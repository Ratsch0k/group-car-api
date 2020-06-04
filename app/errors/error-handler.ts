type ErrorRequestHandler = import('express').ErrorRequestHandler;
import RestError from './rest-error';
import InternalError from './internal-error';
import config from '@config';
import debug from 'debug';
import UnauthorizedRestError from './unauthorized-error';
import ForbiddenError from './forbidden-error';

type UnauthorizedError = import('express-jwt').UnauthorizedError;

const log = debug('group-car:error-handler:log');
const error = debug('group-car:error-handler:error');

/**
 * The general error handler for errors.
 * @param err Thrown error
 * @param req Request
 * @param res Response
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof RestError) {
    log('Handling error: "%s"', err.constructor.name);
    res.status(err.statusCode).send(new RestError(err.statusCode,
        err.message,
        err.detail));
  } else {
    // Check if authorization error
    if (err.name === 'UnauthorizedError') {
      log('Request with invalid jwt token handled. Message: %s',
          (err as UnauthorizedError).message);
      res.status(401).send(new UnauthorizedRestError('Invalid token'));
    } else if (err.code === 'EBADCSRFTOKEN') {
      log('Request has invalid csrf token');
      res.status(403).send(new ForbiddenError());
    } else if (!config.error.withStack) {
      error(err.stack);
      res.status(500).send(new InternalError());
    } else {
      error(err.stack);
      res.status(500).send(new InternalError(undefined, err.stack));
    }
  }
};

export default errorHandler;
