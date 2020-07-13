/* eslint-disable @typescript-eslint/no-explicit-any */
import {MembershipRepository} from '../membership';
import sinon, {assert, match} from 'sinon';
import {InviteService} from '../invite';
import {expect} from 'chai';
import {GroupService} from './group-service';
import {UnauthorizedError} from '../../errors';
import {GroupRepository} from './group-repository';

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
          MembershipRepository, 'findById').rejects();
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

    it('returns group if user is member', async function() {
      const user: any = {
        id: 6,
      };
      const groupId = 9;

      const membershipFindById = sinon.stub(
          MembershipRepository, 'findById').resolves();
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
          groupFindById, groupId);
    });

    it('returns simple group if user has invite for group', async function() {
      const user: any = {
        id: 6,
      };
      const groupId = 9;

      const membershipFindById = sinon.stub(
          MembershipRepository, 'findById').rejects();
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
});
