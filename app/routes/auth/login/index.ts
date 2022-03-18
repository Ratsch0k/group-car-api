import {Router} from 'express';
import {createValidationRouter} from '@app/validators';
import {check} from 'express-validator';
import loginController from './login-controller';

const loginRouter = Router().put(
    '/',
    createValidationRouter(
        'login',
        [
          check('username').notEmpty().escape().trim(),
          check('password').notEmpty(),
        ],
        (req) => `login for user "${req.body.username}"`,
    ),
    loginController,
);

export default loginRouter;
