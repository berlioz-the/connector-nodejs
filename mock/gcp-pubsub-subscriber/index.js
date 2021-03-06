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
        "queue://func-main-jobs": {
            // "0": {
            //     "id": "queue://func-main-jobs",
            //     "kind": "queue",
            //     "class": "queue",
            //     "subClass": "pubsub",
            //     "config": {
            //         "credentials": require('../credentials.json'),
            //         "projectId": "rubentest"
            //     },
            //     "name": "projects/rubentest/topics/localHomePC_img_us-central1_main_jobs",
            //     "subName": "projects/rubentest/subscriptions/localHomePC_img_us-central1_main_proc_img-main-jobs"
            // }
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


const client = berlioz.queue('jobs').client('pubsub-subscriber')
return client.pull({ maxMessages: 5 })
    .then(result => {
        return Promise.serial(result[0].receivedMessages, x => {
            console.log(x);
            return client.acknowledge({
                ackIds: [x.ackId]
            });
        })
    })
    .then(result => {
        console.log('FINAL RESULT: ');
        console.log(result);
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })
