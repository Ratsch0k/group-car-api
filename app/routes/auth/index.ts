import * as express from 'express';
import loginRouter from './login';
import signUpValidator from './signUp/sign-up-validator';
import tokenRouter from './token/token-router';
import logoutRouter from './logout/logout-router';
import csrfRouter from './csrf';
const router = express.Router();


router.use('/', csrfRouter);
router.use('/login', loginRouter);
router.use('/sign-up', signUpValidator);
router.use('/token', tokenRouter);
router.use('/logout', logoutRouter);

export default router;
