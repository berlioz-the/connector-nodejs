const _ = require('the-lodash');
const request = require('request-promise');

class PeerRequestError extends Error
{
    constructor(options, peer, innerError)
    {
        super(innerError.message);
        this._options = options;
        this._peer = peer;
    }

    get peer() {
        return this._peer;
    }

    get url() {
        return this._options.url;
    }
}

class Interface
{
    constructor(logger, registry)
    {
        this._logger = logger;
        this._registry = registry;
    }

    get logger() {
        return this._logger;
    }

    extractRoot()
    {
        return this._registry.extractRoot();
    }

    /* ENDPOINTS */
    monitorEndpoints(optionalEndpointName, cb)
    {
        if (cb === undefined) {
            cb = optionalEndpointName;
            optionalEndpointName = null;
        }

        this._logger.info('MonitorEndpoints:: name:' + optionalEndpointName);

        var path = [];
        if (optionalEndpointName) {
            path.push(optionalEndpointName);
        }
        this._registry.subscribe('endpoints', path, cb);
    }

    /* PEERS */
    monitorPeers(kind, name, endpoint, cb)
    {
        this._logger.info('MonitorPeers:: ' + JSON.stringify([kind, name, endpoint]));
        this._registry.subscribe('peers', [kind, name, endpoint], cb);
    }

    getPeers(kind, name, endpoint)
    {
        return this._registry.get('peers', [kind, name, endpoint]);
    }

    getRandomPeer(kind, name, endpoint)
    {
        var peers = this.getPeers(kind, name, endpoint);
        return _.randomElement(_.values(peers));
    }

    requestRandomPeer(kind, name, endpoint, options)
    {
        var peer = this.getRandomPeer(kind, name, endpoint);
        return this.requestPeer(peer, options);
    }

    requestPeer(peer, options)
    {
        if (!peer) {
            return Promise.resolve(false);
        }
        var myOptions = _.clone(options);
        myOptions.url = peer.protocol + '://' + peer.address + ':' + peer.port;
        if (options.url) {
            myOptions.url += options.url;
        }
        return request(myOptions)
            .then(body => {
                return {
                    url: myOptions.url,
                    peer: peer,
                    body: body
                };
            })
            .catch(error => {
                throw new PeerRequestError(myOptions, peer, error);
            });
    }

    /* DATABASES */
    monitorDatabases(name, cb)
    {
        this._logger.info('MonitorDatabases:: ' + JSON.stringify([name]));
        this._registry.subscribe('databases', [name], cb);
    }

    getDatabases(name)
    {
        return this._registry.get('databases', [name]);
    }

    getDatabase(name)
    {
        var peers = this.getDatabases(name);
        return _.randomElement(_.values(peers));
    }

    getDatabaseInfo(name)
    {
        var dbPeer = this.getDatabase(name);
        if (!dbPeer) {
            return null;
        }
        var info = {
            tableName: dbPeer.name,
            config: {}
        };
        if (dbPeer.region) {
            info.config.region = dbPeer.region;
        }
        if (dbPeer.credentials) {
            info.config.credentials = dbPeer.credentials;
        }
        return info;
     }

     /* QUEUES */
     monitorQueues(name, cb)
     {
         this._logger.info('monitorQueues:: ' + JSON.stringify([name]));
         this._registry.subscribe('queues', [name], cb);
     }

     getQueues(name)
     {
         return this._registry.get('queues', [name]);
     }

     getQueue(name)
     {
         var peers = this.getQueues(name);
         return _.randomElement(_.values(peers));
     }

     getQueueInfo(name)
     {
         var queuePeer = this.getQueue(name);
         if (!queuePeer) {
             return null;
         }
         var info = {
             streamName: queuePeer.name,
             config: {}
         };
         if (queuePeer.region) {
             info.config.region = queuePeer.region;
         }
         if (queuePeer.credentials) {
             info.config.credentials = queuePeer.credentials;
         }
         return info;
      }

      /* DEBUGGING HELPERS */
      setupDebugExpressJSRoutes(app)
      {
          var handler = require('./router-helpers/express');
          return handler(app, this);
      }

}

module.exports = Interface;
