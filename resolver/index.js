const YemmaDiscovery = require('yemma-discovery');
const AuthorizationResolver = require('./AuthorizationResolver');

module.exports = app => init(app);

function init(app) {
    init_registry(app);
    init_resolver(app);
}

function init_registry(app) {
    app.registry = new YemmaDiscovery({ heartBeat: false });
}

function init_resolver(app) {
    app.resolver = new AuthorizationResolver(app.registry, app.settings.authorization);
}
