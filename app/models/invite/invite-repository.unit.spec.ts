/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon, {match, assert} from 'sinon';
import {InviteRepository, InviteId} from './invite-repository';
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

  describe('deleteById', function() {
    it('deletes the invite with the specified id', function() {
      const id: InviteId = {
        userId: 5,
        groupId: 7,
      };

      const inviteDestroyStub = sinon.stub(Invite, 'destroy').resolves(3);

      expect(InviteRepository.deleteById(id)).to.eventually.eql(3);

      assert.calledOnceWithExactly(inviteDestroyStub, match({
        where: id,
        transaction: undefined,
      }));
    });

    it('deletes with transaction if specified', function() {
      const id: InviteId = {
        userId: 5,
        groupId: 7,
      };

      const inviteDestroyStub = sinon.stub(Invite, 'destroy').resolves(3);

      const transactionFake: any = {};
      expect(InviteRepository.deleteById(
          id,
          {transaction: transactionFake},
      ))
          .to.eventually.eql(3);

      assert.calledOnceWithExactly(inviteDestroyStub, match({
        where: id,
        transaction: transactionFake,
      }));
    });
  });

  describe('existsById', function() {
    it('returns true if an invite with the specified id exists', function() {
      const id = {
        userId: 10,
        groupId: 14,
      };

      const invite = {
        userId: id.userId,
        groupId: id.groupId,
        invitedBy: 5,
      };

      const inviteFindOne = sinon.stub(Invite, 'findOne')
          .resolves(invite as any);

      expect(InviteRepository.existsById(id)).to.eventually.be.true;

      assert.calledOnceWithExactly(inviteFindOne, match({
        where: id,
      }));
    });

    it('returns false if no invite with the specified id exists', function() {
      const id = {
        userId: 10,
        groupId: 14,
      };

      const inviteFindOne = sinon.stub(Invite, 'findOne')
          .resolves(null as any);

      expect(InviteRepository.existsById(id)).to.eventually.be.false;

      assert.calledOnceWithExactly(inviteFindOne, match({
        where: id,
      }));
    });
  });

  describe('findAllForGroup', function() {
    it('returns invites for specified group', async function() {
      const groupId = 51;

      const invites = [
        {
          groupId,
          userId: 1,
        },
        {
          groupId,
          userId: 2,
        },
        {
          groupId,
          userId: 3,
        },
      ];

      const inviteFindAll = sinon.stub(Invite, 'findAll')
          .resolves(invites as any);

      await expect(
          InviteRepository.findAllForGroup(groupId),
      ).to.eventually.be.eql(invites);

      assert.calledOnceWithExactly(
          inviteFindAll,
          match({
            where: {groupId},
          }),
      );
    });
  });

  describe('exists', function() {
    let findInviteStub: sinon.SinonStub;

    beforeEach(function() {
      findInviteStub = sinon.stub(Invite, 'findOne');
    });

    it('returns true if the invite exists', async function() {
      const groupId = 42;
      const userId = 55;
      const invite = {
        userId,
        groupId,
        invitedBy: 88,
      };

      findInviteStub.resolves(invite);

      const options = {
        transaction: {},
      };

      await expect(InviteRepository.exists({groupId, userId}, options as any))
          .to.eventually.be.true;

      assert.calledOnceWithExactly(
          findInviteStub,
          match({
            where: {groupId, userId},
            transaction: options.transaction,
          }),
      );
    });

    it('returns false if no invite exists', async function() {
      const groupId = 42;
      const userId = 55;

      findInviteStub.resolves(null);

      const options = {
        transaction: {},
      };

      await expect(InviteRepository.exists({groupId, userId}, options as any))
          .to.eventually.be.false;

      assert.calledOnceWithExactly(
          findInviteStub,
          match({
            where: {groupId, userId},
            transaction: options.transaction,
          }),
      );
    });
  });
});
