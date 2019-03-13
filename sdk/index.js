var pjson = require('./package.json');
console.log(`BerliozSDK v${pjson.version}`);

var logger = require('the-logger').setup('bunyan', 'BerliozSDK', {
    enableFile: false
});
// logger.level = 'error';

const Registry = require('./lib/registry');
const Policy = require('./lib/policy');
const Processor = require('./lib/processor');
const Interface = require('./lib/interface');

var registry = new Registry(logger.sublogger('BerliozRegistry'));
var policy = new Policy(logger.sublogger('BerliozPolicy'), registry);
var processor = new Processor(logger.sublogger('BerliozProcessor'), registry);
var intf = new Interface(logger, registry, policy);

if (process.env.BERLIOZ_METADATA_SOURCE == 'override') {
    const Client = require('./lib/metadata/loader');
    var client = new Client(logger.sublogger('BerliozMetaLoader'), intf.environment, processor);
} else {
    const Client = require('./lib/metadata/client');
    var client = new Client(logger.sublogger('BerliozClient'), intf.environment, processor);
}

module.exports = intf;
