if (!process.env.BERLIOZ_AGENT_PATH) {
    throw new Error('Error: Environment variable BERLIOZ_AGENT_PATH not set');
}

var logger = require('the-logger').setup('bunyan', 'BerliozConnector', {
    enableFile: false
});
// logger.level = 'error';

const Registry = require('./lib/registry');
const Processor = require('./lib/processor');
const Interface = require('./lib/interface');
const Client = require('./lib/client');

var registry = new Registry(logger.sublogger('BerliozRegistry'));
var processor = new Processor(logger.sublogger('BerliozProcessor'), registry);
var intf = new Interface(logger, registry);
var client = new Client(logger.sublogger('BerliozClient'), process.env.BERLIOZ_AGENT_PATH, processor);

module.exports = intf;
