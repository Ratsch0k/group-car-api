import {RestError} from './rest-error';

/**
 * Error which is thrown is an endpoint is not yet implemented.
 */
class NotImplementedError extends RestError {
  /**
   * The path which was requested but is not available.
   */
  public readonly path: string;

  /**
   * Creates an instance of this class.
   * @param path Request path which is not implemented
   */
  constructor(path: string) {
    super(501,
        `The path "${path}" is not implemented`,
        new Date());

    this.path = path;
  }
}

export default NotImplementedError;
