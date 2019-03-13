process.env['BERLIOZ_AGENT_PATH'] = 'ws://localhost:40006/0fb4ca9c-8c19-4ec4-86b2-61fad1134171';
process.env['BERLIOZ_IDENTITY'] = '1';
process.env['BERLIOZ_INFRA'] = 'local';
process.env['BERLIOZ_REGION'] = 'earth-local';
process.env['BERLIOZ_CLUSTER'] = 'hello';
process.env['BERLIOZ_SECTOR'] = 'main';
process.env['BERLIOZ_SERVICE'] = 'web';

const _ = require('the-lodash');
const Promise = require('the-promise');
const berlioz = require('../../../sdk');

const logger = berlioz.logger.sublogger("Sample");

function processQueue()
{
    berlioz.zipkin._zipLogger.endpoint = 'http://localhost:' + '40004' + '/api/v2/spans';
    logger.info('NEW ZIPKIN URL: %s', berlioz.zipkin._zipLogger.endpoint);

    logger.info("[ProcessQueue]...");
    berlioz.zipkin.instrument('my-internal', 'processQueue', 'http://zzz');
    return Promise.timeout(1000)
        .then(() => processQueue());
}

processQueue()
    .then(result => {
        logger.log("RESULT: " + result);
    })
    .catch(reason => {
        logger.error(reason);

    });