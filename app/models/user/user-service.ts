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
   */
  public static async leaveGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<void> {
    const userId = getIdFromModelOrId(currentUser);

    if (userId === undefined) {
      throw new NotLoggedInError();
    }

    await MembershipRepository.removeUserFromGroup(currentUser.id, groupId);
  }
}
