const _ = require('the-lodash');
const Promise = require('the-promise');
const request = require('request-promise');

const PeerAccessor = require('./peer-accessor');
const Executor = require('./executor');

class NativeResource extends PeerAccessor
{
    constructor(berlioz, id)
    {
        super(berlioz, [id]);
    }

    _fetchNativeClient(peer, ClientModule, clientKind)
    {
        if (!(peer.subClass in this._berlioz._nativeClientFetcher)) {
            throw new Error(this.peerId + ' ' + peer.subClass + ' not supported');
        }
        var client = this._berlioz._nativeClientFetcher[peer.subClass](peer, ClientModule, clientKind);
        return client;
    }

    client(ClientModule, clientKind) {
        this.logger.info('[NativeResource::client] peerPath: %s', this.peerPath)
        var handler = {
            get: (target, propKey) => {
                return (params, cb) => {
                    try {
                        this.logger.info('[NativeResource::client] Operation: %s', propKey)

                        return this.performExecutor(
                            propKey, 
                            '/', 
                            this.first.bind(this),
                            cb, 
                            (peer) => {
                                this.logger.info('[NativeResource::client] exec %s', propKey)

                                var client = this._fetchNativeClient(peer, ClientModule, clientKind);

                                const origMethod = client[propKey];
                                if (!origMethod) {
                                    throw new Error('Method ' + propKey + ' not found.');
                                }

                                if (peer.subClass in this._berlioz._nativeClientParamsSetter)
                                {
                                    var paramsSetter = this._berlioz._nativeClientParamsSetter[peer.subClass];
                                    paramsSetter(peer, params, propKey, clientKind);
                                }
                                
                                this.logger.info('[NativeResource::client] params ', params)

                                return new Promise((resolve, reject) => {
                                    this.logger.info('[NativeResource::client] calling ');

                                    origMethod.call(client, params, (err, data) => {
                                        if (err) {
                                            this.logger.info('[NativeResource::client] err ');
                                            reject(err);
                                        } else {
                                            this.logger.info('[NativeResource::client] done ');
                                            resolve(data);
                                        }
                                    });
                                });

                            });
                    } catch (e) {
                        this.logger.exception(e);
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

module.exports = NativeResource;