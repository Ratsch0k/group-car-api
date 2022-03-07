import {
  GroupService,
  MembershipRepository,
  User,
  UserRepository,
} from '@models';
import {
  OwnerCannotLeaveError,
  NotLoggedInError,
  IncorrectPasswordError, NewPasswordMustBeDifferentError,
} from '@errors';
import config from '@app/config';
import debug from 'debug';
import bcrypt from 'bcrypt';
import bindToLog from '@util/user-bound-logging';

const log = debug('group-car:user:service');
const error = debug('group-car:user:service');

/**
 * Service for complex user actions.
 */
export class UserService {
  /**
   * Removes the user from the specified group.
   * @param currentUser - The currently logged in user
   * @param groupId     - The group which the user wants to leave
   * @returns The amount of memberships which got destroyed.
   *  Should be either 0 (user was not a member) or 1.
   */
  public static async leaveGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<number> {
    const group = await GroupService.findById(currentUser, groupId);

    if (group.Owner?.id !== currentUser.id) {
      return MembershipRepository.removeUserFromGroup(currentUser.id, groupId);
    } else {
      throw new OwnerCannotLeaveError();
    }
  }

  /**
   * Finds a limited amount of users who's usernames start
   * with the specified startsWith parameter.
   * @param currentUser - The currently logged in user
   * @param startsWith  - With what the username should start with
   * @param limit       - The limit of how many users should be returned
   */
  public static async findLimitedWithFilter(
      currentUser: Express.User,
      startsWith: string,
      limit?: number,
  ): Promise<User[]> {
    if (typeof currentUser !== 'object' || typeof currentUser.id !== 'number') {
      throw new NotLoggedInError();
    }

    log('User %d: find filtered users');

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

    return UserRepository.findLimitedWithFilter(
        startsWith, limit,
    );
  }

  public static async checkPassword(
      encryptedPassword: string,
      password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, encryptedPassword);
  }

  /**
   *
   * @param currentUser
   * @param oldPassword
   * @param newPassword
   */
  public static async changePassword(
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
      }
      userLog('Password successfully changed');
    } else {
      userError('Old password was incorrect');
      throw new IncorrectPasswordError();
    }
  }
}
