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
                const registry = { next: () => {} };
                const mock = sinon.mock(registry);
                mock.expects('next').never();

                const sut = new AuthorizationResolver(mock, { realm: 'realm', path: 'path' });
                const request = { headers: {} };

                return sut
                    .resolve(request)
                    .then(() => mock.verify())
                    .should.be.fulfilled;
            });
        });
    });
});

