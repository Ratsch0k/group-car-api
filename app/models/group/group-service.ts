import {
  Group,
  GroupRepository,
  InviteService,
} from '@models';
import {
  UnauthorizedError,
  NotOwnerOfGroupError,
  MembershipNotFoundError,
  UserNotAdminOfGroupError,
  UserNotMemberOfGroupError,
} from '@app/errors';
import {MembershipService} from '../membership/membership-service';
import debug from 'debug';

const log = debug('group-car:group:service');
const error = debug('group-car:group:service:error');

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
    log(`Find group with id ${id} for user ${currentUser.id}`);
    // First, check if user is member (gets more information)
    try {
      await MembershipService.findById(currentUser, modelId);
      log(`User ${currentUser.id} is member of group ${id}`);
      return GroupRepository.findById(id, {
        withMembers: true,
        withOwnerData: true,
      });
    } catch (_) {
      log(`User ${currentUser.id} is not member of group ` +
      `${id}. Check for invite`);
    }

    // Second, check if the user has invite (only checked if not a user)
    try {
      await InviteService.findById(
          currentUser,
          modelId,
      );
      log(`User ${currentUser.id} has invite for group ${id}`);
      return GroupRepository.findById(id, {simple: true, withOwnerData: true});
    } catch (_) {
      log(`User ${currentUser.id} has no invite for group ${id}`);
    }

    error(`User ${currentUser.id} is not authorized to access group ${id}`);

    // If neither is the case, user is not authorized
    throw new UnauthorizedError();
  }

  /**
   * Transfers the ownership of a group to another user.
   *
   * Returns the updated group.
   * Throws UnauthorizedError if the current user is not a member or
   * the owner of the specified group.
   * Throws {@link CannotTransferOwnershipToNotAdminError} if the
   * specified user is not an admin of the specified group.
   * @param currentUser - The currently logged in user
   * @param groupId     - The group of which the owner should used
   * @param toId        - The user to which the ownership should be transferred
   */
  public static async transferOwnership(
      currentUser: Express.User,
      groupId: number,
      toId: number,
  ): Promise<Group> {
    log(
        'User %d: transfer ownership of group %d to user %d',
        currentUser.id,
        groupId,
        toId,
    );

    // Check if current user is owner of group
    const group = await this.findById(currentUser, groupId);

    if (group.Owner?.id != currentUser.id) {
      error(
          'User %d: Can\'t transfer ownership as user is not owner of group %d',
          currentUser.id,
          groupId,
      );
      throw new NotOwnerOfGroupError();
    }

    // Check if user to which the ownership should be transferred is an admin
    let membership;
    try {
      membership = await MembershipService.findById(
          currentUser,
          {
            userId: toId,
            groupId,
          },
      );
    } catch (_error) {
      error(
          'User %d: tries to transfer ownership to a user ' +
          'who is not a member of the group',
          currentUser.id,
          groupId,
      );
      if (_error instanceof MembershipNotFoundError) {
        throw new UserNotMemberOfGroupError(toId);
      } else {
        throw _error;
      }
    }


    if (!membership.isAdmin) {
      error(
          'User %d: Can\'t transfer ownership to ' +
          'user %d, not admin of group %d',
          currentUser.id,
          toId,
          groupId,
      );
      throw new UserNotAdminOfGroupError(toId);
    }

    // Transfer ownership
    await GroupRepository.changeOwnership(groupId, toId);
    log(
        'User %d: Successfully changed owner of group %d to user %d',
        currentUser.id,
        groupId,
        toId,
    );

    return this.findById(currentUser, groupId);
  }
}
