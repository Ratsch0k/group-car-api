import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user requests something about a user, which
 * requires that user to be an admin of a certain group.
 */
export class UserNotAdminOfGroupError extends BadRequestError {
  /**
   * Creates an instance of this class.
   * @param userId - The id of the user who is not an admin
   */
  constructor(userId: number) {
    super(`User with id ${userId} is not an admin of the group`);
  }
}
