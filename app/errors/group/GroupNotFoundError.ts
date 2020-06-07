import NotFoundError from '../not-found-error';

/**
 * This error is thrown if a user tries to access a group which doesn't exist.
 */
export class GroupNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class
   * @param id - Id of the group which doesn't exist
   */
  constructor(id: number) {
    super(`Group with id ${id} doesn\'t exist`, {groupId: id});
  }
}
