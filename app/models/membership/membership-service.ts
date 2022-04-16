import {
  MembershipId,
  MembershipRepository,
  Membership,
  GroupService,
  MembershipQueryOptions,
} from '@models';
import {
  MembershipNotFoundError,
  CannotChangeOwnerMembershipError,
  NotAdminOfGroupError,
  NotMemberOfGroupError,
  InternalError,
} from '@errors';
import debug from 'debug';
import {bindUser} from '@util/user-bound-logging';

/**
 * Logging method.
 */
const log = debug('group-car:membership:service');

/**
 * Logging method for errors.
 */
const error = debug('group-car:membership:service:error');

/**
 * Service for complex membership operations.
 */
export const MembershipService = {
  /**
   * Retrieves a membership by its ID.
   *
   * Before retrieving the membership, the method makes sure that `currentUser`
   * is authorized to access the membership. A user is authorized if one of
   * two conditions are true.
   *
   *  - `currentUser.id === id.userId`: The user accesses their own memberships
   *  - `currentUser` is member of the group specified in `id`
   *
   * The reasoning behind this is that a user should only be able to get
   * memberships which concern them and not be able to check memberships
   * between every user and group. This would infringe on the privacy of
   * other users.
   *
   * @param currentUser - Currently logged-in user
   * @param id          - ID to search for
   * @param options     - Options for the repository queries
   *
   * @throws {@link NotMemberOfGroupError}
   * If `currentUser.id !== id.userId` and the logged-in user is not
   * a member of the given group
   *
   * @throws {@link MembershipNotFoundError}
   * *Rethrown from `MembershipRepository.findById()`*. Is thrown if the
   * logged-in user is authorized to access the membership,
   * but it doesn't exist
   */
  async findById(
      currentUser: Express.User,
      id: MembershipId,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership> {
    const userId = currentUser.id;
    const userLog = bindUser(log, userId);
    const userError = bindUser(error, userId);

    // Check if parameter has correct type
    if (typeof userId !== 'number') {
      throw new TypeError('Id of current user has to be a number');
    }

    userLog('Find membership with %o', id);

    /*
     * Check if logged-in user is the specified user.
     * If yes, skip the membership check for the logged-in user.
     * If no, check if the logged-in user is a member of the group.
     */
    if (userId !== id.userId) {
      userLog('Not user of membership. ' +
      'Check if member of group');

      // Check if the logged-in user is member of that group
      try {
        await MembershipRepository.findById(
            {
              userId: userId,
              groupId: id.groupId,
            },
        );
        userLog('Is member of group referenced in membership');
      } catch (err) {
        if (err instanceof MembershipNotFoundError) {
          // Logged-in user is not a member, throw an UnauthorizedError
          userError('Not member of group referenced ' +
          'in membership $o', id);
          throw new NotMemberOfGroupError();
        } else {
          // Something else went wrong, rethrow the error
          userError('Unexpected error', err);
          throw err;
        }
      }
    }

    userLog('Can access membership %o', id);

    // Call the repository method
    return MembershipRepository.findById(id, options);
  },

  /**
   * Updates whether the specified user is an admin
   * of the specified group.
   * @param currentUser - Currently logged-in user
   * @param id          - The id of the membership which should be updated
   * @param isAdmin     - Whether the user should be admin of the group
   *
   * @throws {@link UnauthorizedError} if the currently logged-in
   * user is neither the user for which the admin permission should
   * be changed nor an admin of the referenced group.
   */
  async changeAdminPermission(
      currentUser: Express.User,
      id: MembershipId,
      isAdmin: boolean,
  ): Promise<Membership> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    // Check if parameter has correct type
    if (typeof currentUser.id !== 'number') {
      throw new TypeError('Id of current user has to be a number');
    }

    userLog('Change admin of membership %o', id);

    // Check if current user is an admin of the group
    let currentMembership;
    try {
      currentMembership = await this.findById(
          currentUser, {
            userId: currentUser.id,
            groupId: id.groupId,
          },
      );
      userLog('Is member of group %d', id.groupId);
    } catch (err) {
      if (err instanceof MembershipNotFoundError) {
        userError('Is not member of group %d', id.groupId);
        throw new NotMemberOfGroupError();
      } else {
        userError('Unknown error', err);
        throw err;
      }
    }

    if (!currentMembership.isAdmin) {
      userError('Is not admin of group %d. ' +
      'Can\'t give or take admin', id.groupId);
      throw new NotAdminOfGroupError();
    }

    // Check if user is owner of group
    const group = await GroupService.findById(currentUser, id.groupId);

    if (group.ownerId == id.userId || group.Owner?.id === id.userId) {
      userError('Can\'t change admin of ' +
      'owner of group %d', id.groupId);
      throw new CannotChangeOwnerMembershipError();
    }

    userLog('Change admin permission');
    return MembershipRepository.changeAdminPermission(id, isAdmin);
  },

  /**
   * Gets all memberships of the currently logged-in user.
   * @param currentUser - The currently logged-in user.
   */
  async findAllForUser(
      currentUser: Express.User,
  ): Promise<Membership[]> {
    const userLog = bindUser(log, currentUser.id);
    userLog('Requests to get all their membership');

    return MembershipRepository.findAllForUser(
        currentUser.id,
        {
          withUserData: true,
        },
    );
  },

  /**
   * Gets all memberships for the specified group.
   * @param currentUser - The currently logged in user
   * @param groupId     - The id of the group
   */
  async findAllForGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<Membership[]> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    // Check if user is member of group
    userLog('Request to find all memberships for group %d', groupId);

    try {
      await MembershipRepository.findById({userId: currentUser.id, groupId});
      userLog('User is a member of group %d', groupId);
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        userError('Is not a member of group %d', groupId);
        throw new NotMemberOfGroupError();
      } else {
        userError('Unexpected error while checking membership: %s', e);
        throw e;
      }
    }

    userLog('Get all memberships for group %d', groupId);

    return MembershipRepository.findAllForGroup(
        groupId,
        {
          withUserData: true,
        },
    );
  },

  /**
   * Checks if the current user is a member
   * of the specified group.
   * @param currentUser - The currently logged-in user
   * @param groupId     - The if of the group.
   */
  async isMember(
      currentUser: Express.User,
      groupId: number,
  ): Promise<boolean> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Requests to check if they are a member of group %d', groupId);
    try {
      await MembershipRepository.findById({groupId, userId: currentUser.id});
      return true;
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        return false;
      } else {
        userError(
            'Unexpected error while checking membership for group %d',
            groupId,
        );
        throw new InternalError('Couldn\'t check membership');
      }
    }
  },
};

export default MembershipService;
