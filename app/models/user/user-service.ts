import {
  GroupService,
  MembershipRepository, ProfilePic,
  User,
  UserRepository,
} from '@models';
import {
  OwnerCannotLeaveError,
  IncorrectPasswordError,
  NewPasswordMustBeDifferentError,
  ProfilePictureNotFoundError,
  UserNotFoundError,
} from '@errors';
import config from '@app/config';
import debug from 'debug';
import bcrypt from 'bcrypt';
import bindToLog, {bindUser} from '@util/user-bound-logging';
import generateProfilePic from '@util/generate-profile-pic';

const log = debug('group-car:user:service');
const error = debug('group-car:user:service');


/**
 * Service for complex user actions.
 */
export const UserService = {
  /**
   * Removes the user from the specified group.
   * @param currentUser - The currently logged-in user
   * @param groupId     - The group which the user wants to leave
   * @returns The amount of memberships which got destroyed.
   *  Should be either 0 (user was not a member) or 1.
   */
  async leaveGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<number> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Requests to leave group %d', groupId);

    userLog('Check if owner of group %d', groupId);
    const group = await GroupService.findById(currentUser, groupId);

    if (group.Owner?.id !== currentUser.id) {
      userLog('Not owner, leaving group');
      return MembershipRepository.removeUserFromGroup(currentUser.id, groupId);
    } else {
      userError('Is owner of group %d, owners cannot leave the group', groupId);
      throw new OwnerCannotLeaveError();
    }
  },

  /**
   * Finds a limited amount of users whose usernames start
   * with the specified startsWith parameter.
   * @param currentUser - The currently logged-in user
   * @param startsWith  - With what the username should start with
   * @param limit       - The limit of how many users should be returned
   */
  async findLimitedWithFilter(
      currentUser: Express.User,
      startsWith: string,
      limit?: number,
  ): Promise<User[]> {
    const userLog = bindUser(log, currentUser.id);

    userLog('Request limited filter search for users');

    if (typeof startsWith !== 'string') {
      throw new TypeError('startsWith parameter has to be a string');
    }

    if (typeof limit !== 'number' && typeof limit !== 'undefined') {
      throw new TypeError('limit parameter has to be a number');
    }

    // Assign max value if specified parameter is bigger.
    limit = Math.min(
        limit || config.user.maxLimitQuery,
        config.user.maxLimitQuery,
    );

    // Limit length of startsWith parameter to max length of a username
    startsWith = startsWith.substring(0, config.user.maxUsernameLength);

    userLog('Find users starting with %s and limited to %d', startsWith, limit);

    return UserRepository.findLimitedWithFilter(
        startsWith, limit,
    );
  },

  /**
   * Checks if the given passwords matches the encrypted password.
   * @param encryptedPassword - The encrypted password (hash + salt)
   * @param password - The password to check
   */
  async checkPassword(
      encryptedPassword: string,
      password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, encryptedPassword);
  },

  /**
   * Changes the password of the currently logged-in user.
   *
   * Only changes the password based on two conditions:
   *  - oldPassword != newPassword
   *  - oldPassword matches password of user
   * @param currentUser - The currently logged-in user
   * @param oldPassword - Current password of the user
   * @param newPassword - New password
   *
   * @throws {@link NewPasswordMustBeDifferentError}
   * If `oldPassword` is equal to `newPassword`
   * @throws {@link IncorrectPasswordError}
   * If `oldPassword` does not match the users password
   */
  async changePassword(
      currentUser: Express.User,
      oldPassword: string,
      newPassword: string,
  ): Promise<void> {
    const userLog = bindToLog(log, {args: [currentUser.id]});
    const userError = bindToLog(error, {args: [currentUser.id]});
    userLog('Change password');

    userLog('Check if new and old passwords are different');
    if (oldPassword === newPassword) {
      throw new NewPasswordMustBeDifferentError();
    }

    // Check if oldPassword matches the password of the user
    userLog('Verify if old password correct');

    const user = await UserRepository.findById(currentUser.id);

    if (await this.checkPassword(user.password, oldPassword)) {
      userLog('Old password verified, changing password');
      try {
        await user.update({
          password: newPassword,
        });
      } catch (e) {
        userError('An error occurred while changing the password: %s', e);
        throw e;
      }
      userLog('Password successfully changed');
    } else {
      userError('Old password was incorrect');
      throw new IncorrectPasswordError();
    }
  },

  /**
   * Randomly generates the profile picture for a given username and offset.
   * @param ip - The ip which wants to generate it.
   *
   * As a seed for the randomness the username and the offset is used.
   * @param username - The username
   * @param offset - Offset for the randomness
   */
  async generateProfilePicture(
      ip: string,
      username: string,
      offset: number,
  ): Promise<Buffer> {
    const userLog = bindToLog(log, {args: [ip]});
    const userError = bindToLog(error, {args: [ip]});

    userLog('Generate profile picture for %s with offset %d', username, offset);

    let pb: Buffer;
    try {
      pb = await generateProfilePic(
          config.user.pb.dimensions,
          username,
          offset,
      );
    } catch (e) {
      userError('Error while generating profile picture');
      throw e;
    }

    return pb;
  },

  /**
   * Get the profile picture of a user.
   * @param currentUser - Logged-in user
   * @param userId - ID of the user of which to get the profile picture
   *
   * @throws {@link UserNotFoundError}
   * If the user doesn't exist
   */
  async getProfilePicture(
      currentUser: Express.User,
      userId: number,
  ): Promise<ProfilePic> {
    const userLog = bindToLog(log, {args: [currentUser.id]});

    userLog('Get profile picture of user %d', userId);

    let pb: ProfilePic;
    try {
      pb = await UserRepository.findProfilePictureById(userId);
    } catch (e) {
      if (e instanceof ProfilePictureNotFoundError) {
        throw new UserNotFoundError(userId);
      }
      throw e;
    }

    return pb;
  },
};

export default UserService;
