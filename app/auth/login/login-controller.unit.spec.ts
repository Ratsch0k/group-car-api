import {stub, fake, assert, match} from 'sinon';
import {request, response} from 'express';
import User from '../../users/user';
import bcrypt from 'bcrypt';

import loginController from './login-controller';
import Bluebird from 'bluebird';
import UserDto from '../../users/user-dto';

describe('LoginController', () => {
  it('logs in, if credentials correct', function(done) {
    const requestBody = {
      username: 'demo',
      email: 'demo@mail.com',
      password: '123456',
    };

    const dbUser = {
      username: 'demo',
      email: 'demo@mail.com',
      password: 'hashed',
      get() {
        return this;
      },
    };

    // Stub bcrypt comparing
    const compareStub = stub(bcrypt, 'compare');
    compareStub.resolves(true);

    // Stub database
    const findOneStub = stub(User, 'findOne');
    findOneStub.usingPromise(Bluebird).resolves(dbUser as any);

    // Stub express
    const requestStub = stub(request);
    requestStub.body = requestBody;
    const responseStub = stub(response);
    const next = fake();
    responseStub.send = fake(() => {
      assert.calledWith(compareStub, requestBody.password, dbUser.password);
      assert.notCalled(next);
      assert.calledOnce(responseStub.send);
      assert.calledWith(responseStub.send, match.instanceOf(UserDto));
      assert.calledWith(findOneStub,
          match({where: {username: requestBody.username}}));
      done();
    }) as any;

    loginController(requestStub as any, responseStub as any, next);
  });

  describe('throws error', function() {
    it('if database throws error while finding user', function(done) {
      const requestBody = {
        username: 'demo',
        email: 'demo@mail.com',
        password: '123456',
      };
      const dbError = new Error('SOME MESSAGE');

      // Stub database
      const findOneStub = stub(User, 'findOne');
      findOneStub.usingPromise(Bluebird).rejects(dbError);

      // Stub express
      const requestStub = stub(request);
      requestStub.body = requestBody;
      const responseStub = stub(response);
      const next = fake(() => {
        assert.notCalled(responseStub.send);
        assert.calledWith(next, match(dbError));
        done();
      });

      loginController(requestStub as any, responseStub as any, next);
    });

    it('if given password doesn\'t match stored hash', function(done) {
      const requestBody = {
        username: 'demo',
        email: 'demo@mail.com',
        password: '123456',
      };

      const dbUser = {
        username: 'demo',
        email: 'demo@mail.com',
        password: 'hashed',
      };

      // Stub bcrypt comparing
      const compareStub = stub(bcrypt, 'compare');
      compareStub.resolves(false);

      // Stub database
      const findOneStub = stub(User, 'findOne');
      findOneStub.usingPromise(Bluebird).resolves(dbUser as any);

      // Stub express
      const requestStub = stub(request);
      requestStub.body = requestBody;
      const responseStub = stub(response);
      const next = fake(() => {
        assert.notCalled(responseStub.send);
        assert.calledWith(compareStub, requestBody.password, dbUser.password);
        assert.calledWith(findOneStub,
            match({where: {username: requestBody.username}}));
        assert.calledWith(next,
            match.hasNested('constructor.name', 'InvalidLoginError'));
        assert.calledWith(next,
            match.has('message', 'Username or email is invalid'));
        assert.calledWith(next, match.has('statusCode', 400));
        done();
      }) as any;

      loginController(requestStub as any, responseStub as any, next);
    });

    it('if database can\'t find user', function(done) {
      const requestBody = {
        username: 'demo',
        email: 'demo@mail.com',
        password: '123456',
      };

      // Stub bcrypt comparing
      const compareStub = stub(bcrypt, 'compare');

      // Stub database
      const findOneStub = stub(User, 'findOne');
      findOneStub.usingPromise(Bluebird).resolves(null as any);

      // Stub express
      const requestStub = stub(request);
      requestStub.body = requestBody;
      const responseStub = stub(response);
      const next = fake(() => {
        assert.notCalled(responseStub.send);
        assert.notCalled(compareStub);
        assert.calledWith(findOneStub,
            match({where: {username: requestBody.username}}));
        assert.calledWith(next,
            match.hasNested('constructor.name', 'InvalidLoginError'));
        assert.calledWith(next,
            match.has('message', 'Username or email is invalid'));
        assert.calledWith(next, match.has('statusCode', 400));

        done();
      }) as any;

      loginController(requestStub as any, responseStub as any, next);
    });
  });
});
