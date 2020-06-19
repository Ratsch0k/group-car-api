import BadRequestError from '../bad-request-error';
import config from '@config';

/**
 * This error is thrown if a user tries to invite another user to a group which
 * is already full.
 */
export class GroupIsFullError extends BadRequestError {
  /**
   * Creates an instance of this class
   */
  constructor() {
    super(`The group is full. Maximum amount: ${config.group.maxMembers}`, {
      detail: 'Invitations are counted towards this amount. Either delete ' +
    'invitations or kick users to invite other users.',
    });
  }
}
