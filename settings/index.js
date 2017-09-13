const _ = require('lodash');

module.exports = (settings) => {
    _.merge(
        settings,
        require('./settings.json'),
        require('./authorization.json')
    );

    loadFromEnv(settings);

    function loadFromEnv(settings) {
        Object.keys(settings).forEach((property) => {
            if (!Object.prototype.hasOwnProperty.call(settings, property))
                return null;

            if (typeof settings[property] === 'object')
                return loadFromEnv(settings[property]);

            if (typeof settings[property] === 'string' && settings[property].startsWith('$')) {
                const setting = process.env[settings[property].slice(1)];
                if (!setting)
                    throw new Error(`missing env property: ${settings[property].slice(1)}`);

                settings[property] = setting;
            }

            return null;
        });
    }

    return settings;
};
