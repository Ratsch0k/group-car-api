import {RepositoryQueryOptions} from 'typings';
import {GroupNotFoundError} from '@errors';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {Group, User} from '@models';
import debug from 'debug';
import Sequelize from 'sequelize';
import {containsTransaction, isTransaction} from '@util/is-transaction';

const Op = Sequelize.Op;

const log = debug('group-car:group:repository');
const error = debug('group-car:group:repository:error');

/**
 * Specific options for group queries.
 */
interface GroupQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether the owner data should be included.
   */
  withOwnerData: boolean;

  /**
   * Whether the group should only contain attributes of a simple group.
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
 * Build options for the query builder.
 */
const queryBuildOptions = buildFindQueryOptionsMethod(
    [{
      key: 'withOwnerData',
      include: [{
        model: User,
        as: 'Owner',
        attributes: User.simpleAttributes,
      }],
    }],
    defaultOptions,
);

/**
 * Repository for groups.
 */
export const GroupRepository = {
  /**
   * Searches for a group with the specified id.
   * @param id      - The id of the group to search for
   * @param options - Query options
   *
   * @throws {@link GroupNotFoundError}
   * If the group doesn't exist
   */
  async findById(
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
      const buildOptions = queryBuildOptions(options);
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
  },

  /**
   * Changes the owner of the specified group to the specified user.
   * @param groupId     - The group which should be updated
   * @param newOwnerId  - The new id of the owner
   * @param options     - Options
   */
  async changeOwnership(
      groupId: number,
      newOwnerId: number,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Group> {
    log('Change ownership of group %d to user %d', groupId, newOwnerId);
    const group = await this.findById(groupId, options);
    return group.update({
      ownerId: newOwnerId,
    }, containsTransaction(options));
  },

  /**
   * Gets all groups with the specified ids
   * @param ids  - The list of ids for which to get the groups
   * @param options - Additional query options
   * @returns A promise which resolved to the list of all groups of the user
   */
  async findAllWithIds(
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

    const {include} = queryBuildOptions({withOwnerData: true});

    return Group.findAll({
      where: {
        [Op.or]: orArray,
      },
      include,
      ...containsTransaction(options),
    });
  },

  /**
   * Creates a group with the given values.
   * @param values  - Values ({@link CreateGroupValues})
   * @param options - Additional options
   */
  async create(
      values: CreateGroupValues,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Group> {
    log('Create new group with name %s', values.name);
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
  },

  /**
   * Updates fields of the given group.
   *
   * Only the expected values will be updated and all other given fields
   * will be ignored.
   *
   * Only allows to update the following fields:
   *  - `description`
   *  - `name`
   * @param id      - ID of the group
   * @param values  - Values to update
   * @param options - Additional options
   *
   * @throws {@link GroupNotFoundError}
   * If the specified group doesn't exist
   */
  async update(
      id: number,
      values: Partial<Pick<Group, 'description' |'name'>>,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<Group> {
    log('Update group %d', id);

    const amountChanged = await Group.update(
        {
          name: values.name,
          description: values.description,
        },
        {
          where: {
            id,
          },
          limit: 1,
          transaction: isTransaction(options?.transaction),
          returning: true,
        },
    );

    /*
     * The first element is the amount of changed rows.
     * If it's 0 we know that no group with the id exists.
     * Therefore, we throw an exception
     */
    if (amountChanged[0] === 0) {
      error('Group %d doesn\'t exist', id);
      throw new GroupNotFoundError(id);
    }

    // The second element is an array of all updated groups.
    // We know only one was updated.
    return amountChanged[1][0];
  },
};
