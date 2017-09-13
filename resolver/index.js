const registry = require('yemma');
const AuthorizationResolver = require('./AuthorizationResolver');

module.exports = app => init(app);

function init(app) {
    init_registry(app);
    init_resolver(app);
}

function init_registry(app) {
    app.registry = registry;
    registry.on(registry.events.started, instance => console.log('Registry started on port', instance.settings.port));
    registry.start();
}

function init_resolver(app) {
    app.resolver = new AuthorizationResolver(app.registry, app.settings.authorization);
}
