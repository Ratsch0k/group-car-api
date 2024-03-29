/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {MembershipNotFoundError} from '../../errors';
import sinon, {assert, match} from 'sinon';
import {User, Membership, MembershipRepository} from '../../models';

describe('MembershipRepository', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('throws MembershipNotFoundError if ' +
    'membership doesn\'t exist', async function() {
      const id = {
        userId: 3,
        groupId: 71,
      };

      const membershipFindOneStub = sinon.stub(Membership, 'findOne')
          .resolves(null as any);

      await expect(MembershipRepository.findById(id))
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
          id,
          {
            transaction: fakeTransaction,
          } as any,
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

  describe('findAllForGroup', function() {
    it('returns list of members for specified group', async function() {
      const groupId = 12;

      const members = [
        {
          groupId,
          User: {
            id: 1,
            username: 'USER-1',
          },
          isAdmin: false,
        },
        {
          groupId,
          User: {
            id: 2,
            username: 'USER-2',
          },
          isAdmin: true,
        },
      ];

      const findAllStub = sinon.stub(Membership, 'findAll')
          .resolves(members as any);

      const actual = await MembershipRepository.findAllForGroup(
          groupId,
          {
            withUserData: true,
          },
      );

      expect(actual).to.have.members(members);

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

  describe('changeAdminPermission', function() {
    it('updates isAdmin field correctly', async function() {
      const membership: any = {
        update: sinon.stub().resolves(),
      };

      const findByIdStub = sinon.stub(Membership, 'findOne')
          .resolves(membership);

      const id = {
        userId: 6,
        groupId: 9,
      };

      const options: any = {
        transaction: {},
      };

      await expect(MembershipRepository
          .changeAdminPermission(id, true, options))
          .to.be.eventually.fulfilled;

      assert.calledOnceWithExactly(findByIdStub, match({
        where: {
          ...id,
        },
        transaction: options.transaction,
      }));

      assert.calledOnceWithExactly(membership.update,
          match({isAdmin: true}), options);
    });

    it('throws MembershipNotFoundError if membership ' +
    'doesn\'t exist', async function() {
      const findByIdStub = sinon.stub(Membership, 'findOne')
          .resolves(null as any);

      const id = {
        userId: 6,
        groupId: 9,
      };

      const options: any = {
        transaction: {},
      };

      await expect(MembershipRepository
          .changeAdminPermission(id, true, options))
          .to.be.eventually.rejectedWith(MembershipNotFoundError);

      assert.calledOnceWithExactly(findByIdStub, match({
        where: {
          ...id,
        },
        transaction: options.transaction,
      }));
    });
  });

  describe('findAllForUser', function() {
    let membershipStub: sinon.SinonStub<any, any>;

    beforeEach(function() {
      membershipStub = sinon.stub(Membership, 'findAll');
    });

    it('throws TypeError if specified userId is not ' +
    'a number', async function() {
      const userId = 'test';

      await expect(MembershipRepository.findAllForUser(userId as any))
          .to.be.eventually.rejectedWith(TypeError);

      assert.notCalled(membershipStub);
    });

    it('returns list of membership for the specified user', async function() {
      const userId = 3;

      const memberships = [
        {
          userId,
          groupId: 1,
          isAdmin: true,
        },
        {
          userId,
          groupId: 2,
          isAdmin: false,
        },
      ];

      membershipStub.resolves(memberships as any);

      const options = {
        transaction: {},
      };

      const response = await expect(MembershipRepository.findAllForUser(
        userId as any,
         options as any,
      )).to.be.eventually.fulfilled;

      expect(response).to.be.equal(memberships);

      assert.calledOnceWithExactly(membershipStub, match({
        where: {
          userId,
        },
        ...options,
      }));
    });
  });

  describe('exists', function() {
    let findMembershipStub: sinon.SinonStub;

    beforeEach(function() {
      findMembershipStub = sinon.stub(Membership, 'findOne');
    });

    it('returns false if no membership exists', async function() {
      findMembershipStub.resolves(null);
      const groupId = 66;
      const userId = 98;
      const options = {
        transaction: {},
      };

      await expect(MembershipRepository.exists(
          {groupId, userId}, options as any))
          .to.eventually.be.false;

      assert.calledOnceWithExactly(
          findMembershipStub,
          match({where: {groupId, userId}, transaction: options.transaction}),
      );
    });

    it('returns true if a membership exists', async function() {
      const groupId = 66;
      const userId = 98;

      const fakeMembership = {
        groupId,
        userId,
        isAdmin: false,
      };

      findMembershipStub.resolves(fakeMembership);

      const options = {
        transaction: {},
      };

      await expect(MembershipRepository.exists(
          {groupId, userId}, options as any))
          .to.eventually.be.true;

      assert.calledOnceWithExactly(
          findMembershipStub,
          match({where: {groupId, userId}, transaction: options.transaction}),
      );
    });
  });
});
