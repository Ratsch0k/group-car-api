import {getIdFromModelOrId} from '@app/util/get-id-from-user';
import {RepositoryQueryOptions} from 'typings';
import {MembershipNotFoundError} from '@errors';
import {User, Membership} from '@models';

/**
 * If of a membership.
 */
export interface MembershipId {
  userId: number;
  groupId: number;
}

/**
 * Repository for {@link Membership}.
 *
 * Provides abstraction and security over direct
 * model interaction.
 */
export class MembershipRepository {
  /**
   * Creates a new membership for the given user and given group with the given
   * permission.
   * @param user    - The user for which the membership should be created
   * @param groupId - The group for which the membership should be
   * @param isAdmin - Whether or not the user is an admin of the group
   * @param options - Options for the query
   */
  public static async create(
      user: Express.User | number,
      groupId: number,
      isAdmin: boolean,
      options?: RepositoryQueryOptions,
  ): Promise<Membership> {
    const userId = getIdFromModelOrId(user);

    return Membership.create({
      userId,
      groupId,
      isAdmin,
    }, {
      transaction: options?.transaction,
    });
  }

  /**
   * Finds a membership by it's id.
   * @param id      - The id of the membership
   * @param options - Options for the query
   */
  public static async findById(
      id: MembershipId,
      options?: RepositoryQueryOptions,
  ): Promise<Membership> {
    const membership = await Membership.findOne({
      where: {
        userId: id.userId,
        groupId: id.groupId,
      },
      transaction: options?.transaction,
    });

    if (membership === null) {
      throw new MembershipNotFoundError(id);
    } else {
      return membership;
    }
  }

  /**
   * Returns a list of all users which are members of the specified group.
   * @param groupId - The group for which to check
   * @param options - Query options
   * @returns Promise of a list of members
   */
  public static async findUsersOfGroup(
      groupId: number,
      options?: RepositoryQueryOptions,
  ): Promise<Membership[]> {
    const memberships = await Membership.findAll({
      where: {
        groupId,
      },
      include: [{
        model: User,
        as: 'User',
        attributes: User.simpleAttributes,
      }],
      attributes: ['isAdmin'],
      ...options,
    });

    return memberships;
  }

  /**
   * Removes every membership of the specified user from the specified group.
   * @param userId  - Id of the user to delete from group
   * @param groupId - Id of the group from which the user should be removed
   * @param options - Additional options for query
   * @returns The amount of memberships which got destroyed
   */
  public static async removeUserFromGroup(
      userId: number,
      groupId: number,
      options?: RepositoryQueryOptions,
  ): Promise<number> {
    return Membership.destroy({
      where: {
        userId,
        groupId,
      },
      ...options,
    });
  }

  /**
   * Changes the isAdmin field of the membership with the
   * specified id to the specified value.
   * @param id      - Id of the membership
   * @param isAdmin - New value of the isAdmin field
   */
  public static async changeAdminPermission(
      id: MembershipId,
      isAdmin: boolean,
  ): Promise<Membership> {
    // Get membership of user
    const membership = await this.findById(id);

    // Update membership to admin
    return membership.update({isAdmin});
  }
}
