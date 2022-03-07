declare namespace Express {
  export type User = {
    username: string;
    id: number;
    isBetaUser: boolean;
    createdAt: Date;
    deletedAt: Date;
    updatedAt: Date;
    email: string;
  }

  export type Auth = {
    username?: string;
    id?: number;
    isBetaUser?: boolean;
    loggedIn: boolean;
  }

  export interface Request {
    getCsrfToken(): string;
    getSecret(): string;
    user?: User;
    auth: Auth;
    jwtToken: string | undefined;
  }

  export interface Response {
    setJwtToken(payload: object, subject?: string): void;
  }
}

declare module 'morgan-debug';

declare module 'nodemailer-express-handlebars';

declare module 'nodemailer-express-handlebars-plaintext-inline-ccs';