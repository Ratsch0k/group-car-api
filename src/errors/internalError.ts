import {RestError} from './restError';

/**
 * Error class for internal errors.
 */
class InternalError extends RestError {
  /**
   * The stack trace of the error.\
   * Should only be used in a non production setting.
   */
  public readonly stack?: string;

  /**
   * Creates an instance of this class.
   */
  constructor(stack?: string) {
    super(500, 'An internal error occurred', new Date());

    this.stack = stack;
  }
}

export default InternalError;
