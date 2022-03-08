import {Router} from 'express';
import changePasswordController from './change-password-controller';
import {passwordValidator} from '@app/validators/user-validators';
import {body} from 'express-validator';
import {asyncWrapper} from '@util/async-wrapper';
import createValidationRouter from '@app/validators/create-validation-router';

const changePasswordRouter = Router();

const oldPasswordValidator = body('oldPassword')
    .isString().withMessage('has to be a string')
    .notEmpty().withMessage('has to be a non-empty string');

changePasswordRouter.post(
    '/',
    createValidationRouter(
        'user:settings:change-password',
        [passwordValidator(body('newPassword')), oldPasswordValidator],
        'Change password',
    ),
    asyncWrapper(changePasswordController),
);

export default changePasswordRouter;
