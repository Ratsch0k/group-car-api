import {RepositoryQueryOptions} from 'typings';
import {GroupNotFoundError} from '@errors';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {Group, User} from '@models';
import debug from 'debug';
import Sequelize from 'sequelize';
import {containsTransaction} from '@util/is-transaction';

const Op = Sequelize.Op;

const log = debug('group-car:group:repository');
const error = debug('group-car:group:repository:error');

/**
 * Specific options for group queries.
 */
interface GroupQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether or not the owner data should be included.
   */
  withOwnerData: boolean;

  /**
   * Wether or not the group should only contain attributes of a simple group.
   */
  simple: boolean;
}

export interface CreateGroupValues {
  name: string;
  description?: string;
  ownerId: number;
}

/**
 * Default options
 */
const defaultOptions: GroupQueryOptions = {
  withOwnerData: false,
  simple: false,
};

/**
 * Repository for groups.
 */
export class GroupRepository {
  /**
   * Searches for a group with the specified id.
   * @param id      - The id of the group to search for
   * @param options - Query options
   *
   * @throws {@link GroupNotFoundError}
   * If the group doesn't exist
   */
  public static async findById(
      id: number,
      options?: Partial<GroupQueryOptions>,
  ): Promise<Group> {
    if (typeof id !== 'number') {
      throw new TypeError('Id has to be a number');
    }

    log(`Find group with id ${id}`);

    // Depending on the options, either build include
    // and attributes or simply use the simple attributes
    let include;
    let attributes;
    if (!options?.simple) {
      const buildOptions = this.queryBuildOptions(options);
      include = buildOptions.include;
    } else {
      attributes = Group.simpleAttributes;
    }

    const group = await Group.findByPk(
        id,
        {
          include,
          attributes,
          ...containsTransaction(options),
        },
    );

    if (group === null) {
      error(`Group with id ${id} doesn't exist`);
      throw new GroupNotFoundError(id);
    }
    return group;
  }

  /**
   * Changes the owner of the specified group to the specified user.
   * @param groupId     - The group which should be updated
   * @param newOwnerId  - The new id of the owner
   * @param options     - Options
   */
  public static async changeOwnership(
      groupId: number,
      newOwnerId: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Group> {
    const group = await this.findById(groupId, options);
    return group.update({
      ownerId: newOwnerId,
    }, containsTransaction(options));
  }

  /**
   * Gets all groups with the specified ids
   * @param ids  - The list of ids for which to get the groups
   * @param options - Additional query options
   * @returns A promise which resolved to the list of all groups of the user
   */
  public static async findAllWithIds(
      ids: number[],
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Group[]> {
    // Check if all ids in the list are numbers
    if (ids.some((id) => typeof id !== 'number')) {
      error('At least one id in the array is not a number');
      throw TypeError('The ids array should only contain numbers');
    }

    // Build array to use in query
    const orArray = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      orArray.push({id});
    }
    log('Build array with %d entries', orArray.length);

    const {include} = this.queryBuildOptions({withOwnerData: true});

    return Group.findAll({
      where: {
        [Op.or]: orArray,
      },
      include,
      ...containsTransaction(options),
    });
  }

  /**
   * Creates a group with the given values.
   * @param values  - Values ({@link CreateGroupValues})
   * @param options - Additional options
   */
  public static async create(
      values: CreateGroupValues,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Group> {
    return Group.create(
        {
          name: values.name,
          description: values.description,
          ownerId: values.ownerId,
        },
        {
          ...containsTransaction(options),
        },
    );
  }

  /**
   * Build options for the query builder.
   */
  private static readonly queryBuildOptions = buildFindQueryOptionsMethod(
      [{
        key: 'withOwnerData',
        include: [{
          model: User,
          as: 'Owner',
          attributes: User.simpleAttributes,
        }],
      }],
      defaultOptions,
  )
}
