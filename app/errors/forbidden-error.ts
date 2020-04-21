import RestError from './rest-error';

/**
 * Error thrown if a user requests something he/she has not the permission to.
 */
class ForbiddenError extends RestError {
  /**
   * Creates an instance of this class.
   * @param message An optional message.
   *      If not provided a default message is used.
   */
  constructor(message?: string) {
    let _message;
    if (message) {
      _message = message;
    } else {
      _message = 'The request is forbidden for the user';
    }

    super(403, _message);
  }
}

export default ForbiddenError;
