import {GroupService, MembershipRepository, User} from '@models';
import {OwnerCannotLeaveError, NotLoggedInError} from '@errors';
import {UserRepository} from './user-repository';
import config from '@app/config';
import debug from 'debug';

const log = debug('group-car:user:service');

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
        limit || config.user.maxUsernameLength,
        config.user.maxLimitQuery,
    );

    // Limit length of startsWith parameter to max length of a username
    startsWith = startsWith.substring(0, config.user.maxUsernameLength);

    return UserRepository.findLimitedWithFilter(
        startsWith, limit,
    );
  }
}
