import {
  Group,
  GroupRepository,
  MembershipRepository,
  InviteService,
} from '@models';
import {UnauthorizedError} from '@app/errors';

/**
 * Service for complex group operations.
 */
export class GroupService {
  /**
   * Returns the group with the specified id only if the specified
   * current user is either a member of the group or has an invite
   * for it.
   * @param currentUser - The currently logged in user
   * @param id          - The id to search for
   */
  public static async findById(
      currentUser: Express.User,
      id: number,
  ): Promise<Group> {
    const modelId = {
      userId: currentUser.id,
      groupId: id,
    };
    // First, check if user is member (gets more information)
    try {
      await MembershipRepository.findById(currentUser, modelId);
      return GroupRepository.findById(id);
    } catch (_) {}

    // Second, check if the user has invite (only checked if not a user)
    try {
      await InviteService.findById(
          currentUser,
          modelId,
      );
      return GroupRepository.findById(id, {simple: true});
    } catch (_) {}

    // If neither is the case, user is not authorized
    throw new UnauthorizedError();
  }
}
