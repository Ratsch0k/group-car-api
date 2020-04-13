import {STATUS_CODES} from 'http';
type Send = import('express').Send;
type Response = import('express').Response;


/**
 * The model of an error response.
 */
export class RestError {
  /**
   * The http status code of the error.
   */
  public readonly statusCode: number;

  /**
   * The string representation of the http status code.
   */
  public readonly status: string | undefined;

  /**
   * The message of the error.
   */
  public readonly message: string;

  /**
   * The date when the error occurred.
   */
  public readonly timestamp: Date;

  /**
   * The error object which was thrown.
   */
  public readonly error?: Error;

  /**
   * Creates an instance of this class.
   * @param statusCode Http status code of the error
   * @param message   Message of the error
   * @param timestamp When the error occurred
   * @param error     The thrown error
   */
  constructor(statusCode: number,
      message: string,
      timestamp: Date,
      error?: Error) {
    this.statusCode = statusCode;
    this.status = STATUS_CODES[statusCode];
    this.message = message;
    this.timestamp = timestamp;
    this.error = error;
  }
}

/* eslint-disable no-invalid-this */
/**
 * Returns a function which can overwrite {@link res.send} of
 * express to include custom error handling.\
 * The overwritten send function will check if
 * the provided body is an instanceof of {@link RestError}
 * and set the status of the {@link Response} according to
 * the the statusCode of the body
 * @param send The send function
 */
const errorHandler = function(send: Send) {
  return function(this: Response, body?: any) {
    if (typeof body === 'object' && body instanceof RestError) {
      this.status((<RestError>body).statusCode);
    }

    // eslint-disable-next-line prefer-rest-params
    send.apply(this, arguments as any);
    return this;
  };
};

export default errorHandler;
