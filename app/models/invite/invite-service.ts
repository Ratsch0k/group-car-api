import {InviteId, Invite} from '@models';
import {InviteRepository} from './invite-repository';
import db from '@db';
import {MembershipRepository} from '../membership/membership-repository';
import {UnauthorizedError} from '@errors';
import debug from 'debug';
import {
  CouldNotAssignToGroupError,
} from '@app/errors/user/could-not-assign-to-group-error';

/**
 * Service for invites.
 */
export class InviteService {
  /**
   * Logging method for errors.
   */
  private static logE = debug('group-car:invite:service:error');

  /**
   * Assigns the given user to the group with the given groupId.
   *
   * Assigns the user only if the user has an invite for the group.
   * @param currentUser - The user to assign to a group.
   *                      Should be the currently logged in user
   * @param groupId     - The id of the group the user should be assigned to
   */
  public static async assignUserToGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<void> {
    const inviteId = {
      userId: currentUser.id,
      groupId,
    };

    // Check if the user has an invite for the group, throws if it doesn't exist
    await InviteRepository.findById(inviteId);

    /*
     * Delete invitation and create membership.
     * To avoid that only one of those is executed (other one throws)
     * do it in a transaction.
     */
    const transaction = await db.transaction();

    // Delete invitation

    try {
      await InviteRepository.deleteById(inviteId, {transaction});

      await MembershipRepository.create(
          currentUser,
          groupId,
          false,
          {transaction},
      );
    } catch (error) {
      this.logE(`Could not assign user ${currentUser.id} ` +
        `to group ${groupId}`, error);
      await transaction.rollback();
      throw new CouldNotAssignToGroupError(inviteId.userId, inviteId.groupId);
    }
    await transaction.commit();
  }

  /**
   * Searches for an invite with the given id.
   *
   * If the current user is not the owner of that invite it
   * throws an {@link UnauthorizedError}.
   * @param currentUser - The currently logged in user
   * @param id          - The id for which to search
   */
  public static async findById(
      currentUser: Express.User,
      id: InviteId,
  ): Promise<Invite> {
    // Get memberships of user
    const membership = await MembershipRepository.findById(
        currentUser,
        {
          userId: currentUser.id,
          groupId: id.groupId,
        },
    );
    if (
    // Current user is not user of invite
      currentUser.id !== id.userId &&
          // Current user has no membership with group
          membership === null) {
      throw new UnauthorizedError('Not authorized to request this invite');
    }

    return InviteRepository.findById(id);
  }

  /**
   * Gets a list of all invites for the given user.
   *
   * This method will only return the list if the current user
   * has the same id as the given userId.
   * @param currentUser - The currently logged in user.
   * @param userId      - The id of the user of whom the
   *                      list of invites should be returned
   */
  public static async findAllForUser(
      currentUser: Express.User,
      userId: number,
  ): Promise<Invite[]> {
    if (currentUser.id !== userId) {
      throw new UnauthorizedError();
    }

    return InviteRepository.findAllForUser(
        userId,
        {
          withGroupData: true,
          withInvitedByData: true,
        },
    );
  }
}