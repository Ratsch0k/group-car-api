/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import {GroupRepository} from '../../models';
import Group from './group';
import sinon, {assert, match} from 'sinon';
import {GroupNotFoundError} from '../../errors';
import {MembershipRepository} from '../membership';

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
          .stub(MembershipRepository, 'findUsersOfGroup')
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
      assert.calledOnceWithExactly(findUserOfGroupStub, group.id);
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
          .stub(MembershipRepository, 'findUsersOfGroup')
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
});
