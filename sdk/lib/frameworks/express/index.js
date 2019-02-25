const _ = require('the-lodash');

class Handler
{
    constructor(app, berlioz, policy)
    {
        require('./zipkin')(app, berlioz, policy);
        require('./body-parser')(app, berlioz);
        require('./debugger')(app, berlioz);
    }
}

module.exports = Handler;
