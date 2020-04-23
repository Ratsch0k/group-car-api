import * as express from 'express';
import loginRouter from './login/login-router';
import signUpRouter from './signUp/sign-up-router';
import csrfRouter from './csrf/csrf-router';
const router = express.Router();


router.use('/', csrfRouter);
router.use('/login', loginRouter);
router.use('/sign-up', signUpRouter);

export default router;
