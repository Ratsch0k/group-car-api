import {NotFoundError} from '@errors';

/**
 * Error thrown if a user tries to sign up with a username which already exists.
 */
class UserNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class.
   * @param idOrName - User id or name of the user which can not be found
   */
  constructor(idOrName: number | string) {
    if (typeof idOrName === 'string') {
      super(
          `The user with username "${idOrName} doesn't exist`,
          {username: idOrName},
      );
    } else {
      super(
          `The user with id "${idOrName}" doesn't exist`,
          {userId: idOrName},
      );
    }
  }
}

export default UserNotFoundError;
