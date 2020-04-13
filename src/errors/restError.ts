import {STATUS_CODES} from 'http';

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

export default RestError;
