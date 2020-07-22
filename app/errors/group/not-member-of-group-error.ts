import UnauthorizedError from '../unauthorized-error';

/**
 * This error is thrown if a user requests an action regarding a group
 * of which he/she is not a member.
 */
export class NotMemberOfGroupError extends UnauthorizedError {
  /**
   * Creates an instance of this error class.
   */
  constructor() {
    super('You have to be a member of the group you referred to');
  }
}
