/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert} from 'sinon';
import deleteGroupController from './delete-group-controller';
import {expect} from 'chai';
import {
  BadRequestError,
} from '../../../../../errors';
import {GroupService} from '../../../../../models';

describe('DeleteGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let deleteStub: sinon.SinonStub;

  beforeEach(function() {
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };
    next = sinon.stub();
    deleteStub = sinon.stub(GroupService, 'delete');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if', function() {
    it('if user is missing on request', async function() {
      req = {
        params: {
          groupId: 1,
        },
      };

      await expect(deleteGroupController(req, res, next))
          .to.eventually.to.be.rejectedWith(BadRequestError);

      assert.notCalled(deleteStub);
      assert.notCalled(next);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('if groupId is missing on request', async function() {
      req = {
        user: {
          id: 1,
        },
        params: {},
      };

      await expect(deleteGroupController(req, res, next))
          .to.eventually.to.be.rejectedWith(BadRequestError);

      assert.notCalled(deleteStub);
      assert.notCalled(next);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('if groupId is not numeric', async function() {
      req = {
        user: {
          id: 1,
        },
        params: {
          groupId: 'NOT_A_NUMBER',
        },
      };

      await expect(deleteGroupController(req, res, next))
          .to.eventually.to.be.rejectedWith(BadRequestError);

      assert.notCalled(deleteStub);
      assert.notCalled(next);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });
  });

  it('calls GroupService.delete with correct parameters and sends' +
    'with status code 204', async function() {
    const user = {
      id: 6,
    };
    const groupId = 66;
    req = {
      user,
      params: {
        groupId,
      },
    };

    await expect(deleteGroupController(req, res, next))
        .to.eventually.be.fulfilled;

    assert.calledOnceWithExactly(deleteStub, user, groupId);
    assert.calledOnceWithExactly(res.status, 204);
    assert.calledOnceWithExactly(res.send);
    assert.notCalled(next);
  });
});
