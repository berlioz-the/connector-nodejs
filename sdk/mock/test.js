const Promise = require('the-promise');
const AWS = require('aws-sdk');
if (!AWS) {
    throw new Error('missing aws')
}

// const INSTANCE_IP = 'ec2-52-202-201-228.compute-1.amazonaws.com';
const INSTANCE_IP = 'localhost';
const PORT = 55555;

process.env.TARGET_ID = '82d1c32d-19bd-4e8b-a53b-7529e386b7c3';
process.env.BERLIOZ_CLUSTER = 'hello';
process.env.BERLIOZ_SECTOR = 'main';
process.env.BERLIOZ_SERVICE = 'test';
process.env.BERLIOZ_AGENT_PATH = 'ws://' + INSTANCE_IP + ':' + PORT + '/${TARGET_ID}';

const berlioz = require('../');

berlioz.service('app', 'client').monitorAll(peers => {
    console.log('************* MY SECTOR APP PEERS:');
    console.log(JSON.stringify(peers, null, 2));
});

berlioz.sector('main').service('app', 'client').monitorAll(peers => {
    console.log('************* MAIN SECTOR APP PEERS:');
    console.log(JSON.stringify(peers, null, 2));
});

berlioz.sector('infra').service('zipkin', 'client').monitorAll(peers => {
    console.log('************* ZIPKIN:');
    console.log(JSON.stringify(peers, null, 2));
});

berlioz.sector('infra').service('zipkin', 'client').monitorFirst(peer => {
    console.log('************* ZIPKIN FIRST PEER:');
    console.log(JSON.stringify(peer, null, 2));
});


berlioz.sector('main').database('contacts').monitorAll(peer => {
    console.log('************* DYNAMO ALL PEERS:');
    console.log(JSON.stringify(peer, null, 2));
});

berlioz.sector('main').database('contacts').monitorFirst(peer => {
    console.log('************* DYNAMO FIRST PEER:');
    console.log(JSON.stringify(peer, null, 2));
});

return Promise.timeout(1000)
    .then(() => {
        var x = berlioz.sector('infra').service('zipkin', 'client').all();
        console.log('------------------ ZIPKIN GET ALL: ' + JSON.stringify(x, null, 2));
        x = berlioz.sector('infra').service('zipkin', 'client').first();
        console.log('------------------ ZIPKIN GET FIRST: ' + JSON.stringify(x, null, 2));
        x = berlioz.sector('infra').service('zipkin', 'client').random();
        console.log('------------------ ZIPKIN GET RANDOM: ' + JSON.stringify(x, null, 2));

        x = berlioz.sector('main').database('contacts').random();
        console.log('------------------ DYANMO GET RANDOM: ' + JSON.stringify(x, null, 2));

        x = berlioz.database('contacts').random();
        console.log('------------------ DYANMO2 GET RANDOM: ' + JSON.stringify(x, null, 2));

        // return berlioz.cluster('another').endpoint('client').request({});
    })
    .then(() => berlioz.sector('main').database('contacts').client(AWS).scan({}))
    .then(result => {
        console.log('SECTOR DB Scan Result: ' + JSON.stringify(result, null, 2));
    })
    .then(() => berlioz.database('contacts').client(AWS).scan({}))
    .then(result => {
        console.log('DB Scan Result: ' + JSON.stringify(result, null, 2));
    })
    .then(() => berlioz.database('contacts').client(AWS).scan({}))
    .then(result => {
        console.log('DB Scan Result: ' + JSON.stringify(result, null, 2));
    })
    .then(() => berlioz.database('contacts').client(AWS).scan({}))
    .then(result => {
        console.log('DB Scan Result: ' + JSON.stringify(result, null, 2));
    })
    .then(() => {
        var options = { url: '/entries', method: 'GET', headers: {aaa: 1234} };
        return berlioz.service('app', 'client').request(options);
    })
    .then(() => {
        var options = { url: '/entries', method: 'GET', headers: {aaa: 1234} };
        return berlioz.service('app', 'client').request(options);
    })
    .then(() => {
        var options = { url: '/entries', method: 'GET', headers: {aaa: 1234} };
        return berlioz.service('app', 'client').request(options);
    })
    .then(() => {
        var options = { url: '/entries', method: 'GET', headers: {aaa: 1234} };
        return berlioz.service('app', 'client').request(options);
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })


return;

berlioz.monitorEndpoints(endpoints => {
    console.log('ENDPOINTS:');
    console.log(JSON.stringify(endpoints, null, 2));
});

berlioz.monitorEndpoints('client', endpoints => {
    console.log('CLIENT ENDPOINTS:');
    console.log(JSON.stringify(endpoints, null, 2));
});

berlioz.monitorSecretPublicKey('personal', keys => {
    console.log('************* SECRET PUBLIC KEY:');
    console.log(JSON.stringify(keys, null, 2));

    console.log('************* getSecretPublicKeyInfo:');
    console.log(JSON.stringify(berlioz.getSecretPublicKeyInfo('personal'), null, 2));

    // var x = berlioz.getSecret('personal', AWS);
    // x.encrypt('lalala')
    //     .then(result => {
    //         console.log('ENCRYPTED: ' + result)
    //     })
});

berlioz.monitorSecretPrivateKey('personal', keys => {
    console.log('************* SECRET PRIVATE KEY:');
    console.log(JSON.stringify(keys, null, 2));

    console.log('************* getSecretPrivateKeyInfo:');
    console.log(JSON.stringify(berlioz.getSecretPrivateKeyInfo('personal'), null, 2));

    // var x = berlioz.getSecret('personal', AWS);
    // x.decrypt('X4F6Y3iIuMr1NLzal2RsQF7cpzCNpaUHL34j0stUQJ45l2Ts4pLf8jPQECelRzOHzyzgaCd3JPDNPBZDRf4/ChL1FTAehr6l+f3IEhgJ1pYJP6glgcen2VTcdypZltZ/G9jY6sQau4UuWQ02y5uE/wRpTGuODQ82SxPIboMt5TznwReqfR0ceEL50vMHt16KQqN0eQP9hLQCq2PnQtswek6Gzyz6cmmpzEJxodO+08Zoa0xZB/hslPHDsAjywI3atgDF4gvoSIxvII0blLIBmpzX56e3EyDNs5gbeiZtHmkcHi6Vty36MwzGWLEUkyp1WR2sJ2y1WFyL8TtNBy8rGg==')
    //     .then(result => {
    //         console.log('DECRYPTED: ' + result)
    //     })
});

return Promise.timeout(1000)
    .then(() => {

        // return Promise.resolve()
        //     .then(() => berlioz.getSecret('personal', AWS).encrypt('lalaadfasdfla'))
        //     .then(encrypted => berlioz.getSecret('personal', AWS).decrypt(encrypted))
        //     .then(decrypted => {
        //         console.log('===================================')
        //         console.log(decrypted.toString())
        //     })

        // var options = { url: '/get/item', method: 'GET', headers: {aaa: 1234} };
        // return berlioz.request('service', 'app', 'clientzzz', options);

        // var docClient = berlioz.getDatabaseClient('drugs', AWS);
        // var params = {
        //     Item: {
        //         'name': 'lalala',
        //         'art': 'zzz'
        //     }
        // };
        // return docClient.put(params);

    })
    .then(result => {
        console.log(result);
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })
