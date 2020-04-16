import {InternalError} from '@errors';


/**
 * Error thrown if an error occurred while hashing.
 */
class PasswordNotHashableError extends InternalError {
  /**
   * The user to which the password belongs.
   */
  public readonly user: string;

  /**
   * Creates an instance of this class.
   * @param user The user of which the password is
   */
  constructor(user: string) {
    super(`Couldn't hash the password for user "${user}"`);

    this.user = user;
  }
}

export default PasswordNotHashableError;
