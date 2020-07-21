import UnauthorizedError from '../unauthorized-error';

/**
 * This error is thrown if a user requests an action regarding a group
 * of which he/she is not a member or request an action for a user
 * which is not a member of the group.
 */
export class NotMemberOfGroupError extends UnauthorizedError {
  /**
   * Creates an instance of this error class.
   * @param userId - Id of the user who is not a member of a group
   *    if specified, the error message will change.
   *    Instead of the current user not being a member of the group,
   *    the message will display that another user is not a member of
   *    the group.
   */
  constructor(userId?: number) {
    if (typeof userId === 'number') {
      super(`User with id ${userId} is not a member of the group`);
    } else {
      super('You have to be a member of the group you referred to');
    }
  }
}
