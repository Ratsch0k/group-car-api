import UnauthorizedError from '../unauthorized-error';

/**
 * Error thrown if a client tries to use an invalid session.
 */
export class InvalidSessionError extends UnauthorizedError {
  /**
   * Creates instance of this class.
   */
  constructor() {
    super('Invalid session');
  }
}

export default InvalidSessionError;
