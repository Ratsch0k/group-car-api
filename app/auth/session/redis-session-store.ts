import config from '@app/config';
import {randomBytes} from 'crypto';
import debug from 'debug';
import {RedisClientType, createClient} from 'redis';
import {BaseSession, PreSession, Session} from './session';
import {SessionStore} from './session-store';

/**
 * Session store implementation using Redis.
 */
class RedisSessionStore implements SessionStore {
  /**
   * Redis client.
   */
  private redis: RedisClientType;

  private log = debug('group-car:redis');
  private error = debug('group-car:redis:error');

  /**
   * Creates a new instance.
   *
   * It will create a new redis client and connect
   * it to the redis server specified in the config.
   */
  constructor() {
    this.redis = createClient({
      socket: {
        host: config.redis.hostname,
        port: config.redis.port,
      },
      username: config.redis.username,
      password: config.redis.password,
    });
    this.redis.on('error', (e) => this.error('Redis error: %o', e));
    this.redis.on('connect', () => this.log('Connected to redis server'));
    this.redis.on('disconnect', () =>
      this.log('Disconnected from redis server'));
    this.redis.connect();
  }

  /**
   * Check if a session with the given session id exists.
   * @param sid - Session id
   * @returns Whether or not the session exists
   */
  public async sessionExists(sid: string): Promise<boolean> {
    const amountOfKeys = await this.redis.exists(
        `${config.auth.session.sessionPrefix}:${sid}`);

    return amountOfKeys !== 0;
  }


  /**
   *
   * @returns
   */
  createSessionID(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Stores the given session.
   * @param sid - Session id
   * @param session - Session to store
   */
  public async storeSession(
      session: Omit<Session | PreSession, 'id'>,
  ): Promise<string> {
    // Serialize time to store in redis database
    const serializedSession = {
      ...session,
      absoluteTimeout: session.absoluteTimeout.toISOString(),
      inactivityTimeout: session.inactivityTimeout.toISOString(),
    };

    let sid: string;
    let result: string | null = null;
    do {
      sid = this.createSessionID();
      result = await this.redis
          .json.set(
              `${config.auth.session.sessionPrefix}:${sid}`,
              '$',
              serializedSession, {NX: true},
          );
    } while (result !== 'OK');

    // Set expiration to the same value as the absolute timeout of the session
    const shouldExpireAt = session.absoluteTimeout;
    await this.redis.expireAt(
        `${config.auth.session.sessionPrefix}:${sid}`, shouldExpireAt);

    // Add sid to session
    await this.redis.json.set(
        `${config.auth.session.sessionPrefix}:${sid}`, '$.id', sid);

    // If the session is a user session, add it to the session of the users

    if (session.type === 'session') {
      const userSession = session as Session;
      // Add session to sessions of user
      await this.redis.sAdd(
          config.user.userPrefix + ':' +
          userSession.user.id + ':' +
          config.auth.session.sessionPrefix,
          sid,
      );
    }

    return sid;
  }

  /**
   * Gets the session with the given session id.
   * @param sid - Session ID
   *
   * @returns A promise that is resolved with the following values:
   *  - `instance ofSession`: The sid points to a session
   *  - `instance of PreSession`: The sid points to a pre-session
   *  - `null`: No session or pre-session with the sid exists
   */
  public async getSession(sid: string): Promise<Session | PreSession | null> {
    const storedSessions = await this.redis
        .json.get(`${config.auth.session.sessionPrefix}:${sid}`, {path: '$'});

    if (!Array.isArray(storedSessions)) {
      return null;
    }

    // There should only be one session with a specific id.
    // This should never happen
    // But if it does we can assume something is wrong and delete the session.
    if (storedSessions.length > 1) {
      this.deleteSession(sid);

      return null;
    }

    const session = storedSessions[0] as unknown as BaseSession;

    // Convert dates back to date objects
    return {
      ...session,
      inactivityTimeout: new Date(session.inactivityTimeout),
      absoluteTimeout: new Date(session.absoluteTimeout),
    } as Session | PreSession;
  }

  /**
   * Touches the specified session.
   *
   * Touching a session updates the lastUsedAt time to the current time.
   * This resets the relative inactivity timeout for the session.
   * @param sid - Session id
   * @returns True if the session was touched, false if no session
   *          with the given sid exists.
   */
  public async touchSession(sid: string): Promise<boolean> {
    const result = await this.redis.json.set(
        `${config.auth.session.sessionPrefix}:${sid}`,
        '$.lastUsedAt',
        new Date().toISOString(),
    );

    return result === 'OK';
  }

  /**
   * Delete the session with the given sid.
   *
   * After this function has run the session with the specified
   * id is deleted. If no session exists, this function will
   * not throw an error.
   * @param sid - Session id
   * @returns True if the session was deleted. False, if no
   *  session with the sid exists.
   */
  public async deleteSession(sid: string): Promise<boolean> {
    // Get session to identify if it is associated with a user
    const session = await this.getSession(sid);

    if (session === null) {
      return false;
    }

    if (session.type === 'presession') {
      // If session is a pre-session, just delete the session
      await this.redis.del(`${config.auth.session.sessionPrefix}:${sid}`);
    } else if (session.type === 'session') {
      // If session is a session, delete the session and
      // the sid in the session of the user
      await this.redis.multi()
          .del(`${config.auth.session.sessionPrefix}:${sid}`)
          .sRem(
              config.user.userPrefix + ':' +
              session.user.id + ':' +
              config.auth.session.sessionPrefix,
              session.id,
          )
          .exec();
    }

    return true;
  }

  /**
   * Delete all session that are associated with the user.
   * @param userId - Id of the user
   */
  public async deleteAllUserSessions(userId: number): Promise<number> {
    // Get set of session ids of the user
    const sessions = await this.redis.sMembers(
        config.user.userPrefix + ':' +
        userId + ':' +
        config.auth.session.sessionPrefix,
    );

    // Create multi command to delete all sessions
    const multi = this.redis.multi()
        .del(
            config.user.userPrefix + ':' +
            userId + ':' +
            config.auth.session.sessionPrefix,
        );

    // Delete every session
    for (const sid of sessions) {
      multi.del(`${config.auth.session.sessionPrefix}:${sid}`);
    }

    // Execute commands
    await multi.exec();

    return sessions.length;
  }
}

export default RedisSessionStore;
