import {createSandbox, match} from 'sinon';
import logoutController from './logout-controller';

const sandbox = createSandbox();

describe('LogoutController', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sandbox.restore();
  });

  it('sets empty jwt token', function(done) {
    // Mock request, response
    req = sandbox.stub();

    next = sandbox.stub();

    res = sandbox.stub();
    res.setJwtToken = sandbox.stub();
    res.status = sandbox.stub();
    res.send = sandbox.stub().callsFake(function() {
      sandbox.assert.notCalled(req);
      sandbox.assert.notCalled(next);

      sandbox.assert.calledOnceWithExactly(res.setJwtToken, match({}));
      sandbox.assert.calledOnceWithExactly(res.status, 204);
      sandbox.assert.calledOnceWithExactly(res.send);

      done();
    });

    logoutController(req, res, next);
  });
});
