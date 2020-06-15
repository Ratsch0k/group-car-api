import NotFoundError from '../not-found-error';

/**
 * This error is thrown if a user tries to access a group which doesn't exist.
 */
export class GroupNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class
   * @param groupId - Id of the group which doesn't exist
   */
  constructor(groupId: number) {
    super(`Group with id ${groupId} doesn\'t exist`, {groupId});
  }
}
