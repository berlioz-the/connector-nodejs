module.exports.kind = 'database';
module.exports.class = 'storage';
module.exports.subClass = 'storage';

module.exports.clientFetcher = function(peer, args) 
{
    const {Storage} = require('@google-cloud/storage');
    var storage = new Storage(peer.config);
    var bucket = storage.bucket(peer.name);
    return bucket;
}

module.exports.actionMetadata = {
    config: {

    },
    actions: {
        'file': {
            config: {
                wrapChildren: true
            },
            actions: {
                'createReadStream': {
                    config: {
                    }
                },
                'createWriteStream': {
                    config: {
                    }
                }
            }
        }
    }
}
