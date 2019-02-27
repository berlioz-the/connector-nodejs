var pjson = require('./package.json');
console.log(`BerliozSDK v${pjson.version}`);

if (!process.env.BERLIOZ_AGENT_PATH) {
    throw new Error('BerliozSDKError: Environment variable BERLIOZ_AGENT_PATH not set');
}

var logger = require('the-logger').setup('bunyan', 'BerliozSDK', {
    enableFile: false
});
// logger.level = 'error';

const Registry = require('./lib/registry');
const Policy = require('./lib/policy');
const Processor = require('./lib/processor');
const Interface = require('./lib/interface');
const Client = require('./lib/client');

var registry = new Registry(logger.sublogger('BerliozRegistry'));
var policy = new Policy(logger.sublogger('BerliozPolicy'), registry);
var processor = new Processor(logger.sublogger('BerliozProcessor'), registry);
var intf = new Interface(logger, registry, policy);
var client = new Client(logger.sublogger('BerliozClient'), intf.environment.BERLIOZ_AGENT_PATH, processor);

module.exports = intf;
