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
import {bindUser} from '@util/user-bound-logging';
import {Transaction} from 'typings';

/**
 * Logger.
 */
const log = debug('group-car:car:service');

/**
 * Error logger.
 */
const error = debug('group-car:car:service:error');

/**
 * Service for all car operations.
 */
export const CarService = {
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
  async create(
      currentUser: Express.User,
      groupId: number,
      name: string,
      color: CarColor,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userError(
        'create car for group %d with name $s',
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
      userError('Not admin of group %d', currentUser.id, groupId);
      throw new NotAdminOfGroupError();
    }

    // Check if group has less than max-amount of cars
    let cars;
    try {
      cars = await CarRepository.findByGroup(groupId);
    } catch (e) {
      userLog('Error while getting cars of group %d: ', groupId, e);
      throw new InternalError('Couldn\'t create car');
    }
    if (cars.length >= config.group.maxCars) {
      userError('Group %d has max amount of cars', groupId);
      throw new MaxCarAmountReachedError(cars.length);
    }

    // Check if name already used.
    const nameUsed = cars.some((car) => car.name === name);
    if (nameUsed) {
      userError('Car with name %s already exists in group %d', name, groupId);
      throw new CarNameAlreadyInUseError(name);
    }

    /**
     * Check if color already used.
     */
    const colorUsed = cars.some((car) => car.color === color);
    if (colorUsed) {
      userError('Car with color %s already exists in group %d', color, groupId);
      throw new CarColorAlreadyInUseError(color);
    }

    userLog(
        'create car for group %d with name %s',
        groupId,
        name,
    );

    // Create car
    const car = await CarRepository.create(groupId, name, color, options);

    userLog('Successfully created car %d in group %d', car.carId, groupId);

    GroupNotificationService.notifyCarUpdate(
        groupId,
        car.carId,
        GroupCarAction.Add,
        car,
    );

    userLog('Send notification that new car was created');

    return car.get({plain: true}) as Car;
  },

  /**
   * Find all cars of the specified group.
   *
   * Throws {@link NotMemberOfGroupError} if the current user is not
   * a member of the specified group.
   * @param currentUser   - The currently logged-in user
   * @param groupId       - The id of the group
   * @param options       - Query options
   */
  async findByGroup(
      currentUser: Express.User,
      groupId: number,
      options?: Partial<CarQueryOptions>,
  ): Promise<Car[]> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Find group %d', groupId);

    // Check if current user is a member of the group
    userLog('Check if user member of group %d', groupId);
    try {
      await MembershipRepository.findById({groupId, userId: currentUser.id});
    } catch (e) {
      if (e instanceof MembershipNotFoundError) {
        userError('User is not a member of group %d', groupId);
        throw new NotMemberOfGroupError();
      } else {
        userError('Unexpected error while checking membership of ' +
          'user to group %d: %o', groupId, e);
        throw e;
      }
    }
    userLog('User is member of group, find group %d', groupId);

    return CarRepository.findByGroup(groupId, options);
  },

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
   * @param currentUser - The currently logged-in user
   * @param groupId     - The id of the group
   * @param carId       - The id of the car
   */
  async driveCar(
      currentUser: Express.User,
      groupId: number,
      carId: number,
  ): Promise<void> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(log, currentUser.id);

    userLog('Drive car %d of group %d', carId, groupId);

    userLog('Check if user is member of the group', groupId);
    if (!await MembershipService.isMember(currentUser, groupId)) {
      userError('User is not a member of the group', groupId);
      throw new NotMemberOfGroupError();
    }

    // Start transaction
    const t = await sequelize.transaction();
    try {
      userLog('Get car %d of group %d', carId, groupId);
      // Get car and check if it is already used
      const car = await CarRepository.findById(
          {groupId, carId},
          {transaction: t as unknown as Transaction},
      );

      if (car.driverId !== null) {
        userError('Car is already in use');
        throw new CarInUseError();
      }

      userLog('Set user as driver of car %d of group %d', carId, groupId);
      const updatedCar = await car.update({
        driverId: currentUser.id,
        latitude: null,
        longitude: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {transaction: t as any});

      userLog('Send notification that car is being driven');
      GroupNotificationService.notifyCarUpdate(
          groupId,
          carId,
          GroupCarAction.Drive,
          updatedCar.get({plain: true}) as Car,
      );

      await t.commit();
    } catch (e) {
      userError('Some error occurred while trying to set' +
        ' driver, rollback all changes');
      await t.rollback();
      if (e instanceof CarNotFoundError || e instanceof CarInUseError) {
        userError('Expected error occurred');
        throw e;
      } else {
        error(
            'Error while setting user as driver for car %d of group %d: %o',
            currentUser.id,
            carId,
            groupId,
            e,
        );
        throw new InternalError('Error while registering a driver');
      }
    }
  },

  /**
   * Parks the car at the specified location if the
   * user is the current driver.
   *
   * Throws {@link NotMemberOfGroupError} if the current
   * user is not a member of the group with the
   * specified `groupId`.
   * Throws {@link NotDriverOfCarError} if the current
   * user is not the driver of the car.
   * @param currentUser - The logged-in user
   * @param groupId     - ID of the group
   * @param carId       - ID of the car
   * @param latitude    - Latitude of the location
   * @param longitude   - Longitude of the location
   */
  async parkCar(
      currentUser: Express.User,
      groupId: number,
      carId: number,
      latitude: number,
      longitude: number,
  ): Promise<void> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    const carPk = {carId, groupId};
    userLog(
        'request to park car %o to location %o',
        carPk,
        {latitude, longitude},
    );

    userLog('Check if user is a member of group %d', groupId);
    // Check if user is member of group
    if (!(await MembershipService.isMember(currentUser, groupId))) {
      userError(
          'can\'t park car %o, user not member of group %d',
          carPk,
          groupId,
      );
      throw new NotMemberOfGroupError();
    }

    // Get car and check driver
    const t = await sequelize.transaction();
    try {
      userLog('Check if user is driver of car %d of group %d', carId, groupId);
      const car = await CarRepository
          .findById(carPk, {transaction: t as unknown as Transaction});

      if (car.driverId !== currentUser.id) {
        userError(
            'can\'t park car %o, user is not driver of car',
            currentUser.id,
            carPk,
        );
        throw new NotDriverOfCarError();
      }

      userLog('Set new location of car %d of group %d', carId, groupId);

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
      userLog(
          'User %d: Successfully parked car %o at location %o',
          currentUser.id,
          carPk,
          {latitude, longitude},
      );

      userLog(
          'Send notification that location changed of car %d of group %d',
          carId,
          groupId,
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
        userError('Error while parking car %o: %s', carPk, e);
        throw new InternalError('Couldn\'t park car');
      }
    }
  },

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
  async delete(
      currentUser: Express.User,
      groupId: number,
      carId: number,
  ): Promise<void> {
    const userLog = bindUser(log, currentUser.id);
    const userError = bindUser(error, currentUser.id);

    userLog('Requesting to delete car %d of group %d', carId, groupId);

    // Get membership of user in group
    userLog('Check if user is an admin of the group %d', groupId);
    const membership = await MembershipService.findById(
        currentUser,
        {groupId, userId: currentUser.id},
    );

    // Check if user is an admin
    if (!membership.isAdmin) {
      userError('User is not an admin of group %d', groupId);
      throw new NotAdminOfGroupError();
    }

    userLog('Delete car %d of group %d', carId, groupId);
    // User is allowed to delete the car
    await CarRepository.delete({groupId, carId});

    userLog('Send notification that car %d ' +
      'of group % was deleted', carId, groupId);
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
  },
};

export default CarService;
