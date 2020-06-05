import {NotFoundError} from '@errors';

/**
 * Error thrown if a user tries to sign up with a username which already exists.
 */
class UserNotFoundError extends NotFoundError {
  /**
   * The username which already exists.
   */
  public readonly userId: number;

  /**
   * Creates an instance of this class.
   * @param userId - User id of the user which can not be found
   */
  constructor(userId: number, detail?: Record<string, unknown>) {
    super(`The user with id "${userId}" doesn\'t exist`, detail);

    this.userId = userId;
  }
}

export default UserNotFoundError;
