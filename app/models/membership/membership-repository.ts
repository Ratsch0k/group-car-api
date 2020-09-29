import {getIdFromModelOrId} from '@app/util/get-id-from-user';
import {RepositoryQueryOptions} from 'typings';
import {MembershipNotFoundError} from '@errors';
import {User, Membership} from '@models';
import debug from 'debug';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';

const log = debug('group-car:membership:repository');
const error = debug('group-car:membership:repository:error');

/**
 * If of a membership.
 */
export interface MembershipId {
  userId: number;
  groupId: number;
}

/**
 * Query options.
 */
export interface MembershipQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether or not user data should be included in the query.
   */
  withUserData: boolean;
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
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership> {
    log('Find membership %o', id);

    const {include} = this.queryBuildOptions(options);

    const membership = await Membership.findOne({
      where: {
        userId: id.userId,
        groupId: id.groupId,
      },
      include,
      transaction: options?.transaction,
    });

    if (membership === null) {
      error('Membership %o doesn\'t exist', id);
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
  public static async findAllForGroup(
      groupId: number,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership[]> {
    const {include} = this.queryBuildOptions(options);

    const memberships = await Membership.findAll({
      where: {
        groupId,
      },
      include,
      ...options,
    });

    return memberships;
  }

  /**
   * Gets all memberships of the specified user.
   * @param userId  - The id of the user for which all
   *    memberships should be returned
   * @param options - Additional query options.
   */
  public static async findAllForUser(
      userId: number,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership[]> {
    if (typeof userId !== 'number') {
      throw new TypeError('userId has to be a number');
    }

    const {include} = this.queryBuildOptions(options);

    return Membership.findAll({
      where: {
        userId,
      },
      include,
      ...options,
    });
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
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Membership> {
    // Get membership of user
    const membership = await this.findById(id, options);

    // Update membership to admin
    return membership.update({isAdmin}, options);
  }

  /**
   * Build options for the query builder.
   */
  private static readonly queryBuildOptions = buildFindQueryOptionsMethod(
      [
        {
          key: 'withUserData',
          include: [{
            model: User,
            as: 'User',
            attributes: User.simpleAttributes,
          }],
        },
      ],
  );
}
