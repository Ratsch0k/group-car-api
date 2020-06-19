import {
  checkInviteToLoggedInUser,
  checkMembership,
} from './invite-user-to-group-controller';
import sinon, {match} from 'sinon';
import {
  BadRequestError,
  NotMemberOfGroupError,
  NotAdminOfGroupError,
} from '../../../../errors';
import {Membership} from '../../../../models';
import Bluebird from 'bluebird';

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

  });

  describe('checkUser', function() {

  });

  describe('checkAlreadyInvited', function() {

  });

  describe('checkAlreadyMember', function() {

  });

  describe('checkMaxMembers', function() {

  });

  describe('inviteUser', function() {

  });
});
