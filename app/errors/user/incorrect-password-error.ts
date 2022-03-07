import {UnauthorizedError} from '@errors';

/**
 * Error when the user tries to do a task which requires providing their
 * correct password, but the provided password is incorrect.
 */
export class IncorrectPasswordError extends UnauthorizedError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Incorrect password');
  }
}

export default IncorrectPasswordError;
