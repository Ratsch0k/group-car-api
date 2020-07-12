import Group from './group';
import {GroupRepository} from './group-repository';
import {InviteService} from '../invite';
import {MembershipRepository} from '../membership';
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
    // Check if user has permission to access group
    let hasInvite = false;
    let isMember = false;
    try {
      await InviteService.findById(
          currentUser,
          modelId,
      );
      hasInvite = true;
    } catch (_) {}


    try {
      await MembershipRepository.findById(currentUser, modelId);
      isMember = true;
    } catch (_) {}

    if (hasInvite || isMember) {
      return GroupRepository.findById(id);
    } else {
      throw new UnauthorizedError();
    }
  }
}
