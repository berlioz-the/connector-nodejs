const {
    Tracer,
    Annotation,
    Request,
    BatchRecorder,
    jsonEncoder: {
        JSON_V2
    },
    ExplicitContext,
    Instrumentation,
    ConsoleRecorder
} = require('zipkin');
const {
    HttpLogger
} = require('zipkin-transport-http');
const CLSContext = require('zipkin-context-cls');

const Promise = require('the-promise');

class Zipkin {
    constructor(policy) {
        this._localServiceName = process.env.BERLIOZ_CLUSTER + '-' + process.env.BERLIOZ_SERVICE;

        const ctxImpl = new CLSContext('zipkin');

        this.logger = new HttpLogger({
            endpoint: '',
            jsonEncoder: JSON_V2, // optional, defaults to JSON_V1
            httpInterval: 1000 // how often to sync spans. optional, defaults to 1000
        });
        policy.monitor('zipkin-endpoint', [], value => {
            this.logger.endpoint = value;
        });
        const recorder = new BatchRecorder({logger: this.logger});
        // const recorder = new ConsoleRecorder();
        this.tracer = new Tracer({
            ctxImpl,
            recorder,
            localServiceName: this._localServiceName
        });
    }

    addZipkinHeaders(request, traceId) {
        return Request.addZipkinHeaders(request, traceId);
    }

    instrument(remoteServiceName, method, url)
    {
        return this.tracer.scoped(() => {
            this.tracer.setId(this.tracer.createChildId());
            this.tracer.recordServiceName(this.tracer.localEndpoint.serviceName);
            this.tracer.recordRpc(method.toUpperCase());
            this.tracer.recordBinary('http.url', url);
            this.tracer.recordAnnotation(new Annotation.ClientSend());
            this.tracer.recordAnnotation(new Annotation.ServerAddr({
                serviceName: remoteServiceName
            }));

            const traceId = this.tracer.id;

            const recordResponse = (statusCode) => {
                this.tracer.setId(traceId);
                this.tracer.recordBinary('http.status_code', statusCode.toString());
                this.tracer.recordAnnotation(new Annotation.ClientRecv());
            };

            const recordError  = (error) => {
                this.tracer.setId(traceId);
                this.tracer.recordBinary('error', error.toString());
                this.tracer.recordAnnotation(new Annotation.ClientRecv());
            };

            return {
                traceId: traceId,
                finish: recordResponse,
                error: recordError
            }
        });
    }
}

module.exports = Zipkin;
