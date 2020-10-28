import {NotFoundError} from '@errors';

/**
 * Error thrown if user with the specified username doesn't exists.
 */
export class UsernameNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class.
   * @param username - The username for which no user exists
   */
  constructor(username: string) {
    super(`The user with the username "${username}" doesn\'t exist`,
        {username});
  }
}

export default UsernameNotFoundError;
