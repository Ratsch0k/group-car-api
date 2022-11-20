import {PreSession, Session} from './session';

export interface SessionStore {
  storeSession(session: Omit<PreSession | Session, 'id'>): Promise<string>;

  getSession(sid: string): Promise<Session | PreSession | null>;

  sessionExists(sid: string): Promise<boolean>;

  touchSession(sid: string): Promise<boolean>;

  deleteSession(sid: string): Promise<boolean>;

  deleteAllUserSessions(userId: number): Promise<number>;
}
