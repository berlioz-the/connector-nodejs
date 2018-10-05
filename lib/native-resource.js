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

    _fetchNativeClient(peer, AWS)
    {
        if (!(peer.subClass in this._nativeClientFetcher)) {
            throw new Error(this.peerId + ' ' + peer.subClass + ' not supported');
        }
        var client = this._nativeClientFetcher[peer.subClass](peer, AWS);
        return client;
    }

    client(AWS) {
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

                                var client = this._fetchNativeClient(peer, AWS);

                                const origMethod = client[propKey];
                                if (!origMethod) {
                                    throw new Error('Method ' + propKey + ' not found.');
                                }

                                if (!(peer.subClass in this._nativeClientParamsSetter)) {
                                    throw new Error(this.peerId + ' ' + peer.subClass + ' not supported');
                                }
                                var paramsSetter = this._nativeClientParamsSetter[peer.subClass](peer);
                                paramsSetter(params);

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