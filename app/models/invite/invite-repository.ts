import {Invite, UserDto, Group} from '@models';
import {UnauthorizedError, InviteNotFoundError} from '@app/errors';
import {Membership} from '../membership';
import {Includeable} from 'sequelize/types';
import {User} from '../user';

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
    const confOptions: FindOptions = {
      ...defaultFindOptions,
      ...options,
    };

    // Prepare the include array
    const {include, attributes} = this.buildFindQueryOptions(confOptions);

    // Check if logged in user has userId of invite
    const memberships = await Membership.findAll({
      where: {
        userId: currentUser.id,
      },
    });
    if (
      // Current user is user of invite
      currentUser.id !== id.userId ||
      // Current user has no membership, therefore is not member of group
      memberships.length <= 0 ||
      // Current user is no member of group
      !memberships.some((membership) => membership.groupId === id.groupId)) {
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
    const confOptions: FindOptions = {
      ...defaultFindOptions,
      ...options,
    };

    // Prepare the include array
    const {include, attributes} = this.buildFindQueryOptions(confOptions);

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
  private static buildFindQueryOptions(
      options: FindOptions,
  ): {include: Includeable[] | undefined, attributes: {exclude: string[]}} {
    const include: Includeable[] = [];
    const attributes = {
      exclude: [] as string[],
    };

    if (options.withGroupData) {
      include.push({
        model: Group,
        as: 'Group',
        attributes: [
          'id',
          'name',
          'description',
          'ownerId',
        ],
      });
      attributes.exclude.push('groupId');
    }
    if (options.withUserData) {
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
    if (options.withInvitedByData) {
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
      attributes,
    };
  }
}
