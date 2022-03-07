import {BadRequestError} from '@errors';

/**
 * Error thrown if a user tries to change the password, but the new password
 * is the same as the old one.
 */
export class NewPasswordMustBeDifferentError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Your new password has to be different than your current one');
  }
}

export default NewPasswordMustBeDifferentError;
