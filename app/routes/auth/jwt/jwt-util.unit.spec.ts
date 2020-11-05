/* eslint-disable @typescript-eslint/no-explicit-any */
import {User} from '../../../models';
import sinon, {match} from 'sinon';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import {
  generateToken,
  convertUserToJwtPayload,
  postLoginJwtValidator,
} from './jwt-util';
import {expect} from 'chai';
import {NotLoggedInError, UnauthorizedError} from '../../../errors';
import Bluebird from 'bluebird';

const sandbox = sinon.createSandbox();

describe('jwt-util', function() {
  let signStub: any;
  let getOptionsStub: any;

  /**
   * Stub not relevant methods.
   */
  beforeEach(function() {
    /*
     * Stub sign function with a fake which returns the given arguments inside
     * an object.
     */
    signStub = sandbox.stub(jwt, 'sign')
        .callsFake((payload, secret, options) => {
          return {
            payload,
            secret,
            options,
          };
        });

    /**
     * Stub `getOptions` of the config with a fake which
     * returns the given argument.
     * Real implementation is not relevant here.
     */
    getOptionsStub = sandbox.stub(config.jwt, 'getOptions')
        .callsFake((subject) => {
          if (subject !== undefined) {
            return subject as any;
          } else {
            return config.jwt.notLoggedInSubject;
          }
        });
  });

  /**
   * Restore stubs.
   */
  afterEach(function() {
    sandbox.restore();
  });

  describe('generateToken', function() {
    describe('generates token for user', function() {
      /**
       * Test user data.
       */
      const userData = {
        username: 'test',
        id: 1,
        isBetaUser: true,
        email: 'test@mail.com',
        password: '123456',
      };

      /**
       * The expected jwt payload.
       */
      const expectedPayload = {
        username: userData.username,
        id: userData.id,
        isBetaUser: userData.isBetaUser,
        loggedIn: true,
      };

      let user: User;

      /**
       * Build a fake user instance.
       */
      beforeEach(function() {
        user = User.build(userData);
      });

      it('with subject', function() {
        const subject = 'subject';

        const actual: any = generateToken(user as any, subject);

        expect(actual.payload).to.eql(expectedPayload);
        expect(actual.secret).to.equal(config.jwt.secret);
        expect(actual.options).to.equal(userData.username);

        sandbox.assert.calledOnce(getOptionsStub);
        sandbox.assert.calledWith(getOptionsStub, userData.username);

        sandbox.assert.calledOnce(signStub);
        sandbox.assert.calledWith(signStub,
            match(actual.payload),
            actual.secret,
            actual.options);
      });

      it('without subject', function() {
        const actual: any = generateToken(user as any);

        expect(actual.payload).to.eql(expectedPayload);
        expect(actual.secret).to.equal(config.jwt.secret);
        expect(actual.options).to.equal(userData.username);

        sandbox.assert.calledOnce(getOptionsStub);
        sandbox.assert.calledWith(getOptionsStub, userData.username);

        sandbox.assert.calledOnce(signStub);
        sandbox.assert.calledWith(signStub,
            match(actual.payload),
            actual.secret,
            actual.options);
      });
    });

    describe('generates token', function() {
      const payload = {
        some: 'thing',
        date: new Date(),
        number: 42,
        nested: {
          inner: 'field',
        },
      };

      it('with subject', function() {
        const subject = 'subject';

        const actual: any = generateToken(payload, subject);

        expect(actual.payload).to.eql(payload);
        expect(actual.secret).to.equal(config.jwt.secret);
        expect(actual.options).to.equal(subject);

        sandbox.assert.calledOnce(getOptionsStub);
        sandbox.assert.calledWith(getOptionsStub, subject);

        sandbox.assert.calledOnce(signStub);
        sandbox.assert.calledWith(signStub,
            match(actual.payload),
            actual.secret,
            actual.options);
      });

      it('without subject', function() {
        const actual: any = generateToken(payload);

        expect(actual.payload).to.eql(payload);
        expect(actual.secret).to.equal(config.jwt.secret);
        expect(actual.options).to.equal(config.jwt.notLoggedInSubject);

        sandbox.assert.calledOnce(getOptionsStub);
        sandbox.assert.calledWith(getOptionsStub,
            match.typeOf('undefined'));

        sandbox.assert.calledOnce(signStub);
        sandbox.assert.calledWith(signStub,
            match(actual.payload),
            actual.secret,
            actual.options);
      });
    });
  });

  describe('convertUserToJwtPayload', function() {
    it('converts successfully', function() {
      const userData: any = {
        username: 'test',
        id: 1,
        email: 'test@mail.com',
        password: 'password',
        isBetaUser: true,
        other: 'field',
      };

      const expected = {
        username: userData.username,
        id: 1,
        isBetaUser: userData.isBetaUser,
        loggedIn: true,
      };

      expect(convertUserToJwtPayload(userData)).to.be.eql(expected);
    });

    it('throws error if no argument given', function() {
      expect(() => convertUserToJwtPayload(undefined as any))
          .to.throw(TypeError);
    });
  });

  describe('postLoginJwtValidator', function() {
    it('calls next if jwt not pre-login jwt', function(done) {
      const request: any = sandbox.stub();
      request.auth = {
        loggedIn: true,
        id: 42,
      };

      const userFindStub = sandbox.stub(User, 'findByPk');
      userFindStub.usingPromise(Bluebird).resolves(true as any);

      const next: any = sandbox.stub().callsFake(() => {
        sandbox.assert.calledOnce(userFindStub);
        (sandbox.assert.calledWith as any)(userFindStub, request.auth.id);
        sandbox.assert.calledOnce(next);
        done();
      });
      const response: any = sandbox.stub();

      postLoginJwtValidator(request, response, next);
    });

    it('calls next with NotLoggedInError if jwt doesn\'t ' +
    'exist on request', function(done) {
      const request: any = sandbox.stub();
      const response: any = sandbox.stub();
      const userFindStub = sandbox.stub(User, 'findByPk');
      userFindStub.usingPromise(Bluebird).resolves(null as any);

      const next: any = sandbox.stub().callsFake(() => {
        sandbox.assert.notCalled(userFindStub);
        sandbox.assert
            .calledOnceWithExactly(next, match.instanceOf(NotLoggedInError));
        done();
      });
      postLoginJwtValidator(request, response, next);
    });

    it('calls next with NotLoggedInError if ' +
    'loggedIn is false on auth', function(done) {
      const request: any = sandbox.stub();
      request.user = {
        loggedIn: false,
      };
      const userFindStub = sandbox.stub(User, 'findByPk');
      userFindStub.usingPromise(Bluebird).resolves(null as any);

      const response: any = sandbox.stub();
      const next: any = sandbox.stub().callsFake(() => {
        sandbox.assert.notCalled(userFindStub);
        sandbox.assert
            .calledOnceWithExactly(next, match.instanceOf(NotLoggedInError));
        done();
      });

      postLoginJwtValidator(request, response, next);
    });

    it('calls next with NotLoggedInError if no ' +
      'user with the user id exists', function(done) {
      const request: any = sandbox.stub();
      request.auth = {
        loggedIn: true,
        id: 42,
      };

      const userFindStub = sandbox.stub(User, 'findByPk');
      userFindStub.usingPromise(Bluebird).resolves(null as any);

      const next: any = sandbox.stub().callsFake(() => {
        sandbox.assert.calledOnce(userFindStub);
        (sandbox.assert.calledWith as any)(userFindStub, request.auth.id);
        sandbox.assert.calledOnce(next);
        sandbox.assert.calledWith(next, match.instanceOf(NotLoggedInError));
        done();
      });
      const response: any = sandbox.stub();

      postLoginJwtValidator(request, response, next);
    });
  });
});
