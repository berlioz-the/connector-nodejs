const _ = require('the-lodash');

class Loader
{
    constructor(logger, environment, processor)
    {
        this._logger = logger;
        this._processor = processor;

        var str = environment.BERLIOZ_METADATA_OVERRIDE;
        if (!str) {
            throw new Error('BerliozSDKError: Environment variable BERLIOZ_METADATA_OVERRIDE not set');
        }

        var data = JSON.parse(str);
        for(var section of _.keys(data)) {
            this._processor.accept(section, data[section]);
        }
    }
}

module.exports = Loader;
