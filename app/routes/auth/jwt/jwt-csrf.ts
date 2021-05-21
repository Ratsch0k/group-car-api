import UnauthorizedError from '@app/errors/unauthorized-error';
import config from '@config';
import Tokens from 'csrf';
import {generateToken, cookieOptions} from './jwt-util';
import jsonwebtoken from 'jsonwebtoken';
import debug from 'debug';
import {NextFunction, RequestHandler, Request, Response} from 'express';

const error = debug('group-car:jwt:error');
const warn = debug('group-car:jwt:warn');

/**
 * Save secret name is constant for shorter code.
 */
const secretName = config.jwt.securityOptions.secretName;


/**
 * Creates a middleware for csrf protection with jwt tokens.
 *
 * Expects the jwt token to in a cookie.
 */
const jwtCsrf: () => RequestHandler = () => {

  return (req: Request, res: Response, next: NextFunction): void => {
    const tokens = new Tokens();

    /**
     * Get the jwt token from the request.
     * Verify is used but the error is caught and
     * a null value is instead returned.
     * Because an existing jwt is only import
     * for not ignored methods, but only in the
     * case for csrf protection.
     * Api protection with jwt is not covered in this handler.
     */
    const jwt = checkRequestConfig(req);

    let secret: string;
    let token: string | undefined;

    if (jwt && isIgnoredMethod(req)) {
      /*
       * If the jwt exists on the request and the request
       * is an ignored method. The secret will be retrieved,
       * if no secret can be extracted from the jwt
       * the jwt is misconfigured.
       * Replaced the jwt with a simple pre-login jwt
       */
      const _secret = getSecret(jwt);

      if (_secret === null) {
        warn('Misconfigured jwt on ignored method.' +
          ' Jwt will be replaced with pre-login jwt');
        secret = setSecret(tokens, req, res);
      } else {
        secret = _secret;
      }
    } else if (jwt && !isIgnoredMethod(req)) {
      /*
       * If the jwt exists on the request and the request
       * is not an ignored method. The secret will be retrieved,
       * if no secret exists on the jwt token an Error will
       * be thrown. If the secret was retrieved it will search
       * for the header which contains the csrf token.
       * If it doesn't exist an error will be thrown.
       * If it does exist the secret will be verified against it.
       * If it fails an error is thrown because the secret is either
       * not up to date or was stolen. If it doesn't fail the user
       * can proceed as he would expect.
       */
      const _secret = getSecret(jwt);
      if (_secret === null) {
        error('Misconfigured jwt. Request with jwt but without secret.');
        throw new UnauthorizedError();
      } else {
        secret = _secret;
      }

      // Check if header with token exists
      token = req.get(config.jwt.securityOptions.tokenName);
      if (token === undefined || !tokens.verify(secret, token)) {
        if (token === undefined) {
          error('Request is missing jwt token header');
        } else {
          error('Secret not matching token');
        }

        throw new UnauthorizedError();
      }
    } else if (!jwt && isIgnoredMethod(req)) {
      /*
       * If the method is an ignored method and the jwt doesn't exist on it
       * a new secret will be generated and a jwt token will be set as cookie.
       */
      secret = setSecret(tokens, req, res);
    } else {
      error('Missing jwt');
      throw new UnauthorizedError();
    }

    req.jwtToken = req.cookies['jwt'] ?
      req.cookies['jwt'] :
      req.jwtToken;

    /**
     * Add function to request which gets the csrf token for
     * the secret in the request.
     */
    req.getCsrfToken = () => {
      if (token === undefined) {
        return tokens.create(secret);
      } else {
        return token;
      }
    };

    /**
     * Add function to request which returns the secret.
     */
    req.getSecret = () => {
      return secret;
    };

    // Add function to response which automatically sets the given
    // payload to the response
    res.setJwtToken = (
        payload: Record<string, unknown>,
        subject?: string,
    ): void => {
    // Create new payload which contains the csrf secret
      const _payload = Object.assign({
        [secretName]: secret,
      }, payload);

      const jwtToken = generateToken(_payload, subject);

      req.jwtToken = jwtToken;

      // Set the cookie on the response
      res.cookie(config.jwt.name,
          jwtToken,
          cookieOptions);
    };

    next();
  };
};

/**
 * Returns whether or not the req has a jwt and the jwt contains
 * the secret.
 * @param req - The http request
 * @returns   The jwt payload or null if the jwt doesn't exist
 */
const checkRequestConfig = (req: Request):
// eslint-disable-next-line @typescript-eslint/ban-types
string | object | null => {
  // Get jwt token from request
  const jwtToken = config.jwt.getToken(req);

  if (jwtToken == null && !isIgnoredMethod(req)) {
    error('Missing jwt on covered method');
    throw new UnauthorizedError();
  } else if (jwtToken === null) {
    return null;
  }

  let jwt;
  try {
    jwt = jsonwebtoken.verify(jwtToken, config.jwt.secret);
  } catch (err) {
    warn('Malformed jwt. Couldn\'t verify.');
    return null;
  }

  return jwt;
};

/**
 * Gets the secret from the request.
 * @param req - The http request
 * @returns the secret or null if either the
 *    jwt or the csrf secret inside the jwt doesn't exist
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSecret = (jwt: any): string | null => {
  // Check if jwt available
  if (!jwt) {
    return null;
  }

  // Check if jwt has csrf secret
  if (!jwt[secretName]) {
    return null;
  }

  return jwt[secretName];
};


/**
 * Returns whether or not the request should be ignored.
 * @param req - The request
 * @returns Whether or not the request should be ignored
 */
const isIgnoredMethod = (req: Request): boolean => {
  return config.jwt.securityOptions.ignoredMethods
      .includes(req.method.toUpperCase());
};

/**
 * Generates a new secret and sets the secret
 * on the request in form of a jwt cookie.
 * @param req - The http request
 * @returns   The new secret
 */
const setSecret = (tokens: Tokens, req: Request, res: Response): string => {
  // Generate new secret
  const secret = tokens.secretSync();

  const jwtToken = generateToken({[secretName]: secret});
  req.jwtToken = jwtToken;

  res.cookie(
      config.jwt.name,
      jwtToken,
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
  );

  return secret;
};

export default jwtCsrf;
