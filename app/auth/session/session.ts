
export interface BaseSession {
  id: string;
  userAgent: string;
  ip: string;
  csrfToken: string;
  type: 'session' | 'presession';
  absoluteTimeout: Date;
  inactivityTimeout: Date;
}

export interface Session extends BaseSession {
  type: 'session'
  user: Express.User;
}

export interface PreSession extends BaseSession {
  type: 'presession'
}

/**
 * Type guard to check if a value is a base session.
 * @param session - Object to check
 * @returns Whether or not the variable is any type of session
 */
export function isBaseSession(session: unknown): session is BaseSession {
  return typeof session === 'object' &&
    session !== null &&
    'id' in session &&
    'userAgent' in session &&
    'ip' in session &&
    'csrfToken' in session &&
    'type' in session &&
    'inactivityTimeout' in session &&
    'absoluteTimeout' in session;
}
