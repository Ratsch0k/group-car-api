import BadRequestError from '../bad-request-error';

/**
 * This error is thrown is a user tries to leave a group
 * of which the user is the owner.
 */
export class OwnerCannotLeaveError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('An owner can\'t leave a group. Transfer your ownership to do so');
  }
}
