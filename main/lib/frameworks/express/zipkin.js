const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

module.exports = function(app, berlioz, policy) {

    var middleware = zipkinMiddleware({tracer: berlioz.zipkin.tracer});
    var enableZipkin = false;

    policy.monitor('enable-zipkin', [], value => {
        enableZipkin = value;
    });

    app.use((req, res, next) => {
        if (enableZipkin) {
            middleware(req, res, () => {
                req.tracerId = berlioz.zipkin.tracer.id;
                next();
            });
        } else {
            next();
        }
    });

};
