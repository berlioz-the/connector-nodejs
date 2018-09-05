const _ = require('the-lodash');
const Promise = require('the-promise');
const HttpPeerAccessor = require('./http-peer-accessor');

class Service extends HttpPeerAccessor
{
    constructor(berlioz, id, endpoint)
    {
        super(berlioz, id, endpoint)
    }

}

module.exports = Service;