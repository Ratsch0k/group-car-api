/* eslint-disable @typescript-eslint/no-explicit-any */
import jwtCsrf from './jwt-csrf';
import sinon, {match, fake} from 'sinon';
import config from '../../config';
import jsonwebtoken from 'jsonwebtoken';
import {expect} from 'chai';
import UnauthorizedError from '../../errors/unauthorized-error';
import Tokens from 'csrf';
import * as util from './jwt-util';

const sandbox = sinon.createSandbox();
const secretName = config.jwt.securityOptions.secretName;
const csrfHeaderName = config.jwt.securityOptions.tokenName;

const notIgnoredMethod = ['PUT', 'POST', 'PATCH'];
const ignoredMethod = ['GET', 'HEAD', 'OPTIONS'];

describe('jwt-csrf', function() {
  let jwtCsrfHandler: any;
  let jwtVerifyStub: any;
  let tokenVerifyStub: any;
  let response: any;
  let request: any;
  let next: any;

  beforeEach(function() {
    jwtCsrfHandler = jwtCsrf();

    /**
     * Stub verify method of jsonwebtoken to return given jwtToken
     */
    jwtVerifyStub = sandbox.stub(jsonwebtoken, 'verify')
        .callsFake((token) => {
          return token;
        });

    response = sandbox.stub();
    request = sandbox.stub();
    next = sandbox.stub();
  });

  afterEach(function() {
    sandbox.restore();
  });

  notIgnoredMethod.forEach(function(method) {
    describe(`with not ignored method "${method}"`, function() {
      beforeEach(function() {
        request.method = method;
      });

      it('throws UnauthorizedError if no jwt ' +
          'exists', function() {
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(null as any);

        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify');

        expect(() => jwtCsrfHandler(request, response, next))
            .to.throw(UnauthorizedError);

        sandbox.assert.notCalled(jwtVerifyStub);
        sandbox.assert.notCalled(tokenVerifyStub);
        sandbox.assert.notCalled(next);
      });

      it('throws UnauthorizedError if no jwt ' +
      'exists but the csrf header', function() {
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns('TEST');
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(null as any);

        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify');

        expect(() => jwtCsrfHandler(request, response, next))
            .to.throw(UnauthorizedError);

        sandbox.assert.notCalled(jwtVerifyStub);
        sandbox.assert.notCalled(tokenVerifyStub);
        sandbox.assert.notCalled(next);
      });

      it('throws UnauthorizedError if jwt has no ' +
          'secret', function() {
        sandbox
            .stub(config.jwt, 'getToken')
            .returns({} as any);

        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify');

        expect(() => jwtCsrfHandler(request, response, next))
            .to.throw(UnauthorizedError);

        sandbox.assert.notCalled(tokenVerifyStub);
        sandbox.assert.notCalled(next);
      });

      it('throws UnauthorizedError if jwt has no ' +
      'secret but the csrf header exists', function() {
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns('TEST');
        sandbox
            .stub(config.jwt, 'getToken')
            .returns({} as any);

        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify');

        expect(() => jwtCsrfHandler(request, response, next))
            .to.throw(UnauthorizedError);

        sandbox.assert.notCalled(tokenVerifyStub);
        sandbox.assert.notCalled(next);
      });

      it('throws UnauthorizedError if jwt' +
          ' exists on request but csrf header not', function() {
        request.get = sandbox.stub().withArgs(csrfHeaderName)
            .returns(undefined);

        sandbox
            .stub(config.jwt, 'getToken')
            .returns({
              [secretName]: 'TEST',
            } as any);

        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify');

        expect(() => jwtCsrfHandler(request, response, next))
            .to.throw(UnauthorizedError);

        sandbox.assert.notCalled(tokenVerifyStub);
        sandbox.assert.notCalled(next);
      });

      it('throws UnauthorizedError if jwt' +
      'and csrf header exist but secret doesn\'t belong to token', function() {
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns('TEST');

        sandbox
            .stub(config.jwt, 'getToken')
            .returns({
              [secretName]: 'TEST',
            } as any);

        /**
         * Stub verify method of tokens to return true
         * if secret and token are equal.
         */
        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify')
            .returns(false);

        expect(() => jwtCsrfHandler(request, response, next))
            .to.throw(UnauthorizedError);

        sandbox.assert.notCalled(next);
      });

      it('calls next if jwt with token and ' +
          'csrf header exist and belong together', function() {
        const token = 'TOKEN';
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns(token);

        const secret = 'SECRET';
        const jwt = {
          [secretName]: secret,
        };
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(jwt as any);

        /**
         * Stub verify method of tokens to return true
         * if secret and token are equal.
         */
        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify')
            .returns(true);

        jwtCsrfHandler(request, response, next);

        sandbox.assert.calledOnce(jwtVerifyStub);
        sandbox.assert.calledWith(jwtVerifyStub, match(jwt), config.jwt.secret);
        sandbox.assert.calledOnce(tokenVerifyStub);
        sandbox.assert.calledWith(tokenVerifyStub, secret, token);
        sandbox.assert.calledOnce(next);
      });

      it('getCsrfToken returns the sent token', function() {
        const token = 'TOKEN';
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns(token);

        const secret = 'SECRET';
        const jwt = {
          [secretName]: secret,
        };
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(jwt as any);

        /**
         * Stub verify method of tokens to return true
         * if secret and token are equal.
         */
        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify')
            .returns(true);

        // Call handler with jwt and token
        jwtCsrfHandler(request, response, next);

        expect(request).to.have.ownProperty('getCsrfToken');
        expect(request.getCsrfToken()).to.be.equal(token);
      });

      it('setJwtToken sets a new jwt cookie', function() {
        const token = 'TOKEN';
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns(token);

        /**
         * Stub settings of an cookie to return name, content and options
         */
        response.cookie = fake();

        /**
         * Stub generateToken method to return payload and subject
         */
        const generateTokenReturnValue = 'GENERATED';
        const generateTokenStub: any = sandbox.stub(util, 'generateToken')
            .callsFake(() => generateTokenReturnValue);

        const secret = 'SECRET';
        const jwt = {
          [secretName]: secret,
        };
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(jwt as any);

        /**
         * Stub verify method of tokens to return true
         * if secret and token are equal.
         */
        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify')
            .returns(true);

        // Call handler with jwt and token
        jwtCsrfHandler(request, response, next);

        expect(response).to.have.ownProperty('setJwtToken');

        const payload = {
          username: 'TEST',
          test: true,
        };

        const expectedNewPayload = {
          username: payload.username,
          test: payload.test,
          [secretName]: secret,
        };

        const subject = 'SUBJECT';
        response.setJwtToken(payload, subject);

        sandbox.assert.calledOnce(generateTokenStub);
        sandbox.assert.calledWith(generateTokenStub,
            match(expectedNewPayload),
            subject);
        sandbox.assert.calledOnce(response.cookie);
        sandbox.assert.calledWith(response.cookie,
            config.jwt.name,
            generateTokenReturnValue,
            config.jwt.cookieOptions);
      });

      it('getSecret returns the secret', function() {
        const token = 'TOKEN';
        request.get = sandbox.stub().withArgs(csrfHeaderName).returns(token);

        const secret = 'SECRET';
        const jwt = {
          [secretName]: secret,
        };
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(jwt as any);
        /**
         * Stub verify method of tokens to return true
         * if secret and token are equal.
         */
        tokenVerifyStub = sandbox.stub(Tokens.prototype, 'verify')
            .returns(true);

        // Call handler with jwt and token
        jwtCsrfHandler(request, response, next);

        expect(request).to.have.ownProperty('getSecret');
        expect(request.getSecret()).to.be.equal(secret);
      });
    });
  });

  ignoredMethod.forEach(function(method) {
    describe(`with ignored method "${method}"`, function() {
      beforeEach(function() {
        request.method = method;

        response.cookie = sandbox.stub();
      });

      it('creates new jwt with just the secret if no jwt exists', function() {
        sandbox
            .stub(config.jwt, 'getToken')
            .returns(null as any);
        /**
         * Stub generateToken method.
         */
        const generateTokenReturnValue = 'GENERATE_TOKEN';
        const generateTokenStub = sandbox.stub(util, 'generateToken')
            .returns(generateTokenReturnValue);

        /**
         * Stub set secret method for tokens.
         */
        const secret = 'SECRET';
        const secretSyncStub = sandbox.stub(Tokens.prototype, 'secretSync')
            .returns(secret);

        jwtCsrfHandler(request, response, next);

        sandbox.assert.calledOnce(secretSyncStub);
        sandbox.assert.calledOnce(generateTokenStub);
        sandbox.assert.calledWith(generateTokenStub,
            match({[secretName]: secret}));
        sandbox.assert.calledOnce(response.cookie);
        sandbox.assert.calledWith(response.cookie, config.jwt.name,
            generateTokenReturnValue);
        sandbox.assert.calledOnce(next);
      });

      it('creates new jwt if jwt ' +
          'exists but is missing secret field', function() {
        const jwt = {
          username: 'TEST',
        };
        sandbox
            .stub(config.jwt, 'getToken')
            .withArgs(request)
            .returns(jwt as any);

        /**
         * Stub generateToken method.
         */
        const generateTokenReturnValue = 'GENERATE_TOKEN';
        const generateTokenStub = sandbox.stub(util, 'generateToken')
            .returns(generateTokenReturnValue);

        /**
         * Stub set secret method for tokens.
         */
        const secret = 'SECRET';
        const secretSyncStub = sandbox.stub(Tokens.prototype, 'secretSync')
            .returns(secret);

        jwtCsrfHandler(request, response, next);

        sandbox.assert.calledOnce(secretSyncStub);
        sandbox.assert.calledOnce(generateTokenStub);
        sandbox.assert.calledWith(generateTokenStub,
            match({[secretName]: secret}));
        sandbox.assert.calledOnce(response.cookie);
        sandbox.assert.calledWith(response.cookie, config.jwt.name,
            generateTokenReturnValue);
        sandbox.assert.calledOnce(next);
      });

      it('calls next if jwt with secret exists', function() {
        /**
         * Stub generateToken method.
         */
        const generateTokenStub = sandbox.stub(util, 'generateToken');

        /**
         * Stub set secret method for tokens.
         */
        const secret = 'SECRET';
        const secretSyncStub = sandbox.stub(Tokens.prototype, 'secretSync');

        const jwt = {
          [secretName]: secret,
        };
        sandbox
            .stub(config.jwt, 'getToken')
            .withArgs(request)
            .returns(jwt as any);
        jwtCsrfHandler(request, response, next);

        sandbox.assert.notCalled(secretSyncStub);
        sandbox.assert.notCalled(generateTokenStub);
        sandbox.assert.notCalled(response.cookie);
        sandbox.assert.calledOnce(config.jwt.getToken as any);
        sandbox.assert.calledOnce(next);
      });
    });
  });
});
