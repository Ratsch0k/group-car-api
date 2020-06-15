import debug from 'debug';
import {validationResult} from 'express-validator';
import {InvalidRequestError} from '@app/errors';

type RequestHandler = import('express').RequestHandler;
type Request = import('express').Request;

export interface Options {
  /**
   * Key which should be used for logging.
   *
   * For example:
   *
   * By calling this method like this:
   * ```typescript
   * validationResultHandler('my-server:module', '...');
   * ```
   * the method will use the following for logging if
   * an ip requested an action and if the validation succeeded.
   * ```typescript
   * debug('my-server:module');
   * ```
   * and the following if the validation failed
   * ```typescript
   * debug('my-server:module:error');
   * ```
   */
  debugScope: string;

  /**
   * Short name for the request.
   *
   * This will be used in the logging messages to
   * indicate what action was requested.
   *
   * If this option is a function, the function will be called with
   * the request object of the request. The function should then return
   * a string.
   */
  requestName: ((req: Request) => string) | string;
}

/**
 * Creates a request handler which handles the `validationResult` of the
 * request. The request handler expects that the request is already validated.
 * @param options - The options with which the validationResultHandler
 *  should be created
 */
export const createValidationResultHandler:
(options: Options) => RequestHandler = (options: Options) => {
  // Check if options are defined
  if (!options) {
    throw new Error('The options object has to be provided');
  } else if (!options.debugScope || typeof options.debugScope !== 'string') {
    throw new Error('options.debugScope has to be a non empty string');
  } else if (!options.requestName ||
    (
      typeof options.requestName !== 'string' &&
      typeof options.requestName !== 'function'
    )) {
    throw new Error('options.request has to be a non empty string or ' +
      'a function which will return a string');
  }

  // Create debug methods
  const log = debug(options.debugScope);
  const error = debug(`${options.debugScope}:error`);

  // Return the request handler
  return (req, _res, next) => {
    const requestName = typeof options.requestName === 'string' ?
        options.requestName : options.requestName(req);

    log('IP %s requested: %s', req.ip, requestName);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      error('Request of IP %s failed validation for: %s',
          req.ip, requestName);
      throw new InvalidRequestError(errors);
    } else {
      log('Request of IP %s passed validation for: %s',
          req.ip, requestName);
      next();
    }
  };
};
