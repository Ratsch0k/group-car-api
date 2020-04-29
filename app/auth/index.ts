import * as express from 'express';
import loginRouter from './login/login-router';
import signUpRouter from './signUp/sign-up-router';
import csrfRouter from './csrf/csrf-router';
import tokenRouter from './token/token-router';
const router = express.Router();


router.use('/', csrfRouter);
router.use('/login', loginRouter);
router.use('/sign-up', signUpRouter);
router.use('/token', tokenRouter);

export default router;
