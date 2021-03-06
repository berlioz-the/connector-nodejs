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

class Zipkin {
    constructor(berlioz, policy) {
        this._berlioz = berlioz;
        this._logger = this._berlioz.logger.sublogger("BerliozZipkin");
        this._policy = policy;
        this._localServiceName = ['service', process.env.BERLIOZ_CLUSTER, process.env.BERLIOZ_SECTOR, process.env.BERLIOZ_SERVICE].join('-');

        const ctxImpl = new CLSContext('zipkin');

        this._zipLogger = new HttpLogger({
            endpoint: null,
            jsonEncoder: JSON_V2, // optional, defaults to JSON_V1
            httpInterval: 1000 // how often to sync spans. optional, defaults to 1000
        });

        const recorder = new BatchRecorder({logger: this._zipLogger});
        // const recorder = new ConsoleRecorder();
        this.tracer = new Tracer({
            ctxImpl,
            recorder,
            localServiceName: this._localServiceName
        });

        this._monitorServiceId();
    }

    get logger() {
        return this._logger;
    }

    _monitorServiceId()
    {
        this._policy.monitor('zipkin-service-id', [], value => {
            this._monitorServiceAddress(value)
        });
    }

    _monitorServiceAddress(serviceId)
    {
        this.logger.info('ZIPKIN SERVICE ID: %s', serviceId);
        this._zipLogger.endpoint = null;
        this._berlioz._peerAccessor(serviceId).monitorFirst(peer => {
            if (peer) {
                this._zipLogger.endpoint = peer.protocol + '://' + peer.address + ':' + peer.port + '/api/v2/spans';
            } else {
                this._zipLogger.endpoint = null;
            }
            this.logger.info('ZIPKIN URL: %s', this._zipLogger.endpoint);
        })
    }

    addZipkinHeaders(request, traceId) {
        return Request.addZipkinHeaders(request, traceId);
    }

    instrument(remoteServiceName, method, url)
    {
        this.logger.verbose('[instrument] %s...', remoteServiceName);
        return this.tracer.scoped(() => {
            this.tracer.setId(this.tracer.createChildId());
            // this.tracer.recordServiceName(this._localServiceName);
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

            const recordError = (error) => {
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
