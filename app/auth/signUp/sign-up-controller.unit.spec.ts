import * as User from '../../users/user';
import signUpController from './sign-up-controller';
import {stub, fake, assert, match} from 'sinon';
import Bluebird from 'bluebird';
import {request, response} from 'express';
import UserDto from '../../users/user-dto';
import {expect} from 'chai';

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
    request.body = user;
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

  it('fails to create user because username already exists', function() {

  });

  it('fails to create user due to some error', function() {

  });
});
