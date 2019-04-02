module.exports.kind = 'database';
module.exports.class = 'sql';
module.exports.subClass = 'sql';

module.exports.clientFetcher = function(peer, args)
{
    const _ = require('the-lodash');
    const MySql = require('promise-mysql');
    
    var customConfig = null;
    if (args.length > 1) {
        customConfig = args[1];
    } 
    if (!customConfig) {
        customConfig = {};
    }

    var peerConfig = peer.config;
    if (!peerConfig) {
        peerConfig = {}
    } else {
        peerConfig = _.clone(peerConfig);
    }

    var config = _.defaults(customConfig, peerConfig);
    return MySql.createConnection(config);
}
