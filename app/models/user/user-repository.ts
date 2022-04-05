import config from '@app/config';
import {User} from './.';
import {RepositoryQueryOptions} from 'typings';
import sequelize from 'sequelize';
import debug from 'debug';
import {ProfilePictureNotFoundError, UserNotFoundError} from '@errors';
import {ProfilePic} from '@app/models';
import {containsTransaction, isTransaction} from '@util/is-transaction';
const log = debug('group-car:user:repository');
const error = debug('group-car:user:repository:error');
const Op = sequelize.Op;

/**
 * Repository for the {@link User} model.
 */
export class UserRepository {
  /**
   * Finds a limited amount of users who's username
   * start with the specified string.
   * @param startsWith  - The string with which the usernames should start
   * @param limit       - The limit of how many users should be returns. Has
   *          a default and a max value.
   * @param options - Options
   */
  public static async findLimitedWithFilter(
      startsWith: string,
      limit: number = config.user.maxLimitQuery,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<User[]> {
    if (typeof startsWith !== 'string') {
      throw new TypeError('startsWith parameter has to be a string');
    }

    if (typeof limit !== 'number') {
      throw new TypeError('limit parameter has to be a number');
    }

    log('Find users with: starts with %s, limited to: %d', startsWith, limit);
    return User.findAll({
      where: {
        [Op.and]: [
          {
            // Only get not deleted users.
            deletedAt: {
              [Op.is]: null,
            },
            // Filter for specified startsWith parameter
            username: {
              [Op.startsWith]: startsWith,
            },
          },
        ],
      },
      order: [['username', 'ASC']],
      attributes: User.simpleAttributes,
      limit,
      ...containsTransaction(options),
    });
  }

  /**
   * Find a user by their id
   * @param id - The user id
   * @param options - Additional query options
   */
  public static async findById(
      id: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<User> {
    const user = await User.findByPk(id, containsTransaction(options));

    if (user === null) {
      error('User with id "%d" doesn\'t exist', id);
      throw new UserNotFoundError(id);
    }

    return user;
  }

  /**
   * Search for user by their username.
   *
   * @param username -  The username to look for
   * @param options -  Additional query options
   *
   * @throws UserNotFoundError if no username exists with that username
   */
  public static async findByUsername(
      username: string,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<User> {
    const user = await User.findOne(
        {where: {username},
          ...containsTransaction(options)},
    );

    if (user === null) {
      error('User with username "%s" doesn\'t exist', username);
      throw new UserNotFoundError(username);
    }

    return user;
  }

  /**
   * Gets the profile picture of the user with the given id.
   * @param userId - The ID of the user
   * @param options - Additional options (only transaction is used)
   */
  public static async findProfilePictureById(
      userId: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<ProfilePic> {
    const pb = await ProfilePic.findByPk(
        userId,
        {transaction: isTransaction(options?.transaction)},
    );

    if (pb === null) {
      throw new ProfilePictureNotFoundError(userId);
    }

    return pb;
  }
}
