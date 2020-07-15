/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {MembershipService} from './membership-service';
import sinon, {assert, match} from 'sinon';
import {MembershipRepository} from './membership-repository';
import {MembershipNotFoundError, NotMemberOfGroupError} from '../../errors';

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

      expect(MembershipService.changeAdminPermission(currentUser, id, false))
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
    'an admin of the group');

    it('throws CannotChangeOwnerMembershipError if the ' +
    'membership of the owner should be changed');

    it('calls MembershipRepository.changeAdminPermission ' +
    'with correct parameters');
  });
});
