import {Router} from 'express';
import changePasswordController from './change-password-controller';
import {
  createValidationRouter,
} from '@app/validators';
import {body} from 'express-validator';
import {asyncWrapper} from '@util/async-wrapper';

const changePasswordRouter = Router();

const oldPasswordValidator = body('oldPassword')
    .exists().withMessage('oldPassword is missing')
    .isString().withMessage('oldPassword has to be a string')
    .notEmpty().withMessage('oldPassword has to be a non-empty string');

changePasswordRouter.post(
    '/',
    createValidationRouter(
        'user:settings:change-password',
        [
          body('newPassword').exists().withMessage('newPassword is missing')
              .isPassword('newPassword'),
          oldPasswordValidator,
        ],
        'Change password',
    ),
    asyncWrapper(changePasswordController),
);

export default changePasswordRouter;
