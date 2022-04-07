import {
  Group,
  GroupRepository,
  InviteService,
  MembershipService,
  Membership,
  MembershipRepository, CreateGroupValues,
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
} from '@errors';
import debug from 'debug';
import bindToLog from '@util/user-bound-logging';

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
  public static async kickUser(
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
  }

  /**
   * Returns a list of all groups the current user is a member of.
   * @param currentUser - The currently logged in user.
   */
  public static async findAllForUser(
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
  }

  /**
   * Create a new group with the given values.
   *
   * The owner of the group will be set to the currently
   * logged-in user.
   * @param currentUser - Currently logged-in
   * @param values      - Values of the group
   */
  public static async create(
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
  }
}
