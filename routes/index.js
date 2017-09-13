const bodyParser = require('body-parser');

module.exports = (app) => {
    app.server.use(bodyParser.raw({ type: '*/*', limit: app.settings.body_limit }), app.resolver.proxy());
};

