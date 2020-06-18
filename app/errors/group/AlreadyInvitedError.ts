import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to invite a user to a group
 * to which the user is already invited.
 */
export class AlreadyInvitedError extends BadRequestError {
  /**
   * Creates an instance of this class.
   * @param userId  - The id of the user which should be invited
   * @param groupId - The id of the group the user should be invited to
   */
  constructor(userId: number, groupId: number) {
    super('User is already invited to the group', {userId, groupId});
  }
}
