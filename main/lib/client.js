const WebSocket = require('ws');
const Promise = require('the-promise');

class Client
{
    constructor(logger, baseAddress, processor)
    {
        this._logger = logger;
        this._baseAddress = baseAddress;
        this._processor = processor;
        this._sections = [];

        this._addSection('endpoints', this._processor.acceptEndpoints.bind(this._processor));
        this._addSection('peers', this._processor.acceptPeers.bind(this._processor));
    }

    close()
    {
        for(var section of this._sections)
        {
            this._closeSection(section);
        }
    }

    _addSection(name, handler)
    {
        var sectionInfo = {
            section: name,
            isClosed: false,
            ws: null,
            address: this._baseAddress + '/' + name,
            handler: handler
        }
        this._sections.push(sectionInfo);
        this._connectSection(sectionInfo);
    }

    _connectSection(sectionInfo)
    {
        this._logger.info('Connecting to %s...', sectionInfo.address);

        sectionInfo.ws = new WebSocket(sectionInfo.address);

        sectionInfo.ws.on('open', () => {
            this._logger.info('Client connected');
            sectionInfo.handler();
        });

        sectionInfo.ws.on('error', error => {
            this._logger.error(error);
        });

        sectionInfo.ws.on('message', msg => {
            // this._logger.info(msg);
            var data = JSON.parse(msg);
            sectionInfo.handler(data);
        });

        sectionInfo.ws.on('close', () => {
            sectionInfo.ws = null;
            this._logger.info('Client disconnected');
            this._reconnectSection(sectionInfo);
        });
    }

    _reconnectSection(sectionInfo)
    {
        if (sectionInfo.isClosed) {
            return;
        }

        this._logger.info('Reconnecting after timeout...');
        return Promise.timeout(2000)
            .then(() => this._connectSection(sectionInfo));
    }

    _closeSection(sectionInfo)
    {
        sectionInfo.isClosed = true;
        if (sectionInfo.ws) {
            sectionInfo.ws.terminate();
        }
    }
}

module.exports = Client;
