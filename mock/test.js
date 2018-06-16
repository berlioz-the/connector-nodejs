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
    console.log('PEERS:');
    console.log(JSON.stringify(peers, null, 2));
});
