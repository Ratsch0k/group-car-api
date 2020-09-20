import BadRequestError from './bad-request-error';
import {Result} from 'express-validator';

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
        // Check if this item has nested errors, if it does, append them
        if (resultArray[i].nestedErrors) {
          const nested = resultArray[i].nestedErrors as
              Array<Record<string, unknown>>;
          for (let j = 0; j < nested.length; j++) {
            message += `${nested[j].param} -> ${nested[j].msg}, `;
          }
        } else {
          message += `${resultArray[i].param} -> ${resultArray[i].msg}, `;
        }
      }

      // Remove the last ', '
      message = message.substring(0, message.length - 2);
    }

    super(message, validationResult as unknown as Record<string, unknown>);

    this.validationResult = validationResult;
  }
}

export default InvalidRequestError;
