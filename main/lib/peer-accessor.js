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
        this._berlioz._monitorPeer(this._peerPath, this._berlioz._selectFirstPeer.bind(this._berlioz), cb);
    }

    all()
    {
        return this._berlioz._getPeers(this._peerPath);
    }

    first()
    {
        return this._berlioz._getPeer(this._peerPath, this._berlioz._selectFirstPeer.bind(this._berlioz));
    }

    random()
    {
        return this._berlioz._getPeer(this._peerPath, this._berlioz._selectRandomPeer.bind(this._berlioz));
    }
 
    performExecutor(trackerMethod, trackerUrl, resultCb, actionCb)
    {
        var executor = new Executor(this.logger, this, this._berlioz._policy, this._berlioz._zipkin,
            this._peerPath,
            trackerMethod, trackerUrl, actionCb);
        return executor.perform(resultCb);
    }
}

module.exports = PeerAccessor;