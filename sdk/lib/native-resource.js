const _ = require('the-lodash');
const Promise = require('the-promise');
const request = require('request-promise');

const PeerAccessor = require('./peer-accessor');
const Executor = require('./executor');
const NativeProxy = require('./native-proxy');

class NativeResource extends PeerAccessor
{
    constructor(berlioz, id)
    {
        super(berlioz, [id]);
    }
    
    client(...args)
    {
        if (args.length == 0) {
            throw new Error("SDK name not provided.");
        }
        var sdkName = args[0]
        if (_.isNullOrUndefined(sdkName)) {
            throw new Error("SDK name not set.");
        }

        var peerSdkModule = this._berlioz._peerClients[sdkName];
        if (_.isNullOrUndefined(sdkName)) {
            throw new Error(`Unknown SDK ${sdkName}`);
        }

        var proxy = new NativeProxy(this, peerSdkModule, [{
            args: args
        }]);
        return proxy.handle();
    }

}

module.exports = NativeResource;