// const INSTANCE_IP = 'ec2-52-202-201-228.compute-1.amazonaws.com';
const INSTANCE_IP = 'localhost';
const TARGET_IP = '82d1c32d-19bd-4e8b-a53b-7529e386b7c3';

process.env.BERLIOZ_AGENT_PATH = 'ws://' + INSTANCE_IP + ':55555/' + TARGET_IP;

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

const Promise = require('the-promise');
const Executor = require('../main/lib/executor');
const Policy = require('../main/lib/policy');
const AWS = require('aws-sdk');

return Promise.timeout(1000)
    .then(() => {
        // var options = { url: '/get/item', method: 'GET', headers: {aaa: 1234} };
        // return berlioz.request('service', 'app', 'clientzzz', options);

        var docClient = berlioz.getDatabaseClient('drugs', AWS);
        var params = {
            Item: {
                'name': 'lalala',
                'art': 'zzz'
            }
        };
        return docClient.put(params);

    })
    .then(result => {
        console.log(result);
    })
    .catch(reason => {
        console.log('GLOBAL ERROR: ' + reason);
        console.log(reason);
    })
