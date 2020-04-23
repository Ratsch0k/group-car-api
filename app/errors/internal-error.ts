import {RestError} from './rest-error';

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
  constructor(message?: string, stack?: string) {
    let _message: string;
    if (message === undefined) {
      _message = 'An internal error occurred';
    } else {
      _message = message;
    }

    super(500, _message);

    this.stack = stack;
  }
}

export default InternalError;
