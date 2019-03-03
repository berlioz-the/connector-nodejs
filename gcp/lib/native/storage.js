module.exports.kind = 'database';
module.exports.class = 'storage';
module.exports.subClass = 'storage';

module.exports.clientFetcher = function(peer, GcpStorage) 
{
    var storage = new GcpStorage(peer.config);
    var bucket = storage.bucket(peer.name);
    return bucket;
}

module.exports.actionMetadata = {
    'file': {
        passthrough: true
    },
    'createReadStream': {
        passthrough: true
    },
    'createWriteStream': {
        passthrough: true
    }
}
