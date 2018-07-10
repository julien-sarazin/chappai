const YemmaDiscovery = require('yemma-discovery');
const Resolver = require('./Resolver');

module.exports = app => init(app);

function init(app) {
    init_registry(app);
    init_resolver(app);
}

function init_registry(app) {
    app.registry = new YemmaDiscovery({ subscribe: false });
}

function init_resolver(app) {
    app.resolver = new Resolver(
        app.registry,
        app.settings,
        app.responseHandler,
        app.errorHandler);
}
