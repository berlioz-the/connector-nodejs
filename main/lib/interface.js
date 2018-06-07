const _ = require('the-lodash');
const request = require('request-promise');
const Zipkin = require('./zipkin');

class Interface
{
    constructor(logger, registry)
    {
        this._logger = logger;
        this._registry = registry;
        this._zipkin = new Zipkin(this);
    }

    get logger() {
        return this._logger;
    }

    get zipkin() {
        return this._zipkin;
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

    requestPeer(kind, name, endpoint, options)
    {
        return this.request(kind, name, endpoint, options);
    }

    request(kind, name, endpoint, options)
    {
        var peer = this.getRandomPeer(kind, name, endpoint);
        if (!peer) {
            return Promise.resolve(false);
        }
        var myOptions = _.clone(options);
        myOptions.timeout = 5000;
        myOptions.url = peer.protocol + '://' + peer.address + ':' + peer.port;
        if (options.url) {
            myOptions.url += options.url;
        }
        return this._zipkin.makeRequest(myOptions, process.env.BERLIOZ_CLUSTER + '-' + name);
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

     getDatabaseClient(name, AWS)
     {
         var dbInfo = this.getDatabaseInfo(name);
         var docClient = new AWS.DynamoDB.DocumentClient(dbInfo.config);

         return this._wrapRemoteClient(docClient, 'aws-dynamo-' + name,
            params => {
                var newParams = _.clone(params);
                newParams.TableName = dbInfo.tableName;
                return newParams;
            });
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

      getQueueClient(name, AWS)
      {
          var kinesisInfo = this.getQueueInfo(name);
          var kinesis = new AWS.Kinesis(kinesisInfo.config);

          return this._wrapRemoteClient(kinesis, 'aws-kinesis-' + name,
             params => {
                 var newParams = _.clone(params);
                 newParams.StreamName = kinesisInfo.streamName;
                 return newParams;
             });
      }

      /* INSTRUMENTATION */
      instrument(remoteServiceName, method, url)
      {
          return this._zipkin.instrument(remoteServiceName, method, url);
      }

      /* FRAMEWORK CONFIGURATORS */
      setupExpress(app)
      {
          var Handler = require('./frameworks/express');
          this._handler = new Handler(app, this);
      }


      /*******************************************************/
       _wrapRemoteClient(toWrap, name, prepareInput)
       {
           var handler = {
               get: (target, propKey) => {
                   return (params, cb) => {
                       const origMethod = target[propKey];
                       if (!origMethod) {
                           throw new Error('Method ' + propKey + ' not found.');
                       }

                       var doWork = (resolve, reject) => {
                            var newParams = prepareInput(params);
                            var tracer = this.instrument(name, propKey, '/');
                            origMethod.call(target, newParams, (err, data) => {
                                if (err) {
                                    tracer.error(err);
                                    reject(err);
                                } else {
                                    tracer.finish(200);
                                    resolve(data);
                                }
                            });
                        };

                       if (!cb) {
                           return new Promise(doWork);
                       } else {
                           doWork(result => {
                               cb(null, result);
                           }, error => {
                               cb(error, null);
                           })
                       }
                   };
               }
           };
           var proxy = new Proxy(toWrap, handler);
           return proxy;
       }
}

module.exports = Interface;
