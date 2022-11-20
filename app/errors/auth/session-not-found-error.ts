import NotFoundError from '../not-found-error';

/**
 * Error thrown if the session manager cannot find a specific session.
 */
export class SessionNotFoundError extends NotFoundError {
  /**
   * Creates an instance of this class.
   */
  constructor() {
    super('Session not found');
  }
}

export default SessionNotFoundError;
