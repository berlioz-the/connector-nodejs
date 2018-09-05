const _ = require('the-lodash');
const Promise = require('the-promise');
const Service = require('./service');
const HttpPeerAccessor = require('./http-peer-accessor');

class Cluster extends HttpPeerAccessor
{
    constructor(berlioz, name, endpoint)
    {
        var id = 'cluster://' + [this._name].join('-');
        super(berlioz, id, endpoint)
    }
}

module.exports = Cluster;