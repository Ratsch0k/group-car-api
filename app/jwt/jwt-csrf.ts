import UnauthorizedError from '@app/errors/unauthorized-error';
import config from '@config';
import Tokens from 'csrf';
import {generateToken, cookieOptions} from './jwt-util';
import jsonwebtoken from 'jsonwebtoken';
import debug from 'debug';

type RequestHandler = import('express').RequestHandler;
type Request = import('express').Request;
type Response = import('express').Response;

const log = debug('group-car:jwt');
const error = debug('group-car:jwt:error');
const warn = debug('group-car:jwt:warn');

/**
 * Save secret name is constant for shorter code.
 */
const secretName = config.jwt.securityOptions.secretName;

/**
 * Creates a middleware for csrf protection with jwt tokens.\
 * Expects the jwt token to in a cookie.
 */
const jwtCsrf: () => RequestHandler = () => (req, res, next) => {
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
      secret = setSecret(tokens, res);
    } else {
      log('Ignored method with jwt and secret');
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
   * If the method is an ignored method and the jwt doesn't exist on i
   * a new secret will be generated and a jwt token will be set as cookie.
   */
    log('Ignored method without jwt. Pre-login jwt will be set');
    secret = setSecret(tokens, res);
  } else {
    error('Missing jwt');
    throw new UnauthorizedError();
  }

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
  res.setJwtToken = (payload: object, subject?: string): void => {
    // Create new payload which contains the csrf secret
    const _payload = Object.assign({
      [secretName]: secret,
    }, payload);

    // Set the cookie on the response
    res.cookie(config.jwt.name,
        generateToken(_payload, subject),
        cookieOptions);
  };

  next();
};

/**
 * Returns whether or not the req has a jwt and the jwt contains
 * the secret.
 * @param req The http request
 * @returns   The jwt payload or null if the jwt doesn't exist
 */
const checkRequestConfig = (req: Request): any => {
  // Get jwt token from request
  const jwtToken = config.jwt.getToken(req);

  if (jwtToken == null && !isIgnoredMethod(req)) {
    error('Missing jwt on covered method');
    throw new UnauthorizedError();
  } else if (jwtToken === null) {
    log('Missing jwt on ignored method');
    return null;
  }

  let jwt;
  try {
    jwt = jsonwebtoken.verify(jwtToken, config.jwt.secret);
  } catch (err) {
    warn('Malformed jwt. Couldn\'t verify.');
    return null;
  }
  log('Could verify jwt');

  return jwt;
};

/**
 * Gets the secret from the request.
 * @param req The http request
 * @returns the secret or null if either the
 *    jwt or the csrf secret inside the jwt doesn't exist
 */
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
 * @param req The request
 * @returns Whether or not the request should be ignored
 */
const isIgnoredMethod = (req: Request): boolean => {
  return config.jwt.securityOptions.ignoredMethods
      .includes(req.method.toUpperCase());
};

/**
 * Generates a new secret and sets the secret
 * on the request in form of a jwt cookie.
 * @param req The http request
 * @returns   The new secret
 */
const setSecret = (tokens: Tokens, res: Response): string => {
  // Generate new secret
  const secret = tokens.secretSync();

  res.cookie(
      config.jwt.name,
      generateToken({[secretName]: secret}),
      {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
  );

  return secret;
};

export default jwtCsrf;
