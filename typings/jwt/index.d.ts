declare namespace Express {
  export interface Request {
    getCsrfToken(): string;
    getSecret(): string;
    user?: {
      username?: string;
      id?: number;
      isBetaUser?: boolean;
      loggedIn: boolean;
    };
  }

  export interface Response {
    setJwtToken(payload: object, subject?: string): void;
  }
}

declare module 'morgan-debug';

declare module 'nodemailer-express-handlebars';

declare module 'nodemailer-express-handlebars-plaintext-inline-ccs';