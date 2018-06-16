const WebSocket = require('ws');
const Promise = require('the-promise');
const _ = require('the-lodash');

class Client
{
    constructor(logger, baseAddress, processor)
    {
        this._logger = logger;
        this._baseAddress = baseAddress;
        this._processor = processor;
        this._sections = [];

        this._wsInfo = {
            isClosed: false,
            ws: null,
            address: this._baseAddress
        };

        this._connectSection(this._wsInfo);
    }

    close()
    {
        this._closeSection(this._wsInfo);
    }

    _connectSection(wsInfo)
    {
        this._logger.info('Connecting to %s...', wsInfo.address);

        wsInfo.ws = new WebSocket(wsInfo.address);

        wsInfo.ws.on('open', () => {
            this._logger.info('Client connected');
            // wsInfo.handler();
        });

        wsInfo.ws.on('error', error => {
            this._logger.error(error);
        });

        wsInfo.ws.on('message', msg => {
            // this._logger.info(msg);
            var data = JSON.parse(msg);
            for(var section of _.keys(data)) {
                this._processor.accept(section, data[section]);
            }
        });

        wsInfo.ws.on('close', () => {
            wsInfo.ws = null;
            this._logger.info('Client disconnected');
            this._reconnectSection(wsInfo);
        });
    }

    _reconnectSection(wsInfo)
    {
        if (wsInfo.isClosed) {
            return;
        }

        this._logger.info('Reconnecting after timeout...');
        return Promise.timeout(2000)
            .then(() => this._connectSection(wsInfo));
    }

    _closeSection(wsInfo)
    {
        wsInfo.isClosed = true;
        if (wsInfo.ws) {
            wsInfo.ws.terminate();
        }
    }
}

module.exports = Client;
