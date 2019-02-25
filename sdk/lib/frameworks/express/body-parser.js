const bodyParser = require('body-parser');

module.exports = function(app, berlioz) {

    app.use((req, res, next) => {
        var mid = bodyParser.json();
        mid(req, res, () => {
            berlioz.zipkin.tracer.setId(req.tracerId);
            next();
        });
    });

    app.use((req, res, next) => {
        var mid = bodyParser.urlencoded({ extended: true });
        mid(req, res, () => {
            berlioz.zipkin.tracer.setId(req.tracerId);
            next();
        });
    });

};
