const _ = require('the-lodash');
const Registry = require('./registry');

class Processor
{
    constructor(logger, registry)
    {
        this._logger = logger;
        this._registry = registry;

        this._messageHandlers = {
            endpoints: this._acceptEndpoints.bind(this),
            peers: this._acceptPeers.bind(this)
        }

        this._peerHandler = {
            service: this._handleServicePeers.bind(this),
            cluster: this._handleServicePeers.bind(this),
            database: this._handleDatabasePeers.bind(this),
            queue: this._handleQueuePeers.bind(this)
        };
    }

    accept(section, data)
    {
        this._logger.info('Accept Section: %s', section);

        var handler = this._messageHandlers[section];
        if (handler) {
            return handler(data);
        }
    }

    _acceptEndpoints(message)
    {
        if (!message) {
            this._registry.reset('endpoints');
        } else {
            this._registry.set('endpoints', [], message);
            for(var endpointName of _.keys(message))
            {
                var endpoints = message[endpointName];
                this._registry.set('endpoints', [endpointName], endpoints);
            }
        }
    }

    _acceptPeers(message)
    {
        if (!message) {
            this._registry.reset('peers');
        } else {
            for(var kind of _.keys(message))
            {
                if (kind in this._peerHandler) {
                    var data = message[kind];
                    this._peerHandler[kind](kind, data);
                }
            }
        }
    }

    _handleServicePeers(kind, data)
    {
        for(var name of _.keys(data))
        {
            var serviceData = data[name];
            for(var endpoint of _.keys(serviceData))
            {
                var endpointData = serviceData[endpoint];
                this._registry.set('peers', [kind, name, endpoint], endpointData);
            }
        }
    }

    _handleDatabasePeers(kind, data)
    {
        for(var name of _.keys(data))
        {
            var endpointData = data[name];
            this._registry.set('databases', [name], endpointData);
        }
    }

    _handleQueuePeers(kind, data)
    {
        for(var name of _.keys(data))
        {
            var endpointData = data[name];
            this._registry.set('queues', [name], endpointData);
        }
    }
}

module.exports = Processor;
