const _ = require('lodash');

/**
 * > a Gateway is used to solve the problem of authentication
 * in a micro-service architecture. Basically, when an endpoint needs to ensure a user
 * is connected before validating the access, an authentication service should be in charge.
 *
 * The generic part regarding this issue can be configured to let the resolver
 * communicating with the Authentication token (generally using jwt) to the Authentication service. Then the authentication
 * service decrypt this token (via the technology it used to crypt it), and replace it by the information related to the user itself or reject it.
 *
 * ---
 *
 * > It is also used to solve the problem of ACL in a micro-service architecture.
 * Basically, when an endpoint needs to ensure the issuer is allowed to execute the piece of code.
 * For example:
 *      - is the issuer member of the group related to the business logic?
 *      - has the issuer a valid subscription level to "                "?
 *
 * Few mandatory information are needed as :
 *      - the list of the secured endpoints
 *      - a resolver for each secured endpoints
 */
class Resolver {
    /**
     *
     * @param registry the registry, responsible for managing instances related to realms.
     * @param options mandatory options containing the realm identifier, the path and the header key.
     */
    constructor(registry, options) {
        if (!registry)
            throw new Error('InvalidRegistryError');

        if (!options || typeof options !== 'object' || (!options.authorization.realm || !options.authorization.path || !options.authorization.header))
            throw new Error('InvalidResolverOptionsError');

        this.options = options;
        this.registry = registry;
    }

    /**
     *
     * @param request
     * @return {Promise.<T>}
     */
    resolveAuthorization(request) {
        const self = this;
        const authentication = request.headers[self.options.authorization.header];

        if (!authentication)
            return Promise.resolve();

        return self.registry
            .next({ realm: self.options.authorization.realm })
            .then(makeRequest)
            .then(parseResponse);

        function makeRequest(instance) {
            const request_options = {
                method: self.options.authorization.method,
                headers: {}
            };

            request_options.headers[self.options.authorization.header] = authentication;
            return instance.request(self.options.authorization.path, request_options);
        }

        function parseResponse(data) {
            try {
                return JSON.stringify(data);
            } catch (error) {
                return data;
            }
        }
    }

    resolveAccess(request, authentication) {
        const self = this;

        if (!self.options.access || !self.options.access.realm)
            return Promise.resolve(authentication);

        return self.registry
            .next({ realm: self.options.access.realm })
            .then(makeRequest);

        function makeRequest(instance) {
            const request_options = {
                method: request.method,
                headers: {}
            };

            request_options.headers[self.options.authorization.header] = authentication;

            return instance
                .request(request.originalUrl, request_options)
                .then(() => authentication);
        }
    }

    resolve(request) {
        return this.resolveAuthorization(request)
            .then(this.resolveAccess.bind(this, request));
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

            function dispatch(authentication) {
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

                    options.headers[self.options.authorization.header] = authentication;

                    delete options.headers['content-length'];

                    if (!_.isEmpty(req.body)) {
                        let content_type = req.header('content-type');
                        const separator_index = content_type.indexOf(';');

                        if (separator_index !== -1)
                            content_type = content_type.substring(0, separator_index);

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

                    return (error.cause && SYSTEM_ERRORS.some(ERR => error.cause.code === ERR)) ? dispatch(authentication) : Promise.reject(error);
                }
            }
        };
    }
}

module.exports = Resolver;
