import {
  GroupValidators,
  GroupValidatorsImpl,
} from '@app/validators/group-validators';
import {ValidatorsImpl} from 'express-validator/src/chain';
import {
  UserValidators,
  UserValidatorsImpl,
} from '@app/validators/user-validators';
import {CarValidators, CarValidatorsImpl} from '@app/validators/car-validators';

export type ExtendedValidationChain = GroupValidators &
  UserValidators &
  CarValidators;
const customValidators = [
  GroupValidatorsImpl,
  UserValidatorsImpl,
  CarValidatorsImpl,
];

/**
 * Injects custom validation checks into the validation chain
 * of **express-validator**.
 *
 * This function also requires
 * a modification of the `ValidationChain` type in
 * `typings/index.d.ts` for typescript to properly
 * detect the added custom check methods.
 *
 * This function should be called somewhere at
 * the start of the app so that custom validators
 * are always added.
 */
export const injectCustomChecks = (): void => {
  for (const validators of customValidators) {
    const validatorsNames = Object.getOwnPropertyNames(validators.prototype)
        .filter((name) => name !== 'constructor');
    for (const name of validatorsNames) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (ValidatorsImpl.prototype as any)[name] =
        (validators.prototype as any)[name];
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  }
};

