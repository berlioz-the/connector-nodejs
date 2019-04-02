module.exports.kind = 'queue';
module.exports.class = 'queue';
module.exports.subClass = 'pubsub';

module.exports.clientFetcher = function(peer, args) 
{
    const PubSub = require('@google-cloud/pubsub');
    var client = new PubSub.v1.SubscriberClient(peer.config);
    return client;
}

module.exports.processArgs = function(peer, args, operations) 
{
    if (operations.length == 1) {
        if (operations[0] == 'pull' || 
            operations[0] == 'acknowledge') {
            args[0].subscription = peer.subName
        }
    }
    return args;
}

module.exports.actionMetadata = {
    config: {

    },
    actions: {
        'subscriptionPath': {
            config: {
                wrapChildren: true
            }
        }
    }
}


