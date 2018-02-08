const Idylle = require('idylle');
const Core = Idylle.Core;
const chappai = new Core();

chappai.events = Core.events;

chappai.on(Core.events.init.settings,      require('./settings'));
chappai.on(Core.events.init.routes,        require('./core'));
chappai.on(Core.events.init.routes,        require('./routes'));

// Disabling default directory loading by registering blank listeners
chappai.on(Core.events.init.actions,        app => {});
chappai.on(Core.events.init.models,         app => {});
chappai.on(Core.events.init.middlewares,    app => {});
chappai.on(Core.events.init.boot,           app => {});

module.exports = chappai;
