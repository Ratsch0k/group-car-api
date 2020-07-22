import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user requested something about a user which
 * requires that user to be a member of a certain group.
 */
export class UserNotMemberOfGroupError extends BadRequestError {
  /**
   * Creates an instance of this class.
   * @param userId - The id of the user who is not a member
   */
  constructor(userId: number) {
    super(`User with id ${userId} is not a member of the group`);
  }
}
