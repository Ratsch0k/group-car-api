import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to change the
 * membership of the owner of a group.
 */
export class CannotChangeOwnerMembershipError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Can\'t change the membership of the owner');
  }
}
