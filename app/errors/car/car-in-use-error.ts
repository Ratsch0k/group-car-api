import BadRequestError from '../bad-request-error';

/**
 * This error is thrown when a user tries
 * to drive a car which is already in use
 * by another user.
 */
export class CarInUseError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('The car is already used by another member');
  }
}
