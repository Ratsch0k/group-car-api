import {
  Group,
  GroupRepository,
  MembershipRepository,
  InviteService,
} from '@models';
import {
  UnauthorizedError,
  MembershipNotFoundError,
  CannotChangeOwnerMembershipError,
} from '@app/errors';

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
      return GroupRepository.findById(id, {
        withMembers: true,
        withOwnerData: true,
      });
    } catch (_) {}

    // Second, check if the user has invite (only checked if not a user)
    try {
      await InviteService.findById(
          currentUser,
          modelId,
      );
      return GroupRepository.findById(id, {simple: true, withOwnerData: true});
    } catch (_) {}

    // If neither is the case, user is not authorized
    throw new UnauthorizedError();
  }

  /**
   * Assigns the specified user admin permissions for the specified group.
   *
   * If the user, which requests this, is not an admin of this group,
   * the group doesn't exist, the user doesn't exist or the specified user
   * is the owner of the group, this method will throw an UnauthorizedError.
   * @param currentUser - The currently logged in user
   * @param groupId     - The group for which the user should be an admin
   * @param userId      - The user which should be assigned admin
   * @param isAdmin     - Whether or not the user should be granted or
   *                      revoked admin permissions
   */
  public static async changeAdminPermissionOfUser(
      currentUser: Express.User,
      groupId: number,
      userId: number,
      isAdmin: boolean,
  ): Promise<void> {
    // Check if current user is an admin of the group
    let currentMembership;
    try {
      currentMembership = await MembershipRepository.findById(
          currentUser, {
            userId: currentUser.id,
            groupId,
          },
      );
    } catch (err) {
      if (err instanceof MembershipNotFoundError) {
        throw new UnauthorizedError();
      } else {
        throw err;
      }
    }

    if (!currentMembership.isAdmin) {
      throw new UnauthorizedError();
    }

    // Check if user is owner of group
    const group = await GroupService.findById(currentUser, groupId);

    if (group.ownerId === userId) {
      throw new CannotChangeOwnerMembershipError();
    }

    // Get membership of user
    const membership = await MembershipRepository.findById(
        currentUser, {
          userId,
          groupId,
        },
    );

    // Update membership to admin
    await membership.update({isAdmin});
  }
}
