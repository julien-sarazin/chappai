const _ = require('lodash');

module.exports = (settings) => {
    _.merge(
        settings,
        require('./settings.json'),
        require('./config_template.json')
    );

    loadFromEnv(settings);

    function loadFromEnv(settings) {
        Object.keys(settings).forEach((property) => {
            if (!Object.prototype.hasOwnProperty.call(settings, property))
                return null;

            if (typeof settings[property] === 'object')
                return loadFromEnv(settings[property]);

            if (typeof settings[property] === 'string' && settings[property].startsWith('$')) {
                const key = (settings[property].endsWith('?'))
                    ? settings[property].slice(1).slice(0, -1)
                    : settings[property].slice(1);

                const setting = process.env[key];

                if (!setting && !settings[property].endsWith('?'))
                    throw new Error(`missing env property: ${key}`);

                if (!settings && settings[property].endsWith('?'))
                    delete settings[property];

                settings[property] = setting;
            }

            return null;
        });
    }

    return settings;
};
