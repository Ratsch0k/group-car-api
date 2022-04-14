import {
  inviteUserController,
} from './invite-user-to-group-controller';
import sinon, {assert} from 'sinon';
import {
  BadRequestError,
} from '../../../../../errors';
import {Invite, GroupService} from '../../../../../models';
import {expect} from 'chai';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('InviteUserToGroupController', function() {
  let req: any;
  let res: any;
  let next: any;
  let inviteStub: sinon.SinonStub;

  beforeEach(function() {
    inviteStub = sinon.stub(GroupService, 'inviteUser');

    // Default request type. Override values as necessary
    req = {
      user: {
        id: 16,
      },
      body: {
        userId: 11,
        username: 'TEST_USER',
      },
      params: {
        groupId: 99,
      },
    };

    // Stub response object
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('throws BadRequestError if ', function() {
    // eslint-disable-next-line require-jsdoc
    function checkNothingCalled() {
      assert.notCalled(inviteStub);
      assert.notCalled(res.status);
      assert.notCalled(res.send);
    }

    it('user not on request', async function() {
      req.user = undefined;

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      checkNothingCalled();
    });

    it('groupId missing on request', async function() {
      req.params.groupId = undefined;

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      checkNothingCalled();
    });

    it('groupId not parseable to int', async function() {
      req.params.groupId = 'NOT_A_NUMBER';

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      checkNothingCalled();
    });

    it('userId and username missing on request', async function() {
      req.body = {};

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      checkNothingCalled();
    });

    it('userId not parseable to int and username missing on ' +
      'request', async function() {
      req.body = {
        userId: 'NOT_A_NUMBER',
        username: undefined,
      };

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.rejectedWith(BadRequestError);

      checkNothingCalled();
    });
  });

  describe('calls service function and sends response with ' +
    'status 201 if', function() {
    let invite: Invite;

    beforeEach(function() {
      invite = {
        userId: req.body.userId,
        groupId: req.params.groupId,
        invitedBy: req.user.id,
      } as Invite;

      inviteStub.resolves(invite);
    });

    // eslint-disable-next-line require-jsdoc
    function checkResponseCalls() {
      assert.calledOnceWithExactly(res.status, 201);
      assert.calledOnceWithExactly(res.send, invite);
    }

    it('username provided and rest of arguments correct', async function() {
      req.body.userId = undefined;

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.fulfilled;

      checkResponseCalls();
      assert.calledOnceWithExactly(
          inviteStub,
          req.user,
          req.params.groupId,
          req.body.username,
      );
    });

    it('userId provided and rest of arguments correct', async function() {
      req.body.username = undefined;

      await expect(inviteUserController(req, res, next))
          .to.eventually.be.fulfilled;

      checkResponseCalls();
      assert.calledOnceWithExactly(
          inviteStub,
          req.user,
          req.params.groupId,
          req.body.userId,
      );
    });

    it('userId should take precedence over username', async function() {
      await expect(inviteUserController(req, res, next))
          .to.eventually.be.fulfilled;

      checkResponseCalls();
      assert.calledOnceWithExactly(
          inviteStub,
          req.user,
          req.params.groupId,
          req.body.userId,
      );
    });
  });
});
