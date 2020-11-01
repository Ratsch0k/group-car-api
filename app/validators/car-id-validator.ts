import {param} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

/**
 * The validation chain for the create group request.
 */
export const carIdValidator = [
  param('carId')
      .exists()
      .withMessage('carId is missing')
      .isNumeric().withMessage('carId has to be a number'),
];

/**
 * Router for connecting the validator chain and the validation handler
 */
const carIdValidationRouter = Router({mergeParams: true}).use(
    '/',
    carIdValidator,
    createValidationResultHandler({
      debugScope: 'group-car:validation:carId-id',
      requestName: (req) => `check carId ${req.params.carId}`,
    }),
);

export default carIdValidationRouter;
