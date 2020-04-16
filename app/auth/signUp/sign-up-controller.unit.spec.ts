import * as User from '../../users/user';
import signUpController from './sign-up-controller';
import {stub, fake, assert, match} from 'sinon';
import Bluebird from 'bluebird';
import {request, response} from 'express';
import UserDto from '../../users/user-dto';
import {expect} from 'chai';
import {UniqueConstraintError} from 'sequelize';
import UsernameAlreadyExistsError from
  '../../users/username-already-exists-error';

describe('SignUpController', function() {
  it('creates user', function(done) {
    // Create fake user
    const user = {
      username: 'demo',
      email: 'demo@mail.com',
      password: 'password',
      get() {
        return this;
      },
    };

    // Creates stubs
    const createStub = stub(User.default, 'create');
    createStub.usingPromise(Bluebird.Promise).resolves(user as any);
    const requestStub = stub(request);
    requestStub.body = user;
    const responseStub = stub(response);
    responseStub.send = fake(() => {
      expect(responseStub.send.called);
      assert.notCalled(fakeNext);
      assert.calledWith(responseStub.send, match.instanceOf(UserDto));
      // Get user object
      const responseUser = responseStub.send.args[0][0];
      expect(responseUser.username).to.equal(user.username);
      expect(responseUser.email).to.equal(user.email);
      expect(responseUser.password).to.be.undefined;
      done();
    }) as any;
    const fakeNext = fake();

    signUpController(requestStub as any,
      responseStub as any,
      fakeNext);
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
    const createStub = stub(User.default, 'create');
    createStub.usingPromise(Bluebird.Promise)
        .rejects(new UniqueConstraintError());
    const requestStub = stub(request);
    const responseStub = stub();
    requestStub.body = user;
    const nextFake = fake((err: UsernameAlreadyExistsError) => {
      expect(err).to.be.instanceOf(UsernameAlreadyExistsError);
      expect(err).to.haveOwnProperty('username');
      expect(err.username).to.equal(user.username);
      done();
    });

    signUpController(requestStub as any, responseStub as any, nextFake);
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
    const createStub = stub(User.default, 'create');
    createStub.usingPromise(Bluebird.Promise)
        .rejects(error);
    const requestStub = stub(request);
    const responseStub = stub();
    requestStub.body = user;
    const nextFake = fake((err: Error) => {
      expect(err).to.be.equal(error);
      done();
    });

    signUpController(requestStub as any, responseStub as any, nextFake);
  });
});
