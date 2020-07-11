import {getIdFromModelOrId} from '@app/util/get-id-from-user';
import Membership from './membership';
import {RepositoryQueryOptions} from 'typings';
import {UnauthorizedError} from '@app/errors';
import {MembershipNotFoundError} from '@errors';

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
   * @param user    - The user which requests this query
   * @param id      - The id of the membership
   * @param options - Options for the query
   */
  public static async findById(
      user: Express.User | number,
      id: MembershipId,
      options?: RepositoryQueryOptions,
  ): Promise<Membership> {
    const userId = getIdFromModelOrId(user);

    if (userId !== id.userId) {
      throw new UnauthorizedError('Not authorized to request this membership');
    }

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
}
