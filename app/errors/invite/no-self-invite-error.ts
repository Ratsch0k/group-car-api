import {BadRequestError} from '@errors';

/**
 * Thrown if a user tries to invite themselves to a group.
 */
export class NoSelfInviteError extends BadRequestError {
  /**
   * Creates an instance of this error.
   */
  constructor() {
    super('You can\'t invite yourself');
  }
}

export default NoSelfInviteError;
