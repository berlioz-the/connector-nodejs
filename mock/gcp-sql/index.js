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
        "database://func-main-book": {
            "0": {
                "id": "database://func-main-book",
                "kind": "database",
                "class": "sql",
                "subClass": "sql",
                "config": {
                  "host": "104.198.66.4",
                  "user": "root"
                },
                "name": "localhomepc-gcpx-uscentral1-main-book-iebbaiqzxt"
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

var connection = berlioz.database('book').client('mysql', {
    user: 'root',
    password: '',
    database: 'demo'
});
return connection.query('SELECT * FROM contacts')
    .then(result => {
        console.log('FINAL RESULT: ');
        console.log(result);
        connection.end();
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })
