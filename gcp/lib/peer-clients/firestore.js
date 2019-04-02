module.exports.kind = 'database';
module.exports.class = 'nosql';
module.exports.subClass = 'firestore';

module.exports.clientFetcher = function(peer, args)
{
    const Firestore = require('@google-cloud/firestore');
    var firestore = new Firestore(peer.config);
    return firestore;
}

module.exports.actionMetadata = {
    config: {

    },
    actions: {
        'collection': {
            config: {
                wrapChildren: true
            }
        },
        'doc': {
            config: {
                wrapChildren: true
            }
        }
    }
}
