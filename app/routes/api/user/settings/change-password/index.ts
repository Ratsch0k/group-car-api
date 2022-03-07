import {Router} from 'express';
import changePasswordController from './change-password-controller';
import {passwordValidator} from '@app/validators/user-validators';
import {body} from 'express-validator';

const changePasswordRouter = Router();

changePasswordRouter.post(
    '/',
    [passwordValidator(body('newPassword'))],
    changePasswordController,
);

export default changePasswordRouter;
