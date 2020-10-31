import {
  InviteId,
  Invite,
  InviteRepository,
  MembershipRepository,
  MembershipService,
} from '@models';
import db from '@db';
import {
  MembershipNotFoundError,
  NotMemberOfGroupError,
  UnauthorizedError,
  CouldNotAssignToGroupError,
} from '@errors';
import debug from 'debug';


/**
 * Service for invites.
 */
export class InviteService {
  /**
   * Logging method for errors.
   */
  private static logE = debug('group-car:invite:service:error');

  /**
   * Method for logging.
   */
  private static log = debug('group-car:invite:service');

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
    let membership = null;
    try {
      membership = await MembershipService.findById(
          currentUser,
          {
            userId: currentUser.id,
            groupId: id.groupId,
          },
      );
    } catch (_) {}

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

  /**
   * Gets all invites of the specified group.
   *
   * If the specified user is not a member of the specified
   * group an `NotMemberOfGroupError` will be thrown.
   * @param currentUser - The user which request this
   * @param groupId     - The id of the group
   */
  public static async findAllForGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<Invite[]> {
    this.log('User %d: Find all invites for group %d', currentUser.id, groupId);

    // Check if current user is a member of the group
    try {
      await MembershipService.findById(
          currentUser, {
            userId: currentUser.id,
            groupId,
          },
      );
      this.log('User %d: is member of group %d', currentUser.id, groupId);
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        this.log(
            'User %d: is not a member of group %d',
            currentUser.id,
            groupId,
        );
        throw new NotMemberOfGroupError();
      } else {
        throw e;
      }
    }

    return InviteRepository.findAllForGroup(
        groupId,
        {
          withInvitedByData: true,
          withUserData: true,
        },
    );
  }
}
