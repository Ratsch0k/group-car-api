import NotFoundError from '../not-found-error';

/**
 * This error is thrown if a user tries to access a
 * car which doesn't exist.
 */
export class CarNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class.
   * @param groupId - The id of the group
   * @param carId   - The id of the car
   */
  constructor(groupId: number, carId: number) {
    super(`Car with id ${carId} for group with ` +
        `id ${groupId} doesn't exist`, {groupId, carId});
  }
}
