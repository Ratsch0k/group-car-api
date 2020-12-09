import {CarColor} from '@app/models';
import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to create a car with a color
 * which is already used with another car of the same group.
 */
export class CarColorAlreadyInUseError extends BadRequestError {
  /**
   * Creates an instance of this class.
   * @param color - The used color
   */
  constructor(color: CarColor) {
    super(`${color} is already used`, {color});
  }
}
