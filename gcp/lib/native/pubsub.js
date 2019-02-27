module.exports.kind = 'queue';
module.exports.class = 'queue';
module.exports.subClass = 'pubsub';

module.exports.clientFetcher = function(peer, GcpPubSub, clientKind) 
{
    var client = null;
    
    if (clientKind == 'PublisherClient') {
        var client = new GcpPubSub.v1.PublisherClient(peer.config);
    } else if (clientKind == 'SubscriberClient') {
        var client = new GcpPubSub.v1.SubscriberClient(peer.config);
    } else {
        client = new GcpPubSub(peer.config);
    }

    return client;
}
