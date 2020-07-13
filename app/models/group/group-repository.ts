import {RepositoryQueryOptions} from 'typings';
import {GroupNotFoundError} from '@app/errors';
import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {Group, User, MembershipRepository} from '@models';

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
   */
  withMembers: boolean;
}

/**
 * Default options
 */
const defaultOptions: GroupQueryOptions = {
  withOwnerData: false,
  withMembers: false,
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

    const {include, attributes} = this.queryBuildOptions(options);

    const group = await Group.findByPk(
        id,
        {
          include,
          attributes,
          ...options,
        },
    );

    if (group === null) {
      throw new GroupNotFoundError(id);
    }

    // Check if members should be included
    if (options?.withOwnerData) {
      const members = await MembershipRepository.findUsersOfGroup(id);
      return {
        ...group,
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
