import {BadRequestError} from '@errors';

/**
 * Error thrown if a user tries to sign up with a username which already exists.
 */
class UsernameAlreadyExistsError extends BadRequestError {
  /**
   * The username which already exists.
   */
  public readonly username: string;

  /**
   * Creates an instance of this class.
   * @param username - Username which already exists
   */
  constructor(username: string) {
    super(`The username "${username}" already exists`, {username});

    this.username = username;
  }
}

export default UsernameAlreadyExistsError;
