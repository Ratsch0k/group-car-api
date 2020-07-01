import NotFoundError from '../not-found-error';
import {InviteId} from '@app/models/invite/invite-repository';

/**
 * This error is thrown if a requested invite doesn't exist.
 */
export class InviteNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class.
   * @param inviteId  - Id of the non existing invite
   */
  constructor(inviteId: InviteId) {
    super(`Invite with for user ${inviteId.userId} and ` +
    `group ${inviteId.groupId} doesn't exist`, {inviteId});
  }
}
