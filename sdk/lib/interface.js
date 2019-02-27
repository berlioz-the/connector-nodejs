const fs = require('fs');
const Path = require('path');
const _ = require('the-lodash');
const Zipkin = require('./zipkin');
const SecretClient = require('./secret-client')

const Cluster = require('./cluster');
const Sector = require('./sector');
const PeerAccessor = require('./peer-accessor');
const identityExtractor = require('berlioz-identity-extractor');

class Interface {
    constructor(logger, registry, policy) {
        this._logger = logger;
        this._registry = registry;
        this._policy = policy;
        this._environment = identityExtractor.resolveEnvironment(process.env);
        this._identity = identityExtractor.extract(this._environment);
        this._zipkin = new Zipkin(this, policy);

        this._nativeClientFetcher = {};
        this._nativeClientParamsSetter = {};
    }

    get logger() {
        return this._logger;
    }

    get zipkin() {
        return this._zipkin;
    }

    get identity() {
        return this._identity;
    }

    get environment() {
        return this._environment;
    }

    extractRoot() {
        return this._registry.extractRoot();
    }

    /* ADDON MANAGEMENT */
    addon(addon)
    {
        this._acceptAddonNative(addon.nativeHandlerDir);
    }

    _acceptAddonNative(dir)
    {
        if (!dir) {
            return;
        }

        this.logger.info("Loading addon from %s...", dir)
        fs.readdirSync(dir).forEach((file) => {
            var includePath = Path.join(dir, file);
            this.logger.info("Including from %s...", includePath)

            var addonModule = require(includePath);
            // this.logger.info("Addon: ", _.keys(addonModule))

            if (!addonModule.subClass) {
                return;
            }
            if (addonModule.clientFetcher) {
                this._nativeClientFetcher[addonModule.subClass] = addonModule.clientFetcher;
            }
            if (addonModule.paramsSetter) {
                this._nativeClientParamsSetter[addonModule.subClass] = addonModule.paramsSetter;
            }
        });

        // this.logger.info("this._nativeClientFetcher: ", _.keys(this._nativeClientFetcher))
        // this.logger.info("this._nativeClientParamsSetter: ", _.keys(this._nativeClientParamsSetter))
    }

    /* PEERS */
    cluster(name, endpointOrNone)
    {
        return new Cluster(this, name, endpointOrNone);
    }

    sector(name)
    {
        return new Sector(this, name);
    }

    service(name, endpointOrNone)
    {
        return this.sector(process.env.BERLIOZ_SECTOR).service(name, endpointOrNone);
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
    //     this._registry.subscribe('peers', [this._getResourceId('secret_public_key', name)], cb);
    // }

    // getSecretPublicKeys(name) {
    //     return this._registry.get('peers', [this._getResourceId('secret_public_key', name)]);
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
    //     this._registry.subscribe('peers', [this._getResourceId('secret_private_key', name)], cb);
    // }

    // getSecretPrivateKeys(name) {
    //     return this._registry.get('peers', [this._getResourceId('secret_private_key', name)]);
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
    
    _peerAccessor(serviceId)
    {
        return new PeerAccessor(this, [serviceId]);
    }

    _monitorPeers(peerPath, cb)
    {
        this._logger.info('Service::MonitorPeers: ', peerPath);
        this._registry.subscribe('peers', peerPath, cb);
    }

    _monitorPeer(peerPath, selector, cb)
    {
        var oldValue = null;
        this._logger.info('Service::MonitorFirstPeer: ', peerPath);
        this._registry.subscribe('peers', peerPath, peers => {
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
        return this._registry.get('peers', peerPath);
    }
    
    _getPeer(peerPath, selector)
    {
        var peers = this._getPeers(peerPath);
        return selector(peers);
    }

}

module.exports = Interface;
