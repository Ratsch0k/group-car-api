import BadRequestError from '../../bad-request-error';

/**
 * Error if the user provided wrong credentials for a login.
 */
class InvalidLoginError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Username or email is invalid');
  }
}

export default InvalidLoginError;
