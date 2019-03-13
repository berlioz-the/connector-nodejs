const Promise = require('the-promise');

process.env.BERLIOZ_CLUSTER = 'func';
process.env.BERLIOZ_SECTOR = 'main';
process.env.BERLIOZ_SERVICE = 'test';
process.env.BERLIOZ_METADATA_SOURCE = 'override'
process.env.BERLIOZ_METADATA_OVERRIDE = JSON.stringify({
    "peers": {
        "database://func-main-images": {
            "0": {
                "class": "storage",
                "id": "database://func-main-images",
                "kind": "database",
                "subClass": "storage",
                "name": "sample-proj-2-230121_gprod_func_us-central1_main_images"
            }
        }
    },
    "policies": {
        "values": {
            "enable-zipkin": true,
            "zipkin-service-id": "cluster://sprt-dtracerep"
        }
    }
});

const berlioz = require('../');
berlioz.addon(require('../../aws'));
berlioz.addon(require('../../gcp'));

berlioz.database('images').monitorFirst(peer => {
    console.log('************* IMAGES DB:');
    console.log(JSON.stringify(peer, null, 2));
});

return Promise.timeout(1000)
    .then(() => {
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })

