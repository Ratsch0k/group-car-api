import BadRequestError from './bad-request-error';
type Result = import('express-validator').Result;

/**
 * The error if a request has invalid attributes.
 */
class InvalidRequestError extends BadRequestError {
  /**
   * The result of the validation.
   */
  public validationResult: Result;

  /**
   * Creates an instance of this class.
   * @param validationResult - The result of the validation
   */
  constructor(validationResult: Result) {
    let message = '';
    if (!validationResult.isEmpty()) {
      message += 'The following fields are invalid: ';
      const resultArray: Array<Record<string, unknown>> =
          validationResult.array();
      for (let i = 0; i < resultArray.length; i++) {
        message += `${resultArray[i].param} -> ${resultArray[i].msg}, `;
      }

      // Remove the last ', '
      message = message.substring(0, message.length - 2);
    }

    super(message, validationResult as unknown as Record<string, unknown>);

    this.validationResult = validationResult;
  }
}

export default InvalidRequestError;
