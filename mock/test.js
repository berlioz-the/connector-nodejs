// const INSTANCE_IP = 'ec2-52-202-201-228.compute-1.amazonaws.com';
const INSTANCE_IP = 'localhost';
const PORT = 55555;
const TARGET_IP = '82d1c32d-19bd-4e8b-a53b-7529e386b7c3';

process.env.BERLIOZ_CLUSTER = 'hello';
process.env.BERLIOZ_SECTOR = 'main';
process.env.BERLIOZ_AGENT_PATH = 'ws://' + INSTANCE_IP + ':' + PORT + '/' + TARGET_IP;

const berlioz = require('../main');

berlioz.monitorEndpoints(endpoints => {
    console.log('ENDPOINTS:');
    console.log(JSON.stringify(endpoints, null, 2));
});

berlioz.monitorEndpoints('client', endpoints => {
    console.log('CLIENT ENDPOINTS:');
    console.log(JSON.stringify(endpoints, null, 2));
});

berlioz.monitorPeers('service', 'app', 'client', peers => {
    console.log('************* PEERS:');
    console.log(JSON.stringify(peers, null, 2));
});

berlioz.monitorDatabases('drugs', dbs => {
    console.log('************* DATABASES:');
    console.log(JSON.stringify(dbs, null, 2));

    console.log('************* getDatabaseInfo:');
    console.log(JSON.stringify(berlioz.getDatabaseInfo('drugs'), null, 2));
});

berlioz.monitorQueues('jobs', dbs => {
    console.log('************* QUEUES:');
    console.log(JSON.stringify(dbs, null, 2));

    console.log('************* getQueueInfo:');
    console.log(JSON.stringify(berlioz.getQueueInfo('jobs'), null, 2));
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

const Promise = require('the-promise');
const Executor = require('../main/lib/executor');
const Policy = require('../main/lib/policy');
const AWS = require('aws-sdk');

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
