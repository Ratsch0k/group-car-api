import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if the user request an action
 * with a car which requires the user to be the driver
 * of that car.
 */
export class NotDriverOfCarError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('You have to be the driver of the car');
  }
}
