import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to create a car for a group
 * with a name for which a car already exist in that group.
 */
export class CarNameAlreadyInUserError extends BadRequestError {
  /**
   * Creates an instance of this class.
   * @param name - The already existing name
   */
  constructor(name: string) {
    super(`A car with the name ${name} already exists`, {name});
  }
}
