type Request = import('express').Request;

export interface JWTOptions {
  algorithm: 'HS512' | 'HS384' | 'HS256';
  expiresIn: string;
  issuer: string | undefined;
  subject?: string;
}

export interface JWTSecurityOptions {
  ignoredMethods: string[];
  tokenName: string;
  secretName: string;
}

export interface JWTCookieOptions {
  httpOnly: boolean;
  domain: string | undefined;
  sameSite: boolean;
  secure: boolean;
  signed: boolean;
  maxAge: number;
}

export interface JWTConfig {
  notLoggedInSubject: string;
  name: string;
  secret: string;
  getToken(req: Request): string | null;
  getOptions(username?: string): JWTOptions;
  cookieOptions: JWTCookieOptions;
  securityOptions: JWTSecurityOptions;
}

// Get the secret for the jwt
// If no secret is provided exit with 1. #
// Server shouldn't start without the secret
const secret = process.env.JWT_SECRET;
if (secret === undefined) {
  console.error('Secret for jwt tokens is not provided. Please set the ' +
      'environment variable "JWT_SECRET" to the secret which should be used\n');
  process.exit(1);
}

const name = 'jwt';

/**
 * Gets the token from a request.\
 * The token should be stored in a cookie with
 * the name "jwt"
 */
const getToken = (req: Request) => {
  if (req.cookies[name]) {
    return req.cookies[name];
  } else {
    return null;
  }
};

const notLoggedInSubject = '';

const jwt: JWTConfig = {
  notLoggedInSubject,
  name,
  secret,
  getToken,
  getOptions: (username: string = notLoggedInSubject) => ({
    algorithm: 'HS512',
    expiresIn: '15m', // 15 minutes
    issuer: 'my-group-car.de',
    subject: username,
  }),
  cookieOptions: {
    httpOnly: true,
    domain: process.env.NODE_ENV === 'production' ?
      'my-group-car.de' : undefined,
    sameSite: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
    signed: false,
    maxAge: 1000 * 60 * 15, // 15 minutes
  },
  securityOptions: {
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    tokenName: 'XSRF-TOKEN',
    secretName: 'secret',
  },
};

export default jwt;
