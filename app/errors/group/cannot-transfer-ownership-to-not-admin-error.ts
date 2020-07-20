import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to transfer the ownership of a group
 * to a member of the group which is not an admin.
 */
export class CannotTransferOwnershipToNotAdminError extends BadRequestError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Ownership can only be transferred to admins');
  }
}
