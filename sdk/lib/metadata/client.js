const WebSocket = require('ws');
const Promise = require('the-promise');
const _ = require('the-lodash');

class Client
{
    constructor(logger, environment, processor)
    {
        this._logger = logger;
        this._baseAddress = environment.BERLIOZ_AGENT_PATH;
        if (!this._baseAddress) {
            throw new Error('BerliozSDKError: Environment variable BERLIOZ_AGENT_PATH not set');
        }
        this._processor = processor;

        this._wsInfo = {
            isClosed: false,
            ws: null,
            address: this._baseAddress
        };

        this._connectWs();
    }

    close()
    {
        this._wsInfo.isClosed = true;
        if (this._wsInfo.ws) {
            this._wsInfo.ws.terminate();
            this._wsInfo.ws = null;
        }
    }

    _connectWs()
    {
        if (this._wsInfo.ws) {
            return;
        }
        this._logger.info('Connecting to %s...', this._wsInfo.address);

        this._wsInfo.ws = new WebSocket(this._wsInfo.address);

        this._wsInfo.ws.on('open', () => {
            this._logger.info('Client connected');
            // this._wsInfo.handler();
        });

        this._wsInfo.ws.on('error', error => {
            this._logger.error(error);
        });

        this._wsInfo.ws.on('message', msg => {
            // this._logger.info(msg);
            var data = JSON.parse(msg);
            for(var section of _.keys(data)) {
                this._processor.accept(section, data[section]);
            }
        });

        this._wsInfo.ws.on('close', () => {
            this._wsInfo.ws = null;
            this._logger.info('Client disconnected');
            this._reconnectSection();
        });
    }

    _reconnectSection()
    {
        if (this._wsInfo.isClosed) {
            return;
        }

        this._logger.info('Reconnecting after timeout...');
        return Promise.timeout(2000)
            .then(() => this._connectWs());
    }
}

module.exports = Client;
