import {RestError} from './rest-error';

/**
 * Error class for internal errors.
 */
class InternalError extends RestError {
  /**
   * The stack trace of the error.
   *
   * Should only be used in a non production setting.
   */
  public readonly stack?: string;

  /**
   * Creates an instance of this class.
   * @param message - Message of this error. Has fallback message.
   * @param detail  - Additional information
   * @param stack   - Stack information
   */
  constructor(
      message?: string,
      detail?: Record<string, unknown>,
      stack?: string,
  ) {
    let _message: string;
    if (message === undefined) {
      _message = 'An internal error occurred';
    } else {
      _message = message;
    }

    super(500, _message, detail);

    this.stack = stack;
  }
}

export default InternalError;
