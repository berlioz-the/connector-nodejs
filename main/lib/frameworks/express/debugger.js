const serveStatic = require('serve-static')
const prettyHtml = require('json-pretty-html').default;

const VIEW_PREFIX = '../node_modules/berlioz-connector/lib/router-helpers/express/views/pages/';

module.exports = function(app, berlioz) {

    var staticServePath = __dirname + '/public';
    console.log('staticServePath: ' + staticServePath);
    if (!serveStatic) {
        console.log('serveStatic NOT PRESENT');
    }
    app.use('/berlioz_public', serveStatic(staticServePath));

    app.get('/berlioz', (req, response) => {
        var renderData = getRenderData();
        renderData.environment = getEnvironment();
        renderData.metadataHtml = getMetadata();
        response.render(VIEW_PREFIX + 'index', renderData);
    });

    app.get('/berlioz/environment', (req, response) => {
        var renderData = getRenderData();
        renderData.environment = getEnvironment();
        response.render(VIEW_PREFIX + 'environment', renderData);
    });

    app.get('/berlioz/metadata', (req, response) => {
        var renderData = getRenderData();
        renderData.metadataHtml = getMetadata();
        response.render(VIEW_PREFIX + 'metadata', renderData);
    });

    function getRenderData()
    {
        return {
            cluster: process.env.BERLIOZ_CLUSTER,
            service: process.env.BERLIOZ_SERVICE
        };
    }

    function getEnvironment()
    {
        return _(process.env)
            .keys()
            .map(x => ({name: x, value: process.env[x]}))
            .orderBy(x => x.name);
    }

    function getMetadata()
    {
        var metadata = berlioz.extractRoot();
        var metaStr = JSON.stringify(metadata);
        var metaObj = JSON.parse(metaStr);
        return prettyHtml(metaObj);
    }

};
