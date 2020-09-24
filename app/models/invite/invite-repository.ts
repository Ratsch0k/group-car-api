import {User, Group, Invite} from '@models';
import {InviteNotFoundError} from '@errors';
import {RepositoryQueryOptions} from 'typings';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import debug from 'debug';

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
      transaction: options?.transaction,
    });

    if (invite === null) {
      throw new InviteNotFoundError(id);
    } else {
      return invite;
    }
  }

  /**
   * Returns a list of all invites the user has.
   * @param user          - The currently logged in user
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
      transaction: options?.transaction,
    });
  }

  /**
   * Deletes an invite which is for the given user and group.
   * @param user    - The currently logged in user. Is owner of invite
   * @param groupId - The id of the group for which the invite is
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
      transaction: options?.transaction,
    });
  }

  /**
   * Returns whether or not an invite with the given user and group id exists.
   * @param user    - User of the invite
   * @param groupId - Group id of the invite
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
