import NotFoundError from '../not-found-error';
import {MembershipId} from '@models';

/**
 * This error is thrown if the server searches for a membership
 * which doesn't exist.
 */
export class MembershipNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class with the specified attribute.
   * @param id  - The id of the membership which doesn't exist
   */
  constructor(id: MembershipId) {
    super(
        `Membership of user ${id.userId} for group ${id.groupId} doesn't exist`,
      id as unknown as Record<string, unknown>,
    );
  }
}
