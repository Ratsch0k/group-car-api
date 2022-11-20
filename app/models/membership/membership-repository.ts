import {getIdFromModelOrId} from '@app/util/get-id-from-user';
import {RepositoryQueryOptions} from 'typings';
import {MembershipNotFoundError} from '@errors';
import {User, Membership} from '@models';
import debug from 'debug';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {containsTransaction, isTransaction} from '@util/is-transaction';

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
 * Build options for the query builder.
 */
const queryBuildOptions = buildFindQueryOptionsMethod(
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

/**
 * Query options.
 */
export interface MembershipQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether user data should be included in the query.
   */
  withUserData: boolean;
}

/**
 * Repository for {@link Membership}.
 *
 * Provides abstraction and security over direct
 * model interaction.
 */
export const MembershipRepository = {
  /**
   * Creates a new membership for the given user and given group with the given
   * permission.
   * @param user    - The user for which the membership should be created
   * @param groupId - The group for which the membership should be
   * @param isAdmin - Whether the user is an admin of the group
   * @param options - Options for the query
   */
  async create(
      user: Express.User | number,
      groupId: number,
      isAdmin: boolean,
      options?: RepositoryQueryOptions,
  ): Promise<Membership> {
    const userId = getIdFromModelOrId(user);

    log(
        'Create %s membership for user %d and group %d',
      isAdmin ? 'non-admin' : 'admin',
      userId,
      groupId,
    );

    return Membership.create({
      userId,
      groupId,
      isAdmin,
    }, {
      transaction: isTransaction(options?.transaction),
    });
  },

  /**
   * Finds a membership by its id.
   * @param id      - The id of the membership
   * @param options - Options for the query
   */
  async findById(
      id: MembershipId,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership> {
    log('Find membership %o', id);

    const {include} = queryBuildOptions(options);

    const membership = await Membership.findOne({
      where: {
        userId: id.userId,
        groupId: id.groupId,
      },
      include,
      transaction: isTransaction(options?.transaction),
    });

    if (membership === null) {
      error('Membership %o doesn\'t exist', id);
      throw new MembershipNotFoundError(id);
    } else {
      return membership;
    }
  },

  /**
   * Returns a list of all users which are members of the specified group.
   * @param groupId - The group for which to check
   * @param options - Query options
   * @returns Promise of a list of members
   */
  async findAllForGroup(
      groupId: number,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership[]> {
    const {include} = queryBuildOptions(options);
    log('Find all membership of group %d', groupId);

    const memberships = await Membership.findAll({
      where: {
        groupId,
      },
      include,
      ...containsTransaction(options),
    });

    return memberships;
  },

  /**
   * Gets all memberships of the specified user.
   * @param userId  - The id of the user for which all
   *    memberships should be returned
   * @param options - Additional query options.
   */
  async findAllForUser(
      userId: number,
      options?: Partial<MembershipQueryOptions>,
  ): Promise<Membership[]> {
    if (typeof userId !== 'number') {
      throw new TypeError('userId has to be a number');
    }
    log('Find all membership of user %d', userId);

    const {include} = queryBuildOptions(options);

    return Membership.findAll({
      where: {
        userId,
      },
      include,
      ...containsTransaction(options),
    });
  },

  /**
   * Removes every membership of the specified user from the specified group.
   * @param userId  - ID of the user to delete from group
   * @param groupId - ID of the group from which the user should be removed
   * @param options - Additional options for query
   * @returns The amount of memberships which got destroyed
   */
  async removeUserFromGroup(
      userId: number,
      groupId: number,
      options?: RepositoryQueryOptions,
  ): Promise<number> {
    log('Delete membership for user %d and group %d', userId, groupId);
    return Membership.destroy({
      where: {
        userId,
        groupId,
      },
      ...containsTransaction(options),
    });
  },

  /**
   * Changes the isAdmin field of the membership with the
   * specified id to the specified value.
   * @param id      - ID of the membership
   * @param isAdmin - New value of the isAdmin field
   * @param options - Options
   */
  async changeAdminPermission(
      id: MembershipId,
      isAdmin: boolean,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Membership> {
    log(
        'Change membership for user %d and group %d to be %s',
        id.userId,
        id.groupId,
      isAdmin ? 'admin' : 'non-admin',
    );
    // Get membership of user
    const membership = await this.findById(id, options);

    // Update membership to admin
    return membership.update({isAdmin}, containsTransaction(options));
  },

  /**
   * Get the amount of members of a group.
   * @param groupId - ID of the group
   * @param options - Additional options
   * @returns The amount of members as a Promise
   */
  async countForGroup(
      groupId: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<number> {
    log('Count membership of group %d', groupId);
    return Membership.count({
      where: {groupId},
      transaction: isTransaction(options?.transaction)},
    );
  },

  /**
   * Checks if a membership of a user for a group exists.
   * @param groupId - ID of the group
   * @param userId - ID of the user
   * @param options - Additional options
   */
  async exists(
      {groupId, userId}: MembershipId,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<boolean> {
    log('Check if membership for user %d and group %d exists', userId, groupId);
    const membership = await Membership.findOne({
      where: {
        groupId,
        userId,
      },
      transaction: isTransaction(options?.transaction),
    });

    return membership !== null;
  },
};

export default MembershipRepository;
