const _ = require('the-lodash');
const Promise = require('the-promise');
const request = require('request-promise');

const PeerAccessor = require('./peer-accessor');
const Executor = require('./executor');

class HttpPeerAccessor extends PeerAccessor
{
    constructor(berlioz, id, endpoint)
    {
        if (!endpoint) {
            endpoint = 'default';
        }
        super(berlioz, [id, endpoint])
    }

    request(options, cb) {
        this.logger.silly('REQUEST, orig options: ', options);

        var options = _.clone(options);
        var url = options.url;
        options.timeout = this._berlioz._policy.resolve('timeout', this._policyTarget);

        return this.performExecutor(options.method || 'GET', url, true, cb,
            (peer, traceId) => {

                options.url = peer.protocol + '://' + peer.address + ':' + peer.port;
                if (url) {
                    options.url += url;
                }

                var finalOptions;
                if (traceId) {
                    finalOptions = this._berlioz._zipkin.addZipkinHeaders(options, traceId);
                } else {
                    finalOptions = options;
                }

                this.logger.silly('REQUEST, newOptions: ', finalOptions);
                return request(finalOptions);
            });
    }
}

module.exports = HttpPeerAccessor;