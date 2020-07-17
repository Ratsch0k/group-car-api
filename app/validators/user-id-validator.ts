import {param} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

/**
 * Validation chain for validating user id.
 */
export const userIdValidator = [
  param('userId')
      .exists()
      .withMessage('userId is missing')
      .isNumeric()
      .withMessage('userId has to be number'),
];

/**
 * Validation router for validating and handling result of
 * validation of user id.
 */
const userIdValidationRouter = Router({mergeParams: true}).use(
    '/',
    userIdValidator,
    createValidationResultHandler({
      debugScope: 'group-car:validation:user-id',
      requestName: (req) => `check userId ${req.params.userId}`,
    }),
);

export default userIdValidationRouter;
