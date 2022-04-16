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
import {bindUser} from '@util/user-bound-logging';

/**
 * Logging method for errors.
 */
const error = debug('group-car:invite:service:error');

/**
 * Method for logging.
 */
const log = debug('group-car:invite:service');

/**
 * Service for invites.
 */
export const InviteService = {
  /**
   * Assigns the given user to the group with the given groupId.
   *
   * Assigns the user only if the user has an invite for the group.
   * @param currentUser - The user to assign to a group.
   *                      Should be the currently logged in user
   * @param groupId     - The id of the group the user should be assigned to
   */
  async assignUserToGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<void> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Request to use invite to join group %d', groupId);

    const inviteId = {
      userId: currentUser.id,
      groupId,
    };

    userLog('Check if the invite %o exists', inviteId);
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
      userLog('Delete invite %o', inviteId);
      await InviteRepository.deleteById(inviteId, {transaction});

      userLog('Create membership for group %d', groupId);
      await MembershipRepository.create(
          currentUser,
          groupId,
          false,
          {transaction},
      );
    } catch (e) {
      userError(`Could not assign user ` +
        `to group %d: %s`, groupId, e);
      await transaction.rollback();
      throw new CouldNotAssignToGroupError(inviteId.userId, inviteId.groupId);
    }
    await transaction.commit();
    userLog('Successfully joined group %d', groupId);
  },

  /**
   * Searches for an invite with the given id.
   *
   * @param currentUser - The currently logged-in user
   * @param id          - The id for which to search
   *
   * @throws {@link UnauthorizedError}
   * If `currentUser` is neither a member of the group nor
   * user mentioned in the invite
   */
  async findById(
      currentUser: Express.User,
      id: InviteId,
  ): Promise<Invite> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Request to find invite %o', id);
    // Get memberships of user
    let membership = null;
    try {
      userLog('Check if user is a member of group %d', id.groupId);
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
      userError('User is not the the invitee and not a member of the group');
      throw new UnauthorizedError('Not authorized to request this invite');
    }

    return InviteRepository.findById(id);
  },

  /**
   * Gets a list of all invites for the given user.
   *
   * This method will only return the list if the current user
   * has the same id as the given userId.
   * @param currentUser - The currently logged in user.
   * @param userId      - The id of the user of whom the
   *                      list of invites should be returned
   */
  async findAllForUser(
      currentUser: Express.User,
      userId: number,
  ): Promise<Invite[]> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Requests to find all invites of user %d', userId);

    if (currentUser.id !== userId) {
      userError('Is not the specified user %d', userId);
      throw new UnauthorizedError();
    }

    return InviteRepository.findAllForUser(
        userId,
        {
          withGroupData: true,
          withInvitedByData: true,
        },
    );
  },

  /**
   * Gets all invites of the specified group.
   *
   * If the specified user is not a member of the specified
   * group an `NotMemberOfGroupError` will be thrown.
   * @param currentUser - The user which request this
   * @param groupId     - The id of the group
   */
  async findAllForGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<Invite[]> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);
    userLog('Find all invites for group %d', groupId);

    // Check if current user is a member of the group
    try {
      userLog('Check if member of group %d', groupId);
      await MembershipService.findById(
          currentUser, {
            userId: currentUser.id,
            groupId,
          },
      );
      userLog('Is member of group %d', groupId);
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        userError(
            'Is not a member of group %d',
            groupId,
        );
        throw new NotMemberOfGroupError();
      } else {
        userError(
            'Unexpected error while checking membership of group %d: %s',
            groupId,
            e,
        );
        throw e;
      }
    }

    userLog('Get all invites for group %d', groupId);
    return InviteRepository.findAllForGroup(
        groupId,
        {
          withInvitedByData: true,
          withUserData: true,
        },
    );
  },
};
