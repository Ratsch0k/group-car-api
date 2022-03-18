import {ValidationChain} from 'express-validator';
import {CarColor} from '@models';
import {ValidatorsImpl} from 'express-validator/src/chain';

/**
 * Class for additional car related validation checks.
 */
export class CarValidators extends ValidatorsImpl<ValidationChain> {
  /**
   * Checks if car color.
   */
  isCarColor(): ValidationChain {
    return this
        .isString()
        .withMessage('color has to be a string')
        .isIn(Object.values(CarColor).filter((value) => isNaN(Number(value))))
        .withMessage('color has to be an available color');
  }

  /**
   * Checks if car name.
   */
  isCarName(): ValidationChain {
    return this
        .isString()
        .withMessage('name has to be a string')
        .isLength({min: 1})
        .withMessage('name has to be a non empty string');
  }

  /**
   * Checks if latitude.
   */
  isLatitude(): ValidationChain {
    return this
        .isFloat({min: -90, max: 90})
        .withMessage('latitude has to be a number between -90 and 90');
  }

  /**
   * Checks if longitude.
   */
  isLongitude(): ValidationChain {
    return this
        .isFloat({min: -180, max: 180})
        .withMessage('longitude has to be a number between -180 and 180');
  }
}
