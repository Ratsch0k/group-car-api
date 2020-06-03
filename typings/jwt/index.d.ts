declare namespace Express {
  export interface Request {
    getCsrfToken(): string;
    getSecret(): string;
    user?: {
      username?: string;
      userId?: number;
      isBetaUser?: boolean;
      loggedIn?: boolean;
    };
  }

  export interface Response {
    setJwtToken(payload: object, subject?: string): void;
  }
}