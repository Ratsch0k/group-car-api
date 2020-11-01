import config from '@app/config';
import {
  CarColorAlreadyInUseError,
  CarInUseError,
  CarNameAlreadyInUserError,
  CarNotFoundError,
  InternalError,
  MaxCarAmountReachedError,
  MembershipNotFoundError,
  NotAdminOfGroupError,
  NotMemberOfGroupError,
} from '@app/errors';
import {
  Car,
  CarQueryOptions,
  MembershipRepository,
  CarRepository,
  CarColor,
  Membership,
  MembershipService,
} from '@models';
import debug from 'debug';
import sequelize from '@db';

/**
 * Service for all car operations.
 */
export class CarService {
  /**
   * Logger.
   */
  private static readonly log = debug('group-car:car:service');

  /**
   * Error logger.
   */
  private static readonly error = debug('group-car:car:service:error');

  /**
   * Create a new car.
   *
   * Throws {@link NotAdminOfGroup} if the current user is not an
   * admin of the specified group.
   * Throws {@link CarNameAlreadyInUseError} if a car with the specified
   * name already exists for the specified group.
   * Throws {@link CarColorAlreadyInUseError} if the color is already used
   * for a car in the group.
   * @param groupId - Id of the group this car belongs to
   * @param name    - Name of the car
   * @param color   - Color of the car
   * @param options - Options for the return value
   */
  public static async create(
      currentUser: Express.User,
      groupId: number,
      name: string,
      color: CarColor,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car> {
    this.log(
        'User %d wants to create car for group %d with name $s',
        currentUser.id,
        groupId,
        name,
    );

    let membership: Membership;
    try {
      // Check if user is admin of the group
      membership = await MembershipRepository
          .findById({groupId, userId: currentUser.id});
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        throw new NotAdminOfGroupError();
      } else {
        throw e;
      }
    }

    if (!membership.isAdmin) {
      this.error('User %d: Not admin of group %d', currentUser.id, groupId);
      throw new NotAdminOfGroupError();
    }

    // Check if group has less than max-amount of cars
    let cars;
    try {
      cars = await CarRepository.findByGroup(groupId);
    } catch (e) {
      this.log('Error while getting cars of group %d: ', groupId, e);
      throw new InternalError('Couldn\'t create car');
    }
    if (cars.length >= config.group.maxCars) {
      throw new MaxCarAmountReachedError(cars.length);
    }

    // Check if name already used.
    const nameUsed = cars.some((car) => car.name === name);
    if (nameUsed) {
      throw new CarNameAlreadyInUserError(name);
    }

    /**
     * Check if color already used.
     */
    const colorUsed = cars.some((car) => car.color === color);
    if (colorUsed) {
      throw new CarColorAlreadyInUseError(color);
    }

    this.log(
        'User %d: create car for group %d with name %s',
        currentUser.id,
        groupId,
        name,
    );

    // Create car
    const car = await CarRepository.create(groupId, name, color, options);
    return car.get({plain: true}) as Car;
  }

  /**
   * Find all cars of the specified group.
   *
   * Throws {@link NotMemberOfGroupError} if the current user is not
   * a member of the specified group.
   * @param currentUser   - The currently logged in user
   * @param groupId       - The id of the group
   * @param options       - Query options
   */
  public static async findByGroup(
      currentUser: Express.User,
      groupId: number,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car[]> {
    // Check if current user is a member of the group
    try {
      await MembershipRepository.findById({groupId, userId: currentUser.id});
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        throw new NotMemberOfGroupError();
      } else {
        throw e;
      }
    }

    return CarRepository.findByGroup(groupId, options);
  }

  /**
   * Try to register the current user
   * as driver of the specified car.
   *
   * A user can only be registered if
   * the user is not the driver of any
   * other car and if the car doesn't currently
   * have another driver.
   * @param currentUser - The currently logged in user
   * @param groupId     - The id of the group
   * @param carId       - The id of the car
   */
  public static async registerDriver(
      currentUser: Express.User,
      groupId: number,
      carId: number,
  ): Promise<void> {
    if (!await MembershipService.isMember(currentUser, groupId)) {
      throw new NotMemberOfGroupError();
    }

    // Start transaction
    const t = await sequelize.transaction();
    try {
      // Check if user is driver of any other car
      const car = await CarRepository.findByPk(
          {groupId, carId},
          {transaction: t},
      );

      if (car.driverId !== null) {
        throw new CarInUseError();
      }

      await car.update({driverId: currentUser.id}, {transaction: t});

      await t.commit();
    } catch (e) {
      await t.rollback();
      if (e instanceof CarNotFoundError || e instanceof CarInUseError) {
        throw e;
      } else {
        this.error(
            'Error while registering user %d as driver for car %o: ',
            currentUser.id,
            {groupId, carId},
            e,
        );
      }
    }
  }
}

export default CarService;
