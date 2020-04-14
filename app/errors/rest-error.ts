import {STATUS_CODES} from 'http';

/**
 * The model of an error response.
 */
export class RestError extends Error {
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
  public readonly errorInfo?: any;

  /**
   * Creates an instance of this class.
   * @param statusCode Http status code of the error
   * @param message   Message of the error
   * @param timestamp When the error occurred
   * @param error     More info about the error,
   *    can be used on the client for better error visualization
   */
  constructor(statusCode: number,
      message: string,
      timestamp: Date,
      errorInfo?: any) {
    super();
    this.statusCode = statusCode;
    this.status = STATUS_CODES[statusCode];
    this.message = message;
    this.timestamp = timestamp;
    this.errorInfo = errorInfo;
  }
}

export default RestError;
