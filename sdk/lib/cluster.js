const _ = require('the-lodash');
const Promise = require('the-promise');
const HttpPeerAccessor = require('./http-peer-accessor');

class Cluster extends HttpPeerAccessor
{
    constructor(berlioz, name, endpoint)
    {
        var id = 'cluster://' + name;
        super(berlioz, id, endpoint)
        this._id = id;
    }

    endpoint(name)
    {
        return new HttpPeerAccessor(this._berlioz, this._id, name)
    }
}

module.exports = Cluster;