/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai';
import sinon, {assert} from 'sinon';
import bcrypt from 'bcrypt';
import * as generateProfilePic from '../../util/generate-profile-pic';
import {
  OwnerCannotLeaveError,
  NewPasswordMustBeDifferentError,
  IncorrectPasswordError, ProfilePictureNotFoundError, UserNotFoundError,
} from '../../errors';
import {UserRepository} from './user-repository';
import config from '../../config';
import {MembershipRepository} from '../membership';
import {UserService} from './user-service';
import {GroupService} from '../group';


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

  describe('checkPassword', function() {
    let bcryptCompare: sinon.SinonStub;

    beforeEach(function() {
      bcryptCompare = sinon.stub(bcrypt, 'compare')
          .callsFake((str1, str2) => Promise.resolve(str1 == str2));
    });

    it('returns true if both arguments match', async function() {
      const encryptedPassword = 'PASSWORD';
      const password = encryptedPassword;

      const value = await UserService.checkPassword(
          encryptedPassword, password);

      expect(value).to.be.true;
      assert.calledOnceWithExactly(bcryptCompare, password, encryptedPassword);
    });

    it('returns false if both arguments don\'t match', async function() {
      const encryptedPassword = 'PASSWORD';
      const password = 'FALSE_PASSWORD';

      const value = await UserService.checkPassword(
          encryptedPassword, password);

      expect(value).to.be.false;
      assert.calledOnceWithExactly(bcryptCompare, password, encryptedPassword);
    });
  });

  describe('changePassword', function() {
    let findUserById: sinon.SinonStub;
    let bcryptCompare: sinon.SinonStub;

    beforeEach(function() {
      findUserById = sinon.stub(UserRepository, 'findById');
      bcryptCompare = sinon.stub(bcrypt, 'compare')
          .callsFake((str1, str2) => Promise.resolve(str1 == str2));
    });

    it('throws NewPasswordMustBeDifferent if new and old' +
      ' passwords are equal', async function() {
      await expect(
          UserService.changePassword(
            {id: 12} as Express.User,
            'PASSWORD',
            'PASSWORD',
          ),
      ).to.eventually.be.rejectedWith(NewPasswordMustBeDifferentError);

      assert.notCalled(findUserById);
      assert.notCalled(bcryptCompare);
    });

    it('throws IncorrectPasswordError if oldPassword doesn\'t match the ' +
      'password of the user', async function() {
      const password = 'CURRENT_PASSWORD';
      const user = {
        id: 12,
        password,
      };
      findUserById.resolves(user);

      const oldPassword = 'OLD_PASSWORD';
      const newPassword = 'NEW_PASSWORD';

      await expect(
          UserService.changePassword(
              {id: user.id} as Express.User,
              oldPassword,
              newPassword,
          ),
      ).to.eventually.be.rejectedWith(IncorrectPasswordError);

      assert.calledOnceWithExactly(findUserById, user.id);
      assert.calledOnceWithExactly(bcryptCompare, oldPassword, password);
    });

    it('updates password of user to new password if old password ' +
      'matches the user\'s password', async function() {
      const password = 'CURRENT_PASSWORD';
      const user = {
        id: 12,
        password,
        update: sinon.stub().resolves(),
      };
      findUserById.resolves(user);

      const oldPassword = password;
      const newPassword = 'NEW_PASSWORD';

      await expect(
          UserService.changePassword(
              {id: user.id} as Express.User,
              oldPassword,
              newPassword,
          ),
      ).to.eventually.be.fulfilled;

      assert.calledOnceWithExactly(findUserById, user.id);
      assert.calledOnceWithExactly(bcryptCompare, oldPassword, password);
      assert.calledOnceWithExactly(
          user.update,
          sinon.match({password: newPassword}),
      );
    });

    it('rethrows error when an error occurs while changing ' +
      'the password', async function() {
      const password = 'CURRENT_PASSWORD';
      const customError = new Error('CUSTOM ERROR');
      const user = {
        id: 12,
        password,
        update: sinon.stub().rejects(customError),
      };
      findUserById.resolves(user);

      const oldPassword = password;
      const newPassword = 'NEW_PASSWORD';

      await expect(
          UserService.changePassword(
          {id: user.id} as Express.User,
          oldPassword,
          newPassword,
          ),
      ).to.eventually.be.rejectedWith(customError);

      assert.calledOnceWithExactly(findUserById, user.id);
      assert.calledOnceWithExactly(bcryptCompare, oldPassword, password);
      assert.calledOnceWithExactly(
          user.update,
          sinon.match({password: newPassword}),
      );
    });
  });

  describe('generateProfilePicture', function() {
    let generateProfilePicStub: sinon.SinonStub;

    beforeEach(function() {
      generateProfilePicStub = sinon.stub(generateProfilePic, 'default');
    });

    it('uses generateProfilePic utility function to generate ' +
      'profile picture', async function() {
      const ip = 'TEST_IP';
      const username = 'TEST_USERNAME';
      const offset = 1;

      await UserService.generateProfilePicture(ip, username, offset);

      assert.calledOnceWithExactly(
          generateProfilePicStub,
          config.user.pb.dimensions,
          username,
          offset,
      );
    });
  });

  describe('getProfilePicture', function() {
    let findProfilePictureStub: sinon.SinonStub;

    beforeEach(function() {
      findProfilePictureStub = sinon.stub(
          UserRepository,
          'findProfilePictureById',
      );
    });

    it('calls UserRepository.findProfilePictureById with ' +
      'correct arguments', async function() {
      const fakePb = 'TEST_PROFILE_PICTURE';
      const userId = 51;
      const user = {id: 10};

      findProfilePictureStub.resolves(fakePb);

      const actual = await UserService.getProfilePicture(user as any, userId);

      expect(actual).to.eq(fakePb);

      assert.calledOnceWithExactly(findProfilePictureStub, userId);
    });

    it('throws UserNotFoundError if the ProfilePicture ' +
      'exists', async function() {
      const userId = 61;
      findProfilePictureStub.callsFake(() =>
        Promise.reject(new ProfilePictureNotFoundError(userId)));

      const user = {id: 11};

      await expect(UserService.getProfilePicture(user as any, userId))
          .to.eventually.be.rejectedWith(UserNotFoundError);

      assert.calledOnceWithExactly(findProfilePictureStub, userId);
    });

    it('rethrows any other error', async function() {
      const error = new Error('TEST_ERROR');
      const userId = 66;
      findProfilePictureStub.callsFake(() => Promise.reject(error));

      const user = {id: 12};

      await expect(UserService.getProfilePicture(user as any, userId))
          .to.eventually.be.rejectedWith(error);

      assert.calledOnceWithExactly(findProfilePictureStub, userId);
    });
  });
});
