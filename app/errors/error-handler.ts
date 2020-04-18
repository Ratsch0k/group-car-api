type ErrorRequestHandler = import('express').ErrorRequestHandler;
import RestError from './rest-error';
import InternalError from './internal-error';
import config from '@app/config';
import debug from 'debug';

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
        err.timestamp,
        err.detail));
  } else {
    error(err.stack);
    if (!config.error.withStack) {
      res.status(500).send(new InternalError());
    } else {
      res.status(500).send(new InternalError(undefined, err.stack));
    }
  }
};

export default errorHandler;
