module.exports.kind = 'queue';
module.exports.class = 'queue';
module.exports.subClass = 'pubsub';

module.exports.clientFetcher = function(peer, args) 
{
    const PubSub = require('@google-cloud/pubsub');
    var client = new PubSub.v1.PublisherClient(peer.config);
    return client;
}

module.exports.processArgs = function(peer, args, operations) 
{
    if (operations.length == 1) {
        if (operations[0] == 'publish') {
            args[0].topic = peer.name
        }
    }
    return args;
}

