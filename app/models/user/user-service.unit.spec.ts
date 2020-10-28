/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert} from 'sinon';
import {UserService, MembershipRepository, GroupService} from '../index';
import {OwnerCannotLeaveError, NotLoggedInError} from '../../errors';
import {UserRepository} from './user-repository';
import config from '../../config';

describe('UserService', function() {
  afterEach(function() {
    sinon.restore();
  });

  describe('leaveGroup', function() {
    it('calls and returns result of ' +
    'MembershipRepository.removeUserFromGroup', async function() {
      const currentUser: any = {
        id: 4,
      };

      const groupId = 15;

      const removeStub = sinon.stub(MembershipRepository, 'removeUserFromGroup')
          .resolves(groupId as any);

      const group = {
        Owner: {
          id: 56,
        },
      };
      const findByIdStub = sinon.stub(GroupService, 'findById')
          .resolves(group as any);

      await expect(UserService.leaveGroup(currentUser, groupId))
          .to.eventually.eql(groupId);

      sinon.assert.calledOnceWithExactly(removeStub, currentUser.id, groupId);
      sinon.assert.calledOnceWithExactly(findByIdStub, currentUser, groupId);
    });

    it('throws OwnerCannotLeaveError if current user ' +
    'is owner of group', async function() {
      const currentUser: any = {
        id: 4,
      };

      const groupId = 15;

      const removeStub = sinon.stub(MembershipRepository, 'removeUserFromGroup')
          .resolves(groupId as any);

      const group = {
        Owner: {
          id: currentUser.id,
        },
      };
      const findByIdStub = sinon.stub(GroupService, 'findById')
          .resolves(group as any);

      await expect(UserService.leaveGroup(currentUser, groupId))
          .to.eventually.be.rejectedWith(OwnerCannotLeaveError);

      sinon.assert.notCalled(removeStub);
      sinon.assert.calledOnceWithExactly(findByIdStub, currentUser, groupId);
    });
  });

  describe('findLimitedWithFilter', function() {
    let currentUser: any;
    let startsWith: any;
    let limit: any;

    let userRepFindLimitedWithFilterStub: sinon.SinonStub<any, any>;

    beforeEach(function() {
      userRepFindLimitedWithFilterStub =
          sinon.stub(UserRepository, 'findLimitedWithFilter');
    });

    describe('throws NotLoggedInError if', function() {
      it('currentUser is not an object', async function() {
        currentUser = 'test';
        startsWith = 'test';
        limit = 10;

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.rejectedWith(NotLoggedInError);

        assert.notCalled(userRepFindLimitedWithFilterStub);
      });

      it('currentUser.id is not an number', async function() {
        currentUser = {id: 'test'};
        startsWith = 'test';
        limit = 10;

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.rejectedWith(NotLoggedInError);

        assert.notCalled(userRepFindLimitedWithFilterStub);
      });
    });

    describe('throws TypeError if', function() {
      it('startsWith is not a string', async function() {
        currentUser = {id: 55};
        startsWith = 99;
        limit = 10;

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.rejectedWith(TypeError);

        assert.notCalled(userRepFindLimitedWithFilterStub);
      });

      it('limit is neither undefined nor a number', async function() {
        currentUser = {id: 55};
        startsWith = 'test';
        limit = 'test';

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.rejectedWith(TypeError);

        assert.notCalled(userRepFindLimitedWithFilterStub);
      });
    });

    describe('calls repository method', function() {
      it('with correct parameters', async function() {
        currentUser = {id: 55};
        startsWith = 'test';
        limit = config.user.maxLimitQuery - 1;

        const users = [
          {
            id: 1,
            username: 'test1',
          },
          {
            id: 2,
            username: 'test2',
          },
        ];

        userRepFindLimitedWithFilterStub.resolves(users as any);

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.fulfilled;

        assert.calledOnceWithExactly(
            userRepFindLimitedWithFilterStub,
            startsWith,
            limit,
        );
      });

      it('with limit only being at large as defined ' +
      'max limit query', async function() {
        currentUser = {id: 55};
        startsWith = 'test';
        limit = config.user.maxLimitQuery + 2;

        const users = [
          {
            id: 1,
            username: 'test1',
          },
          {
            id: 2,
            username: 'test2',
          },
        ];

        userRepFindLimitedWithFilterStub.resolves(users as any);

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.fulfilled;

        assert.calledOnceWithExactly(
            userRepFindLimitedWithFilterStub,
            startsWith,
            config.user.maxLimitQuery,
        );
      });

      it('with startsWith only at large as username length', async function() {
        currentUser = {id: 55};
        startsWith = 'a'.repeat(config.user.maxUsernameLength + 10);
        limit = config.user.maxLimitQuery - 1;

        const users = [
          {
            id: 1,
            username: 'test1',
          },
          {
            id: 2,
            username: 'test2',
          },
        ];

        userRepFindLimitedWithFilterStub.resolves(users as any);

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
            limit,
        ))
            .to.be.eventually.fulfilled;

        assert.calledOnceWithExactly(
            userRepFindLimitedWithFilterStub,
            'a'.repeat(config.user.maxUsernameLength),
            limit,
        );
      });

      it('with limit being assigned maximal query length ' +
      'if not defined', async function() {
        currentUser = {id: 55};
        startsWith = 'test';

        const users = [
          {
            id: 1,
            username: 'test1',
          },
          {
            id: 2,
            username: 'test2',
          },
        ];

        userRepFindLimitedWithFilterStub.resolves(users as any);

        await expect(UserService.findLimitedWithFilter(
            currentUser,
            startsWith,
        ))
            .to.be.eventually.fulfilled;

        assert.calledOnceWithExactly(
            userRepFindLimitedWithFilterStub,
            startsWith,
            config.user.maxLimitQuery,
        );
      });
    });
  });
});
