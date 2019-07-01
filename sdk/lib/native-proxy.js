const _ = require('the-lodash');
const Promise = require('the-promise');

const PeerAccessor = require('./peer-accessor');
const Executor = require('./executor');

class NativeProxy
{
    constructor(resource, peerSdkModule, operations, session)
    {
        this._resource = resource;
        this._peerSdkModule = peerSdkModule;
        this._operations = operations;
        if (!this._operations) {
            this._operations = [];
        }
        this._session = session;

        this.logger.info('[NativeProxy] constructor, operations: ', this._operations)

        var naming = this._operations.filter(x => x.action).map(x => x.action);
        this._name = naming.join('::');

        var handler = {
            get: (target, propKey) => {
                return (...args) => {
                    return this._proxyHandler(propKey, args);
                };
            }
        };
        this._myProxy = new Proxy({}, handler);

        this._massagedOperations = this._buildConfigs();
        this.logger.info('[NativeProxy] constructor, config: ', this._operationConfigs)
    }

    get logger() {
        return this._resource.logger;
    }

    handle()
    {
        this.logger.verbose('[NativeProxy::handle] peerPath: %s', this._resource.peerPath, this._operations);

        var lastOperation = _.last(this._massagedOperations);
        this.logger.verbose('[NativeProxy::handle] lastOperation: ', lastOperation);

        var wrapChildren = false;
        if (_.isNotNullOrUndefined(lastOperation.config.wrapChildren)) {
            wrapChildren = lastOperation.config.wrapChildren;
        }

        if (wrapChildren)
        {
            return this._myProxy;
        }
        else
        {
            return this._execute();
        }
    }

    _buildConfigs()
    {
        var config = {
            wrapChildren: true
        };

        var currMetadata = this._peerSdkModule.actionMetadata;
        if (!currMetadata) {
            currMetadata = {};
        }

        var massagedOperations = [];
        for(var operation of this._operations)
        {
            if (operation.action) {
                if (!currMetadata.actions) {
                    currMetadata = null    
                } else {
                    currMetadata = currMetadata.actions[operation.action];
                }
            }
            if (currMetadata) {
                var currConfig = {};
                if (currMetadata.config) {
                    currConfig = _.clone(currMetadata.config);
                }
                config = _.defaults(currConfig, config)
            }

            massagedOperations.push({
                operation: operation,
                config: _.clone(config)
            });

            config.wrapChildren = false;
        }
        return massagedOperations;
    }

    _proxyHandler(action, args)
    {
        try {
            this.logger.verbose('[NativeProxy::_proxyHandler] Operation: %s', action)
            this.logger.verbose('[NativeProxy::_proxyHandler] Arguments: ', args)

            if (action == 'then' || action == 'catch') {
                return Promise.resolve("NotPromisable.");
                // return this._myProxy;
            }

            return this._childProxy({
                action: action,
                args: args
            });

        } catch (e) {
            console.log("**********************")
            console.log(e)
            this.logger.exception(e);
            // if (cb) {
            //     cb(e, null);
            // } else {
            //     return Promise.reject(e);
            // }
        }
    }

    _childProxy(operation)
    {
        var operations = _.clone(this._operations);
        operations.push(operation);
        var childProxy = new NativeProxy(this._resource, this._peerSdkModule, operations, this._session);
        return childProxy.handle();
    }

    _execute()
    {
        this.logger.info('[NativeProxy::_execute] %s...', this._resource.peerPath);
        return this._resource.performExecutor(
            this._name, 
            '/', 
            this._resource.first.bind(this._resource),
            null, 
            (peer) => {
                this.logger.info('[NativeResource::_execute] inside for %s', this._resource.peerPath)
                return this._executeForPeer(peer)
                    .then(result => {
                        // this.logger.info('[NativeResource::_execute] final result:', result)
                        return result;
                    });
            });
    }

    _executeForPeer(peer)
    {
        this.logger.silly('[NativeProxy::_executeForPeer] %s, peer: ', this._resource.peerPath, peer);

        var result = null;
        var operationNames = []
        return Promise.serial(this._massagedOperations, x => {
            this.logger.silly('[NativeProxy::_executeForPeer] running for action: %s...', x.operation.action);
            if (x.operation.action) {
                operationNames.push(x.operation.action);
            }
            return Promise.resolve(this._runOperation(peer, x, result, operationNames))
                .then(newResult => {
                    result = newResult;
                    this.logger.silly('[NativeResource::_executeForPeer] %s, result:', this._resource.peerPath, result);
                })
        })
        .then(() => result);
    }

    _runOperation(peer, massagedOperation, root, operationNames)
    {
        var name = operationNames.join("-")

        if (!massagedOperation.operation.action) {
            if (!this._peerSdkModule.clientFetcher) {
                throw new Error(`Peer ${peer.subClass} not supported`);
            }
            return Promise.resolve()
                .then(() => {
                    if (this._session.client) {
                        if (!_.fastDeepEqual(this._session.peer, peer)) {
                            var client = this._session.client;
                            this._session.client = null;
                            this._session.peer = null;
                            if (this._peerSdkModule.clientTerminator) {
                                this.logger.info('[_runOperation] running clientTerminator for %s...', name);
                                return this._peerSdkModule.clientTerminator(client);
                            }
                        }
                        return this._session.client;
                    }
                })
                .then(() => {
                    if (!this._session.client) {
                        this.logger.info('[_runOperation] running clientFetcher for %s...', name);
                        return Promise.resolve(this._peerSdkModule.clientFetcher(peer, massagedOperation.operation.args))
                            .then(client => {
                                this._session.client = client;
                                this._session.peer = peer;
                                return this._session.client;
                            })
                    } else {
                        return this._session.client;
                    }
                });
        }

        const origMethod = root[massagedOperation.operation.action];
        if (!origMethod) {
            throw new Error(`Method ${massagedOperation.operation.action} not found.`);
        }

        var args = _.clone(massagedOperation.operation.args);
        if (this._peerSdkModule.processArgs) {
            var processArgs = this._peerSdkModule.processArgs;
            args = processArgs(peer, args, operationNames);
        }

        this.logger.verbose("[_runOperation] %s, args: ", name, args);
        var result = origMethod.apply(root, args);

        return Promise.resolve(result)
            .then(finalResult => {
                this.logger.verbose('[_runOperation] %s, result:', name, finalResult);
                return finalResult;
            })
    }

}

module.exports = NativeProxy;