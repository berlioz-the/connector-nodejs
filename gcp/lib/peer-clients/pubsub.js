module.exports.kind = 'queue';
module.exports.class = 'queue';
module.exports.subClass = 'pubsub';

module.exports.clientFetcher = function(peer, args) 
{
    const PubSub = require('@google-cloud/pubsub');
    var client = new PubSub(peer.config);
    return client;
}

