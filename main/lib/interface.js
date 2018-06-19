const _ = require('the-lodash');
const request = require('request-promise');
const Zipkin = require('./zipkin');
const Executor = require('./executor');

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
            }
        }

        this._nativeClientParamsSetter = {
            dynamodb: (peer) => { return (params) => {
                params.TableName = peer.name;
            }; },
            kinesis: (peer) => { return (params) => {
                params.StreamName = peer.name;
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
        this._registry.subscribe(kind, [name, endpoint], cb);
    }

    getPeers(kind, name, endpoint) {
        return this._registry.get(kind, [name, endpoint]);
    }

    getRandomPeer(kind, name, endpoint) {
        var peers = this.getPeers(kind, name, endpoint);
        return _.randomElement(_.values(peers));
    }

    request(kind, name, endpoint, options, cb) {
        this._logger.silly('REQUEST, orig options: ', options);

        var target = [kind, name, endpoint];

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
        this._registry.subscribe('database', [name], cb);
    }

    getDatabases(name) {
        return this._registry.get('database', [name]);
    }

    getDatabase(name) {
        var peers = this.getDatabases(name);
        return _.randomElement(_.values(peers));
    }

    getDatabaseInfo(name) {
        return this.getDatabase(name);
    }

    getDatabaseClient(name, AWS) {
        return this._getNativeResourceClient(['database', name], AWS);
    }

    /* QUEUES */
    monitorQueues(name, cb) {
        this._logger.info('monitorQueues:: ' + JSON.stringify([name]));
        this._registry.subscribe('queue', [name], cb);
    }

    getQueues(name) {
        return this._registry.get('queue', [name]);
    }

    getQueue(name) {
        var peers = this.getQueues(name);
        return _.randomElement(_.values(peers));
    }

    getQueueInfo(name) {
        return this.getQueue(name);
    }

    getQueueClient(name, AWS) {
        return this._getNativeResourceClient(['queue', name], AWS);
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

    _getNativeResource(section, name) {
        var peers = this._registry.get(section, [name]);
        return _.randomElement(_.values(peers));
    }

    _getNativeResourceClient(targetNaming, AWS) {
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
