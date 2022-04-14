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

  describe('create', function() {
    let groupCreateStub: sinon.SinonStub;

    beforeEach(function() {
      groupCreateStub = sinon.stub(Group, 'create');
    });

    it('calls Group.create with correct arguments', async function() {
      const userId = 55;

      const args = {
        name: 'TEST_GROUP',
        description: 'TEST_DESCRIPTION',
        ownerId: userId,
      };

      const fakeGroup = {
        name: args.name,
        description: args.description,
        ownerId: userId,
      };

      groupCreateStub.resolves(fakeGroup);

      const options = {transaction: 'T'};

      const actual = await GroupRepository.create(args, options as any);

      expect(actual).to.eql(fakeGroup);
      assert.calledOnceWithExactly(
          groupCreateStub,
          match(args),
          match(options),
      );
    });
  });

  describe('update', function() {
    let updateStub: sinon.SinonStub;

    beforeEach(function() {
      updateStub = sinon.stub(Group, 'update');
    });

    it('calls Group.update with the correct arguments', async function() {
      const groupId = 61;
      const values = {
        description: 'NEW_DESC',
        name: 'NEW_NAME',
      };
      const options = {
        transaction: 8,
      };
      const group = {
        name: values.name,
        description: values.description,
        id: groupId,
      };
      updateStub.resolves([1, [group]]);

      await expect(GroupRepository.update(groupId, values, options as any))
          .to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(
          updateStub,
          values,
          match({
            where: {id: groupId},
            limit: 1,
            transaction: options.transaction,
            returning: true,
          }),
      );
    });

    it('only updates description and name and no ' +
      'other field', async function() {
      const groupId = 61;
      const values = {
        description: 'NEW_DESC',
        name: 'NEW_NAME',
        ownerId: 45,
        other: 'MALICIOUS_FIELD',
      };
      const options = {
        transaction: 8,
      };
      const group = {
        name: values.name,
        description: values.description,
        id: groupId,
      };
      updateStub.resolves([1, [group]]);

      await expect(GroupRepository.update(groupId, values, options as any))
          .to.eventually.eql(group);

      assert.calledOnceWithExactly(
          updateStub,
          {
            description: values.description,
            name: values.name,
          },
          match({
            where: {id: groupId},
            limit: 1,
            transaction: options.transaction,
            returning: true,
          }),
      );
    });

    it('throws GroupNotFoundError if the specified group ' +
      'doesn\'t exist', async function() {
      const groupId = 61;
      const values = {
        description: 'NEW_DESC',
        name: 'NEW_NAME',
      };
      const options = {
        transaction: 8,
      };
      updateStub.resolves([0]);

      await expect(GroupRepository.update(groupId, values, options as any))
          .to.eventually.be.rejectedWith(GroupNotFoundError);

      assert.calledOnceWithExactly(
          updateStub,
          values,
          match({
            where: {id: groupId},
            limit: 1,
            transaction: options.transaction,
            returning: true,
          }),
      );
    });
  });
});
