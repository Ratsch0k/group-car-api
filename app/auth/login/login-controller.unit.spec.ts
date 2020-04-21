import {stub, fake, assert, match, createSandbox} from 'sinon';
import User from '../../users/user';
import bcrypt from 'bcrypt';

import loginController from './login-controller';
import Bluebird from 'bluebird';
import UserDto from '../../users/user-dto';

const sandbox = createSandbox();

describe('LoginController', function() {
  afterEach(() => {
    sandbox.restore();
  });

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
      isBetaUser: false,
      get() {
        return this;
      },
    };

    const expectedJwt = {
      username: 'demo',
      isBetaUser: false,
    };

    // Stub bcrypt comparing
    const compareStub = sandbox.stub(bcrypt, 'compare');
    compareStub.resolves(true);

    // Stub database
    const findByUsernameStub = sandbox.stub(User, 'findByUsername');
    findByUsernameStub.usingPromise(Bluebird).resolves(dbUser as any);

    // Stub express
    const requestStub: any = sandbox.stub();
    requestStub.body = requestBody;
    const responseStub: any = sandbox.stub();
    responseStub.setJwtToken = fake();
    const next = fake();
    responseStub.send = fake(() => {
      sandbox.assert.calledWith(compareStub,
          requestBody.password,
          dbUser.password);
      assert.notCalled(next);
      sandbox.assert.calledOnce(responseStub.send);
      sandbox.assert.calledWith(responseStub.send, match.instanceOf(UserDto));
      sandbox.assert.calledWith(findByUsernameStub, requestBody.username);
      sandbox.assert.calledOnce(responseStub.setJwtToken);
      sandbox.assert.calledWith(responseStub.setJwtToken, match(expectedJwt));
      done();
    }) as any;

    loginController(requestStub, responseStub, next);
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
      const findOneStub = sandbox.stub(User, 'findOne');
      findOneStub.usingPromise(Bluebird).rejects(dbError);

      // Stub express
      const requestStub: any = sandbox.stub();
      requestStub.body = requestBody;
      const responseStub: any = sandbox.stub();
      responseStub.send = sandbox.stub();
      const next = fake((err: any) => {
        sandbox.assert.notCalled(responseStub.send);
        assert.calledWith(next, match(dbError));
        done();
      });

      loginController(requestStub, responseStub, next);
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
      const compareStub = sandbox.stub(bcrypt, 'compare');
      compareStub.resolves(false);

      // Stub database
      const findOneStub = sandbox.stub(User, 'findOne');
      findOneStub.usingPromise(Bluebird).resolves(dbUser as any);

      // Stub express
      const requestStub: any = sandbox.stub();
      requestStub.body = requestBody;
      const responseStub: any = sandbox.stub();
      responseStub.send = sandbox.stub();
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

      loginController(requestStub, responseStub, next);
    });

    it('if database can\'t find user', function(done) {
      const requestBody = {
        username: 'demo',
        email: 'demo@mail.com',
        password: '123456',
      };

      // Stub bcrypt comparing
      const compareStub = sandbox.stub(bcrypt, 'compare');

      // Stub database
      const findOneStub = sandbox.stub(User, 'findOne');
      findOneStub.usingPromise(Bluebird).resolves(null as any);

      // Stub express
      const requestStub: any = sandbox.stub();
      requestStub.body = requestBody;
      const responseStub: any = sandbox.stub();
      responseStub.send = stub();
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

      loginController(requestStub, responseStub, next);
    });
  });
});
