const _ = require('lodash');

class Handler
{
    constructor(app, berlioz)
    {
        this._app = app;
        this._berlioz = berlioz;
        request('./zipkin')(app, berlioz);
        request('./debugger')(app, berlioz);
    }
}

module.exports = Handler;
