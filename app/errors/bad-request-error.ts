import RestError from './rest-error';

/**
 * The error if a request is malformed.\
 * The request is most likely missing attributes or
 * attributes are not valid
 */
class BadRequestError extends RestError {
  /**
   * Creates an instance of this class.
   * @param message   Message of the error
   * @param errorInfo More error information
   */
  constructor(message: string, errorInfo?: any) {
    super(400, message, errorInfo);
  }
};

export default BadRequestError;
