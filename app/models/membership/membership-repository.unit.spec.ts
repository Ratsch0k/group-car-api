/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {UnauthorizedError, MembershipNotFoundError} from '../../errors';
import {MembershipRepository} from './membership-repository';
import Membership from './membership';
import sinon, {assert, match} from 'sinon';

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
});
