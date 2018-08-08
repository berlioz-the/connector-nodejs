const _ = require('the-lodash');
const request = require('request-promise');
const Zipkin = require('./zipkin');
const Executor = require('./executor');
const SecretClient = require('./secret-client')

class Interface {
    constructor(logger, registry, policy) {
        this._logger = logger;
        this._registry = registry;
        this._policy = policy;
        this._zipkin = new Zipkin(policy);

        this._nativeClientFetcher = {
            dynamodb: (peer, AWS) => {
                return new AWS.DynamoDB.DocumentClient(peer.config);
            },
            kinesis: (peer, AWS) => {
                return new AWS.Kinesis(peer.config);
            },
            "rsa-secret": (peer, AWS) => {
                return new AWS.SSM(peer.config);
            }
        }

        this._nativeClientParamsSetter = {
            dynamodb: (peer) => { return (params) => {
                params.TableName = peer.name;
            }; },
            kinesis: (peer) => { return (params) => {
                params.StreamName = peer.name;
            }; },
            "rsa-secret": (peer) => { return (params) => {
                params.Name = peer.name;
            }; }
        }
    }

    get logger() {
        return this._logger;
    }

    get zipkin() {
        return this._zipkin;
    }

    extractRoot() {
        return this._registry.extractRoot();
    }

    /* ENDPOINTS */
    monitorEndpoints(optionalEndpointName, cb) {
        if (cb === undefined) {
            cb = optionalEndpointName;
            optionalEndpointName = null;
        }

        this._logger.info('MonitorEndpoints:: name:' + optionalEndpointName);

        var path = [];
        if (optionalEndpointName) {
            path.push(optionalEndpointName);
        }
        this._registry.subscribe('endpoints', path, cb);
    }

    /* PEERS */
    monitorPeers(kind, name, endpoint, cb) {
        this._logger.info('MonitorPeers:: ' + JSON.stringify([kind, name, endpoint]));
        this._registry.subscribe('peer', [this._getServiceId(kind, name), endpoint], cb);
    }

    getPeers(kind, name, endpoint) {
        return this._registry.get('peer', [this._getServiceId(kind, name), endpoint]);
    }

    getRandomPeer(kind, name, endpoint) {
        var peers = this.getPeers(kind, name, endpoint);
        return _.randomElement(_.values(peers));
    }

    request(kind, name, endpoint, options, cb) {
        this._logger.silly('REQUEST, orig options: ', options);

        var target = ['peer', this._getServiceId(kind, name), endpoint];

        var options = _.clone(options);
        var url = options.url;
        options.timeout = this._policy.resolve('timeout', target);

        var executor = new Executor(this._logger, this._registry, this._policy, this._zipkin,
            target,
            options.method || 'GET', url,
            (peer, traceId) => {

                options.url = peer.protocol + '://' + peer.address + ':' + peer.port;
                if (url) {
                    options.url += url;
                }

                var finalOptions;
                if (traceId) {
                    finalOptions = this._zipkin.addZipkinHeaders(options, traceId);
                } else {
                    finalOptions = options;
                }

                this._logger.silly('REQUEST, newOptions: ', finalOptions);
                return request(finalOptions);
            });
        return executor.perform(cb);
    }

    /* DATABASES */
    monitorDatabases(name, cb) {
        this._logger.info('MonitorDatabases:: ' + JSON.stringify([name]));
        this._registry.subscribe('peer', [this._getResourceId('database', name)], cb);
    }

    getDatabases(name) {
        return this._registry.get('peer', [this._getResourceId('database', name)]);
    }

    getDatabase(name) {
        var peers = this.getDatabases(name);
        return _.randomElement(_.values(peers));
    }

    getDatabaseInfo(name) {
        return this.getDatabase(name);
    }

    getDatabaseClient(name, AWS) {
        return this._getNativeResourceClient('database', name, AWS);
    }

    /* QUEUES */
    monitorQueues(name, cb) {
        this._logger.info('monitorQueues:: ' + JSON.stringify([name]));
        this._registry.subscribe('peer', [this._getResourceId('queue', name)], cb);
    }

    getQueues(name) {
        return this._registry.get('peer', [this._getResourceId('queue', name)]);
    }

    getQueue(name) {
        var peers = this.getQueues(name);
        return _.randomElement(_.values(peers));
    }

    getQueueInfo(name) {
        return this.getQueue(name);
    }

    getQueueClient(name, AWS) {
        return this._getNativeResourceClient('queue', name, AWS);
    }

    /* SECRET PUBLIC KEY */
    monitorSecretPublicKey(name, cb) {
        this._logger.info('monitorSecretPublicKey:: ' + JSON.stringify([name]));
        this._registry.subscribe('peer', [this._getResourceId('secret_public_key', name)], cb);
    }

    getSecretPublicKeys(name) {
        return this._registry.get('peer', [this._getResourceId('secret_public_key', name)]);
    }

    getSecretPublicKey(name) {
        var peers = this.getSecretPublicKeys(name);
        return _.randomElement(_.values(peers));
    }

    getSecretPublicKeyInfo(name) {
        return this.getSecretPublicKey(name);
    }

    getSecretPublicKeyClient(name, AWS) {
        return this._getNativeResourceClient('secret_public_key', name, AWS);
    }

    /* SECRET PRIVATE KEY */
    monitorSecretPrivateKey(name, cb) {
        this._logger.info('monitorSecretPrivateKey:: ' + JSON.stringify([name]));
        this._registry.subscribe('peer', [this._getResourceId('secret_private_key', name)], cb);
    }

    getSecretPrivateKeys(name) {
        return this._registry.get('peer', [this._getResourceId('secret_private_key', name)]);
    }

    getSecretPrivateKey(name) {
        var peers = this.getSecretPrivateKeys(name);
        return _.randomElement(_.values(peers));
    }

    getSecretPrivateKeyInfo(name) {
        return this.getSecretPrivateKey(name);
    }

    getSecretPrivateKeyClient(name, AWS) {
        return this._getNativeResourceClient('secret_private_key', name, AWS);
    }

    /* SECRET PUBLIC & PRIVATE KEY */
    getSecret(name, AWS) {
        return new SecretClient(this, name, AWS);
    }

    /* INSTRUMENTATION */
    instrument(remoteServiceName, method, url) {
        return this._zipkin.instrument(remoteServiceName, method, url);
    }

    /* FRAMEWORK CONFIGURATORS */
    setupExpress(app) {
        var Handler = require('./frameworks/express');
        this._handler = new Handler(app, this, this._policy);
    }


    /*******************************************************/
    _getServiceId(kind, name) {
        var serviceId;
        if (kind == 'service') {
            serviceId = 'service://' + [process.env.BERLIOZ_CLUSTER, process.env.BERLIOZ_SECTOR, name].join('-');
        } else if (kind == 'cluster') {
            serviceId = 'cluster://' + [name].join('-');
        } else {
            throw new Error('Invalid kind: ' + kind + ' provided');
        }
        return serviceId;
    }

    _getResourceId(kind, name) {
        return kind + '://' + [process.env.BERLIOZ_CLUSTER, process.env.BERLIOZ_SECTOR, name].join('-');
    }

    /*******************************************************/

    _getNativeResource(section, name) {
        var peers = this._registry.get(section, [name]);
        return _.randomElement(_.values(peers));
    }

    _getNativeResourceClient(kind, name, AWS) {
        var targetNaming = ['peer', _getResourceId(kind, name)];
        this._logger.info('[_getNativeResourceClient] ', targetNaming)
        var handler = {
            get: (target, propKey) => {
                return (params, cb) => {
                    try {
                        this._logger.info('[_getNativeResourceClient] %s', propKey)

                        var executor = new Executor(this._logger, this._registry, this._policy, this._zipkin,
                            targetNaming,
                            propKey, '/',
                            (peer) => {
                                this._logger.info('[_getNativeResourceClient] exec %s', propKey)

                                if (!(peer.subClass in this._nativeClientFetcher)) {
                                    throw new Error(targetNaming[0] + ' ' + peer.subClass + ' not supported');
                                }
                                var client = this._nativeClientFetcher[peer.subClass](peer, AWS);

                                const origMethod = client[propKey];
                                if (!origMethod) {
                                    throw new Error('Method ' + propKey + ' not found.');
                                }

                                if (!(peer.subClass in this._nativeClientParamsSetter)) {
                                    throw new Error(targetNaming[0] + ' ' + peer.subClass + ' not supported');
                                }
                                var paramsSetter = this._nativeClientParamsSetter[peer.subClass](peer);
                                paramsSetter(params);

                                this._logger.info('[_getNativeResourceClient] params ', params)

                                return new Promise((resolve, reject) => {
                                    this._logger.info('[_getNativeResourceClient] calling ');

                                    origMethod.call(client, params, (err, data) => {
                                        if (err) {
                                            this._logger.info('[_getNativeResourceClient] err ');
                                            reject(err);
                                        } else {
                                            this._logger.info('[_getNativeResourceClient] done ');
                                            resolve(data);
                                        }
                                    });
                                });

                            });
                        return executor.perform(cb);
                    } catch (e) {
                        this._logger.exception(e);
                        if (cb) {
                            cb(e, null);
                        } else {
                            return Promise.reject(e);
                        }
                    }
                };
            }
        };
        return new Proxy({}, handler);
    }
}

module.exports = Interface;
