/* eslint-disable @typescript-eslint/no-explicit-any */
import {UserService} from '../../../../../../models';
import sinon, {assert} from 'sinon';
import {expect} from 'chai';
import {leaveGroupController} from './leave-group-controller';
import {
  BadRequestError,
  NotMemberOfGroupError,
  InternalError,
} from '../../../../../../errors';

describe('LeaveGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let userServiceLeaveGroupStub: sinon.SinonStub;

  beforeEach(function() {
    userServiceLeaveGroupStub = sinon.stub(UserService, 'leaveGroup');
  });

  afterEach(function() {
    sinon.restore();
  });

  it('throws BadRequestError if groupId is not parsable', async function() {
    req = {
      user: {},
      params: {
        groupId: 'test',
      },
    };

    await expect(leaveGroupController(req, res, next)).to.eventually
        .be.rejectedWith(BadRequestError);

    assert.notCalled(userServiceLeaveGroupStub);
  });

  it('throws BadRequestError if groupId is not defined', async function() {
    req = {
      user: {},
      params: {},
    };

    await expect(leaveGroupController(req, res, next)).to.eventually
        .be.rejectedWith(BadRequestError);

    assert.notCalled(userServiceLeaveGroupStub);
  });

  it('throws BadRequestError if user in request ' +
  'is not defined', async function() {
    req = {
      params: {
        groupId: '14',
      },
    };

    await expect(leaveGroupController(req, res, next)).to.eventually
        .be.rejectedWith(BadRequestError);

    assert.notCalled(userServiceLeaveGroupStub);
  });

  describe('calls leave group and', function() {
    it('responses with 204 if one membership was deleted', async function() {
      req = {
        user: {
          id: 14,
        },
        params: {
          groupId: 14,
        },
      };

      res = {};
      res.status = sinon.stub().returnsThis();
      res.send = sinon.stub();

      userServiceLeaveGroupStub.resolves(1);

      await expect(leaveGroupController(req, res, next)).to.eventually
          .be.fulfilled;

      assert.calledOnceWithExactly(
          userServiceLeaveGroupStub,
          req.user,
          req.params.groupId,
      );
      assert.calledOnceWithExactly(res.status, 204);
      assert.calledOnceWithExactly(res.send);
    });

    it('throws NotMemberOfGroup if no membership ' +
    'was deleted', async function() {
      req = {
        user: {
          id: 14,
        },
        params: {
          groupId: 14,
        },
      };

      res = {};
      res.status = sinon.stub().returnsThis();
      res.send = sinon.stub();

      userServiceLeaveGroupStub.resolves(0);

      await expect(leaveGroupController(req, res, next)).to.eventually
          .be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(
          userServiceLeaveGroupStub,
          req.user,
          req.params.groupId,
      );
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });

    it('throws InternalError if any other amount of ' +
    'membership was deleted', async function() {
      req = {
        user: {
          id: 14,
        },
        params: {
          groupId: 14,
        },
      };

      res = {};
      res.status = sinon.stub().returnsThis();
      res.send = sinon.stub();

      userServiceLeaveGroupStub.resolves(13);

      await expect(leaveGroupController(req, res, next)).to.eventually
          .be.rejectedWith(InternalError);

      assert.calledOnceWithExactly(
          userServiceLeaveGroupStub,
          req.user,
          req.params.groupId,
      );
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    });
  });
});
