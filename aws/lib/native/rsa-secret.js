module.exports.kind = 'secret';
module.exports.class = 'rsa';
module.exports.subClass = 'rsa-secret';

module.exports.clientFetcher = function(peer, AWS) 
{
    return new AWS.SSM(peer.config);
}

module.exports.paramsSetter = function(peer, params) 
{
    params.Name = peer.name;
}
