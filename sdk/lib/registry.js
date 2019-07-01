const _ = require('the-lodash');
const uuid = require('uuid/v4');

class Registry
{
    constructor(logger)
    {
        this._logger = logger;
        this._sections = {};
        this._subscribers = {};
    }

    extractRoot() {
        return this._sections;
    }

    subscribe(sectionName, path, cb)
    {
        var subscriberId = this._getSubscriberId(sectionName, path);
        if (!(subscriberId in this._subscribers)) {
            this._subscribers[subscriberId] = {};
        }
        var id = uuid();
        this._subscribers[subscriberId][id] = cb;

        this._notifyToSubscriber(sectionName, path, cb);

        return {
            stop: () => {
                delete this._subscribers[subscriberId][id];
                if (_.keys(this._subscribers[subscriberId]).length == 0) {
                    delete this._subscribers[subscriberId];
                }
            }
        }
    }

    _getSubscriberId(sectionName, path)
    {
        var subscriber = {
            section: sectionName,
            path: path
        };
        var subscriberId = JSON.stringify(subscriber);
        return subscriberId;
    }

    _notifyToSubscribers(sectionName, path)
    {
        var subscriberId = this._getSubscriberId(sectionName, path);
        if (!(subscriberId in this._subscribers)) {
            return;
        }
        var value = this.get(sectionName, path);
        if (!value) {
            return;
        }
        for(var cb of _.values(this._subscribers[subscriberId]))
        {
            this._triggerToSubscriber(value, cb);
        }
    }

    _notifyToSubscriber(sectionName, path, cb)
    {
        var value = this.get(sectionName, path);
        if (!value) {
            return;
        }
        this._triggerToSubscriber(value, cb);
    }

    _triggerToSubscriber(value, cb)
    {
        cb(value);
    }

    reset(sectionName)
    {
        this._logger.info('Reset:: ' + sectionName);
        this._sections[sectionName] = {};
    }

    set(sectionName, path, value)
    {
        this._logger.info('Set:: ' + sectionName + ', Path: ' + JSON.stringify(path), value);

        var section = this._getSection(sectionName);
        var pathStr = JSON.stringify(path);
        var currValue = section[pathStr];
        if (_.isEqual(currValue, value)) {
            return;
        }
        section[pathStr] = value;
        this._notifyToSubscribers(sectionName, path);
    }

    get(sectionName, path)
    {
        var section = this._getSection(sectionName);
        var pathStr = JSON.stringify(path);
        var currValue = section[pathStr];
        return currValue;
    }

    _getSection(name)
    {
        if (!(name in this._sections))
        {
            this._sections[name] = {};
        }
        return this._sections[name];
    }
}

module.exports = Registry;
