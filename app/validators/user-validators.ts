import {ValidationChain} from 'express-validator';
import {Validators, ValidatorsImpl} from 'express-validator/src/chain';

export interface UserValidators extends Validators<ValidationChain> {
  isPassword(name?: string): ValidationChain;
  isUsername(name?: string): ValidationChain;
}

/**
 * Additional checks for user related checks.
 */
export class UserValidatorsImpl extends ValidatorsImpl<ValidationChain> {
  /**
   * Checks if field conforms to password rules.
   */
  isPassword(name = 'password'): ValidationChain {
    return this
        .isString()
        .withMessage(name + ' has to be a string')
        .isLength({min: 6, max: 255})
        .withMessage(name + ' has to be at least 6 characters long');
  }

  /**
   * Checks if conforms to username rules.
   */
  isUsername(name = 'username'): ValidationChain {
    return this
        .isString()
        .trim()
        .notEmpty()
        .isLength({min: 4, max: 25})
        .withMessage(name + ' has to be between 4 and 25 characters long')
        .custom((value: string) => {
          if (/\s/.test(value)) {
            throw new Error(name + ' should not contain whitespace');
          }
          return true;
        })
        .escape();
  }
}
