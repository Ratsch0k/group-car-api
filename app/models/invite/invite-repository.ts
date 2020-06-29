import {Invite, UserDto, Group, User} from '@models';
import {UnauthorizedError, InviteNotFoundError} from '@app/errors';
import {Membership} from '../membership';
import {Includeable} from 'sequelize/types';

export type InviteId = {userId: number, groupId: number};

/**
 * Options of find queries
 */
export interface FindOptions {
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
   * Returns the invite with the given id, if the user is either
   * the one the invitation is meant for or if the user is
   * a member of the group for which the invitation is.
   * @param user  - The currently logged in user of the request
   * @param id    - The id of the invite, consists of user and group id
   */
  public static async findById(
      currentUser: UserDto,
      id: InviteId,
      options?: FindOptions,
  ): Promise<Invite> {
    // Prepare the include array
    const {include, attributes} = this.buildFindQueryOptions(options);

    // Get memberships of user
    const membership = await Membership.findOne({
      where: {
        userId: currentUser.id,
        groupId: id.groupId,
      },
    });
    if (
      // Current user is not user of invite
      currentUser.id !== id.userId &&
      // Current user has no membership with group
      membership === null) {
      throw new UnauthorizedError('Not authorized to request this invite');
    }
    const invite = await Invite.findOne({
      where: {
        userId: id.userId,
        groupId: id.groupId,
      },
      include,
      attributes,
    });

    if (invite === null) {
      throw new InviteNotFoundError(id);
    } else {
      return invite;
    }
  }

  /**
   * Returns a list of all invites the user has.
   * @param currentUser     - The currently logged in user
   * @param withGroupData   - Whether or not to include group data
   */
  public static async findAllForUser(
      currentUser: Express.User,
      options?: Partial<FindOptions>,
  ): Promise<Invite[]> {
    // Prepare the include array
    const {include, attributes} = this.buildFindQueryOptions(options);

    return Invite.findAll({
      where: {
        userId: currentUser.id,
      },
      include,
      attributes,
    });
  }

  /**
   * Builds the array of models to include
   * in the query from {@link FindOptions}.
   * @param options - The options which define the to included models.
   */
  public static buildFindQueryOptions(
      options?: Partial<FindOptions>,
  ): {
    include: Includeable[] | undefined,
    attributes: {exclude: string[]} | undefined
  } {
    const confOptions: FindOptions = {
      ...defaultFindOptions,
      ...options,
    };

    const include: Includeable[] = [];
    const attributes = {
      exclude: [] as string[],
    };

    if (confOptions.withGroupData) {
      include.push({
        model: Group,
        as: 'Group',
        attributes: [
          'id',
          'name',
          'description',
        ],
        include: [{
          model: User,
          as: 'Owner',
          attributes: [
            'id',
            'username',
          ],
        }],
      });
      attributes.exclude.push('groupId');
    }
    if (confOptions.withUserData) {
      include.push({
        model: User,
        as: 'User',
        attributes: [
          'id',
          'username',
        ],
      });
      attributes.exclude.push('userId');
    }
    if (confOptions.withInvitedByData) {
      include.push({
        model: User,
        as: 'InviteSender',
        attributes: [
          'id',
          'username',
        ],
      });
      attributes.exclude.push('invitedBy');
    }

    return {
      include: include.length <= 0 ? undefined : include,
      attributes: attributes.exclude.length > 0 ? attributes : undefined,
    };
  }
}
