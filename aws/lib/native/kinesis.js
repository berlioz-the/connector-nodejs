module.exports.kind = 'queue';
module.exports.class = 'queue';
module.exports.subClass = 'kinesis';

module.exports.clientFetcher = function(peer, AWS) 
{
    return new AWS.Kinesis(peer.config);
}

module.exports.paramsSetter = function(peer, params) 
{
    params.StreamName = peer.name;
}
