/* eslint-disable @typescript-eslint/no-explicit-any */
import {InviteRepository} from './invite-repository';
import {
  InviteNotFoundError,
  CouldNotAssignToGroupError,
  UnauthorizedError,
} from '../../errors';
import sinon, {assert, match} from 'sinon';
import {InviteService} from './invite-service';
import {expect} from 'chai';
import {MembershipRepository} from '../membership';
import db from '../../db';

describe('InviteService', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('assignUserToGroup', function() {
    it('throws InviteNotFoundError if no invite for the user ' +
    'and the group exists', async function() {
      const currentUser = {
        id: 6,
      };

      const groupId = 5;

      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById')
          .rejects(new InviteNotFoundError({userId: currentUser.id, groupId}));

      await expect(InviteService.assignUserToGroup(currentUser as any, groupId))
          .to.eventually.be.rejectedWith(InviteNotFoundError);

      assert.calledOnceWithExactly(inviteRepFindByIdStub, match({
        userId: currentUser.id,
        groupId,
      }));
    });

    it('deletes invite and creates membership if ' +
    'invite exists', async function() {
      const currentUser: any = {
        id: 6,
      };

      const groupId = 5;

      const inviteId = {
        userId: currentUser.id,
        groupId,
      };

      const transactionFake = {
        rollback: sinon.stub(),
        commit: sinon.stub(),
      };
      const transactionStub = sinon.stub(db, 'transaction')
          .resolves(transactionFake as any);

      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById')
          .resolves();

      const inviteRepDeleteByIdStub = sinon.stub(InviteRepository, 'deleteById')
          .resolves();

      const membershipRepCreateStub = sinon.stub(MembershipRepository, 'create')
          .resolves();

      await expect(InviteService.assignUserToGroup(currentUser as any, groupId))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(inviteRepFindByIdStub, match(inviteId));

      assert.calledOnceWithExactly(inviteRepDeleteByIdStub,
          match(inviteId), match.any);

      assert.calledOnceWithExactly(
          membershipRepCreateStub,
          currentUser,
          groupId,
          false,
          match.any,
      );

      assert.calledOnceWithExactly(transactionStub);
      assert.calledOnceWithExactly(transactionFake.commit);
      assert.notCalled(transactionFake.rollback);
    });

    it('executes create and delete with transaction and ' +
    'calls rollback when deletes invite throws error', async function() {
      const currentUser: any = {
        id: 6,
      };

      const groupId = 5;

      const inviteId = {
        userId: currentUser.id,
        groupId,
      };

      const transactionFake = {
        rollback: sinon.stub(),
        commit: sinon.stub(),
      };
      const transactionStub = sinon.stub(db, 'transaction')
          .resolves(transactionFake as any);

      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById')
          .resolves();

      const inviteRepDeleteByIdStub = sinon.stub(InviteRepository, 'deleteById')
          .rejects();

      const membershipRepCreateStub = sinon.stub(MembershipRepository, 'create')
          .resolves();

      await expect(InviteService.assignUserToGroup(currentUser as any, groupId))
          .to.eventually.be.rejectedWith(CouldNotAssignToGroupError);

      assert.calledOnceWithExactly(inviteRepFindByIdStub, match(inviteId));

      assert.calledOnceWithExactly(inviteRepDeleteByIdStub,
          match(inviteId), match.any);

      assert.notCalled(
          membershipRepCreateStub);

      assert.calledOnceWithExactly(transactionStub);
      assert.notCalled(transactionFake.commit);
      assert.calledOnceWithExactly(transactionFake.rollback);
    });

    it('executes create and delete with transaction and ' +
    'calls rollback when create membership throws error', async function() {
      const currentUser: any = {
        id: 6,
      };

      const groupId = 5;

      const inviteId = {
        userId: currentUser.id,
        groupId,
      };

      const transactionFake = {
        rollback: sinon.stub(),
        commit: sinon.stub(),
      };
      const transactionStub = sinon.stub(db, 'transaction')
          .resolves(transactionFake as any);

      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById')
          .resolves();

      const inviteRepDeleteByIdStub = sinon.stub(InviteRepository, 'deleteById')
          .resolves();

      const membershipRepCreateStub = sinon.stub(MembershipRepository, 'create')
          .rejects();

      await expect(InviteService.assignUserToGroup(currentUser as any, groupId))
          .to.eventually.be.rejectedWith(CouldNotAssignToGroupError);

      assert.calledOnceWithExactly(inviteRepFindByIdStub, match(inviteId));

      assert.calledOnceWithExactly(inviteRepDeleteByIdStub,
          match(inviteId), match.any);

      assert.calledOnceWithExactly(
          membershipRepCreateStub,
          currentUser,
          groupId,
          false,
          match.any,
      );

      assert.calledOnceWithExactly(transactionStub);
      assert.notCalled(transactionFake.commit);
      assert.calledOnceWithExactly(transactionFake.rollback);
    });
  });

  describe('findById', function() {
    it('throws UnauthorizedError if currentUser ' +
    'is other user than requested and not member ' +
    'of the group the invite is for', async function() {
      const currentUser: any = {
        id: 5,
      };

      const id = {
        userId: 10,
        groupId: 71,
      };

      const membershipFindOneStub = sinon.stub(MembershipRepository, 'findById')
          .resolves(null as any);

      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById');

      await expect(InviteService.findById(currentUser, id))
          .to.eventually.be.rejectedWith(UnauthorizedError);

      assert.calledOnceWithExactly(membershipFindOneStub, currentUser, match({
        userId: currentUser.id,
        groupId: id.groupId,
      }));

      assert.notCalled(inviteRepFindByIdStub);
    });

    it('returns invite if currentUser is user with ' +
    'the specified id', async function() {
      const currentUser: any = {
        id: 10,
      };

      const id = {
        userId: 10,
        groupId: 71,
      };

      const membershipFindOneStub = sinon.stub(MembershipRepository, 'findById')
          .resolves(null as any);

      const invite = {
        userId: id.userId,
        groupId: id.groupId,
        invitedBy: 12,
      };
      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById')
          .resolves(invite as any);

      await expect(InviteService.findById(currentUser, id))
          .to.eventually.equal(invite);

      assert.calledOnceWithExactly(membershipFindOneStub, currentUser, match({
        userId: currentUser.id,
        groupId: id.groupId,
      }));

      assert.calledOnceWithExactly(inviteRepFindByIdStub, id);
    });

    it('returns invite if currentUser is a member of ' +
    'the group the invite is for', async function() {
      const currentUser: any = {
        id: 5,
      };

      const id = {
        userId: 10,
        groupId: 71,
      };

      const membershipFindOneStub = sinon.stub(MembershipRepository, 'findById')
          .resolves(true as any);

      const invite = {
        userId: id.userId,
        groupId: id.groupId,
        invitedBy: 12,
      };
      const inviteRepFindByIdStub = sinon.stub(InviteRepository, 'findById')
          .resolves(invite as any);

      await expect(InviteService.findById(currentUser, id))
          .to.eventually.equal(invite);

      assert.calledOnceWithExactly(membershipFindOneStub, currentUser, match({
        userId: currentUser.id,
        groupId: id.groupId,
      }));

      assert.calledOnceWithExactly(inviteRepFindByIdStub, id);
    });
  });

  describe('findAllForUser', function() {
    it('throws UnauthorizedError if currentUser is not user with ' +
    'specified userId', async function() {
      const currentUser: any = {
        id: 98,
      };

      const userId = 11;

      await expect(InviteService.findAllForUser(currentUser, userId))
          .to.eventually.be.rejectedWith(UnauthorizedError);
    });

    it('returns all invites for currentUser', async function() {
      const currentUser: any = {
        id: 98,
      };

      const userId = 98;

      const invites = [
        {
          userId: 98,
          groupId: 1,
        },
        {
          userId: 98,
          groupId: 2,
        },
      ];

      const inviteRepFindAllForUserStub = sinon
          .stub(InviteRepository, 'findAllForUser')
          .resolves(invites as any);

      await expect(InviteService.findAllForUser(currentUser, userId))
          .to.eventually.equal(invites);

      assert.calledOnceWithExactly(inviteRepFindAllForUserStub, userId, match({
        withGroupData: true,
        withInvitedByData: true,
      }));
    });
  });
});
