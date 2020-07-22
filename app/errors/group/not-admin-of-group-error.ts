import UnauthorizedError from '../unauthorized-error';

/**
 * This error is thrown if a user requests an action regarding a group
 * of which he/she is not an admin or if the user requests an action for
 * another user who is not an admin of a group.
 */
export class NotAdminOfGroupError extends UnauthorizedError {
  /**
   * Creates an instance of this error class.
   * @param userId - Id of the user who is not an admin of the group.
   *    If not specified the error message will indicate that the
   *    currently logged in user is not an admin. If specified
   *    the error message will instead indicate that the user
   *    with the specified id is not an admin.
   */
  constructor(userId?: number) {
    if (typeof userId === 'number') {
      super(`User with id ${userId} is not an admin of the group`);
    } else {
      super('You have to be an admin of the group you have referred to');
    }
  }
}
