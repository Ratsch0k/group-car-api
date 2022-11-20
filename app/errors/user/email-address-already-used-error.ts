import BadRequestError from '../bad-request-error';

/**
 * Error thrown is someone tries to create a user with an email address that
 * is already used by another user.
 */
export class EmailAddressAlreadyUsedError extends BadRequestError {
  /**
   * Creates instance.
   * @param email - Email address that is already used
   */
  constructor(email: string) {
    super(`Email address ${email} already used`);
  }
}

export default EmailAddressAlreadyUsedError;
