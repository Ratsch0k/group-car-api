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
export const UserRepository = {
  /**
   * Finds a limited amount of users whose username
   * start with the specified string.
   * @param startsWith  - The string with which the usernames should start
   * @param limit       - The limit of how many users should be returns. Has
   *          a default and a max value.
   * @param options - Options
   */
  async findLimitedWithFilter(
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              [Op.is]: null as any,
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
  },

  /**
   * Find a user by their id
   * @param id - The user id
   * @param options - Additional query options
   *
   * @throws {@link UserNotFoundError}
   * If no user with the id exists
   */
  async findById(
      id: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<User> {
    log('Find user %d', id);
    const user = await User.findByPk(id, containsTransaction(options));

    if (user === null) {
      error('User with id "%d" doesn\'t exist', id);
      throw new UserNotFoundError(id);
    }

    return user;
  },

  /**
   * Search for user by their username.
   *
   * @param username -  The username to look for
   * @param options -  Additional query options
   *
   * @throws {@link UserNotFoundError}
   *  if no username exists with that username
   */
  async findByUsername(
      username: string,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<User> {
    log('Find user "%s"', username);
    const user = await User.findOne(
        {where: {username},
          ...containsTransaction(options)},
    );

    if (user === null) {
      error('User with username "%s" doesn\'t exist', username);
      throw new UserNotFoundError(username);
    }

    return user;
  },

  /**
   * Gets the profile picture of the user with the given id.
   * @param userId - The ID of the user
   * @param options - Additional options (only transaction is used)
   */
  async findProfilePictureById(
      userId: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<ProfilePic> {
    log('Find profile picture of user %d', userId);
    const pb = await ProfilePic.findByPk(
        userId,
        {transaction: isTransaction(options?.transaction)},
    );

    if (pb === null) {
      throw new ProfilePictureNotFoundError(userId);
    }

    return pb;
  },

  /**
   * Check if the given email address is used by any user.
   * @param email - Email address
   * @returns Whether or not a user already uses the email address
   */
  async isEmailUsed(
      email: string,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<boolean> {
    log('Check if email address %s is used', email);
    const result = await User.count({
      where: {
        email,
      },
      transaction: isTransaction(options?.transaction),
    });

    return result > 0;
  },

  async create(
      username: string,
      email: string,
      password: string,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<User> {
    log('Create new user with username %s', username);

    return User.create({
      username,
      email,
      password,
    }, {transaction: isTransaction(options?.transaction)});
  },
};

export default UserRepository;
