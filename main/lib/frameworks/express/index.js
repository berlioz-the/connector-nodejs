const _ = require('the-lodash');

class Handler
{
    constructor(app, berlioz)
    {
        this._app = app;
        this._berlioz = berlioz;
        require('./zipkin')(app, berlioz);
        require('./body-parser')(app, berlioz);
        require('./debugger')(app, berlioz);
    }
}

module.exports = Handler;
