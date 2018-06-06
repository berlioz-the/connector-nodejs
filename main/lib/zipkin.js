const {
    Tracer,
    BatchRecorder,
    jsonEncoder: {
        JSON_V2
    },
    ExplicitContext,
    ConsoleRecorder
} = require('zipkin');
const {
    HttpLogger
} = require('zipkin-transport-http');
const CLSContext = require('zipkin-context-cls');

const wrapRequest = require('zipkin-instrumentation-request');
const request = require('request');
const Promise = require('Promise');

class Zipkin {
    constructor(berlioz) {
        this._berlioz = berlioz;

        const ctxImpl = new CLSContext('zipkin');
        const localServiceName = process.env.BERLIOZ_CLUSTER + '-' + process.env.BERLIOZ_SERVICE;
        const recorder = new BatchRecorder({
            logger: new HttpLogger({
                endpoint: process.env.BERLIOZ_ZIPKIN_PATH, //'http://172.17.0.10:9411/api/v2/spans',
                jsonEncoder: JSON_V2, // optional, defaults to JSON_V1
                httpInterval: 1000 // how often to sync spans. optional, defaults to 1000
            })
        });
        this.tracer = new Tracer({
            ctxImpl,
            recorder,
            localServiceName
        });
    }

    makeRequest(options, remoteServiceName) {
        const zipkinRequest = wrapRequest(request, {
            tracer: this.tracer,
            remoteServiceName
        });
        return new Promise((resolve, reject) => {
            zipkinRequest(options, (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                resolve({
                    response,
                    body
                });
            });
        });
    }
}

module.exports = Zipkin;
