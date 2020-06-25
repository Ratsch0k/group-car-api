import {Invite, UserDto, Group} from '@models';
import {UnauthorizedError, InviteNotFoundError} from '@app/errors';
import {Membership} from '../membership';

export type InviteId = {userId: number, groupId: number};

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
  ): Promise<Invite> {
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
      withGroupData = false,
  ): Promise<Invite[]> {
    return Invite.findAll({
      where: {
        userId: currentUser.id,
      },
      include: withGroupData ? [{
        model: Group,
        as: 'Group',
      }] : undefined,
    });
  }
}
