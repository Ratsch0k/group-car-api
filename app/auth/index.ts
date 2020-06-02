import * as express from 'express';
import loginRouter from './login/login-validator';
import signUpRouter from './signUp/sign-up-validator';
import csrfRouter from './csrf/csrf-router';
import tokenRouter from './token/token-router';
import logoutRouter from './logout/logout-router';
const router = express.Router();


router.use('/', csrfRouter);
router.use('/login', loginRouter);
router.use('/sign-up', signUpRouter);
router.use('/token', tokenRouter);
router.use('/logout', logoutRouter);

export default router;
