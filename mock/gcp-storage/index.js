const Promise = require('the-promise');
const fs = require('fs');

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
})

process.env.BERLIOZ_CLUSTER = 'img';
process.env.BERLIOZ_SECTOR = 'main';
process.env.BERLIOZ_SERVICE = 'test';
process.env.BERLIOZ_METADATA_SOURCE = 'override'
process.env.BERLIOZ_METADATA_OVERRIDE = JSON.stringify({
    "peers": {
        "database://img-main-images": {
            "0": {
                "id": "database://img-main-images",
                "kind": "database",
                "class": "storage",
                "subClass": "storage",
                "config": {
                    "credentials": require('../credentials.json'),
                    "projectId": "rubentest"
                },
                "name": "rubentest_localhomepc_img_us-central1_main_images"
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

const client = berlioz.database('images').client('storage');

function uploadFile()
{
    var stream = fs.createReadStream('d:\\berlioz.png');

    return new Promise((resolve, reject) => {
        client.file('berlioz.png').createWriteStream()
            // .then(file => {
            //     throw new Error("ZZZZZZZZZZZZZZZZ")
            //     console.log("[uploadImage] FILE: ")
            //     console.log(file)
            //     return file.createWriteStream();
            // })
            .then(writeStream => {
                stream.pipe(writeStream)
                    .on('error', (error) => {
                        reject(error);
                    })
                    .on('finish', () => {
                        resolve();
                    });
            })
            .catch(reason => {
                reject(reason);
            });
    });
}



return uploadFile()
// return client.getFiles() //{ prefix: 'orig/'})
// .then(result => {
        // console.log('Files: ');
        // console.log(result);
        // console.log(result[0].map(x => x.name));
        // return result[0][0];
    // })
    // .then(myFile => {
    //     console.log(myFile.name);
    //     return myFile.createReadStream();
    // })
    // .then(stream => {
    //     stream.on('end', () => {
    //         console.log("***************************************");
    //     });
    //     stream.on('error', (error) => {
    //         console.log(error);
    //         response.end();
    //     });
    //     stream.pipe(process.stdout);
    // })
    .then(result => {
        console.log('FINAL RESULT: ');
        console.log(result);
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })
