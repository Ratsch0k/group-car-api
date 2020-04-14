type ErrorRequestHandler = import('express').ErrorRequestHandler;
import RestError from './rest-error';
import InternalError from './internal-error';

/**
 * The general error handler for errors.
 * @param err Thrown error
 * @param req Request
 * @param res Response
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof RestError) {
    res.status(err.statusCode).send(new RestError(err.statusCode,
        err.message,
        err.timestamp,
        err.detail));
  } else {
    if (process.env.NODE_ENV === 'production') {
      res.status(500).send(new InternalError());
    } else {
      res.status(500).send(new InternalError(err.stack));
    }
  }
};

export default errorHandler;
