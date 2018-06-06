const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

module.exports = function(app, berlioz) {

    app.use(zipkinMiddleware({berlioz.zipkin.tracer}));

};
