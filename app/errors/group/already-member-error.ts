import BadRequestError from '../bad-request-error';

/**
 * This error is thrown if a user tries to invite a user to a group
 * of which the user is already a member of.
 */
export class AlreadyMemberError extends BadRequestError {
  /**
   * Creates an instance of this class.
   * @param userId  - The id of the user which should be invited
   * @param groupId - The id of the group the user should be invited to
   */
  constructor(userId: number, groupId: number) {
    super('User is already a member of the group', {userId, groupId});
  }
}
