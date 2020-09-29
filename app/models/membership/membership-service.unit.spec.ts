/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {MembershipService} from './membership-service';
import sinon, {assert, match} from 'sinon';
import {MembershipRepository} from './membership-repository';
import {
  MembershipNotFoundError,
  NotMemberOfGroupError,
  NotAdminOfGroupError,
  CannotChangeOwnerMembershipError,
} from '../../errors';
import {GroupService} from '../group';

describe('MembershipService', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('throws TypeError if id of current user ' +
    'is not a number', async function() {
      let currentUser: any = {
        id: 'test',
      };

      await expect(
          MembershipService.findById(
            currentUser as any,
            undefined as any,
          ),
      ).to.eventually.be.rejectedWith(TypeError);

      currentUser = {};

      await expect(
          MembershipService.findById(
            currentUser as any,
            undefined as any,
          ),
      ).to.eventually.be.rejectedWith(TypeError);
    });

    it('throws UnauthorizedError if current user is neither ' +
    'member of group nor user referenced in id', async function() {
      const currentUser = {
        id: 5,
      };

      const id = {
        userId: 7,
        groupId: 8,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .rejects(new MembershipNotFoundError(id));

      await expect(MembershipService.findById(currentUser as any, id))
          .to.eventually.be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(
          membershipRepFindById,
          match({
            groupId: id.groupId,
            userId: currentUser.id,
          }),
          match.any,
      );
    });

    it('calls MembershipRepository.findById if current user ' +
    'is member of group', async function() {
      const currentUser = {
        id: 5,
      };

      const id = {
        userId: 7,
        groupId: 8,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .resolves();

      await expect(MembershipService.findById(currentUser as any, id))
          .to.eventually.be.fulfilled;

      assert.calledWithExactly(
          membershipRepFindById,
          match({
            groupId: id.groupId,
            userId: currentUser.id,
          }),
          match.any,
      );

      assert.calledWithExactly(
          membershipRepFindById,
          match(id),
          match.any,
      );

      assert.calledTwice(membershipRepFindById);
    });

    it('calls MembershipRepository.findById if user is the ' +
    'user of the membership', async function() {
      const currentUser = {
        id: 5,
      };

      const id = {
        userId: currentUser.id,
        groupId: 8,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .resolves();

      await expect(MembershipService.findById(currentUser as any, id))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(
          membershipRepFindById,
          match(id),
          match.any,
      );
    });
  });

  describe('changeAdminPermission', function() {
    it('throws TypeError if id of current user is ' +
    'not a number', async function() {
      let currentUser: any = {
        id: 'test',
      };

      await expect(
          MembershipService.changeAdminPermission(
              currentUser,
              undefined as any,
              false,
          ),
      ).to.eventually.be.rejectedWith(TypeError);

      currentUser = {};

      await expect(
          MembershipService.changeAdminPermission(
              currentUser,
              undefined as any,
              false,
          ),
      ).to.eventually.be.rejectedWith(TypeError);
    });

    it('throws NotMemberOfGroupError if current user ' +
    'is not member of the group', async function() {
      const currentUser: any = {
        id: 7,
      };

      const id = {
        userId: 8,
        groupId: 2,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .rejects(new MembershipNotFoundError(id));

      await expect(MembershipService
          .changeAdminPermission(currentUser, id, false))
          .to.eventually.be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(
          membershipRepFindById,
          match({
            userId: currentUser.id,
            groupId: id.groupId,
          }),
          match.any,
      );
    });

    it('throws NotAdminOfGroupError if current user is not ' +
    'an admin of the group', async function() {
      const currentUser: any = {
        id: 7,
      };

      const id = {
        userId: 8,
        groupId: 2,
      };

      const currentUserMembership = {
        isAdmin: false,
        groupId: id.groupId,
        userId: currentUser.id,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .resolves(currentUserMembership as any);

      await expect(MembershipService
          .changeAdminPermission(currentUser, id, false))
          .to.eventually.be.rejectedWith(NotAdminOfGroupError);

      assert.calledOnceWithExactly(
          membershipRepFindById,
          match({
            userId: currentUser.id,
            groupId: id.groupId,
          }),
          match.any,
      );
    });

    it('throws CannotChangeOwnerMembershipError if the ' +
    'membership of the owner should be changed', async function() {
      const currentUser: any = {
        id: 7,
      };

      const id = {
        userId: 8,
        groupId: 2,
      };

      const currentUserMembership = {
        isAdmin: true,
        groupId: id.groupId,
        userId: currentUser.id,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .resolves(currentUserMembership as any);

      const group = {
        ownerId: id.userId,
      };

      const groupServiceFindById = sinon.stub(GroupService, 'findById')
          .resolves(group as any);

      await expect(MembershipService
          .changeAdminPermission(currentUser, id, false))
          .to.eventually.be.rejectedWith(CannotChangeOwnerMembershipError);

      assert.calledOnceWithExactly(
          membershipRepFindById,
          match({
            userId: currentUser.id,
            groupId: id.groupId,
          }),
          match.any,
      );

      assert.calledOnceWithExactly(
          groupServiceFindById,
          currentUser,
          id.groupId,
      );
    });

    it('calls MembershipRepository.changeAdminPermission ' +
    'with correct parameters', async function() {
      const currentUser: any = {
        id: 7,
      };

      const id = {
        userId: 8,
        groupId: 2,
      };

      const currentUserMembership = {
        isAdmin: true,
        groupId: id.groupId,
        userId: currentUser.id,
      };

      const membershipRepFindById = sinon.stub(MembershipRepository, 'findById')
          .resolves(currentUserMembership as any);

      const group = {
        ownerId: 10,
      };

      const groupServiceFindById = sinon.stub(GroupService, 'findById')
          .resolves(group as any);

      const membershipRepChangePerm = sinon.stub(
          MembershipRepository,
          'changeAdminPermission',
      ).resolves();

      await expect(MembershipService
          .changeAdminPermission(currentUser, id, false))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(
          membershipRepFindById,
          match({
            userId: currentUser.id,
            groupId: id.groupId,
          }),
          match.any,
      );

      assert.calledOnceWithExactly(
          groupServiceFindById,
          currentUser,
          id.groupId,
      );

      assert.calledOnceWithExactly(membershipRepChangePerm, id, false);
    });
  });

  describe('findAllForUser', function() {
    it('calls MembershipRepository.findAllForUser ' +
    'with correct parameters', async function() {
      const currentUser = {
        id: 9,
      };

      const memberships = [
        {
          userId: currentUser.id,
          groupId: 1,
          isAdmin: true,
        },
        {
          userId: currentUser.id,
          groupId: 2,
          isAdmin: false,
        },
      ];

      const findAllForUserStub = sinon.stub(
          MembershipRepository,
          'findAllForUser',
      ).resolves(memberships as any);

      await expect(MembershipService.findAllForUser(currentUser as any))
          .to.be.eventually.fulfilled;

      assert.calledOnceWithExactly(
          findAllForUserStub,
          currentUser.id,
          match({withUserData: true}),
      );
    });
  });
});
