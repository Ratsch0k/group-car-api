/* eslint-disable @typescript-eslint/no-explicit-any */
import {Membership} from '../membership';
import sinon, {match} from 'sinon';
import {InviteRepository} from './invite-repository';
import {UnauthorizedError, InviteNotFoundError} from '../../errors';
import {expect} from 'chai';
import Invite from './invite';
import Bluebird from 'bluebird';

describe('InviteRepository', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('throws UnauthorizedError if current user ' +
    'not user of invite and not member of group', async function() {
      const membershipFindAllStub = sinon.stub(Membership, 'findOne')
          .resolves(null as any);

      const currentUser = {
        id: 2,
      };

      await InviteRepository
          .findById(currentUser as any, {userId: 3, groupId: 1})
          .catch((err) => {
            expect(err).to.be.instanceOf(UnauthorizedError);
          });

      sinon.assert.calledOnceWithExactly(membershipFindAllStub, match({
        where: {
          userId: currentUser.id,
        },
      }));
    });

    it('returns invite if user is the invited user', async function() {
      const membershipFindAllStub = sinon.stub(Membership, 'findOne')
          .resolves(null as any);

      const currentUser = {
        id: 2,
      };

      const invite = {
        userId: currentUser.id,
        groupId: 1,
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(invite as any);

      const response = await InviteRepository
          .findById(currentUser as any, {userId: 2, groupId: 1});

      sinon.assert.calledOnceWithExactly(membershipFindAllStub, match({
        where: {
          userId: currentUser.id,
        },
      }));

      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          groupId: 1,
          userId: currentUser.id,
        },
      }));

      expect(response).to.equal(invite);
    });

    it('returns invite if user member of group ' +
    'of the invite', async function() {
      const membership = {
        userId: 2,
        groupId: 1,
      };

      const membershipFindAllStub = sinon.stub(Membership, 'findOne')
          .resolves(membership as any);

      const inviteId = {
        groupId: 1,
        userId: 3,
      };

      const currentUser = {
        id: 2,
      };

      const invite = {
        userId: 3,
        groupId: 1,
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(invite as any);

      const response = await InviteRepository
          .findById(currentUser as any, inviteId);

      sinon.assert.calledOnceWithExactly(membershipFindAllStub, match({
        where: {
          userId: currentUser.id,
          groupId: inviteId.groupId,
        },
      }));

      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          userId: inviteId.userId,
          groupId: inviteId.groupId,
        },
        include: undefined,
        attributes: undefined,
      }));

      expect(response).to.equal(invite);
    });

    it('throws InviteNotFoundError if invitation ' +
    'doesn\'t exist', async function() {
      const membership = {
        userId: 2,
        groupId: 1,
      };

      const membershipFindAllStub = sinon.stub(Membership, 'findOne')
          .resolves(membership as any);

      const inviteId = {
        groupId: 1,
        userId: 3,
      };

      const currentUser = {
        id: 2,
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(null as any);

      await InviteRepository
          .findById(currentUser as any, inviteId)
          .catch((err) => {
            expect(err).to.be.instanceOf(InviteNotFoundError);
            expect((err as InviteNotFoundError).detail).to.be.not.undefined;
            expect((err as InviteNotFoundError).detail).to.eql({inviteId});
          });

      sinon.assert.calledOnceWithExactly(membershipFindAllStub, match({
        where: {
          userId: currentUser.id,
          groupId: inviteId.groupId,
        },
      }));

      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        attributes: undefined,
        include: undefined,
        where: {
          userId: inviteId.userId,
          groupId: inviteId.groupId,
        },
      }));
    });
  });

  describe('findAllForUser', function() {

  });
});
