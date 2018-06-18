const _ = require('the-lodash');
const Promise = require('the-promise');

class Executor
{
    constructor(registry, policy, zipkin, target, trackerMethod, trackerUrl, actionCb)
    {
        this._registry = registry;
        this._policy = policy;
        this._target = target;
        this._trackerMethod = trackerMethod;
        this._trackerUrl = trackerUrl;
        this._actionCb = actionCb;

        if (this._resolvePolicy('enable-zipkin')) {
            this._zipkin = zipkin;
        }

        if (target[0] == 'service') {
            this._remoteServiceName = process.env.BERLIOZ_CLUSTER + '-' + target[1];
        } else if (target[0] == 'cluster') {
            this._remoteServiceName = target[1] + '-' + target[2];
        } else {
            this._remoteServiceName = process.env.BERLIOZ_CLUSTER + '-' + target.join('-');
        }

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
            .then(result => {
                this._context.result = result;
            })
            .catch(reason => {
                this._context.hasError = true;
                this._context.lastError = reason;
                console.log('retry::catch: ' + reason);
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
        return this._actionCb(peer);
    }

    _fetchPeer()
    {
        var peers = this._registry.get(_.head(this._target), _.drop(this._target));
        return _.randomElement(_.values(peers));
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
        if (this._zipkin) {
            return this._zipkin.instrument(remoteServiceName, method, url);
        } else {
            return {
                finish: () => {},
                error: () => {}
            };
        }
    }

    _resolvePolicy(name)
    {
        return this._policy.resolve(name, this._target);
    }
}

module.exports = Executor;
