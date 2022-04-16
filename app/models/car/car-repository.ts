import {
  buildFindQueryOptionsMethod,
} from '@app/util/build-find-query-options';
import {RepositoryQueryOptions} from 'typings';
import {Group, User, Car, CarColor} from '@models';
import debug from 'debug';
import {CarNotFoundError, InternalError} from '@app/errors';
import sequelize from '@db';
import Sequelize from 'sequelize';
import {containsTransaction, isTransaction} from '@util/is-transaction';

/**
 * Primary key for a car.
 */
export interface CarPk {
  /**
   * The id of the group which the car belongs to.
   */
  groupId: number;
  /**
   * The id of the car.
   */
  carId: number;
}

/**
 * Query options for car queries.
 */
export interface CarQueryOptions extends RepositoryQueryOptions {
  /**
   * Whether the data of the group should be included.
   *
   * Default value: `false`
   */
  withGroupData: boolean;

  /**
   * Whether the user data of the driver should be included.
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
 * Logger.
 */
const log = debug('group-car:car:repository');

/**
 * Error logger.
 */
const error = debug('group-car:car:repository:error');

/**
 * Query build options.
 */
const queryBuildOptions = buildFindQueryOptionsMethod(
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
);

/**
 * Repository for cars.
 */
export const CarRepository = {
  /**
   * Create a new car with the specified values.
   * @param groupId   - Id of the group for which this is
   * @param name      - The name of the group
   * @param color     - Color of the group
   * @param options   - Query options for the return value
   */
  async create(
      groupId: number,
      name: string,
      color: CarColor,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car> {
    log('Create car %s for group %d', name, groupId);

    const buildOptions = queryBuildOptions(options);

    try {
      const car = await sequelize.transaction(async (t) => {
        const nextId = await Car.findOne({
          attributes: [[Sequelize.fn('MAX', Sequelize.col('carId')), 'max_id']],
          where: {
            groupId,
          },
          transaction: t,
          ...containsTransaction(options),
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
              ...containsTransaction(options),
            },
        );
      });

      return car;
    } catch (e) {
      error(
          'Error occurred while creating car %s for group %d',
          name,
          groupId,
          e,
      );
      throw new InternalError('Could not create car');
    }
  },

  /**
   * Find all cars for the specified group.
   * @param groupId   - Id of the group
   * @param options   - Query options.
   */
  async findByGroup(
      groupId: number,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car[]> {
    log('Find all cars for group %d', groupId);

    const queryOptions = queryBuildOptions(options);

    try {
      const cars = await Car.findAll(
          {
            where: {
              groupId,
            },
            include: queryOptions.include,
            ...containsTransaction(options),
          },
      );
      return cars;
    } catch (e) {
      error('Error while getting cars for group %d', groupId, e);
      throw new InternalError('Couldn\'t get cars');
    }
  },

  /**
   * Find the car by the specified pk (primary key) or
   * throws {@link CarNotFoundError}.
   * @param pk      - The pk to search for
   * @param options - Query options
   */
  async findById(
      pk: CarPk,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car> {
    log('Search for car with pk %o', pk);
    const queryOptions = queryBuildOptions(options);

    let car;
    try {
      car = await Car.findOne({
        where: {
          carId: pk.carId,
          groupId: pk.groupId,
        },
        include: queryOptions.include,
        ...containsTransaction(options),
      });
    } catch (e) {
      error('Error while finding car with pk %o: ', pk, e);
      throw new InternalError('An error occurred while searching for the car');
    }

    if (car === null) {
      log('Car with pk %o doesn\'t exist');
      throw new CarNotFoundError(pk.groupId, pk.carId);
    }

    log('Found car with pk %o', pk);
    return car;
  },

  /**
   * Deletes a car of a group.
   *
   * @param pk - Primary key of car. Consists of group and car id.
   * @param options - Options. Only transaction is used.
   *
   * @throws {@link CarNotFoundError}
   * If there is no car with the given primary key
   */
  async delete(
      pk: CarPk,
      options?: Partial<RepositoryQueryOptions>,
  ): Promise<void> {
    log('Delete car %d of group %d', pk.carId, pk.groupId);

    // Delete car
    const deletedAmount = await Car.destroy({
      where: {
        carId: pk.carId,
        groupId: pk.groupId,
      },
      limit: 1, // Ensure that never more than one car can be deleted.
      transaction: isTransaction(options?.transaction),
    });

    // If no row is deleted, throw CarNotFoundError
    if (deletedAmount === 0) {
      error('Group %d has no car %d', pk.groupId, pk.carId);
      throw new CarNotFoundError(pk.groupId, pk.carId);
    }

    log('Successfully deleted car %d of group %d', pk.carId, pk.groupId);
  },
};

export default CarRepository;
