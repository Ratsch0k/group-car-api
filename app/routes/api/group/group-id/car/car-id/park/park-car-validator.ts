import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';
import {Router} from 'express';
import {body} from 'express-validator';

export const parkCarValidator = [
  body('latitude')
      .exists()
      .withMessage('latitude is missing')
      .isFloat({min: -90, max: 90})
      .withMessage('latitude has to be a number between -90 and 90'),
  body('longitude')
      .exists()
      .withMessage('longitude is missing')
      .isFloat({min: -180, max: 180})
      .withMessage('longitude has to be a number between -180 and 180'),
];

const parkCarValidationRouter = Router().use(
    parkCarValidator,
    createValidationResultHandler({
      debugScope: 'group-car:car:park',
      requestName: 'check location',
    }),
);

export default parkCarValidationRouter;
