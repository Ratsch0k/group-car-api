/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {UnauthorizedError, MembershipNotFoundError} from '../../errors';
import sinon, {assert, match} from 'sinon';
import {User, Membership, MembershipRepository} from '../../models';

describe('MembershipRepository', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('throws UnauthorizedError if current ' +
    'user has not specified id', async function() {
      const user: any = {
        id: 3,
      };

      const id = {
        userId: 5,
        groupId: 71,
      };

      const membershipFindOneStub = sinon.stub(Membership, 'findOne');

      await expect(MembershipRepository.findById(user, id))
          .to.eventually.be.rejectedWith(UnauthorizedError);


      assert.notCalled(membershipFindOneStub);
    });

    it('throws MembershipNotFoundError if ' +
    'membership doesn\'t exist', async function() {
      const user: any = {
        id: 3,
      };

      const id = {
        userId: 3,
        groupId: 71,
      };

      const membershipFindOneStub = sinon.stub(Membership, 'findOne')
          .resolves(null as any);

      await expect(MembershipRepository.findById(user, id))
          .to.eventually.be.rejectedWith(MembershipNotFoundError);


      assert.calledOnceWithExactly(membershipFindOneStub, match({
        where: {
          userId: id.userId,
          groupId: id.groupId,
        },
      }));
    });

    it('returns correct membership and uses ' +
    'transaction if specified', async function() {
      const user: any = {
        id: 3,
      };

      const id = {
        userId: 3,
        groupId: 71,
      };

      const membership = {
        userId: 3,
        groupId: 71,
        isAdmin: true,
      };

      const membershipFindOneStub = sinon.stub(Membership, 'findOne')
          .resolves(membership as any);

      const fakeTransaction: any = {};

      await expect(MembershipRepository.findById(
          user,
          id,
          {
            transaction: fakeTransaction,
          },
      )).to.eventually.be.equal(membership);


      assert.calledOnceWithExactly(membershipFindOneStub, match({
        where: {
          userId: id.userId,
          groupId: id.groupId,
        },
        transaction: fakeTransaction,
      }));
    });
  });

  describe('create', function() {
    it('creates membership with transaction', async function() {
      const user: any = {
        id: 3,
      };

      const groupId = 41;

      const membership = {
        userId: 3,
        groupId: 41,
        isAdmin: true,
      };

      const membershipCreateStub = sinon.stub(Membership, 'create')
          .resolves(membership as any);

      const fakeTransaction: any = {};

      await expect(MembershipRepository.create(
          user,
          groupId,
          true,
          {
            transaction: fakeTransaction,
          },
      )).to.eventually.be.equal(membership);


      assert.calledOnceWithExactly(
          membershipCreateStub,
          match({
            userId: user.id,
            groupId,
            isAdmin: true,
          }),
          match({
            transaction: fakeTransaction,
          }));
    });
  });

  describe('removeUserFromGroup', function() {
    it('calls Membership.destroy with correct parameters', async function() {
      const userId = 10;
      const groupId = 11;
      const options: any = {
        transaction: 15,
      };

      const membershipDestroyStub = sinon.stub(Membership, 'destroy')
          .resolves();

      await MembershipRepository.removeUserFromGroup(userId, groupId, options);

      sinon.assert.calledOnceWithExactly(
          membershipDestroyStub,
          match({
            where: {
              groupId,
              userId,
            },
            ...options,
          }),
      );
    });
  });

  describe('findUsersOfGroup', function() {
    it('returns list of members for specified group', async function() {
      const groupId = 12;

      const members = [
        {
          groupId,
          User: {
            id: 1,
            username: 'USER-1',
          },
        },
        {
          groupId,
          User: {
            id: 2,
            username: 'USER-2',
          },
        },
      ];

      const findAllStub = sinon.stub(Membership, 'findAll')
          .resolves(members as any);

      const actual = await MembershipRepository.findUsersOfGroup(groupId);

      expect(actual).to.have.members([
        members[0].User,
        members[1].User,
      ]);

      assert.calledOnceWithExactly(findAllStub, match({
        where: {
          groupId,
        },
        include: [{
          model: User,
          as: 'User',
          attributes: User.simpleAttributes,
        }],
      }));
    });
  });
});
