import {
  MembershipId,
  MembershipRepository,
  Membership,
  GroupService,
} from '@models';
import {RepositoryQueryOptions} from 'typings';
import {
  UnauthorizedError,
  MembershipNotFoundError,
  CannotChangeOwnerMembershipError,
} from '@errors';

/**
 * Service for complex membership operations.
 */
export class MembershipService {
  /**
   * Returns a membership with the specific id if it exists.
   *
   * Throws {@link MembershipNotFoundError} if the membership
   * doesn't exist. Throws {@link UnauthorizedError} if
   * the current user is neither the user to which is
   * referenced in the membership nor a member
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

    if (userId !== id.userId && userId) {
      // Check if user is member of that group
      const userMembership = await Membership.findOne({
        where: {
          userId: userId,
          groupId: id.groupId,
        },
        transaction: options?.transaction,
      });

      if (userMembership === null) {
        throw new UnauthorizedError();
      }
    } else {
      throw new UnauthorizedError('Not authorized to request this membership');
    }

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
    // Check if current user is an admin of the group
    let currentMembership;
    try {
      currentMembership = await this.findById(
          currentUser, {
            userId: currentUser.id,
            groupId: id.groupId,
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
    const group = await GroupService.findById(currentUser, id.groupId);

    if (group.ownerId === id.userId) {
      throw new CannotChangeOwnerMembershipError();
    }

    return MembershipRepository.changeAdminPermission(id, isAdmin);
  }
}
