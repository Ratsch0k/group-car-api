import UnauthorizedError from '../unauthorized-error';

/**
 * This error is thrown if a user requests an action regarding a group
 * of which he/she is not an admin.
 */
export class NotAdminOfGroupError extends UnauthorizedError {
  /**
   * Creates an instance of this error class.
   */
  constructor() {
    super('You have to be an admin of the group you have referred to');
  }
}
