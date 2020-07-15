import {RepositoryQueryOptions} from 'typings';
import {GroupNotFoundError} from '@app/errors';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {Group, User, MembershipRepository} from '@models';
import debug from 'debug';

const log = debug('group-car:group:repository');
const error = debug('group-car:group:repository:error');

/**
 * Specific options for group queries.
 */
interface GroupQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether or not the owner data should be included or only the id.
   */
  withOwnerData: boolean;

  /**
   * Whether or not all members should be included in an array.
   *
   * If `simple` is set, this option will do nothing as the members list
   * doesn't exist on a simple group object.
   */
  withMembers: boolean;

  /**
   * Wether or not the group should only contain attributes of a simple group.
   */
  simple: boolean;
}

/**
 * Default options
 */
const defaultOptions: GroupQueryOptions = {
  withOwnerData: false,
  withMembers: false,
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
      attributes = buildOptions.attributes;
    } else {
      attributes = Group.simpleAttributes;
    }

    const group = await Group.findByPk(
        id,
        {
          include,
          attributes,
          ...options,
        },
    );

    if (group === null) {
      error(`Group with id ${id} doesn't exist`);
      throw new GroupNotFoundError(id);
    }

    // Check if members should be included
    if (options?.withMembers) {
      log('Get members of group');
      const members = await MembershipRepository.findUsersOfGroup(id);
      return {
        ...group.get({plain: true}),
        members,
      } as Group;
    } else {
      return group;
    }
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
        exclude: ['ownerId'],
      }],
      defaultOptions,
  )
}
