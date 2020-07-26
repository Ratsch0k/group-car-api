import {
  MembershipId,
  MembershipRepository,
  Membership,
  GroupService,
} from '@models';
import {RepositoryQueryOptions} from 'typings';
import {
  MembershipNotFoundError,
  CannotChangeOwnerMembershipError,
  NotAdminOfGroupError,
  NotMemberOfGroupError,
} from '@errors';
import debug from 'debug';

const log = debug('group-car:membership:service');
const error = debug('group-car:membership:service:error');

/**
 * Service for complex membership operations.
 */
export class MembershipService {
  /**
   * Returns a membership with the specific id if it exists.
   *
   * Throws {@link MembershipNotFoundError} if the membership
   * doesn't exist. Throws {@link UnauthorizedError} if
   * the current user is not the user which is
   * referenced in the membership and not a member
   * of the group.
   * @param currentUser - Currently logged in user
   * @param id          - Id to search for
   * @param options     - Options for the repository queries
   */
  public static async findById(
      currentUser: Express.User,
      id: MembershipId,
      options?: RepositoryQueryOptions,
  ): Promise<Membership> {
    const userId = currentUser.id;

    // Check if parameter has correct type
    if (typeof userId !== 'number') {
      throw new TypeError('Id of current user has to be a number');
    }

    log(`User %d: Find membership with %o`, currentUser.id, id);

    if (userId !== id.userId) {
      log('User %d: not user of membership. ' +
      'Check if member of group', currentUser.id);

      // Check if user is member of that group
      try {
        await MembershipRepository.findById(
            {
              userId: userId,
              groupId: id.groupId,
            },
            options,
        );
        log('User %d: is member of group referenced in membership',
            currentUser.id);
      } catch (err) {
        if (err instanceof MembershipNotFoundError) {
          error('User %d: not member of group referenced ' +
          'in membership $o', currentUser.id, id);
          throw new NotMemberOfGroupError();
        } else {
          error('Unexpected error', err);
          throw err;
        }
      }
    }

    log('User %d: can access membership %o', currentUser.id, id);

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

    log('User %d: change admin of membership %o', currentUser.id, id);

    // Check if current user is an admin of the group
    let currentMembership;
    try {
      currentMembership = await this.findById(
          currentUser, {
            userId: currentUser.id,
            groupId: id.groupId,
          },
      );
      log('User %d: member of group %d', currentUser.id, id.groupId);
    } catch (err) {
      if (err instanceof MembershipNotFoundError) {
        error('User %d: not member of group %d', currentUser.id, id.groupId);
        throw new NotMemberOfGroupError();
      } else {
        error('Unknown error', err);
        throw err;
      }
    }

    if (!currentMembership.isAdmin) {
      error('User %d: not admin of group %d. ' +
      'Can\'t give or take admin', currentUser.id, id.groupId);
      throw new NotAdminOfGroupError();
    }

    // Check if user is owner of group
    const group = await GroupService.findById(currentUser, id.groupId);

    if (group.ownerId == id.userId || group.Owner?.id === id.userId) {
      error('User %d: can\'t change admin of ' +
      'owner of group %d', currentUser.id, id.groupId);
      throw new CannotChangeOwnerMembershipError();
    }

    log('User %d: forward to repository');
    return MembershipRepository.changeAdminPermission(id, isAdmin);
  }
}
