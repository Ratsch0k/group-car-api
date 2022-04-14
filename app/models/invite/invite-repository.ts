import {User, Group, Invite} from '@models';
import {InviteNotFoundError} from '@errors';
import {RepositoryQueryOptions} from 'typings';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import debug from 'debug';
import {containsTransaction, isTransaction} from '@util/is-transaction';

export type InviteId = {userId: number, groupId: number};

/**
 * Options of find queries
 */
export interface FindOptions extends RepositoryQueryOptions {
  [key: string]: unknown;

  /**
   * Whether or not the group data should be returned instead of the groupId
   */
  withGroupData: boolean;
  /**
   * Whether or not the user data should be returned instead of the userId
   */
  withUserData: boolean;
  /**
   * Whether or not the invitedBy field
   * should include the user data instead of the id
   */
  withInvitedByData: boolean;
}

/**
 * Default find options
 */
const defaultFindOptions: FindOptions = {
  withGroupData: false,
  withUserData: false,
  withInvitedByData: false,
};

/**
 * Repository for invites.
 *
 * Provides an abstraction and security layer
 * over the model.
 */
export class InviteRepository {
  /**
   * Method for logging.
   */
  private static log = debug('group-car:invite:repository');

  /**
   * Method for error logging.
   */
  private static logE = debug('group-car:invite:repository:error');
  /**
   * Returns the invite with the given id.
   * If no invite exists will throw {@link InviteNotFoundError}.
   * @param id          - The id of the invite, consists of user and group id
   * @param options     - FindOptions define what should be eagerly loaded
   */
  public static async findById(
      id: InviteId,
      options?: Partial<FindOptions>,
  ): Promise<Invite> {
    // Prepare the include array
    const {include} = this.buildOptions(options);

    const invite = await Invite.findOne({
      where: {
        userId: id.userId,
        groupId: id.groupId,
      },
      include,
      transaction: isTransaction(options?.transaction),
    });

    if (invite === null) {
      throw new InviteNotFoundError(id);
    } else {
      return invite;
    }
  }

  /**
   * Returns a list of all invites the user has.
   * @param userId          - The currently logged-in user
   * @param options       - FindOptions define what should be eagerly loaded
   */
  public static async findAllForUser(
      userId: number,
      options?: Partial<FindOptions>,
  ): Promise<Invite[]> {
    // Prepare the include array
    const {include} = this.buildOptions(options);

    return Invite.findAll({
      where: {
        userId,
      },
      include,
      transaction: isTransaction(options?.transaction),
    });
  }

  /**
   * Deletes an invite which is for the given user and group.
   * @param id - ID of the invite
   * @param options - Options
   * @returns Promise of number of deleted rows
   */
  public static async deleteById(
      id: InviteId,
      options?: RepositoryQueryOptions,
  ): Promise<number> {
    return Invite.destroy({
      where: {
        userId: id.userId,
        groupId: id.groupId,
      },
      transaction: isTransaction(options?.transaction),
    });
  }

  /**
   * Returns whether or not an invite with the given user and group id exists.
   * @param id      - Invite ID
   * @param options - Query options
   */
  public static async existsById(
      id: InviteId,
      options?: RepositoryQueryOptions,
  ): Promise<boolean> {
    try {
      await this.findById(id, options);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Gets all invites for the specified group.
   * @param groupId - The if of the group
   * @param options - Query options
   */
  public static async findAllForGroup(
      groupId: number,
      options?: Partial<FindOptions>,
  ): Promise<Invite[]> {
    this.log('Find all invites for group %d (options: %o)', groupId, options);
    const {include} = this.buildOptions(options);

    return Invite.findAll({
      where: {
        groupId,
      },
      include,
    });
  }

  /**
   * Gets the amount of invites of a group.
   * @param groupId - ID of the group
   * @param options - Additional options
   * @returns Amount of invites for the given group as a Promise
   */
  public static async countForGroup(
      groupId: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<number> {
    return Invite.count({
      where: {
        groupId,
      },
      transaction: isTransaction(options?.transaction),
    });
  }

  /**
   * Creates an invite for the given id.
   * @param userId    - ID of the user to invite
   * @param groupId   - ID of the group
   * @param invitedBy - ID of the user which created the invite
   * @param options - Additional options
   */
  public static async create(
      userId: number,
      groupId: number,
      invitedBy: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Invite> {
    return Invite.create(
        {
          userId,
          groupId,
          invitedBy,
        }, {
          ...containsTransaction(options),
        },
    );
  }

  /**
   * Checks if the invite with the given id exists.
   *
   * This is basically equivalent to checking if the user
   * is invited to the group.
   * @param groupId - ID of the user
   * @param userId  - ID of the group
   * @param options - Additional options
   */
  public static async exists(
      {groupId, userId}: InviteId,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<boolean> {
    const invite = await Invite.findOne({
      where: {
        groupId,
        userId,
      },
      transaction: isTransaction(options?.transaction),
    });

    return invite !== null;
  }

  /**
   * Builds the array of models to include
   * in the query from {@link FindOptions}.
   * @param options - The options which define the to included models.
   */
  public static buildOptions = buildFindQueryOptionsMethod(
      [
        {
          key: 'withGroupData',
          include: [{
            model: Group,
            as: 'Group',
            attributes: Group.simpleAttributes,
            include: [{
              model: User,
              as: 'Owner',
              attributes: User.simpleAttributes,
            }],
          }],
        },
        {
          key: 'withUserData',
          include: [{
            model: User,
            as: 'User',
            attributes: User.simpleAttributes,
          }],
        },
        {
          key: 'withInvitedByData',
          include: [{
            model: User,
            as: 'InviteSender',
            attributes: User.simpleAttributes,
          }],
        },
      ],
      defaultFindOptions,
  );
}
