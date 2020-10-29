import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {RepositoryQueryOptions} from 'typings';
import {Group, User, Car, CarColor} from '@models';
import debug from 'debug';


/**
 * Query options for car queries.
 */
export interface CarQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether or not the data of the group should be included.
   */
  withGroupData: boolean;

  /**
   * Whether or no the user data of the driver should be included.
   */
  withDriverData: boolean;
}

/**
 * Default query options.
 */
const defaultOptions: CarQueryOptions = {
  withGroupData: false,
  withDriverData: true,
};

/**
 * Repository for cars.
 */
export class CarRepository {
  /**
   * Logger.
   */
  private static log = debug('group-car:car:repository');

  /**
   * Error logger.
   */
  private static error = debug('group-car:car:repository:error');

  /**
   * Create a new car with the specified values.
   * @param groupId   - Id of the group for which this is
   * @param name      - The name of the group
   * @param color     - Color of the group
   * @param options   - Query options for the return value
   */
  public static async create(
      groupId: number,
      name: string,
      color: CarColor,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car> {
    const buildOptions = this.queryBuildOptions(options);

    return Car.create(
        {
          groupId,
          color,
          name,
        },
        {
          include: buildOptions.include,
          ...options,
        },
    );
  }

  /**
   * Query build options.
   */
  private static readonly queryBuildOptions = buildFindQueryOptionsMethod(
      [
        {
          key: 'withGroupData',
          include: [{
            model: Group,
            as: 'Group',
            attributes: Group.simpleAttributes,
          }],
        },
        {
          key: 'withDriverData',
          include: [{
            model: User,
            as: 'Driver',
            attributes: User.simpleAttributes,
          }],
        },
      ],
      defaultOptions,
  )
}

export default CarRepository;
