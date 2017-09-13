const sinon = require('sinon');
const AuthorizationResolver = require('./AuthorizationResolver');


describe('AuthorizationResolver', () => {

    describe('constructor()', () => {
        describe('when no registry is passed', () => {
            it('should throw an InvalidRegistryError', () => {
                function throwable() {
                    return new AuthorizationResolver();
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
                    return new AuthorizationResolver(registryCollaborator);
                }

                throwable
                    .should
                    .throw('InvalidResolverOptionsError');
            });
        });
    });

    describe('resolve', () => {
        describe('when a request has to be resolved, with an header without the authorization key', () => {
            it('should fulfill a promise without resolving the authorization', () => {
                const registry = {
                    next: () => {
                    }
                };
                const options = {realm: 'realm', path: 'path'};
                const request = {headers: {}};

                const mock = sinon.mock(registry);
                mock.expects('next').never();

                const sut = new AuthorizationResolver(registry, options);

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
                const options = {realm: 'realm', path: 'path'};
                const request = {headers: {authorization: 'xxx'}};

                const registry_mock = sinon.mock(registry);
                const instance_mock = sinon.mock(instance);

                registry_mock.expects('next')
                    .once()
                    .returns(Promise.resolve(instance));

                instance_mock.expects('request')
                    .once()
                    .returns('abc');

                const sut = new AuthorizationResolver(registry, options);

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
});

