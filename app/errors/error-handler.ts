import {ErrorRequestHandler} from 'express';
import RestError from './rest-error';
import InternalError from './internal-error';
import config from '@config';
import debug from 'debug';
import UnauthorizedRestError from './unauthorized-error';
import ForbiddenError from './forbidden-error';
import BadRequestError from './bad-request-error';

import {UnauthorizedError} from 'express-jwt';

const log = debug('group-car:error-handler');
const error = debug('group-car:error-handler:error');

/**
 * The general error handler for errors.
 * @param err - Thrown error
 * @param req - Request
 * @param res - Response
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let restError: RestError;
  if (err instanceof RestError) {
    log('Handling error: "%s"', err.constructor.name);
    restError = new RestError(
        err.statusCode,
        err.message,
        err.detail,
    );
    restError.detail = {
      ...restError.detail,
      errorName: err.constructor.name,
    };
  } else {
    // Check if authorization error
    if (err.name === 'UnauthorizedError') {
      log('Request with invalid jwt token handled. Message: %s',
          (err as UnauthorizedError).message);
      restError = new UnauthorizedRestError('Invalid token');
    } else if (err.code === 'EBADCSRFTOKEN') {
      log('Request has invalid csrf token');
      restError = new ForbiddenError();
    } else if (err instanceof SyntaxError) {
      restError = new BadRequestError('Malformed request');
    } else if (!config.error.withStack) {
      error(err.stack);
      restError = new InternalError();
    } else {
      error(err.stack);
      restError = new InternalError(
          err.message,
          undefined,
          err.stack,
      );
    }
    restError.detail = {
      ...restError.detail,
      errorName: restError.constructor.name,
    };
  }

  res.status(restError.statusCode).send(restError);
};

export default errorHandler;
