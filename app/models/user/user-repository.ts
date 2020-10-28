import config from '@app/config';
import {User} from '../../models';
import {RepositoryQueryOptions} from 'typings';
import sequelize from 'sequelize';
import debug from 'debug';
const log = debug('group-car:user:repository');
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
      ...options,
    });
  }
}
