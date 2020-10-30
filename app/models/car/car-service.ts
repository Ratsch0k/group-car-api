import {
  MembershipNotFoundError,
  NotAdminOfGroupError,
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
}

export default CarService;
