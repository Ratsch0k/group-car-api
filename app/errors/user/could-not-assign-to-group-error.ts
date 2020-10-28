import InternalError from '../internal-error';

/**
 * This error is thrown if the server could not assign a user to a group.
 */
export class CouldNotAssignToGroupError extends InternalError {
  /**
   * Creates an instance of this group.
   * @param userId  - Id of the user
   * @param groupId - Id of the group
   */
  constructor(userId: number, groupId: number) {
    super(
        `Could not assign user ${userId} to group ${groupId}`,
        {
          userId,
          groupId,
        },
    );
  }
}
