import {PreSession, Session} from '@app/auth/session/session';
import {ExtendedValidationChain} from '@app/validators';
import Bluebird from 'bluebird';

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Options for all repository methods.
 */
export interface RepositoryQueryOptions {
  [key: string]: unknown;
  transaction?: Transaction;
}

/**
 * For why this is here, look at `app/validators/inject-custom-checks.ts`
 */
declare module 'express-validator' {
  export interface ValidationChain extends ExtendedValidationChain {}
}

declare global {
  namespace Express {
    export type User = {
      username: string;
      id: number;
      createdAt: Date;
      deletedAt?: Date;
      updatedAt: Date;
      email: string;
    }

    export type Auth = {
      username?: string;
      id?: number;
      loggedIn: boolean;
    }

    export interface Request {
      user?: User;
      session: PreSession | Session;
      createSession(user: User): Promise<Session>;
      createPreSession(): Promise<PreSession>;
      destroySession(): Promise<void>;
      destroyAllUserSessions(user: User): Promise<void>;
    }

    export interface Response {
      createSession(user: User): Promise<void>;
    }

    export interface Response {
      setJwtToken(payload: object, subject?: string): void;
    }
  }
}
