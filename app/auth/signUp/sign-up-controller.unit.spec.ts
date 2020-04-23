import * as User from '../../users/user';
import signUpController from './sign-up-controller';
import {fake, assert, match, createSandbox} from 'sinon';
import Bluebird from 'bluebird';
import UserDto from '../../users/user-dto';
import {expect} from 'chai';
import {UniqueConstraintError} from 'sequelize';
import UsernameAlreadyExistsError from
  '../../errors/users/username-already-exists-error';

const sandbox = createSandbox();

describe('SignUpController', function() {
  afterEach(function() {
    sandbox.restore();
  });

  it('creates user', function(done) {
    // Create fake user
    const user = {
      username: 'demo',
      email: 'demo@mail.com',
      password: 'password',
      isBetaUser: false,
      get() {
        return this;
      },
    };

    const jwt = {
      isBetaUser: user.isBetaUser,
      username: user.username,
    };

    // Creates stubs
    const createStub = sandbox.stub(User.default, 'create');
    createStub.usingPromise(Bluebird.Promise).resolves(user as any);
    const requestStub: any = sandbox.stub();
    requestStub.body = user;
    const responseStub: any = sandbox.stub();
    responseStub.status = sandbox.stub()
        .withArgs(201).returns(responseStub as any);
    responseStub.setJwtToken = fake();
    responseStub.send = fake(() => {
      expect(responseStub.send.called);
      assert.notCalled(fakeNext);
      sandbox.assert.calledWith(responseStub.send, match.instanceOf(UserDto));
      sandbox.assert.calledWith(responseStub.status, 201);
      sandbox.assert.calledOnce(responseStub.setJwtToken);
      sandbox.assert.calledWith(responseStub.setJwtToken, match(jwt));
      // Get user object
      const responseUser = responseStub.send.args[0][0];
      expect(responseUser.username).to.equal(user.username);
      expect(responseUser.email).to.equal(user.email);
      expect(responseUser.password).to.be.undefined;
      done();
    }) as any;
    const fakeNext = fake();

    signUpController(requestStub, responseStub, fakeNext);
  });

  it('fails to create user because username already exists', function(done) {
    const user = {
      username: 'demo',
      email: 'demo@mail.com',
      password: 'password',
      get() {
        return this;
      },
    };

    // Create stubs
    const createStub = sandbox.stub(User.default, 'create');
    createStub.usingPromise(Bluebird.Promise)
        .rejects(new UniqueConstraintError());
    const requestStub: any = sandbox.stub();
    const responseStub: any = sandbox.stub();
    requestStub.body = user;
    const nextFake = fake((err: UsernameAlreadyExistsError) => {
      expect(err).to.be.instanceOf(UsernameAlreadyExistsError);
      expect(err).to.haveOwnProperty('username');
      expect(err.username).to.equal(user.username);
      done();
    });

    signUpController(requestStub, responseStub, nextFake);
  });

  it('fails to create user due to some error', function(done) {
    // Fake user
    const user = {
      username: 'demo',
      email: 'demo@mail.com',
      password: 'password',
      get() {
        return this;
      },
    };

    // Fake error
    const error = new Error('CUSTOM ERROR');

    // Create stubs
    const createStub = sandbox.stub(User.default, 'create');
    createStub.usingPromise(Bluebird.Promise)
        .rejects(error);
    const requestStub: any = sandbox.stub();
    const responseStub: any = sandbox.stub();
    requestStub.body = user;
    const nextFake = fake((err: Error) => {
      expect(err).to.be.equal(error);
      done();
    });

    signUpController(requestStub, responseStub, nextFake);
  });
});
