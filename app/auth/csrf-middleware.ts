import config from '@app/config';
import {InvalidCsrfTokenError} from '@app/errors';
import debug from 'debug';
import {NextFunction, Router, Request, Response} from 'express';

/**
 * CSRFMiddleware options.
 */
export interface CSRFMiddlewareOptions {
  methods?: string[]
}

/**
 * Default options for the middleware.
 */
export const defaultOptions ={
  methods: ['post', 'put'],
};

const log = debug('group-car:csrf');
const error = debug('group-car:csrf:error');

/**
 * Create a csrf request handler.
 * @param options - CSRFMiddleware options
 * @returns The request handler for checking the csrf
 */
const csrfCheckRequestHandler = (
    options: Required<CSRFMiddlewareOptions>,
) => (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
  // Check if method should be checked
  if (!options.methods.includes(req.method.toLowerCase())) {
    // If method should not be checked, just continue to the
    // next request handler
    log('Request uses ignored method %s', req.method.toLowerCase());
    next();
    return;
  }

  log('Checking request');
  const sentCsrfToken = req.header(config.auth.csrfTokenName);
  const sessionCsrfToken = req.session.csrfToken;

  if (sentCsrfToken !== sessionCsrfToken) {
    error('CSRF token doesn\'t match');
    throw new InvalidCsrfTokenError();
  }

  next();
};

/**
 * Create the csrf middleware with the given options
 *
 * The csrf middleware checks on specific methods that the request
 * contains a the csrf token associated with the request's session.
 * If the request's method is ignored or if the csrf token is valid,
 * the middleware will hand handling to the next request handler.
 * If the request doesn't contain a token at all or if the provided token
 * is invalid, it will reject the request by throwing
 * an {@link InvalidCsrfTokenError}
 * exception. A csrf token is invalid if it isn't the same as the
 * value stored in the session.
 * @param options - CSRFMiddleware options
 * @returns The csrf middleware
 */
export const csrfMiddleware = (options: CSRFMiddlewareOptions = {}): Router => {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };
  const router = Router();
  router.use(csrfCheckRequestHandler(mergedOptions));

  return router;
};
