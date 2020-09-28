/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {GroupRepository, User} from '../../models';
import Group from './group';
import sinon, {assert, match} from 'sinon';
import {GroupNotFoundError} from '../../errors';
import {MembershipRepository} from '../membership';
import {Op} from 'sequelize';

describe('GroupRepository', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('findById', function() {
    it('throws TypeError if specified id is not a number', function() {
      return expect(GroupRepository.findById('test' as any)).to
          .eventually.be.rejectedWith(TypeError);
    });

    it('throws GroupNotFoundError if group with id ' +
    'doesn\'t exist', async function() {
      const groupFindByPkStub = sinon.stub(Group, 'findByPk')
          .resolves(null as any);

      await expect(GroupRepository.findById(5)).to.eventually.
          be.rejectedWith(GroupNotFoundError);

      assert.calledOnceWithExactly(groupFindByPkStub as any, 5, match.any);
    });

    it('includes members if withMembers set in options', async function() {
      const group: any = {
        id: 5,
        get: sinon.stub().returnsThis(),
      };
      const groupFindByPkStub = sinon.stub(Group, 'findByPk')
          .resolves(group as any);

      const members = [{
        id: 6,
      }];

      const findUserOfGroupStub = sinon
          .stub(MembershipRepository, 'findAllForGroup')
          .resolves(members as any);

      const groupResponse = await expect(
          GroupRepository.findById(group.id, {withMembers: true}))
          .to.eventually.be.fulfilled;

      expect(groupResponse).to.haveOwnProperty('members');
      expect(groupResponse.members).to.eql(members);

      assert.calledOnceWithExactly(
        groupFindByPkStub as any,
        5,
        match.any,
      );
      assert.calledOnceWithExactly(
          findUserOfGroupStub,
          group.id,
          match({withUserData: true}),
      );
    });

    it('returns group', async function() {
      const group: any = {
        id: 5,
      };
      const groupFindByPkStub = sinon.stub(Group, 'findByPk')
          .resolves(group as any);

      const members = [{
        id: 6,
      }];

      const findUserOfGroupStub = sinon
          .stub(MembershipRepository, 'findAllForGroup')
          .resolves(members as any);

      const groupResponse = await expect(GroupRepository.findById(group.id))
          .to.eventually.be.fulfilled;

      expect(groupResponse).to.not.haveOwnProperty('members');

      assert.calledOnceWithExactly(
        groupFindByPkStub as any,
        5,
        match.any,
      );
      assert.notCalled(findUserOfGroupStub);
    });
  });

  describe('changeOwnership', function() {
    it('updates ownership and returns group and uses ' +
    'specified options', async function() {
      const group = {
        update: sinon.stub().resolvesThis(),
      };

      const options = {
        transaction: {},
      };

      const findByPkStub = sinon.stub(Group, 'findByPk').resolves(group as any);

      const groupId = 5;
      const newOwnerId = 7;

      await expect(GroupRepository.changeOwnership(
          groupId,
          newOwnerId,
          options as any,
      )).to.eventually.be.equal(group);

      assert.calledOnceWithExactly(findByPkStub, groupId, match.any);
      assert.calledOnceWithExactly(
          group.update,
          match({
            ownerId: newOwnerId,
          }),
          options,
      );
    });

    it('throws GroupNotFoundError if group doesn\'t exist', async function() {
      const findByPkStub = sinon.stub(Group, 'findByPk').resolves(null as any);

      const groupId = 5;
      const newOwnerId = 7;

      await expect(GroupRepository.changeOwnership(groupId, newOwnerId))
          .to.eventually.be.rejectedWith(GroupNotFoundError);

      assert.calledOnceWithExactly(findByPkStub, groupId, match.any);
    });
  });

  describe('findAllWithIds', function() {
    let groupFindAll: sinon.SinonStub<any, any>;

    beforeEach(function() {
      groupFindAll = sinon.stub(Group, 'findAll');
    });

    it('throws TypeError if any id of the specified ids ' +
    'list is not a number', async function() {
      const ids = [1, 2, 3, 4, 'test', 6, 7, 8];

      await expect(GroupRepository.findAllWithIds(ids as any))
          .to.be.eventually.rejectedWith(TypeError);

      assert.notCalled(groupFindAll);
    });

    it('returns the list of groups with the specified ids', async function() {
      const ids = [1, 2];

      const groups = [
        {
          id: 1,
          name: 'group_1',
        },
        {
          id: 2,
          name: 'group_2',
        },
      ];

      groupFindAll.resolves(groups as any);

      const options = {
        transaction: {},
      };

      await expect(GroupRepository.findAllWithIds(ids as any, options as any))
          .to.be.eventually.fulfilled;

      const expected = [{id: 1}, {id: 2}];

      assert.calledOnceWithExactly(
          groupFindAll,
          match({
            where: {
              [Op.or]: expected,
            },
            include: [{
              model: User,
              as: 'Owner',
              attributes: User.simpleAttributes,
            }],
            ...options,
          }),
      );
    });
  });
});
