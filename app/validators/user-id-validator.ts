import {param} from 'express-validator';
import createValidationRouter from '@app/validators/create-validation-router';

/**
 * Validation chain for validating user id.
 */
export const userIdValidator = [
  param('userId')
      .exists()
      .withMessage('userId is missing')
      .isNumeric()
      .withMessage('userId has to be a number'),
];

/**
 * Validation router for validating and handling result of
 * validation of user id.
 */
const userIdValidationRouter = createValidationRouter(
    'user-id',
    userIdValidator,
    (req) => `check userId ${req.params.userId}`,
);

export default userIdValidationRouter;
