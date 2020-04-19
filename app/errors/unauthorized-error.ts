import {RestError} from './rest-error';

/**
 * Error if the user isn't authorized for the resources he/she requested.\
 * Or if the send token is not valid.
 */
class UnauthorizedError extends RestError {
  /**
   * Creates an instance of this class.
   * @param message The message of the error.
   *                If none is provided the following default message is used:
   *                `You're not authorized to access the resource`
   */
  constructor(message?: string) {
    let _message;
    if (message !== undefined) {
      _message = message;
    } else {
      _message = 'You\'re not authorized to access the resource';
    }

    super(401, _message, new Date());
  }
}

export default UnauthorizedError;
