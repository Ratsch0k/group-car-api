declare namespace Express {
  export interface Request {
    getCsrfToken(): string;
    getSecret(): string;
  }

  export interface Response {
    setJwtToken(payload: object, subject: string): void;
  }
}
