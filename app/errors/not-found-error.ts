import {RestError} from './rest-error';

/**
 * Error class for internal errors.
 */
class NotFoundError extends RestError {
  /**
   * Creates an instance of this class.
   */
  constructor(message?: string, detail?: Record<string, unknown>) {
    let _message: string;
    if (message === undefined) {
      _message = 'Entity not found';
    } else {
      _message = message;
    }

    super(404, _message, detail);
  }
}

export default NotFoundError;
