import {NotFoundError} from '@errors';

/**
 * Error thrown if a user tries to sign up with a username which already exists.
 */
class UserNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class.
   * @param userId - User id of the user which can not be found
   */
  constructor(userId: number) {
    super(`The user with id "${userId}" doesn\'t exist`, {userId});
  }
}

export default UserNotFoundError;
