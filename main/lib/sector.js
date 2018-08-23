const _ = require('the-lodash');
const Promise = require('the-promise');
const Service = require('./service');
const NativeResource = require('./native-resource');

class Sector
{
    constructor(berlioz, name)
    {
        this._berlioz = berlioz;
        this._name = name;
    }

    service(name, endpoint)
    {
        var id = 'service://' + [process.env.BERLIOZ_CLUSTER, this._name, name].join('-');
        return new Service(this._berlioz, id, endpoint);
    }

    database(name)
    {
        return this._nativeResource('database', name);
    }

    queue(name)
    {
        return this._nativeResource('queue', name);
    }

    _nativeResource(kind, name)
    {
        var id = kind + '://' + [process.env.BERLIOZ_CLUSTER, this._name, name].join('-');
        return new NativeResource(this._berlioz, id);
    }
}

module.exports = Sector;