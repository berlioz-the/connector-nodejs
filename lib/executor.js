const _ = require('the-lodash');
const Promise = require('the-promise');

class Executor
{
    constructor(logger, peerAccessor, policy, zipkin, target, selectRandom, trackerMethod, trackerUrl, actionCb)
    {
        this._logger = logger;
        this._peerAccessor = peerAccessor;
        this._policy = policy;
        this._target = target;
        this._selectRandom = selectRandom;
        this._trackerMethod = trackerMethod;
        this._trackerUrl = trackerUrl;
        this._actionCb = actionCb;

        if (this._resolvePolicy('enable-zipkin')) {
            this._logger.verbose('Zipkin is enabled.');
            this._zipkin = zipkin;
        }

        this._remoteServiceName = _.head(this._target);
        this._remoteServiceName = this._remoteServiceName.replace(/\//g, '');
        this._remoteServiceName = this._remoteServiceName.replace(/:/g, '-');

        this._context = {
            canRetry: true,
            tryCount: 0
        };
    }

    perform(cb)
    {
        if (!cb) {
            return this._try();
        } else {
            return this._try()
                .then(result => cb(null, result))
                .catch(reason => cb(reason, null));
        }
    }

    _try()
    {
        return Promise.resolve()
            .then(() => {
                this._context.hasError = false;
                this._context.lastError = null;
                this._context.tryCount++;
                return this._perform();
            })
            .then(() => {
                if (this._checkCompleted()) {
                    return this._context.result;
                } else {
                    return this._retry();
                }
            })
    }

    _retry()
    {
        if (this._context.tryCount >= this._resolvePolicy('retry-count')) {
            this._context.canRetry = false;
        }

        if (!this._context.canRetry) {
            return Promise.reject(this._context.lastError);
        }

        return this._retryWait()
            .then(() => this._try());
    }

    _retryWait()
    {
        var timeout = this._resolvePolicy('retry-initial-delay');
        timeout = timeout * Math.pow(this._resolvePolicy('retry-delay-multiplier'), this._context.tryCount - 1);
        timeout = Math.min(timeout, this._resolvePolicy('retry-max-delay'));
        if (timeout > 0) {
            var tracer = this._instrument('sleep', 'GET', 'http://sleep');
            return Promise.timeout(timeout)
                .then(() => {
                    tracer.finish(200);
                });
        }
    }

    _perform()
    {
        var peer = this._fetchPeer();
        if (!peer) {
            if (!this._resolvePolicy('no-peer-retry')) {
                this._context.canRetry = false;
            }
            return Promise.reject(new Error('No peer found.'));
        }

        var tracer = this._instrument(this._remoteServiceName, this._trackerMethod, this._trackerUrl);
        return Promise.resolve(this._actionCb(peer, tracer.traceId))
            .then(result => {
                tracer.finish(200);
                this._context.result = result;
            })
            .catch(reason => {
                tracer.error(reason);
                this._context.hasError = true;
                this._context.lastError = reason;
                this._logger.error('Executor::_perform::catch: ', reason);
            });
    }

    _fetchPeer()
    {
        if (this._selectRandom) {
            return this._peerAccessor.random();
        } else {
            return this._peerAccessor.first();
        }
    }

    _checkCompleted()
    {
        if (this._context.hasError) {
            return false;
        }
        return true;
    }

    _instrument(remoteServiceName, method, url)
    {
        var result;
        if (this._zipkin) {
            result = this._zipkin.instrument(remoteServiceName, method, url);
        }
        if (!result)
        {
            result = {
                traceId: null,
                finish: () => {},
                error: () => {}
            };
        }
        return result;
    }

    _resolvePolicy(name)
    {
        return this._policy.resolve(name, this._target);
    }
}

module.exports = Executor;
