import {ValidationChain} from 'express-validator';
import {ValidatorsImpl, Validators} from 'express-validator/src/chain';

export interface GroupValidators extends Validators<ValidationChain> {
  isGroupName(): ValidationChain;
  isGroupDescription(): ValidationChain;
}

/**
 * Class for additional validators related to groups.
 */
export class GroupValidatorsImpl extends ValidatorsImpl<ValidationChain> {
  /**
   * Check if group name.
   */
  isGroupName(): ValidationChain {
    return this
        .isString()
        .withMessage('Name has to be a string')
        .notEmpty()
        .withMessage('Name has to be a non empty string')
        // Sanitize name
        .trim()
        .escape();
  }

  /**
   * Check if group description
   */
  isGroupDescription(): ValidationChain {
    return this
        // But if it exists it has to be a non-empty string
        .isString()
        .withMessage('Description has to be a string')
        // Sanitize description
        .trim()
        .escape();
  }
}
