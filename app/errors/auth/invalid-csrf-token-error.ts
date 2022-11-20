import BadRequestError from '../bad-request-error';

/**
 * Error thrown when a request has an invalid csrf token.
 */
export class InvalidCsrfTokenError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Invalid csrf token');
  }
}

export default InvalidCsrfTokenError;
