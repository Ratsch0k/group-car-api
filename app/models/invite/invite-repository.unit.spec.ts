/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {match} from 'sinon';
import {InviteRepository} from './invite-repository';
import {InviteNotFoundError} from '../../errors';
import {expect} from 'chai';
import Bluebird from 'bluebird';
import {Invite} from '..';

describe('InviteRepository', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('returns invite with given id', async function() {
      const invite = {
        userId: 2,
        groupId: 1,
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(invite as any);

      const response = await InviteRepository
          .findById(invite);

      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          groupId: invite.groupId,
          userId: invite.userId,
        },
      }));

      expect(response).to.equal(invite);
    });

    it('throws InviteNotFoundError if invitation ' +
    'doesn\'t exist', async function() {
      const inviteId = {
        groupId: 1,
        userId: 3,
      };

      const inviteFindOneStub = sinon.stub(Invite, 'findOne')
          .usingPromise(Bluebird).resolves(null as any);

      await InviteRepository
          .findById(inviteId)
          .catch((err) => {
            expect(err).to.be.instanceOf(InviteNotFoundError);
            expect((err as InviteNotFoundError).detail).to.be.not.undefined;
            expect((err as InviteNotFoundError).detail).to.eql({inviteId});
          });

      sinon.assert.calledOnceWithExactly(inviteFindOneStub, match({
        where: {
          userId: inviteId.userId,
          groupId: inviteId.groupId,
        },
      }));
    });
  });

  describe('findAllForUser', function() {
    it('returns list of invites of the user', async function() {
      const userId = 1;

      const expectedInvites = [
        {
          groupId: 1,
          userId: userId,
        },
        {
          groupId: 2,
          userId: userId,
        },
        {
          groupId: 3,
          userId: userId,
        },
        {
          groupId: 4,
          userId: userId,
        },
      ];

      const inviteFindAllStub = sinon.stub(Invite, 'findAll')
          .resolves(expectedInvites as any);

      const actualInvites = await InviteRepository.findAllForUser(userId);

      expect(actualInvites).to.equal(expectedInvites);
      sinon.assert.calledOnceWithExactly(inviteFindAllStub, match({
        where: {
          userId,
        },
      }));
    });
  });
});
