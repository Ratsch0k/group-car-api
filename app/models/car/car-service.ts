import {
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
} from '@models';
import debug from 'debug';

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
}

export default CarService;
