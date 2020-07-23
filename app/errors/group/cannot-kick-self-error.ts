import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to kick
 * himself/herself from a group.
 */
export class CannotKickSelfError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('You can\'t kick yourself. Consider leaving the group');
  }
}
