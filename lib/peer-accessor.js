const _ = require('the-lodash');
const Promise = require('the-promise');
const Executor = require('./executor');

class PeerAccessor
{
    constructor(berlioz, peerPath)
    {
        this._berlioz = berlioz;
        this._peerPath = peerPath;
    }

    get peerPath() {
        return this._peerPath;
    }

    get peerId() {
        return _.head(this._peerPath);
    }

    get logger() {
        return this._berlioz.logger;
    }

    get registry() {
        return this._berlioz._registry;
    }

    monitorAll(cb)
    {
        this._berlioz._monitorPeers(this._peerPath, cb);
    }

    monitorFirst(cb)
    {
        this._berlioz._monitorPeer(this._peerPath, this._selectFirstPeer.bind(this), cb);
    }

    all()
    {
        return this._berlioz._getPeers(this._peerPath);
    }

    first()
    {
        return this._berlioz._getPeer(this._peerPath, this._selectFirstPeer.bind(this));
    }

    random()
    {
        return this._berlioz._getPeer(this._peerPath, this._selectRandomPeer.bind(this));
    }
    
    performExecutor(trackerMethod, trackerUrl, peerSelector, resultCb, actionCb)
    {
        var executor = new Executor(this.logger, peerSelector, this._berlioz._policy, this._berlioz._zipkin,
            this._peerPath,
            trackerMethod, trackerUrl, actionCb);
        return executor.perform(resultCb);
    }

    _selectFirstPeer(peers)
    {
        if (_.isEmpty(peers)) {
            return null;
        }
        var identity = _.head(_.keys(peers));
        return peers[identity];
    }

    _selectRandomPeer(peers)
    {
        if (_.isEmpty(peers)) {
            return null;
        }
        var peerIdentities = _.keys(peers);
        var index = _.random(0, peerIdentities.length - 1);
        var identity = peerIdentities[index];
        return peers[identity];
    }
}

module.exports = PeerAccessor;