import config from '@app/config';
import {randomBytes} from 'crypto';
import debug from 'debug';
import {NextFunction, Request, Response, Router} from 'express';
import RedisSessionStore from './redis-session-store';
import {isBaseSession, PreSession, Session} from './session';
import {SessionStore} from './session-store';

/**
 * Session manager.
 */
class SessionManager {
  private sessionStore: SessionStore;
  private log = debug('group-car:session');
  private error = debug('group-car:session:error')

  /**
   *
   */
  constructor(SessionStoreClass: new() => SessionStore = RedisSessionStore) {
    this.log('Starting session manager');
    this.sessionStore = new SessionStoreClass();
  }

  /**
   *
   * @returns
   */
  getRouter(): Router {
    const router = Router();
    router.use(this.handleRequest.bind(this));

    return router;
  }

  /**
   * Creates a random csrf token using a cryptographic secure prng.
   * @returns CSRF token
   */
  createCSRFToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Create a pre-session for the given request.
   * @param req - The request.
   *              Uses some information of the request to craft the session
   * @returns The pre-session
   */
  async createPreSession(req: Request): Promise<PreSession> {
    this.log('Creating pre-session for %s', req.ip);
    const csrf = this.createCSRFToken();

    const preSession = {
      csrfToken: csrf,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip,
      type: 'presession' as const,
      inactivityTimeout: new Date(
          Date.now() + config.auth.session.inactivityTimeout),
      absoluteTimeout: new Date(
          Date.now() + config.auth.session.absoluteTimeout),
    };

    const sid = await this.sessionStore.storeSession(preSession);

    return {
      ...preSession,
      id: sid,
    };
  }

  /**
   * Create a session given for the request and user.
   * @param req - The request that identifies the users's client.
   *              Some information of the request to craft the session.
   * @param user - The user for which to create the session
   * @returns The session
   */
  async createSession(
      req: Request,
      user: Express.User,
  ): Promise<Session> {
    this.log('Create session for ip %s and user %s', req.ip, user.username);
    const csrf = this.createCSRFToken();

    const session = {
      csrfToken: csrf,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      },
      type: 'session' as const,
      inactivityTimeout: new Date(
          Date.now() + config.auth.session.inactivityTimeout),
      absoluteTimeout: new Date(
          Date.now() + config.auth.session.absoluteTimeout),
    };

    const sid = await this.sessionStore.storeSession(session);
    return {
      ...session,
      id: sid,
    };
  }

  /**
   * Deletes the session associated with the request and replaces it
   * with a pre-session.
   * @param req - The request that contains a session
   * @param res - Response
   */
  async destroySession(
      req: Request,
      res: Response,
  ): Promise<void> {
    this.log('Destroy session on ip %s', req.ip);

    // Get session
    const sid = req.session.id;

    await this.sessionStore.deleteSession(sid);

    await this.createAndAttachPreSession(req, res);
  }

  /**
   * Attaches a cookie for the given session to the response.
   * @param res - Response
   * @param session - Session to attach
   */
  private attachSessionCookie(
      res: Response,
      session: PreSession | Session,
  ): void {
    const sid = session.id;

    // Check if the response already sets a session cookie.
    // This might happen, if the client logs in with their first
    // request. The request has no valid session, thus, a pre-session
    // is attached to the request. But when the request successfully logs
    // in, a session is created. We only want to send the
    // client the last session cookie. Therefore, we have to remove
    // the already existing on from the request.
    let setCookieHeader = res.getHeader('set-cookie');
    if (setCookieHeader !== undefined) {
      let newHeaders: string | string[] = [];

      // If only one set-cookie value, convert to array.
      // This way, we can reuse the code for handling arrays
      if (typeof setCookieHeader === 'string') {
        setCookieHeader = [setCookieHeader];
      }

      // Iterate through the values and create a new array
      // without any set-cookie value that would create a session cookie
      if (Array.isArray(setCookieHeader)) {
        for (const setCookie of setCookieHeader) {
          if (!setCookie.startsWith(config.auth.session.cookieName)) {
            newHeaders.push(setCookie);
          }
        }
      }

      // If the array only consists of one value, set it to a string.
      if (newHeaders.length === 1) {
        newHeaders = newHeaders[0];
      }

      // Readd the set-cookie header to the response.
      // If there are now items, remove the header,
      // if otherwise, just set it.
      if (Array.isArray(newHeaders) && newHeaders.length === 0) {
        res.removeHeader('set-cookie');
      } else {
        res.setHeader('set-cookie', newHeaders);
      }
    }


    res.cookie(
        config.auth.session.cookieName,
        sid,
        {
          ...config.auth.session.cookieOptions,
          expires: new Date(
              Date.now() +
              config.auth.session.absoluteTimeout,
          ),
        },
    );
  }

  /**
   * Creates a pre-session for the given requests and
   * attaches it to the request.
   *
   * Additionally, it also modifies the request to match the session such as
   * setting the user to undefined, setting the session cookie, and the session
   * attribute.
   * @param req - The request
   * @param res - The response
   * @returns The created pre-session
   */
  async createAndAttachPreSession(
      req: Request,
      res: Response,
  ): Promise<PreSession> {
    const session = await this.createPreSession(req);

    // If there was a previous session, delete it
    if (req.session) {
      await this.sessionStore.deleteSession(req.session.id);
    }

    // Attach the session cookie
    req.user = undefined;
    req.session = session;
    this.attachSessionCookie(res, session);

    // Attach the session's csrf token
    const csrfToken = session.csrfToken;
    res.setHeader(config.auth.csrfTokenName, csrfToken);

    return session;
  }

  /**
   * Create and attach a user session to the given request.
   *
   * Additionally, the request and response are modified to match the new
   * session, such as setting the user, session and the session cookie.
   * @param req - Request
   * @param res - Response
   * @param user - User for the session
   * @returns The created user sesssion
   */
  async createAndAttachSession(
      req: Request,
      res: Response,
      user: Express.User,
  ): Promise<Session> {
    const session = await this.createSession(req, user);

    // If there was a previous session, delete it
    if (req.session) {
      await this.sessionStore.deleteSession(req.session.id);
    }

    // Attach the session cookie
    req.user = user;
    req.session = session;
    this.attachSessionCookie(res, session);

    // Attach the session's csrf token
    const csrfToken = session.csrfToken;
    res.setHeader(config.auth.csrfTokenName, csrfToken);

    return session;
  }

  /**
   * Check if the session has expired by checking the
   * absolute and inactivity timeout.
   * @param session - Session to check
   */
  hasSessionExpired(session: PreSession | Session): boolean {
    const now = Date.now();

    return session.absoluteTimeout.getTime() < now ||
      session.inactivityTimeout.getTime() < now;
  }

  /**
   * Check for session anomalies
   * @param req - Request
   * @param session - Session
   * @returns True if an anomaly is found, false if not.
   */
  checkForSessionAnomaly(req: Request, session: PreSession | Session): boolean {
    // Check if ip and user-agent is the same
    return req.headers['user-agent'] !== session.userAgent ||
      req.ip !== session.ip;
  }

  /**
   * Delete all session of the given users. This means, they will be logged out
   * of every device.
   * @param user - User of which to delete all sessions
   */
  async destroyAllUserSessions(user: Express.User): Promise<void> {
    await this.sessionStore.deleteAllUserSessions(user.id);
  }

  /**
   * Get the sid from the request if it exists and make sure that
   * it is base64 encoded string
   * @param req - Request
   * @returns The session id as string or null if it doesn't exist or is
   *          not of correct type.
   */
  getSanitizedSid(req: Request): string | null {
    const rawSid = req.cookies[config.auth.session.cookieName];

    if (typeof rawSid !== 'string') return null;

    return rawSid;
  }

  /**
   * Handle a request.
   * @param req - Request
   * @param res - Response
   * @param next - Next function
   */
  async handleRequest(
      req: Request,
      res: Response,
      next: NextFunction,
  ): Promise<void> {
    // Check if request has session id
    let sid = this.getSanitizedSid(req);
    let session: PreSession | Session | null = null;

    if (typeof sid === 'string') {
      session = await this.sessionStore.getSession(sid);
    }

    if (
      session === null ||
      !isBaseSession(session) ||
      this.hasSessionExpired(session) ||
      this.checkForSessionAnomaly(req, session)
    ) {
      this.log(
          'Request of %s with no valid session. Creating pre-session',
          req.ip,
      );
      session = await this.createAndAttachPreSession(req, res);
    }

    if (session.type === 'presession') {
      this.log('Request of %s contains valid pre-session', req.ip);
      req.user = undefined;
    } else if (session.type === 'session') {
      this.log('Request of %s contains valid session', req.ip);
      req.user = {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        updatedAt: session.user.updatedAt,
        createdAt: session.user.createdAt,
        deletedAt: session.user.deletedAt,
      };
    }
    sid = session.id;

    // Reset inactivity timeout
    await this.sessionStore.touchSession(sid);

    // Attach session and related functions to request
    req.session = session;
    req.createSession = this.createAndAttachSession.bind(this, req, res);
    req.createPreSession = this.createAndAttachPreSession.bind(this, req, res);
    req.destroySession = this.destroySession.bind(this, req, res);
    req.destroyAllUserSessions = this.destroyAllUserSessions.bind(this);

    next();
  }
}

export default SessionManager;
