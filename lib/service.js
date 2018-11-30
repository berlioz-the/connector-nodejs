const _ = require('the-lodash');
const Promise = require('the-promise');
const HttpPeerAccessor = require('./http-peer-accessor');

class Service extends HttpPeerAccessor
{
    constructor(berlioz, clusterName, sectorName, name, endpoint)
    {
        var id = 'service://' + [clusterName, sectorName, name].join('-');
        super(berlioz, id, endpoint)
    }

}

module.exports = Service;