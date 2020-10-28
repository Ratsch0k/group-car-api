import UnauthorizedError from '../unauthorized-error';

/**
 * This error is thrown if a user tries to access something which requires to
 * be logged in.
 */
export class NotLoggedInError extends UnauthorizedError {
  /**
   * Creates an instance of this error.
   */
  constructor() {
    super('You have to be logged in');
  }
}
