import config from '@app/config';
import {
  CarColorAlreadyInUseError,
  CarInUseError,
  CarNameAlreadyInUseError,
  CarNotFoundError,
  InternalError,
  MaxCarAmountReachedError,
  MembershipNotFoundError,
  NotAdminOfGroupError,
  NotDriverOfCarError,
  NotMemberOfGroupError,
} from '@app/errors';
import {
  Car,
  CarColor,
  CarQueryOptions,
  CarRepository,
  GroupCarAction,
  GroupNotificationService,
  Membership,
  MembershipRepository,
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
   * @throws {@link NotAdminOfGroupError}
   * if the current user is not an
   * admin of the specified group.
   * @throws {@link CarNameAlreadyInUseError}
   * if a car with the specified
   * name already exists for the specified group.
   * @throws {@link CarColorAlreadyInUseError}
   * if the color is already used
   * for a car in the group.
   * @param currentUser - Currently logged-in user
   * @param groupId - ID of the group this car belongs to
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
      throw new CarNameAlreadyInUseError(name);
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

    GroupNotificationService.notifyCarUpdate(
        groupId,
        car.carId,
        GroupCarAction.Add,
        car,
    );

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
   *
   * Throws {@link NotMemberOfGroupError} if the current user
   * is not a member of the group with the specified `groupId`.
   * Throws {@link CarInUseError} if the specified car is
   * used by a user. (`driverId` is not `null`)
   * @param currentUser - The currently logged in user
   * @param groupId     - The id of the group
   * @param carId       - The id of the car
   */
  public static async driveCar(
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
      const car = await CarRepository.findById(
          {groupId, carId},
          {transaction: t},
      );

      if (car.driverId !== null) {
        throw new CarInUseError();
      }

      const updatedCar = await car.update({
        driverId: currentUser.id,
        latitude: null,
        longitude: null,
      }, {transaction: t});

      GroupNotificationService.notifyCarUpdate(
          groupId,
          carId,
          GroupCarAction.Drive,
          updatedCar.get({plain: true}) as Car,
      );

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
        throw new InternalError('Error while registering a driver');
      }
    }
  }

  /**
   * Parks the car at the specified location if the
   * user is the current driver.
   *
   * Throws {@link NotMemberOfGroupError} if the current
   * user is not a member of the group with the
   * specified `groupId`.
   * Throws {@link NotDriverOfCarError} if the current
   * user is not the driver of the car.
   * @param currentUser - The logged in user
   * @param groupId     - Id of the group
   * @param carId       - Id of the car
   * @param latitude    - Latitude of the location
   * @param longitude   - Longitude of the location
   */
  public static async parkCar(
      currentUser: Express.User,
      groupId: number,
      carId: number,
      latitude: number,
      longitude: number,
  ): Promise<void> {
    const carPk = {carId, groupId};
    this.log(
        'User %d: request to park car %o to location %o',
        currentUser.id,
        carPk,
        {latitude, longitude},
    );
    // Check if user is member of group
    if (!(await MembershipService.isMember(currentUser, groupId))) {
      this.error(
          'User %d: can\'t park car %o, user not member of group %d',
          currentUser.id,
          carPk,
          groupId,
      );
      throw new NotMemberOfGroupError();
    }

    // Get car and check driver
    const t = await sequelize.transaction();
    try {
      const car = await CarRepository
          .findById(carPk, {transaction: t});

      if (car.driverId !== currentUser.id) {
        this.error(
            'User %d: can\'t park car %o, user is not driver of car',
            currentUser.id,
            carPk,
        );
        throw new NotDriverOfCarError();
      }

      const updatedCar = await car.update(
          {
            driverId: null,
            latitude,
            longitude,
          },
          {
            transaction: t,
          },
      );
      this.log(
          'User %d: Successfully parked car %o at location %o',
          currentUser.id,
          carPk,
          {latitude, longitude},
      );

      GroupNotificationService.notifyCarUpdate(
          groupId,
          carId,
          GroupCarAction.Park,
          updatedCar.get({plain: true}) as Car,
      );

      t.commit();
    } catch (e) {
      t.rollback();

      if (e instanceof NotDriverOfCarError) {
        throw e;
      } else {
        this.error('Error while parking car %o', carPk);
        throw new InternalError('Couldn\'t park car');
      }
    }
  }

  /**
   * Delete a car of a group if user has permission.
   *
   * Before deleting a car this method checks if
   * the `currentUser` is a member and an admin
   * of the specified group. If so, the car
   * is deleted. After the successful deletion, a delete
   * event is emitted with {@link GroupNotificationService}.
   *
   * ***Note:*** *The deletion event only includes `groupId`
   * and `carId` and no other field.*
   *
   * @param currentUser - Currently logged-in user
   * @param groupId - ID of the group
   * @param carId - ID of the car
   *
   * @throws {@link NotMemberOfGroupError}
   * If `currentUser` is not a member of the group
   * @throws {@link NotAdminOfGroupError}
   * If `currentUser` is not an admin of the group
   * @throws {@link CarNotFoundError}
   * if there is no car with the specified id
   */
  public static async delete(
      currentUser: Express.User,
      groupId: number,
      carId: number,
  ): Promise<void> {
    // Get membership of user in group
    const membership = await MembershipService.findById(
        currentUser,
        {groupId, userId: currentUser.id},
    );

    // Check if user is an admin
    if (!membership.isAdmin) {
      throw new NotAdminOfGroupError();
    }

    // User is allowed to delete the car
    await CarRepository.delete({groupId, carId});

    // Notify of the deletion
    GroupNotificationService.notifyCarUpdate(
        groupId,
        carId,
        GroupCarAction.Delete,
        /*
         * This should be enough data for a client to know which car is deleted.
         * But other fields of the car are missing, which has to be taken into
         * account on the client. Therefore, it should be noted in the
         * documentation.
         */
        {
          carId,
          groupId,
        } as Car,
    );
  }
}

export default CarService;
