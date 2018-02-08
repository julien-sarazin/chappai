const sinon = require('sinon');
const Resolver = require('./Resolver');


describe('Resolver', () => {
    describe('constructor()', () => {
        describe('when no registry is passed', () => {
            it('should throw an InvalidRegistryError', () => {
                function throwable() {
                    return new Resolver();
                }

                throwable
                    .should
                    .throw('InvalidRegistryError');
            });
        });

        describe('when no options are passed', () => {
            it('should throw an InvalidResolverOptionsError', () => {
                function throwable() {
                    const registryCollaborator = {};
                    return new Resolver(registryCollaborator);
                }

                throwable
                    .should
                    .throw('InvalidResolverOptionsError');
            });
        });

        describe('when no handlers are passed', () => {
            it('should throw an MissingHandlersError', () => {
                function throwable() {
                    const registry = {
                        next: () => {
                        }
                    };
                    const options = { authorization: { realm: 'realm', path: 'path', header: 'authorization' } };

                    return new Resolver(registry, options);
                }

                throwable
                    .should
                    .throw('MissingHandlersError');
            });
        });
    });

    describe('.resolve()', () => {
        describe('when a request has to be resolved, with an header without the authorization key', () => {
            it('should fulfill a promise without resolving the authorization', () => {
                const registry = {
                    next: () => {
                    }
                };
                const options = { authorization: { realm: 'realm', path: 'path', header: 'authorization' } };
                const request = { headers: {} };

                const mock = sinon.mock(registry);
                mock
                    .expects('next')
                    .never();

                const handler = () => Promise.resolve();
                const sut = new Resolver(registry, options, handler, handler);

                return sut
                    .resolve(request)
                    .then(() => mock.verify())
                    .should.be.fulfilled;
            });
        });

        describe('when a request has to be resolved, with an header with the authorization key', () => {
            it('should fulfill a promise by resolving the authorization', () => {
                const registry = {
                    next: () => {
                    }
                };
                const instance = {
                    request: () => {
                    }
                };
                const options = { authorization: { realm: 'realm', path: 'path', header: 'authorization' } };
                const request = { headers: { authorization: 'xxx' } };

                const registry_mock = sinon.mock(registry);
                const instance_mock = sinon.mock(instance);

                const handler = () => Promise.resolve();

                registry_mock
                    .expects('next')
                    .once()
                    .returns(Promise.resolve(instance));

                instance_mock
                    .expects('request')
                    .once()
                    .returns('abc');

                const sut = new Resolver(registry, options, handler, handler);

                return sut
                    .resolve(request)
                    .then(() => {
                        registry_mock.verify();
                        instance_mock.verify();
                    })
                    .should.be.fulfilled;
            });
        });
    });

    describe('.proxy()', () => {
        describe('when a request has to be proxy with an authorization header', () => {
            it('should resolve the authorization header by the authorization service, with the proper realm, and path', () => {
                const registry = {
                    next: () => {
                    }
                };
                const instance = {
                    request: () => {
                    }
                };
                const options = { authorization: { realm: 'realm', path: 'path', header: 'authorization' } };
                const handler = () => {};
                const request = { originalUrl: '/test/path/component', headers: { authorization: 'xxx' } };

                const sut = new Resolver(registry, options, handler, handler);

                const registry_mock = sinon.mock(registry);
                const instance_mock = sinon.mock(instance);
                const sut_mock = sinon.mock(sut);

                sut_mock
                    .expects('resolve')
                    .once()
                    .withArgs(request)
                    .returns(Promise.resolve('resolved_authorization'));

                registry_mock
                    .expects('next')
                    .once()
                    .returns(Promise.resolve(instance));

                instance_mock
                    .expects('request')
                    .once()
                    .withArgs('/path/component', {
                        headers: { authorization: 'resolved_authorization' },
                        method: undefined,
                        resolveWithFullResponse: true
                    });

                return sut.proxy()(request)
                    .then(() => {
                        registry_mock.verify();
                        instance_mock.verify();
                        sut_mock.verify();
                    })
                    .should.be.fulfilled;
            });
        });
    });
});
