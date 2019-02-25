module.exports.kind = 'database';
module.exports.class = 'nosql';
module.exports.subClass = 'dynamodb';

module.exports.clientFetcher = function(peer, AWS) 
{
    return new AWS.DynamoDB.DocumentClient(peer.config);
}

module.exports.paramsSetter = function(peer, params) 
{
    params.TableName = peer.name;
}
