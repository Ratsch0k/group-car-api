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

/**
 * Service for complex membership operations.
 */
export class MembershipService {
  /**
   * Logging method.
   */
  private static log = debug('group-car:membership:service');

  /**
   * Logging method for errors.
   */
  private static error = debug('group-car:membership:service:error');


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
  public static async findById(
      currentUser: Express.User,
      id: MembershipId,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership> {
    const userId = currentUser.id;

    // Check if parameter has correct type
    if (typeof userId !== 'number') {
      throw new TypeError('Id of current user has to be a number');
    }

    this.log(`User %d: Find membership with %o`, currentUser.id, id);

    /*
     * Check if logged-in user is the specified user.
     * If yes, skip the membership check for the logged-in user.
     * If no, check if the logged-in user is a member of the group.
     */
    if (userId !== id.userId) {
      this.log('User %d: not user of membership. ' +
      'Check if member of group', currentUser.id);

      // Check if the logged-in user is member of that group
      try {
        await MembershipRepository.findById(
            {
              userId: userId,
              groupId: id.groupId,
            },
        );
        this.log('User %d: is member of group referenced in membership',
            currentUser.id);
      } catch (err) {
        if (err instanceof MembershipNotFoundError) {
          // Logged-in user is not a member, throw an UnauthorizedError
          this.error('User %d: not member of group referenced ' +
          'in membership $o', currentUser.id, id);
          throw new NotMemberOfGroupError();
        } else {
          // Something else went wrong, rethrow the error
          this.error('Unexpected error', err);
          throw err;
        }
      }
    }

    this.log('User %d: can access membership %o', currentUser.id, id);

    // Call the repository method
    return MembershipRepository.findById(id, options);
  }

  /**
   * Updates whether or not the specified user is an admin
   * of the specified group.
   *
   * Throws {@link UnauthorizedError} if the currently logged in user is neither
   * the user for which the admin permission should be changed nor an admin of
   * the referenced group.
   * @param currentUser - Currently logged in user
   * @param id          - The id of the membership which should be updated
   * @param isAdmin     - Whether or not the user should be admin of the group
   */
  public static async changeAdminPermission(
      currentUser: Express.User,
      id: MembershipId,
      isAdmin: boolean,
  ): Promise<Membership> {
    // Check if parameter has correct type
    if (typeof currentUser.id !== 'number') {
      throw new TypeError('Id of current user has to be a number');
    }

    this.log('User %d: change admin of membership %o', currentUser.id, id);

    // Check if current user is an admin of the group
    let currentMembership;
    try {
      currentMembership = await this.findById(
          currentUser, {
            userId: currentUser.id,
            groupId: id.groupId,
          },
      );
      this.log('User %d: member of group %d', currentUser.id, id.groupId);
    } catch (err) {
      if (err instanceof MembershipNotFoundError) {
        this.error('User %d: not member of group %d',
            currentUser.id, id.groupId);
        throw new NotMemberOfGroupError();
      } else {
        this.error('Unknown error', err);
        throw err;
      }
    }

    if (!currentMembership.isAdmin) {
      this.error('User %d: not admin of group %d. ' +
      'Can\'t give or take admin', currentUser.id, id.groupId);
      throw new NotAdminOfGroupError();
    }

    // Check if user is owner of group
    const group = await GroupService.findById(currentUser, id.groupId);

    if (group.ownerId == id.userId || group.Owner?.id === id.userId) {
      this.error('User %d: can\'t change admin of ' +
      'owner of group %d', currentUser.id, id.groupId);
      throw new CannotChangeOwnerMembershipError();
    }

    this.log('User %d: forward to repository');
    return MembershipRepository.changeAdminPermission(id, isAdmin);
  }

  /**
   * Gets all memberships of the currently logged in user.
   * @param currentUser - The currently logged in user.
   */
  public static async findAllForUser(
      currentUser: Express.User,
  ): Promise<Membership[]> {
    return MembershipRepository.findAllForUser(
        currentUser.id,
        {
          withUserData: true,
        },
    );
  }

  /**
   * Gets all memberships for the specified group.
   * @param currentUser - The currently logged in user
   * @param groupId     - The id of the group
   */
  public static async findAllForGroup(
      currentUser: Express.User,
      groupId: number,
  ): Promise<Membership[]> {
    // Check if user is member of group
    this.log('User %d: find all memberships for group %d',
        currentUser.id, groupId);

    try {
      await MembershipRepository.findById({userId: currentUser.id, groupId});
      this.log('User %d: user is not a member of group %d',
          currentUser.id, groupId);
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        throw new NotMemberOfGroupError();
      } else {
        throw e;
      }
    }

    return MembershipRepository.findAllForGroup(
        groupId,
        {
          withUserData: true,
        },
    );
  }

  /**
   * Checks if the current user is a member
   * of the specified group.
   * @param currentUser - The currently logged-in user
   * @param groupId     - The if of the group.
   */
  public static async isMember(
      currentUser: Express.User,
      groupId: number,
  ): Promise<boolean> {
    try {
      await MembershipRepository.findById({groupId, userId: currentUser.id});
      return true;
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        return false;
      } else {
        throw new InternalError('Couldn\'t check membership');
      }
    }
  }
}
