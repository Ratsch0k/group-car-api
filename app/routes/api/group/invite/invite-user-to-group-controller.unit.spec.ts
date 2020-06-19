import {
  checkInviteToLoggedInUser,
  checkMembership,
  checkGroup,
  checkUser,
  checkAlreadyInvited,
  checkAlreadyMember,
  checkMaxMembers,
  inviteUser,
} from './invite-user-to-group-controller';
import sinon, {match} from 'sinon';
import {
  BadRequestError,
  NotMemberOfGroupError,
  NotAdminOfGroupError,
  GroupNotFoundError,
  UserNotFoundError,
  AlreadyInvitedError,
  AlreadyMemberError,
  GroupIsFullError,
} from '../../../../errors';
import {Membership, Group, User, Invite} from '../../../../models';
import Bluebird from 'bluebird';
import config from '../../../../config';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('InviteUserToGroup', function() {
  let req: any;
  let res: any;
  let next: any;

  afterEach(function() {
    sinon.restore();
  });

  describe('checkInviteToLoggedInUser', function() {
    it('throws BadRequestError if user tries to ' +
        'send an invite to himself/herself', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 10,
        },
      };

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(BadRequestError));
        done();
      });

      checkInviteToLoggedInUser(req, res, next);
    });

    it('calls next if user tries to send ' +
        'invite to other player', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
      };

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next);
        done();
      });

      checkInviteToLoggedInUser(req, res, next);
    });
  });

  describe('checkMembership', function() {
    it('throws NotMemberOfGroup if user tries to ' +
        'send invite for a group he/she is not a member of', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const findOneStub = sinon.stub(Membership, 'findOne')
          .usingPromise(Bluebird).resolves(null as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(NotMemberOfGroupError));
        sinon.assert.calledOnceWithExactly(findOneStub, match({
          where: {
            groupId: req.params.groupId,
            userId: req.user.id,
          },
        }));
        done();
      });

      checkMembership(req, res, next);
    });

    it('throws NotMemberOfGroup if user tries to send ' +
        'invite for a group he/she is not an admin of', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const membership = {
        isAdmin: false,
      };

      const findOneStub = sinon.stub(Membership, 'findOne')
          .usingPromise(Bluebird).resolves(membership as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(NotAdminOfGroupError));
        sinon.assert.calledOnceWithExactly(findOneStub, match({
          where: {
            groupId: req.params.groupId,
            userId: req.user.id,
          },
        }));
        done();
      });

      checkMembership(req, res, next);
    });

    it('calls next if user who tries to send invite ' +
        'is member and admin of group', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const membership = {
        isAdmin: true,
      };

      const findOneStub = sinon.stub(Membership, 'findOne')
          .usingPromise(Bluebird).resolves(membership as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(next);
        sinon.assert.calledOnceWithExactly(findOneStub, match({
          where: {
            groupId: req.params.groupId,
            userId: req.user.id,
          },
        }));
        done();
      });

      checkMembership(req, res, next);
    });
  });

  describe('checkGroup', function() {
    it('throws GroupNotFoundError if group doesn\'t exist', function(done) {
      req = {
        params: {
          groupId: 12,
        },
      };

      const groupFindByPkStub = sinon.stub(Group, 'findByPk')
          .usingPromise(Bluebird).resolves(null as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(groupFindByPkStub as any,
            req.params.groupId);
        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(GroupNotFoundError));
        done();
      });

      checkGroup(req, res, next);
    });

    it('calls next if group exists', function(done) {
      req = {
        params: {
          groupId: 12,
        },
      };

      const group = {
        id: 12,
      };

      const groupFindByPkStub = sinon.stub(Group, 'findByPk')
          .usingPromise(Bluebird).resolves(group as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(groupFindByPkStub as any,
            req.params.groupId);
        sinon.assert.calledOnceWithExactly(next);
        done();
      });

      checkGroup(req, res, next);
    });
  });

  describe('checkUser', function() {
    it('throws UserNotFoundError if user which should be ' +
        'invited doesn\'t exist', function(done) {
      req = {
        body: {
          userId: 11,
        },
      };

      const userFindByPk = sinon.stub(User, 'findByPk')
          .usingPromise(Bluebird).resolves(null as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(
          userFindByPk as any, req.body.userId);
        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(UserNotFoundError));
        done();
      });

      checkUser(req, res, next);
    });

    it('calls next if user exists', function(done) {
      req = {
        body: {
          userId: 11,
        },
      };

      const user = {
        id: req.body.userId,
      };

      const userFindByPk = sinon.stub(User, 'findByPk')
          .usingPromise(Bluebird).resolves(user as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(
          userFindByPk as any, req.body.userId);
        sinon.assert.calledOnceWithExactly(next);
        done();
      });

      checkUser(req, res, next);
    });
  });

  describe('checkAlreadyInvited', function() {
    it('throws AlreadyInvitedError if user was already ' +
        'invited to the group', function(done) {
      req = {
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const invite = {
        groupId: req.params.groupId,
        userId: req.body.id,
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(invite as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(inviteFindOneStub as any, match({
          where: {
            groupId: req.params.groupId,
            userId: req.body.userId,
          },
        }));

        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(AlreadyInvitedError));

        done();
      });

      checkAlreadyInvited(req, res, next);
    });

    it('calls next if user was not already invited', function(done) {
      req = {
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(null as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(inviteFindOneStub as any, match({
          where: {
            groupId: req.params.groupId,
            userId: req.body.userId,
          },
        }));

        sinon.assert.calledOnceWithExactly(next);

        done();
      });

      checkAlreadyInvited(req, res, next);
    });
  });

  describe('checkAlreadyMember', function() {
    it('throws AlreadyMemberError if user is a member ' +
        'of the group', function(done) {
      req = {
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const membership = {
        groupId: req.params.groupId,
        userId: req.body.userId,
      };

      const membershipFindOneStub = sinon.stub(Membership, 'findOne')
          .usingPromise(Bluebird).resolves(membership as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(membershipFindOneStub as any, match({
          where: {
            groupId: req.params.groupId,
            userId: req.body.userId,
          },
        }));

        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(AlreadyMemberError));

        done();
      });

      checkAlreadyMember(req, res, next);
    });

    it('calls next if user was not already invited', function(done) {
      req = {
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const membershipFindOneStub = sinon.stub(Membership, 'findOne')
          .usingPromise(Bluebird).resolves(null as any);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(membershipFindOneStub as any, match({
          where: {
            groupId: req.params.groupId,
            userId: req.body.userId,
          },
        }));

        sinon.assert.calledOnceWithExactly(next);

        done();
      });

      checkAlreadyMember(req, res, next);
    });
  });

  describe('checkMaxMembers', function() {
    it('throws GroupIsFullError if amount of invited users and members ' +
        'of group exceeds max group capacity', function(done) {
      req = {
        params: {
          groupId: 12,
        },
      };

      const maxMembers = config.group.maxMembers;

      const membershipCountStub = sinon.stub(Membership, 'count')
          .usingPromise(Bluebird).resolves(maxMembers - 2);

      const inviteCountStub = sinon.stub(Invite, 'count')
          .usingPromise(Bluebird).resolves(3);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(membershipCountStub, match({
          where: {
            groupId: req.params.groupId,
          },
        }));

        sinon.assert.calledOnceWithExactly(inviteCountStub, match({
          where: {
            groupId: req.params.groupId,
          },
        }));

        sinon.assert.calledOnceWithExactly(next,
            match.instanceOf(GroupIsFullError));

        done();
      });

      checkMaxMembers(req, res, next);
    });

    it('calls next if amount of invited users and members ' +
        'is below amount of maximum members per group', function(done) {
      req = {
        params: {
          groupId: 12,
        },
      };

      const maxMembers = config.group.maxMembers;

      const membershipCountStub = sinon.stub(Membership, 'count')
          .usingPromise(Bluebird).resolves(maxMembers - 2);

      const inviteCountStub = sinon.stub(Invite, 'count')
          .usingPromise(Bluebird).resolves(2);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(membershipCountStub, match({
          where: {
            groupId: req.params.groupId,
          },
        }));

        sinon.assert.calledOnceWithExactly(inviteCountStub, match({
          where: {
            groupId: req.params.groupId,
          },
        }));

        sinon.assert.calledOnceWithExactly(next);

        done();
      });

      checkMaxMembers(req, res, next);
    });
  });

  describe('inviteUser', function() {
    it('creates invite for user to group and ' +
        'responses with it', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const invite = {
        userId: req.body.userId,
        groupId: req.params.groupId,
        invitedBy: req.user.id,
      };

      const inviteCreateStub = sinon.stub(Invite, 'create')
          .usingPromise(Bluebird).resolves(invite as any);

      res = {};
      res.status = sinon.stub().returnsThis();
      res.send = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(inviteCreateStub as any,
            match(invite));

        sinon.assert.calledOnceWithExactly(res.status, 201);
        sinon.assert.calledOnceWithExactly(res.send, invite);

        done();
      });

      inviteUser(req, res, next);
    });

    it('calls next with error if create invite throws one', function(done) {
      req = {
        user: {
          id: 10,
        },
        body: {
          userId: 11,
        },
        params: {
          groupId: 12,
        },
      };

      const invite = {
        userId: req.body.userId,
        groupId: req.params.groupId,
        invitedBy: req.user.id,
      };

      const error = new Error('TEST');
      const inviteCreateStub = sinon.stub(Invite, 'create')
          .usingPromise(Bluebird).rejects(error);

      next = sinon.stub().callsFake(() => {
        sinon.assert.calledOnceWithExactly(inviteCreateStub as any,
            match(invite));

        sinon.assert.calledOnceWithExactly(next, error);

        done();
      });

      inviteUser(req, res, next);
    });
  });
});
