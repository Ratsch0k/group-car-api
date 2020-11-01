import {buildFindQueryOptionsMethod} from '@app/util/build-find-query-options';
import {RepositoryQueryOptions} from 'typings';
import {Group, User, Car, CarColor} from '@models';
import debug from 'debug';
import {InternalError} from '@app/errors';
import sequelize from '@db';
import Sequelize from 'sequelize';


/**
 * Query options for car queries.
 */
export interface CarQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether or not the data of the group should be included.
   *
   * Default value: `false`
   */
  withGroupData: boolean;

  /**
   * Whether or no the user data of the driver should be included.
   *
   * Default value: `true`
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
    this.log('Create car %s for group %d', name, groupId);

    const buildOptions = this.queryBuildOptions(options);

    try {
      const car = await sequelize.transaction(async (t) => {
        const nextId = await Car.findOne({
          attributes: [[Sequelize.fn('MAX', Sequelize.col('carId')), 'max_id']],
          where: {
            groupId,
          },
          transaction: t,
          ...options,
        }).then((res) => {
          if (res && res.get('max_id')) {
            return res.get('max_id') as number + 1;
          } else {
            return 1;
          }
        });

        return Car.create(
            {
              groupId,
              color,
              name,
              carId: nextId,
            },
            {
              include: buildOptions.include,
              transaction: t,
              ...options,
            },
        );
      });

      return car;
    } catch (e) {
      this.error(
          'Error occurred while creating car %s for group %d',
          name,
          groupId,
          e,
      );
      throw new InternalError('Could not create car');
    }
  }

  /**
   * Find all cars for the specified group.
   * @param groupId   - Id of the group
   * @param options   - Query options.
   */
  public static async findByGroup(
      groupId: number,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car[]> {
    this.log('Find all cars for group %d', groupId);

    const queryOptions = this.queryBuildOptions(options);

    try {
      const cars = await Car.findAll(
          {
            where: {
              groupId,
            },
            include: queryOptions.include,
            ...options,
          },
      );
      return cars;
    } catch (e) {
      this.error('Error while getting cars for group %d', groupId, e);
      throw new InternalError('Couldn\'t get cars');
    }
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
