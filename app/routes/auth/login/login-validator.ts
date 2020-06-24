import {Router} from 'express';
import loginController from './login-controller';
import {createValidationResultHandler} from '@util/validation-result-handler';
import {check} from 'express-validator';

export const loginValidator = [
  check('username').notEmpty().escape().trim(),
  check('password').notEmpty(),
];

/**
 * Add the {@link loginValidationHandler} to the router
 */
const router = Router().put(
    '/',
    loginValidator,
    createValidationResultHandler({
      debugScope: 'group-car:login',
      requestName: (req) => `login for user "${req.body.username}"`,
    }),
    loginController,
);

export default router;
