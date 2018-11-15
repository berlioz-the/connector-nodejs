const _ = require('the-lodash');
const Registry = require('./registry');

class Processor
{
    constructor(logger, registry)
    {
        this._logger = logger;
        this._registry = registry;

        this._messageHandlers = {
            policies: this._acceptPolicies.bind(this),
            endpoints: this._acceptEndpoints.bind(this),
            peers: this._acceptPeers.bind(this)
        }
    }

    accept(section, data)
    {
        this._logger.info('Accept Section: %s', section, data);

        var handler = this._messageHandlers[section];
        if (handler) {
            return handler(data);
        }
    }

    _acceptPolicies(message)
    {
        if (!message) {
            this._registry.reset('policies');
        } else {
            this._registry.set('policies', [], message);
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
            for(var serviceId of _.keys(message))
            {
                this._registry.set('peers', [serviceId], message[serviceId]);
            }
        }
    }

}

module.exports = Processor;
