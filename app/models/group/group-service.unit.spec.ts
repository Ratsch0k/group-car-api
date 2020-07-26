/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {InviteService} from '../invite';
import {expect} from 'chai';
import {GroupService} from './group-service';
import {
  UnauthorizedError,
  NotOwnerOfGroupError,
  MembershipNotFoundError,
  InviteNotFoundError,
  UserNotAdminOfGroupError,
  UserNotMemberOfGroupError,
  CannotKickSelfError,
  NotAdminOfGroupError,
  NotMemberOfGroupError,
} from '../../errors';
import {GroupRepository} from './group-repository';
import {MembershipService} from '../membership/membership-service';
import {MembershipRepository} from '../membership';

describe('GroupService', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('throws UnauthorizedError if user is neither ' +
    'member of group nor has an invite for it', async function() {
      const user: any = {
        id: 6,
      };
      const groupId = 9;

      const membershipFindById = sinon.stub(
          MembershipService, 'findById').rejects();
      const inviteFindById = sinon.stub(InviteService, 'findById')
          .rejects();
      const groupFindById = sinon.stub(GroupRepository, 'findById').rejects();

      await expect(GroupService.findById(user, groupId))
          .to.eventually.be.rejectedWith(UnauthorizedError);

      assert.calledOnceWithExactly(
          membershipFindById, user, match({userId: user.id, groupId}));
      assert.calledOnceWithExactly(
          inviteFindById, user, match({userId: user.id, groupId}));
      assert.notCalled(groupFindById);
    });

    it('returns group if user is member with members list', async function() {
      const user: any = {
        id: 6,
      };
      const groupId = 9;

      const membershipFindById = sinon.stub(
          MembershipService, 'findById').resolves();
      const inviteFindById = sinon.stub(InviteService, 'findById')
          .rejects();
      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves();

      await expect(GroupService.findById(user, groupId))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(
          membershipFindById, user, match({userId: user.id, groupId}));
      assert.notCalled(inviteFindById);
      assert.calledOnceWithExactly(
          groupFindById, groupId, match({withMembers: true}));
    });

    it('returns simple group if user has invite for group', async function() {
      const user: any = {
        id: 6,
      };
      const groupId = 9;

      const membershipFindById = sinon.stub(
          MembershipService, 'findById').rejects();
      const inviteFindById = sinon.stub(InviteService, 'findById')
          .resolves();
      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves();

      await expect(GroupService.findById(user, groupId))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(
          membershipFindById, user, match({userId: user.id, groupId}));
      assert.calledOnceWithExactly(
          inviteFindById, user, match({userId: user.id, groupId}));
      assert.calledOnceWithExactly(
          groupFindById,
          groupId,
          match({simple: true}),
      );
    });
  });

  describe('transferOwnership', function() {
    const currentUser: any = {
      id: 8,
    };

    it('throws UnauthorizedError if current user is not a ' +
    'member and has no invite for the specified group', async function() {
      const groupId = 8;
      const toId = 10;

      const membershipFindById = sinon.stub(MembershipService, 'findById')
          .rejects(new MembershipNotFoundError({
            userId: currentUser.id, groupId,
          }));

      const inviteFindById = sinon.stub(InviteService, 'findById')
          .rejects(new InviteNotFoundError({userId: currentUser.id, groupId}));

      await expect(GroupService.transferOwnership(currentUser, groupId, toId))
          .to.be.eventually.rejectedWith(UnauthorizedError);

      assert.calledOnceWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );

      assert.alwaysCalledWithExactly(
          inviteFindById,
          currentUser,
          {
            userId: currentUser.id,
            groupId,
          },
      );
    });

    it('throws NotOwnerOfGroup if current user only ' +
    'has an invite for the specified group', async function() {
      const groupId = 8;
      const toId = 10;

      const group = {
        id: 8,
        Owner: {
          id: currentUser.id + 1,
        },
      };

      const invite = {
        groupId,
        userId: currentUser.id,
      };

      const membershipFindById = sinon.stub(MembershipService, 'findById')
          .rejects(new MembershipNotFoundError({
            userId: currentUser.id, groupId,
          }));

      const inviteFindById = sinon.stub(InviteService, 'findById')
          .resolves(invite as any);

      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves(group as any);

      await expect(GroupService.transferOwnership(currentUser, groupId, toId))
          .to.be.eventually.rejectedWith(NotOwnerOfGroupError);

      assert.calledOnceWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );
      assert.calledOnceWithExactly(groupFindById, groupId, match.any);

      assert.calledOnceWithExactly(
          inviteFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );
    });

    it('throws NotOwnerOfGroupError if current user is not ' +
    'owner of specified group', async function() {
      const groupId = 8;
      const toId = 10;

      const membership = {
        userId: currentUser.id,
        groupId,
        isAdmin: true,
      };

      const group = {
        id: 8,
        Owner: {
          id: currentUser.id + 1,
        },
      };
      const membershipFindById = sinon.stub(MembershipService, 'findById')
          .resolves(membership as any);

      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves(group as any);

      await expect(GroupService.transferOwnership(currentUser, groupId, toId))
          .to.be.eventually.rejectedWith(NotOwnerOfGroupError);

      assert.calledOnceWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );
      assert.calledOnceWithExactly(groupFindById, groupId, match.any);
    });

    it('throws UserNotMemberOfGroup if owner tries to transfer ' +
    'ownership to a user who is not a member of the group', async function() {
      const groupId = 8;
      const toId = 10;

      const membership = {
        userId: currentUser.id,
        groupId,
        isAdmin: true,
      };

      const group = {
        id: 8,
        Owner: {
          id: currentUser.id,
        },
      };

      const membershipFindById = sinon.stub(MembershipService, 'findById')
          .onFirstCall()
          .resolves(membership as any)
          .onSecondCall()
          .rejects(new MembershipNotFoundError({userId: toId, groupId}));

      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves(group as any);

      const error = await expect(GroupService
          .transferOwnership(currentUser, groupId, toId))
          .to.be.eventually.rejectedWith(UserNotMemberOfGroupError);

      expect(error.message).to.eql(new UserNotMemberOfGroupError(toId).message);

      assert.calledWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );
      assert.calledWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: toId,
            groupId,
          }),
      );
      assert.calledTwice(membershipFindById);
      assert.calledOnceWithExactly(groupFindById, groupId, match.any);
    });

    it('throws UserNotAdminOfGroupError if ' +
    'owner tries to transfer ownership to member who is not ' +
    'admin of specified group', async function() {
      const groupId = 8;
      const toId = 10;

      const membership = {
        userId: currentUser.id,
        groupId,
        isAdmin: true,
      };

      const toIdMembership = {
        userId: currentUser.id + 2,
        groupId,
        isAdmin: false,
      };

      const group = {
        id: 8,
        Owner: {
          id: currentUser.id,
        },
      };

      const membershipFindById = sinon.stub(MembershipService, 'findById')
          .onFirstCall()
          .resolves(membership as any)
          .onSecondCall()
          .resolves(toIdMembership as any);

      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves(group as any);

      const error = await expect(GroupService
          .transferOwnership(currentUser, groupId, toId))
          .to.be.eventually
          .rejectedWith(UserNotAdminOfGroupError);

      expect(error).to.be.instanceOf(UserNotAdminOfGroupError);
      expect(error).to.have
          .haveOwnProperty(
              'message',
              `User with id ${toId} is not an admin of the group`,
          );

      assert.calledWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );
      assert.calledWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: toId,
            groupId,
          }),
      );
      assert.calledTwice(membershipFindById);
      assert.calledOnceWithExactly(groupFindById, groupId, match.any);
    });

    it('changes ownership to specified user and ' +
    'returns group', async function() {
      const groupId = 8;
      const toId = 10;

      const membership = {
        userId: currentUser.id,
        groupId,
        isAdmin: true,
      };

      const toIdMembership = {
        userId: currentUser.id + 2,
        groupId,
        isAdmin: true};

      const group = {
        id: 8,
        Owner: {
          id: currentUser.id,
        },
      };

      const membershipFindById = sinon.stub(MembershipService, 'findById')
          .onFirstCall()
          .resolves(membership as any)
          .onSecondCall()
          .resolves(toIdMembership as any);

      const groupFindById = sinon.stub(GroupRepository, 'findById')
          .resolves(group as any);

      const groupChangeOwnership = sinon.stub(
          GroupRepository,
          'changeOwnership',
      ).resolves();

      await expect(GroupService.transferOwnership(currentUser, groupId, toId))
          .to.be.eventually.equal(group);

      assert.calledWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: currentUser.id,
            groupId,
          }),
      );
      assert.calledWithExactly(
          membershipFindById,
          currentUser,
          match({
            userId: toId,
            groupId,
          }),
      );
      assert.calledThrice(membershipFindById);
      assert.calledWithExactly(groupFindById, groupId, match.any);
      assert.calledTwice(groupFindById);
      assert.calledOnceWithExactly(groupChangeOwnership, groupId, toId);
    });
  });

  describe('kickUser', function() {
    let currentUser: any;
    let groupId: number;
    let userId: number;

    let memberServFindById: sinon.SinonStub<any, any>;
    let memberRepRemoveUser: sinon.SinonStub<any, any>;
    let groupRepFindById: sinon.SinonStub<any, any>;

    beforeEach(function() {
      memberServFindById = sinon.stub(MembershipService, 'findById');
      memberRepRemoveUser = sinon.stub(
          MembershipRepository,
          'removeUserFromGroup',
      );
      groupRepFindById = sinon.stub(GroupRepository, 'findById');
    });

    describe('throws', function() {
      it('CannotKickSelfError if specified userId and id of current user ' +
      'is equal', async function() {
        userId = 8;
        currentUser = {
          id: userId,
        };
        groupId = 10;

        await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.rejectedWith(CannotKickSelfError);

        assert.notCalled(memberRepRemoveUser);
        assert.notCalled(memberServFindById);
        assert.notCalled(groupRepFindById);
      });

      it('NotMemberOfGroupError if current user is not member of the ' +
      'specified group', async function() {
        userId = 8;
        currentUser = {
          id: 9,
        };
        groupId = 10;

        memberServFindById.rejects(new MembershipNotFoundError({
          userId: currentUser.id,
          groupId,
        }));

        await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.rejectedWith(NotMemberOfGroupError);

        assert.calledOnceWithExactly(
            memberServFindById,
            currentUser,
            match({
              userId: currentUser.id,
              groupId,
            }),
        );

        assert.notCalled(memberRepRemoveUser);
        assert.notCalled(groupRepFindById);
      });

      it('NotAdminOfGroupError if current user is member but not admin ' +
      'of group', async function() {
        userId = 8;
        currentUser = {
          id: 9,
        };
        groupId = 10;

        const currentMembership = {
          userId: currentUser.id,
          groupId,
          isAdmin: false,
        };

        memberServFindById.resolves(currentMembership as any);

        await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.rejectedWith(NotAdminOfGroupError);

        assert.calledOnceWithExactly(
            memberServFindById,
            currentUser,
            match({
              userId: currentUser.id,
              groupId,
            }),
        );

        assert.notCalled(memberRepRemoveUser);
        assert.notCalled(groupRepFindById);
      });

      it('MembershipNotFoundError if the specified user is not a member ' +
      'of the group', async function() {
        userId = 8;
        currentUser = {
          id: 9,
        };
        groupId = 10;

        const currentMembership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        };

        memberServFindById
            .onFirstCall().resolves(currentMembership as any)
            .onSecondCall().rejects(
                new MembershipNotFoundError({userId, groupId}));

        const error = await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.rejectedWith(MembershipNotFoundError);

        expect(error.detail).to.eql({userId, groupId});

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId: currentUser.id,
              groupId,
            },
        );

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId,
              groupId,
            },
        );

        assert.notCalled(memberRepRemoveUser);
        assert.notCalled(groupRepFindById);
      });

      it('NotOwnerOfGroupError if specified user is admin of the group ' +
      'but current user is not the owner', async function() {
        userId = 8;
        currentUser = {
          id: 9,
        };
        groupId = 10;

        const currentMembership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        };

        const userMembership = {
          userId,
          groupId,
          isAdmin: true,
        };

        memberServFindById
            .onFirstCall().resolves(currentMembership as any)
            .onSecondCall().resolves(userMembership as any);

        const group = {
          name: 'TEST',
          description: 'TEST',
          ownerId: currentUser.id + 1,
        };

        groupRepFindById.resolves(group as any);

        await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.rejectedWith(NotOwnerOfGroupError);

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId: currentUser.id,
              groupId,
            },
        );

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId,
              groupId,
            },
        );

        assert.calledOnceWithExactly(groupRepFindById, groupId);

        assert.notCalled(memberRepRemoveUser);
      });
    });

    describe('removes the specified user from the group if', function() {
      it('specified user is normal member and current ' +
      'user is admin', async function() {
        userId = 8;
        currentUser = {
          id: 9,
        };
        groupId = 10;

        const currentMembership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        };

        const userMembership = {
          userId,
          groupId,
          isAdmin: false,
        };

        memberServFindById
            .onFirstCall().resolves(currentMembership as any)
            .onSecondCall().resolves(userMembership as any);

        memberRepRemoveUser.resolves();

        const group = {
          name: 'TEST',
          description: 'TEST',
          ownerId: currentUser.id + 1,
        };

        groupRepFindById.resolves(group as any);


        await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.fulfilled;

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId: currentUser.id,
              groupId,
            },
        );

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId,
              groupId,
            },
        );

        assert.calledOnceWithExactly(memberRepRemoveUser, userId, groupId);

        assert.calledWithMatch(
            groupRepFindById,
            groupId, {
              withMembers: true,
              withOwnerData: true,
            },
        );
      });

      it('specified user is admin and current user is owner', async function() {
        userId = 8;
        currentUser = {
          id: 9,
        };
        groupId = 10;

        const currentMembership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        };

        const userMembership = {
          userId,
          groupId,
          isAdmin: true,
        };

        memberServFindById
            .onFirstCall().resolves(currentMembership as any)
            .onSecondCall().resolves(userMembership as any);

        const group = {
          name: 'TEST',
          description: 'TEST',
          ownerId: currentUser.id,
        };

        groupRepFindById.resolves(group as any);

        memberRepRemoveUser.resolves();


        await expect(GroupService.kickUser(
            currentUser,
            groupId,
            userId,
        )).to.be.fulfilled;

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId: currentUser.id,
              groupId,
            },
        );

        assert.calledWithMatch(
            memberServFindById,
            currentUser, {
              userId,
              groupId,
            },
        );

        assert.calledOnceWithExactly(memberRepRemoveUser, userId, groupId);

        assert.calledWithMatch(
            groupRepFindById,
            groupId, {
              withMembers: true,
              withOwnerData: true,
            },
        );
      });
    });
  });
});
