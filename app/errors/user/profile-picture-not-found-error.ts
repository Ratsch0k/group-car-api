import {NotFoundError} from '@errors';

/**
 * Not found error thrown if a user tries to get the profile picture of a user
 * which doesn't exist.
 */
export class ProfilePictureNotFoundError extends NotFoundError {
  /**
   * Creates this error.
   * @param userId - ID of the user of which the profile picture was queried
   */
  constructor(userId: number) {
    super('Couldn\'t find profile picture for user ' + userId);
  }
}

export default ProfilePictureNotFoundError;
