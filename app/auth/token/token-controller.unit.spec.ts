import {createSandbox, match} from 'sinon';
import tokenController from './token-controller';
import {expect} from 'chai';
import {UnauthorizedError} from '../../errors';
import User from '../../users/user';
import Bluebird from 'bluebird';

const sandbox = createSandbox();

describe('TokenController', function() {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(function() {
    req = sandbox.stub();
    res = sandbox.stub();
    next = sandbox.stub();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('throws Unauthorized error if ' +
      'req.user.username doesn\'t exist', function() {
    const jwt = {
      no: 'user',
    };

    req.user = jwt;

    expect(() => tokenController(req, res, next)).to.throw(UnauthorizedError);
  });

  it('throws Unauthorized error if user doesn\'t exist', function(done) {
    const jwt = {
      username: 'test',
    };
    req.user = jwt;

    // Mock database
    const findStub = sandbox.stub(User, 'findByUsername')
        .usingPromise(Bluebird)
        .resolves(null);

    next.callsFake(() => {
      sandbox.assert.calledOnce(findStub);
      sandbox.assert.calledWith(findStub, jwt.username);
      sandbox.assert.calledWith(next, match.instanceOf(UnauthorizedError));
      done();
    });

    tokenController(req, res, next);
  });

  it('throws Unauthorized error if user exists ' +
      'but was already deleted', function(done) {
    const jwt = {
      username: 'test',
    };
    req.user = jwt;

    const user = {
      deletedAt: new Date(),
    };

    // Mock database
    const findStub = sandbox.stub(User, 'findByUsername')
        .usingPromise(Bluebird)
        .resolves(user as any);

    next.callsFake(() => {
      sandbox.assert.calledOnce(findStub);
      sandbox.assert.calledWith(findStub, jwt.username);
      sandbox.assert.calledWith(next, match.instanceOf(UnauthorizedError));
      done();
    });

    tokenController(req, res, next);
  });

  it('responds with 200 if user exists', function(done) {
    const jwt = {
      username: 'test',
    };
    req.user = jwt;

    const user = {
      deletedAt: null,
    };

    // Mock database
    const findStub = sandbox.stub(User, 'findByUsername')
        .usingPromise(Bluebird)
        .resolves(user as any);

    // Mock status
    res.status = sandbox.stub().returns(res);
    res.send = sandbox.stub().callsFake(() => {
      sandbox.assert.calledOnce(findStub);
      sandbox.assert.calledWith(findStub, jwt.username);
      sandbox.assert.calledOnce(res.status);
      sandbox.assert.calledWith(res.status, 200);
      done();
    });

    tokenController(req, res, next);
  });
});
