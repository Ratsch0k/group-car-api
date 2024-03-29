import {
  Group,
  GroupRepository,
  InviteService,
  MembershipService,
  Membership,
  MembershipRepository,
  CreateGroupValues,
  UserRepository,
  InviteRepository,
  Invite,
} from '@models';
import {
  UnauthorizedError,
  NotOwnerOfGroupError,
  MembershipNotFoundError,
  UserNotAdminOfGroupError,
  UserNotMemberOfGroupError,
  CannotKickSelfError,
  NotAdminOfGroupError,
  NotMemberOfGroupError,
  NoSelfInviteError,
  InternalError,
  AlreadyInvitedError,
  AlreadyMemberError,
  GroupIsFullError,
} from '@errors';
import debug from 'debug';
import bindToLog, {bindUser} from '@util/user-bound-logging';
import config from '@config';

const log = debug('group-car:group:service');
const error = debug('group-car:group:service:error');

/**
 * Service for complex group operations.
 */
export const GroupService = {
  /**
   * Returns the group with the specified id only if the specified
   * current user is either a member of the group or has an invite
   * for it.
   * @param currentUser - The currently logged-in user
   * @param id          - The id to search for
   */
  async findById(
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
  },

  /**
   * Transfers the ownership of a group to another user.
   *
   * Returns the updated group.
   * Throws UnauthorizedError if the current user is not a member or
   * the owner of the specified group.
   * @throws {@link UserNotAdminOfGroupError}
   * If the user who should become the owner is not an admin
   * of the group.
   * @param currentUser - The currently logged-in user
   * @param groupId     - The group of which the ownership should be transferred
   * @param toId        - The user to which the ownership should be transferred
   */
  async transferOwnership(
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
  },

  /**
   * Kicks the specified user from the specified group.
   *
   * This method enforces the following constraints:
   *  - A normal member can not kick any member
   *  - An admin can only kick normal members
   *  - The owner can kick every members (admins included)
   *  - No member can kick himself/herself
   *
   * Throws UnauthorizedError if the current user is not
   * a member or not an admin of the specified group or
   * if an admin tries to kick another admin.
   * Throws CannotKickSelfError if the current user
   * tries to kick himself/herself.
   * @param currentUser - The currently logged in user
   * @param groupId     - The id of the group from where the
   *                      user should be kicked
   * @param userId      - The id of the user who should be kicked
   * @returns A promise which resolves in the updated group data or rejected
   *  by an error
   */
  async kickUser(
      currentUser: Express.User,
      groupId: number,
      userId: number,
  ): Promise<Membership[]> {
    // Check if kicking self
    if (userId === currentUser.id) {
      throw new CannotKickSelfError();
    }

    // Get membership of current user
    let currentMembership;
    try {
      currentMembership = await MembershipService.findById(
          currentUser,
          {
            userId: currentUser.id,
            groupId,
          },
      );
    } catch (err) {
      /*
       * If the current user is not a member of the specified group,
       * indicated by the MembershipNotFoundError,
       * throw a NotMemberOfGroupError.
       */
      if (err instanceof MembershipNotFoundError) {
        error(
            'User %d: cannot kick user %d from ' +
          'group %d, user is not member of group',
            currentUser.id,
            userId,
            groupId,
            err,
        );
        throw new NotMemberOfGroupError();
      } else {
        throw err;
      }
    }


    // Check if current user is admin (owner is also admin)
    if (!currentMembership.isAdmin) {
      throw new NotAdminOfGroupError();
    }

    // Get membership of user to kick
    const toKickMembership = await MembershipService.findById(
        currentUser,
        {
          userId,
          groupId,
        },
    );

    // If other user is admin, check if current user is owner
    if (toKickMembership.isAdmin) {
      const group = await GroupRepository.findById(groupId);

      if (group.ownerId != currentUser.id) {
        throw new NotOwnerOfGroupError();
      }
    }

    await MembershipRepository.removeUserFromGroup(userId, groupId);

    // Return new group data
    return MembershipRepository.findAllForGroup(groupId, {withUserData: true});
  },

  /**
   * Returns a list of all groups the current user is a member of.
   * @param currentUser - The currently logged in user.
   */
  async findAllForUser(
      currentUser: Express.User,
  ): Promise<Group[]> {
    log('User %d: Get all groups', currentUser.id);
    // Get all groups of user by getting all memberships
    const memberships = await MembershipService.findAllForUser(currentUser);

    log('User %d: Got all membership', currentUser.id);
    // Convert memberships into array of group ids
    const groupIdArray = memberships.map((m) => m.groupId);

    log(
        'User %d: build list of ids with a length of %d',
        currentUser.id,
        groupIdArray.length);
    return GroupRepository.findAllWithIds(groupIdArray);
  },

  /**
   * Create a new group with the given values.
   *
   * The owner of the group will be set to the currently
   * logged-in user.
   * @param currentUser - Currently logged-in
   * @param values      - Values of the group
   */
  async create(
      currentUser: Express.User,
      values: Omit<CreateGroupValues, 'ownerId'>,
  ): Promise<Group> {
    const userLog = bindToLog(log, {args: [currentUser.id]});
    const {name, description} = values;

    userLog('Create the group %s', name);

    // Create the group
    const group = await GroupRepository.create({
      name,
      description,
      ownerId: currentUser.id,
    });

    // Only return plain version
    return group.get({plain: true}) as Group;
  },

  /**
   * Deletes the group with the given id if the user is the owner.
   *
   * First, it checks if `currentUser` is the owner of the specified group.
   * If not, the method throws. If yes, it deletes the group.
   *
   * @param currentUser - Currently logged-in user
   * @param groupId     - ID of the group to delete
   *
   * @throws {@link NotMemberOfGroupError}
   * Thrown if `currentUser` is not a member of the group
   *
   * @throws {@link GroupNotFoundError}
   * Thrown if `currentUser` is somehow a member of the group but the
   * group itself doesn't exist. *Could be thrown in some edge-cases
   * where the group is deleted before the membership and the method
   * is called in between*
   * @throws {@link NotOwnerOfGroupError}
   * If the user is a member of the group but not the owner.
   */
  async delete(
      currentUser: Express.User,
      groupId: number,
  ): Promise<void> {
    const userLog = bindToLog(log, {args: [currentUser.id]});
    const userError = bindToLog(error, {args: [currentUser.id]});

    userLog('Requesting to delete group %d', groupId);
    // Check if user is a member of the group

    userLog('Check if a member');
    if (!await MembershipService.isMember(currentUser, groupId)) {
      userError('Not a member of the group %d', groupId);
      throw new NotMemberOfGroupError();
    }

    userLog('Get group %d', groupId);
    // Get the group and check if the user is the owner
    const group = await GroupRepository.findById(groupId);

    userLog('Check if user the owner of the group %d', groupId);
    if (group.ownerId !== currentUser.id) {
      userError('Is not the owner');
      throw new NotOwnerOfGroupError();
    }

    // Delete the group
    userLog('Delete the group');
    try {
      await group.destroy();
    } catch (e) {
      // Log exception and rethrow
      userError('Unexpected error while deleting the group %d', groupId);
      throw e;
    }
  },

  /**
   * Invites a user to the given group.
   *
   * The user to invite can either be specified by their user-id or by their
   * username. If the username is provided, this method will automatically
   * retrieve their id.
   *
   * **The following has to be fulfilled before a user is invited:**
   *
   * A user can only be invited if the currently logged-in user
   * is an admin of the group and the group has not reached the maximum
   * amount of members. Additionally, the user to be invited has to
   * exist, is not allowed to be the logged-in user, must not have
   * an invite or be a member of the group
   * @param currentUser - Currently logged-in user
   * @param groupId     - ID of the group to which the user should be invited
   * @param user        - Username or id of the user to invite
   *
   * @throws {@link NoSelfInviteError}
   * If `currentUser` is the same user as specified with `user`
   * @throws {@link NotMemberOfGroupError}
   * If `currentUser` is not a member of the group
   * @throws {@link NotAdminOfGroupError}
   * If `currentUser` is not an admin of the group
   * @throws {@link UserNotFoundError}
   * If a user id is provided but not user with that id exists
   * @throws {@link UsernameNotFoundError}
   * If the username is provided but no user with that username exists
   * @throws {@link AlreadyInvitedError}
   * If the user to invite is already invited to the group
   * @throws {@link AlreadyMemberError}
   * If the user to invite is already a member of the group
   * @throws {@link GroupIsFullError}
   * If the group has already reached to maximum amount of allowed members
   */
  async inviteUser(
      currentUser: Express.User,
      groupId: number,
      user: string | number,
  ): Promise<Invite> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Starting: Invite user %s to group %d', user, groupId);

    // Check that logged-in user doesn't invite themselves
    if (
      (typeof user === 'string' && currentUser.username === user) ||
      (typeof user === 'number' && currentUser.id === user)
    ) {
      userError('Tries to invite themselves');
      throw new NoSelfInviteError();
    }

    // Validate that the user is an admin of the group
    let loggedInUserMembership: Membership;
    try {
      loggedInUserMembership = await MembershipRepository.findById(
          {groupId, userId: currentUser.id});
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        userError('Is not a member');
        throw new NotMemberOfGroupError();
      }
      userError('Unexpected error while getting the membership ' +
        'of the logged-in user: %s', e);
      throw e;
    }

    if (!loggedInUserMembership.isAdmin) {
      userError('Is not an admin');
      throw new NotAdminOfGroupError();
    }
    /*
     * From here on out, we know the logged-in user
     * is authorized to make this request
     */

    /*
     * Retrieve the id of the user.
     *
     * If `user` is a number it will be the id.
     * Then we just check if a user with that id exists.
     *
     * If `user` is a string, we expect it to be the username.
     * Try to retrieve the user by their username and set
     * the userId accordingly.
     */
    let userId: number;

    if (typeof user === 'number') {
      userLog('userId was provided, simply checking if user exists');
      // Check if a user with that id exists
      await UserRepository.findById(user);

      userId = user;
    } else if (typeof user === 'string') {
      userLog('username was provided, getting userId');
      const toInviteUser = await UserRepository.findByUsername(user);

      userId = toInviteUser.id;
    } else {
      userError('Neither the username nor the userId' +
        'were provided, this should have been caught earlier');
      throw new InternalError('Unexpected behaviour');
    }

    /*
     * The following 3 checks are done sequentially to minimize impact
     * on system resources. This will lead to a longer response time but only
     * as many database queries as really necessary.
     *
     * If the increased response time becomes a big issue, this code could be
     * optimized by either using `Promise.all` for all checks or by combining
     * the separate checks into one database query (if possible).
     */

    // Check if user is already invited to group
    userLog('Check if user %d is invited to group %d', userId, groupId);
    if (await InviteRepository.exists({groupId, userId})) {
      userError('User %d is already invited to group %d', userId, groupId);
      throw new AlreadyInvitedError(userId, groupId);
    }

    // Check that the user is not a member of the group
    userLog('Check if user %d is a member of group %d', userId, groupId);
    if (await MembershipRepository.exists({groupId, userId})) {
      userError('User %d is already a member of the group %d', userId, groupId);
      throw new AlreadyMemberError(userId, groupId);
    }

    // Get member count of group. The relevant count includes all members
    // but also all invited users because it should not be possible ot invite
    // more users than the group is allowed to contain.
    userLog('Get amount of invites and members of group %d', groupId);
    const [memberCount, inviteCount] = await Promise.all([
      MembershipRepository.countForGroup(groupId),
      InviteRepository.countForGroup(groupId),
    ]);

    const totalAmount = memberCount + inviteCount;

    if (totalAmount >= config.group.maxMembers) {
      userError('Group %d is already full', groupId);
      throw new GroupIsFullError();
    }

    // At this point, all checks have passed and the invite
    // for the user is created
    userLog('Inviting user %d to group %d', userId, groupId);
    const invite = await InviteRepository.create(
        userId,
        groupId,
        currentUser.id,
    );
    userLog('Successfully invited user %d to group %d', userId, groupId);

    return invite.get({plain: true}) as Invite;
  },

  /**
   * Update fields of the specified group.
   *
   * `currentUser` has to be an admin of the group.
   * Only the following fields can be updated:
   *  - `description`
   *  - `name`
   *
   * Other fields require more checks and can only be
   * changed via their respected methods.
   * @param currentUser - Logged-in user
   * @param groupId     - ID of the group
   * @param values      - Values to change
   */
  async update(
      currentUser: Express.User,
      groupId: number,
      values: Partial<Omit<CreateGroupValues, 'ownerId'>>,
  ): Promise<Group> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Request to update fields of group %d', groupId);

    // Get membership of logged-in user to group
    userLog('Check membership: user %d -> group %d', currentUser.id, groupId);
    let membership;

    try {
      membership = await MembershipRepository
          .findById({groupId, userId: currentUser.id});
    } catch (e) {
      // Only catch if the membership doesn't exist, otherwise rethrow
      if (e instanceof MembershipNotFoundError) {
        userError('Is not a member of the group');
        // Throw other exception
        throw new NotMemberOfGroupError();
      }
      userError('Unexpected error while getting membership: %s', e);
      throw e;
    }

    // Check if logged-in user is an admin
    if (!membership.isAdmin) {
      userError('Is not an admin');
      throw new NotAdminOfGroupError();
    }

    userLog('User is authorized to update the group');

    try {
      const updatedGroup = await GroupRepository.update(
          groupId,
          {description: values.description, name: values.name},
      );
      userLog('Successfully updated group %d', groupId);

      return updatedGroup.get({plain: true}) as Group;
    } catch (e) {
      // Log error and rethrow
      userError('Unexpected error while updating the group: %s', e);
      throw e;
    }
  },
};
