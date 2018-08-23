const _ = require('the-lodash');
const Zipkin = require('./zipkin');
const SecretClient = require('./secret-client')

const Cluster = require('./cluster');
const Sector = require('./sector');
const PeerAccessor = require('./peer-accessor');

class Interface {
    constructor(logger, registry, policy) {
        this._logger = logger;
        this._registry = registry;
        this._policy = policy;
        this._zipkin = new Zipkin(this, policy);

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

    /* PEERS */
    cluster(name)
    {
        return new Cluster(this, name);
    }

    sector(name)
    {
        return new Sector(this, name);
    }

    service(name, endpoint)
    {
        return this.sector(process.env.BERLIOZ_SECTOR).service(name, endpoint);
    }

    /* PEERS */
    database(name)
    {
        return this.sector(process.env.BERLIOZ_SECTOR).database(name);
    }

    queue(name)
    {
        return this.sector(process.env.BERLIOZ_SECTOR).queue(name);
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

    
   
    /* SECRET PUBLIC KEY */
    // monitorSecretPublicKey(name, cb) {
    //     this._logger.info('monitorSecretPublicKey:: ' + JSON.stringify([name]));
    //     this._registry.subscribe('peer', [this._getResourceId('secret_public_key', name)], cb);
    // }

    // getSecretPublicKeys(name) {
    //     return this._registry.get('peer', [this._getResourceId('secret_public_key', name)]);
    // }

    // getSecretPublicKey(name) {
    //     var peers = this.getSecretPublicKeys(name);
    //     return _.randomElement(_.values(peers));
    // }

    // getSecretPublicKeyInfo(name) {
    //     return this.getSecretPublicKey(name);
    // }

    // getSecretPublicKeyClient(name, AWS) {
    //     return this._getNativeResourceClient('secret_public_key', name, AWS);
    // }

    /* SECRET PRIVATE KEY */
    // monitorSecretPrivateKey(name, cb) {
    //     this._logger.info('monitorSecretPrivateKey:: ' + JSON.stringify([name]));
    //     this._registry.subscribe('peer', [this._getResourceId('secret_private_key', name)], cb);
    // }

    // getSecretPrivateKeys(name) {
    //     return this._registry.get('peer', [this._getResourceId('secret_private_key', name)]);
    // }

    // getSecretPrivateKey(name) {
    //     var peers = this.getSecretPrivateKeys(name);
    //     return _.randomElement(_.values(peers));
    // }

    // getSecretPrivateKeyInfo(name) {
    //     return this.getSecretPrivateKey(name);
    // }

    // getSecretPrivateKeyClient(name, AWS) {
    //     return this._getNativeResourceClient('secret_private_key', name, AWS);
    // }

    /* SECRET PUBLIC & PRIVATE KEY */
    // getSecret(name, AWS) {
    //     return new SecretClient(this, name, AWS);
    // }

    /*******************************************************/

    /* INSTRUMENTATION */
    instrument(remoteServiceName, method, url) {
        return this._zipkin.instrument(remoteServiceName, method, url);
    }


    /*******************************************************/

    /* FRAMEWORK CONFIGURATORS */
    setupExpress(app) {
        var Handler = require('./frameworks/express');
        this._handler = new Handler(app, this, this._policy);
    }

    /*******************************************************/
    

    _peerAccessor(id, endpoint)
    {
        return new PeerAccessor(this, [id, endpoint]);
    }

    _monitorPeers(peerPath, cb)
    {
        this._logger.info('Service::MonitorPeers: ', peerPath);
        this._registry.subscribe('peer', peerPath, cb);
    }

    _monitorPeer(peerPath, selector, cb)
    {
        var oldValue = null;
        this._logger.info('Service::MonitorFirstPeer: ', peerPath);
        this._registry.subscribe('peer', peerPath, peers => {
            var value = selector(peers);
            var isChanged = false;
            if (value) {
                if (oldValue) {
                    isChanged = !_.isEqual(value, oldValue);
                } else {
                    isChanged = true;
                }
            } else {
                if (oldValue) {
                    isChanged = true;
                } else {
                    isChanged = false;
                }
            }
            if (isChanged) {
                oldValue = value;
                cb(value);
            }
        });
    }

    _getPeers(peerPath)
    {
        return this._registry.get('peer', peerPath);
    }
    
    _getPeer(peerPath, selector)
    {
        var peers = this._registry.get('peer', peerPath);
        return selector(peers);
    }

    _selectFirstPeer(peers)
    {
        var identity = _.head(_.keys(peers));
        if (identity) {
            return peers[identity];
        }
        return null;
    }

    _selectRandomPeer(peers)
    {
        var identity = _.head(_.keys(peers));
        if (identity) {
            return peers[identity];
        }
        return null;
    }

}

module.exports = Interface;
