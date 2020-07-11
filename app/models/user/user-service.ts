import {getIdFromModelOrId} from '@app/util/get-id-from-user';
import {NotLoggedInError} from '@app/errors';
import {MembershipRepository} from '../membership';

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
    const userId = getIdFromModelOrId(currentUser);

    if (userId === undefined) {
      throw new NotLoggedInError();
    }

    return MembershipRepository.removeUserFromGroup(currentUser.id, groupId);
  }
}
