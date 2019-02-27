const _ = require('the-lodash');

class Policy
{
    constructor(logger, registry)
    {
        this._logger = logger;
        this._registry = registry;
        this._defaults = {
            'enable-zipkin': false,
            'zipkin-endpoint': '',
            'timeout': 5000,
            'no-peer-retry': true,
            'retry-count': 3,
            'retry-initial-delay': 500,
            'retry-delay-multiplier': 2,
            'retry-max-delay': 5000
        }
    }

    get logger() {
        return this._logger;
    }

    monitor(name, target, cb)
    {
        this.logger.verbose('[monitor] %s::%s ...', name, target);
        var currValue = this.resolve(name, target);
        cb(currValue);
        this._registry.subscribe('policies', [], () => {
            this.logger.verbose('[monitor] changed %s::%s ...', name, target);
            var newValue = this.resolve(name, target);
            this.logger.verbose('[monitor] changed %s::%s, new value: %s', name, target, newValue);
            if (currValue != newValue) {
                currValue = newValue;
                cb(currValue);
            }
        });
    }

    resolve(name, target)
    {
        var root = this._registry.get('policies', []);
        if (!root) {
            root = {};
        }
        if (!target) {
            target = [];
        }
        var value = this._resolve(root, name, target);
        if (_.isNotNullOrUndefined(value)) {
            return value;
        }
        value = this._defaults[name];
        if (_.isNotNullOrUndefined(value)) {
            return value;
        }
        console.log('No Default set for ' + name);
        return null;
    }

    _resolve(root, name, target)
    {
        // console.log(target.join('-'));
        // console.log(JSON.stringify(root, null, 4));

        var value = null;
        if (target.length > 0) {
            if (root.children) {
                var child = root.children[_.head(target)];
                if (child) {
                    var childTarget = _.drop(target);
                    value = this._resolve(child, name, childTarget)
                }
            }
        }
        if (_.isNotNullOrUndefined(value)) {
            return value;
        }
        if (root.values) {
            return root.values[name];
        }
        return null;
    }
}

module.exports = Policy;
