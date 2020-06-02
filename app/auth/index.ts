import * as express from 'express';
import loginValidator from './login/login-validator';
import signUpValidator from './signUp/sign-up-validator';
import csrfRouter from './csrf/csrf-router';
import tokenRouter from './token/token-router';
import logoutRouter from './logout/logout-router';
const router = express.Router();


router.use('/', csrfRouter);
router.use('/login', loginValidator);
router.use('/sign-up', signUpValidator);
router.use('/token', tokenRouter);
router.use('/logout', logoutRouter);

export default router;
