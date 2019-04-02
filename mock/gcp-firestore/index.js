const Promise = require('the-promise');

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
})

process.env.BERLIOZ_CLUSTER = 'func';
process.env.BERLIOZ_SECTOR = 'main';
process.env.BERLIOZ_SERVICE = 'test';
process.env.BERLIOZ_METADATA_SOURCE = 'override'
process.env.BERLIOZ_METADATA_OVERRIDE = JSON.stringify({
    "peers": {
        "database://func-main-store": {
            "0": {
                "id": "database://gcpx-main-store",
                "kind": "database",
                "class": "nosql",
                "subClass": "firestore",
                "config": {
                  "credentials": require('../credentials.json'),
                  "projectId": "rubentest"
                }
            }
        }
    },
    "policies": {
        "values": {
            "enable-zipkin": false,
            "zipkin-service-id": "cluster://sprt-dtracerep"
        }
    }
});

const _ = require('the-lodash');
const berlioz = require('../../sdk');
berlioz.addon(require('../../gcp'));

const client = berlioz.database('store').client('firestore');
return client.collection('users').listDocuments()
    .then(documentRefs => {
        return client.getAll(documentRefs);
    })
    .then(documentSnapshots => {
        documentSnapshots = documentSnapshots.filter(x => x.exists);
        var datas = documentSnapshots.map(x => x.data());
        return datas;
    })
    .then(result => {
        console.log('FINAL RESULT: ');
        console.log(result);
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })
