/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {assert, match} from 'sinon';
import {Invite, InviteRepository, InviteService} from '../invite';
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
  UserNotFoundError,
  AlreadyInvitedError,
  AlreadyMemberError,
  GroupIsFullError,
} from '../../errors';
import {GroupRepository} from './group-repository';
import {Membership, MembershipService} from '../membership';
import {MembershipRepository} from '../membership';
import {User, UserRepository} from '../user';
import config from '../../config';

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

    it('returns full group if user is member', async function() {
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
          groupFindById, groupId, match({withOwnerData: true}));
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
    let memberFindAllForGroup: sinon.SinonStub<any, any>;

    beforeEach(function() {
      memberServFindById = sinon.stub(MembershipService, 'findById');
      memberRepRemoveUser = sinon.stub(
          MembershipRepository,
          'removeUserFromGroup',
      );
      groupRepFindById = sinon.stub(GroupRepository, 'findById');
      memberFindAllForGroup = sinon.stub(
          MembershipRepository,
          'findAllForGroup',
      );
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
        assert.notCalled(memberFindAllForGroup);
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
        assert.notCalled(memberFindAllForGroup);
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
        assert.notCalled(memberFindAllForGroup);
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
        assert.notCalled(memberFindAllForGroup);
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
        assert.notCalled(memberFindAllForGroup);
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

        assert.notCalled(groupRepFindById);

        assert.calledOnceWithExactly(
            memberFindAllForGroup,
            groupId,
            match({withUserData: true}),
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
            groupId,
        );

        assert.calledOnceWithExactly(
            memberFindAllForGroup,
            groupId,
            match({
              withUserData: true,
            }),
        );
      });
    });
  });

  describe('findAllForUser', function() {
    let membershipFindAllForUser: sinon.SinonStub<any, any>;
    let groupFindAllWithIds: sinon.SinonStub<any, any>;

    beforeEach(function() {
      membershipFindAllForUser = sinon.stub(
          MembershipService,
          'findAllForUser',
      );
      groupFindAllWithIds = sinon.stub(GroupRepository, 'findAllWithIds');
    });

    it('calls GroupRepository.findAllWithIds with correct ' +
    'parameters', async function() {
      const currentUser = {
        id: 99,
      };

      const memberships = [
        {
          userId: currentUser.id,
          groupId: 1,
          isAdmin: false,
        },
        {
          userId: currentUser.id,
          groupId: 2,
          isAdmin: true,
        },
      ];

      membershipFindAllForUser.resolves(memberships as any);
      groupFindAllWithIds.resolves();

      const expected = [1, 2];

      await expect(GroupService.findAllForUser(currentUser as any))
          .to.be.eventually.fulfilled;

      assert.calledOnceWithExactly(membershipFindAllForUser, currentUser);
      assert.calledOnceWithExactly(groupFindAllWithIds, match(expected));
    });
  });

  describe('create', function() {
    let repCreateStub: sinon.SinonStub;

    beforeEach(function() {
      repCreateStub = sinon.stub(GroupRepository, 'create');
    });

    it('calls GroupRepository.create with the correct args and ' +
      'returns the plain group', async function() {
      // Create fake data
      const currentUser = {
        id: 88,
      };

      const args = {
        name: 'GROUP_NAME',
        description: 'GROUP_DESCRIPTION',
      };

      const expected = {
        ...args,
        ownerId: currentUser.id,
      };

      const fakeGroup = {
        ...expected,
        get: sinon.stub().returns(expected),
      };

      repCreateStub.resolves(fakeGroup);

      const actual = await GroupService.create(currentUser as any, args);

      expect(actual).to.eql(expected);
      assert.calledOnceWithExactly(repCreateStub, match(expected));
      assert.calledOnceWithExactly(fakeGroup.get, match({plain: true}));
    });
  });

  describe('delete', function() {
    let isMemberStub: sinon.SinonStub;
    let findGroupStub: sinon.SinonStub;

    beforeEach(function() {
      isMemberStub = sinon.stub(MembershipService, 'isMember');
      findGroupStub = sinon.stub(GroupRepository, 'findById');
    });

    it('throws NotMemberOfGroup if user is not a member of ' +
      'the group', async function() {
      const user = {
        id: 88,
      } as Express.User;
      const groupId = 11;

      // Set stubs
      isMemberStub.resolves(false);

      await expect(GroupService.delete(user, groupId))
          .to.eventually.be.rejectedWith(NotMemberOfGroupError);

      assert.calledOnceWithExactly(isMemberStub, user, groupId);
      assert.notCalled(findGroupStub);
    });

    it('throws NotOwnerOfGroup if user is not an ' +
      'owner of the group', async function() {
      const user = {
        id: 88,
      } as Express.User;
      const group = {
        id: 11,
        ownerId: user.id + 1, // Ensure user is not the owner
        destroy: sinon.stub(),
      };

      // Set stubs
      isMemberStub.resolves(true);
      findGroupStub.resolves(group);

      await expect(GroupService.delete(user, group.id))
          .to.eventually.be.rejectedWith(NotOwnerOfGroupError);

      assert.calledOnceWithExactly(isMemberStub, user, group.id);
      assert.calledOnceWithExactly(findGroupStub, group.id);
      assert.notCalled(group.destroy);
    });

    it('delete the group if the group exists and the ' +
      'user is the owner', async function() {
      const user = {
        id: 88,
      } as Express.User;
      const group = {
        id: 11,
        ownerId: user.id, // Make user the owner
        destroy: sinon.stub(),
      };

      // Set stubs
      isMemberStub.resolves(true);
      findGroupStub.resolves(group);

      await expect(GroupService.delete(user, group.id))
          .to.be.eventually.be.fulfilled;

      assert.calledOnceWithExactly(isMemberStub, user, group.id);
      assert.calledOnceWithExactly(findGroupStub, group.id);
      assert.calledOnceWithExactly(group.destroy);
    });
  });

  describe('inviteUser', function() {
    let isMemberStub: sinon.SinonStub;
    let isInvitedStub: sinon.SinonStub;
    let getMembershipStub: sinon.SinonStub;
    let createInviteStub: sinon.SinonStub;
    let getMemberAmountStub: sinon.SinonStub;
    let getInvitesAmountStub: sinon.SinonStub;
    let findUserByIdStub: sinon.SinonStub;
    let findUserUsernameStub: sinon.SinonStub;
    let currentUser: Express.User;

    beforeEach(function() {
      isMemberStub = sinon.stub(MembershipRepository, 'exists');
      isInvitedStub = sinon.stub(InviteRepository, 'exists');
      getMembershipStub = sinon.stub(MembershipRepository, 'findById');
      createInviteStub = sinon.stub(InviteRepository, 'create');
      getMemberAmountStub = sinon.stub(MembershipRepository, 'countForGroup');
      getInvitesAmountStub = sinon.stub(InviteRepository, 'countForGroup');
      findUserByIdStub = sinon.stub(UserRepository, 'findById');
      findUserUsernameStub = sinon.stub(UserRepository, 'findByUsername');

      /**
       * Only assign necessary fields
       */
      currentUser = {
        id: 5,
      } as Express.User;
    });

    describe('throws ', function() {
      // eslint-disable-next-line require-jsdoc
      function checkCreateInviteCall() {
        assert.notCalled(createInviteStub);
      }

      it('NotMemberOfGroupError if requesting user is not a ' +
        'member of the group', async function() {
        const userId = 66;
        const groupId = 88;

        getMembershipStub.callsFake(() =>
          Promise.reject(new NotMemberOfGroupError()));

        await expect(GroupService.inviteUser(currentUser, groupId, userId))
            .to.eventually.be.rejectedWith(NotMemberOfGroupError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.notCalled(getInvitesAmountStub);
        assert.notCalled(getMemberAmountStub);
        assert.notCalled(findUserUsernameStub);
        assert.notCalled(findUserByIdStub);
        assert.notCalled(isMemberStub);
        assert.notCalled(isInvitedStub);
      });

      it('NotAdminOfGroupError if requesting user not an ' +
        'admin of the group', async function() {
        const userId = 66;
        const groupId = 88;

        const membership = {
          userId: currentUser.id,
          groupId,
          isAdmin: false,
        } as Membership;

        getMembershipStub.resolves(membership);

        await expect(GroupService.inviteUser(currentUser, groupId, userId))
            .to.eventually.be.rejectedWith(NotAdminOfGroupError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.notCalled(getInvitesAmountStub);
        assert.notCalled(getMemberAmountStub);
        assert.notCalled(findUserUsernameStub);
        assert.notCalled(findUserByIdStub);
        assert.notCalled(isMemberStub);
        assert.notCalled(isInvitedStub);
      });

      it('UserNotFoundError if no user with the ' +
        'specified id exists', async function() {
        const userId = 66;
        const groupId = 88;

        const membership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        } as Membership;

        findUserByIdStub.callsFake(() =>
          Promise.reject(new UserNotFoundError(userId)));

        getMembershipStub.resolves(membership);

        await expect(GroupService.inviteUser(currentUser, groupId, userId))
            .to.eventually.be.rejectedWith(UserNotFoundError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.calledOnceWithExactly(findUserByIdStub, userId);
        assert.notCalled(getInvitesAmountStub);
        assert.notCalled(getMemberAmountStub);
        assert.notCalled(findUserUsernameStub);
        assert.notCalled(isMemberStub);
        assert.notCalled(isInvitedStub);
      });

      it('UserNotFoundError if no user with the specified ' +
        'username exists', async function() {
        const username = 'INVITEE';
        const groupId = 88;

        const membership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        } as Membership;

        findUserUsernameStub.callsFake(() =>
          Promise.reject(new UserNotFoundError(username)));

        getMembershipStub.resolves(membership);

        await expect(GroupService.inviteUser(currentUser, groupId, username))
            .to.eventually.be.rejectedWith(UserNotFoundError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.calledOnceWithExactly(findUserUsernameStub, username);
        assert.notCalled(getInvitesAmountStub);
        assert.notCalled(getMemberAmountStub);
        assert.notCalled(findUserByIdStub);
        assert.notCalled(isMemberStub);
        assert.notCalled(isInvitedStub);
      });

      it('AlreadyInvitedError if the user to invite is already ' +
        'invited to the group', async function() {
        const userId = 54;
        const groupId = 88;

        const membership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        } as Membership;

        findUserByIdStub.resolves();
        getMembershipStub.resolves(membership);
        isInvitedStub.resolves(true);

        await expect(GroupService.inviteUser(currentUser, groupId, userId))
            .to.eventually.be.rejectedWith(AlreadyInvitedError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.calledOnceWithExactly(findUserByIdStub, userId);
        assert.calledOnceWithExactly(isInvitedStub, {groupId, userId});
        assert.notCalled(findUserUsernameStub);
        assert.notCalled(getInvitesAmountStub);
        assert.notCalled(getMemberAmountStub);
        assert.notCalled(isMemberStub);
      });

      it('AlreadyMemberError if the user to invite is already ' +
        'a member of the group', async function() {
        const userId = 54;
        const groupId = 88;

        const membership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        } as Membership;

        findUserByIdStub.resolves();
        getMembershipStub.resolves(membership);
        isInvitedStub.resolves(false);
        isMemberStub.resolves(true);

        await expect(GroupService.inviteUser(currentUser, groupId, userId))
            .to.eventually.be.rejectedWith(AlreadyMemberError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.calledOnceWithExactly(findUserByIdStub, userId);
        assert.calledOnceWithExactly(isInvitedStub, {groupId, userId});
        assert.calledOnceWithExactly(isMemberStub, {groupId, userId});
        assert.notCalled(findUserUsernameStub);
        assert.notCalled(getInvitesAmountStub);
        assert.notCalled(getMemberAmountStub);
      });

      it('GroupIsFullError if the group is already at ' +
        'max capacity', async function() {
        const userId = 54;
        const groupId = 88;

        const membership = {
          userId: currentUser.id,
          groupId,
          isAdmin: true,
        } as Membership;

        findUserByIdStub.resolves();
        getMembershipStub.resolves(membership);
        isInvitedStub.resolves(false);
        isMemberStub.resolves(false);
        getMemberAmountStub.resolves(config.group.maxMembers - 2);
        getInvitesAmountStub.resolves(3);

        await expect(GroupService.inviteUser(currentUser, groupId, userId))
            .to.eventually.be.rejectedWith(GroupIsFullError);

        checkCreateInviteCall();
        assert.calledOnceWithExactly(
            getMembershipStub,
            {groupId, userId: currentUser.id},
        );
        assert.calledOnceWithExactly(findUserByIdStub, userId);
        assert.calledOnceWithExactly(isInvitedStub, {groupId, userId});
        assert.calledOnceWithExactly(isMemberStub, {groupId, userId});
        assert.calledOnceWithExactly(getInvitesAmountStub, groupId);
        assert.calledOnceWithExactly(getMemberAmountStub, groupId);
        assert.notCalled(findUserUsernameStub);
      });
    });

    it('if the logged-in user is an admin of the group, the specified user ' +
      'exists and ist neither already invited or a member of the group and' +
      'the group is not full, create the invite and return the invite as a ' +
      'plain object', async function() {
      const userId = 54;
      const groupId = 88;

      const membership = {
        userId: currentUser.id,
        groupId,
        isAdmin: true,
      } as Membership;

      findUserByIdStub.resolves();
      getMembershipStub.resolves(membership);
      isInvitedStub.resolves(false);
      isMemberStub.resolves(false);
      getMemberAmountStub.resolves(1);
      getInvitesAmountStub.resolves(0);

      const invite = {
        userId,
        groupId,
        invitedBy: currentUser.id,
      } as Invite;
      const response = {
        ...invite,
        get: sinon.stub().returns(invite),
      };
      createInviteStub.resolves(response);

      const actual = await GroupService
          .inviteUser(currentUser, groupId, userId);

      expect(actual).to.eq(invite);
      assert.calledOnceWithExactly(
          getMembershipStub,
          {groupId, userId: currentUser.id},
      );
      assert.calledOnceWithExactly(findUserByIdStub, userId);
      assert.calledOnceWithExactly(isInvitedStub, {groupId, userId});
      assert.calledOnceWithExactly(isMemberStub, {groupId, userId});
      assert.calledOnceWithExactly(getInvitesAmountStub, groupId);
      assert.calledOnceWithExactly(getMemberAmountStub, groupId);
      assert.notCalled(findUserUsernameStub);
      assert.calledOnceWithExactly(
          createInviteStub,
          userId,
          groupId,
          currentUser.id,
      );
    });

    it('if username specified, retrieve user and ' +
      'use user id instead', async function() {
      const username = 'TEST_USER';
      const groupId = 88;

      const membership = {
        userId: currentUser.id,
        groupId,
        isAdmin: true,
      } as Membership;

      const user = {
        id: 11,
        username,
      } as User;

      findUserUsernameStub.resolves(user);
      getMembershipStub.resolves(membership);
      isInvitedStub.resolves(false);
      isMemberStub.resolves(false);
      getMemberAmountStub.resolves(1);
      getInvitesAmountStub.resolves(0);

      const invite = {
        userId: user.id,
        groupId,
        invitedBy: currentUser.id,
      } as Invite;
      const response = {
        ...invite,
        get: sinon.stub().returns(invite),
      };
      createInviteStub.resolves(response);

      const actual = await GroupService
          .inviteUser(currentUser, groupId, username);

      expect(actual).to.eq(invite);

      assert.calledOnceWithExactly(
          getMembershipStub,
          {groupId, userId: currentUser.id},
      );
      assert.notCalled(findUserByIdStub);
      assert.calledOnceWithExactly(isInvitedStub, {groupId, userId: user.id});
      assert.calledOnceWithExactly(isMemberStub, {groupId, userId: user.id});
      assert.calledOnceWithExactly(getInvitesAmountStub, groupId);
      assert.calledOnceWithExactly(getMemberAmountStub, groupId);
      assert.calledOnceWithExactly(findUserUsernameStub, username);
      assert.calledOnceWithExactly(
          createInviteStub,
          user.id,
          groupId,
          currentUser.id,
      );
    });
  });
});
