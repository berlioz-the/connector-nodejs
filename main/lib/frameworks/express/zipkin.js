const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

module.exports = function(app, berlioz) {

    app.use((req, res, next) => {
        var mid = zipkinMiddleware({tracer: berlioz.zipkin.tracer});
        mid(req, res, () => {
            req.tracerId = berlioz.zipkin.tracer.id;
            next();
        });
    });

};
