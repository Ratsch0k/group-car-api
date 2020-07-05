import {getIdFromModelOrId} from '@app/util/get-id-from-user';
import Membership from './membership';
import {RepositoryQueryOptions} from 'typings';

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
}
