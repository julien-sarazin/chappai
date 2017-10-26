const _ = require('lodash');

/**
 * Authorization Resolver is used to solve the problem of authorization
 * in a micro-service architecture. Basically, when an endpoint needs to ensure a user
 * is connected before validating the access, an authentication service should be in charge.
 *
 * The generic part regarding this issue can be configured to let the resolver
 * communicating the authorization token (generally using jwt) to the authorization service. Then the authorization
 * service decrypt this token, and replace it by the information related to the user itself or reject it.
 */
class AuthorizationResolver {
    /**
     *
     * @param registry the registry, responsible for managing instances related to realms.
     * @param options mandatory options containing the realm identifier, the path and the header key.
     */
    constructor(registry, options) {
        if (!registry)
            throw new Error('InvalidRegistryError');

        if (!options || typeof options !== 'object' || (!options.realm || !options.path))
            throw new Error('InvalidResolverOptionsError');

        this.options = options;
        options.method = options.method || 'GET';
        options.header = options.header || 'authorization';

        this.registry = registry;
    }

    /**
     *
     * @param request
     * @return {Promise.<T>}
     */
    resolve(request) {
        const self = this;
        const authorization = request.headers[this.options.header];

        if (!authorization)
            return Promise.resolve();

        return self.registry
            .next({ realm: this.options.realm })
            .then(makeRequest)
            .then(parseResponse);

        function makeRequest(instance) {
            const request_options = {
                method: self.options.method,
                headers: {}
            };

            request_options.headers[self.options.header] = authorization;
            return instance.request(self.options.path, request_options);
        }

        function parseResponse(data) {
            try {
                return JSON.stringify(data);
            } catch (error) {
                return data;
            }
        }
    }

    /**
     *
     * @param req
     * @param res
     */
    proxy() {
        const self = this;

        return (req, res) => {
            const realm = req.originalUrl.split('/')[1];
            const targeted_path = `/${req.originalUrl.split('/').splice(2).join('/')}`;
            const ids = [];

            return self
                .resolve(req)
                .then(dispatch)
                .then(data => {
                    data = typeof data === 'number'
                        ? data.toString()
                        : data;

                    res.send(data);
                })
                .catch(response => {
                    const reason = serializeError();
                    res.status(response.code || response.statusCode || 500).send(reason);

                    function serializeError() {
                        return { reason: response.reason || (response.error && response.error.reason) || response.error || response.message };
                    }
                });

            function dispatch(authorization) {
                return self.registry
                    .next({ realm, _id: { $nin: ids } })
                    .then(makeRequest)
                    .then(parseResponse)
                    .catch(dispatchOnRequestErrors);

                function makeRequest(instance) {
                    ids.push(instance.id);

                    const options = {
                        method: req.method,
                        resolveWithFullResponse: true,
                        headers: req.headers
                    };

                    options.headers[self.options.header] = authorization;

                    delete options.headers['content-length'];

                    if (!_.isEmpty(req.body)) {
                        const content_type = req.header('content-type');
                        switch (content_type) {
                            case 'application/json':
                                options.body = JSON.parse(req.body);
                                break;

                            case 'text/plain':
                            case 'text/html':
                                options.body = req.body.toString();
                                break;

                            default:
                                options.body = req.body;
                        }
                    }

                    return instance.request(targeted_path, options);
                }

                function parseResponse(response) {
                    res.set(response.headers);
                    res.statusCode = response.statusCode;

                    return response.body;
                }

                function dispatchOnRequestErrors(error) {
                    const SYSTEM_ERRORS = [
                        'ECONNREFUSED',
                        'ESOCKETTIMEDOUT',
                        'ECONNRESET',
                        'ETIMEDOUT',
                        'EPIPE'
                    ];

                    return (error.cause && SYSTEM_ERRORS.some(ERR => error.cause.code === ERR)) ? dispatch(authorization) : Promise.reject(error);
                }
            }
        };
    }
}

module.exports = AuthorizationResolver;
