/* eslint-disable @typescript-eslint/no-explicit-any */
import {signUpController} from './sign-up-controller';
import {fake, assert, match, createSandbox} from 'sinon';
import Bluebird from 'bluebird';
import {UserDto, ProfilePic, User} from '../../../models';
import {expect} from 'chai';
import {UniqueConstraintError} from 'sequelize';
import UsernameAlreadyExistsError from
  '../../../errors/user/username-already-exists-error';
import * as generatePic from '../../../util/generate-profile-pic';
import config from '../../../config';
import db from '../../../db';
const sandbox = createSandbox();

describe('SignUpController', function() {
  let transactionStub: sinon.SinonStub;
  let transaction: any;

  beforeEach(function() {
    transaction = {
      commit: sandbox.stub().resolves(),
      rollback: sandbox.stub().resolves(),
    };
    transactionStub = sandbox.stub(
        db,
        'transaction',
    ).resolves(transaction as any);
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('creates user', function(done) {
    // Create fake user
    const user = {
      id: 5,
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

    // Mock profile pic create function
    const picCreateStub = sandbox.stub(ProfilePic, 'create');
    picCreateStub.usingPromise(Bluebird).resolves();

    // Mock profile pic generation
    const fakeData = 'DATA';
    const generateStub = sandbox.stub(generatePic, 'default')
        .resolves(fakeData as any);

    // Creates stubs
    const createStub = sandbox.stub(User, 'create');
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
      // Check generatePic call
      const dim = config.user.pb.dimensions;
      sandbox.assert.calledOnceWithExactly(generateStub, dim, user.username, 0);

      sandbox.assert.calledOnce(picCreateStub);
      sandbox.assert.calledOnce(transactionStub);
      sandbox.assert.calledOnce(transaction.commit);

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

  it('fails to create user because username already exists', async function() {
    const user = {
      username: 'demo',
      email: 'demo@mail.com',
      password: 'password',
      get() {
        return this;
      },
    };

    // Create stubs
    const createStub = sandbox.stub(User, 'create');
    createStub.usingPromise(Bluebird.Promise)
        .rejects(new UniqueConstraintError());
    const requestStub: any = sandbox.stub();
    const responseStub: any = sandbox.stub();
    requestStub.body = user;

    try {
      await signUpController(requestStub, responseStub, undefined as any);
    } catch (err) {
      expect(err).to.be.instanceOf(UsernameAlreadyExistsError);
      expect(err).to.haveOwnProperty('username');
      expect(err.username).to.equal(user.username);
      sandbox.assert.calledOnce(transaction.rollback);
    }
  });

  it('fails to create user due to some error', async function() {
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
    const createStub = sandbox.stub(User, 'create');
    createStub.usingPromise(Bluebird.Promise)
        .rejects(error);
    const requestStub: any = sandbox.stub();
    const responseStub: any = sandbox.stub();
    requestStub.body = user;

    try {
      await signUpController(requestStub, responseStub, undefined as any);
    } catch (err) {
      expect(err).to.be.equal(error);
      sandbox.assert.calledOnce(transaction.rollback);
    }
  });
});
