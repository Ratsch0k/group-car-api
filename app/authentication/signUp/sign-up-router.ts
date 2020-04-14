import * as express from 'express';
import signUpValidators from '@app/authentication/signUp/sign-up-validators';
import signUpController from '@app/authentication/signUp/sign-up-controller';

const router: express.Router = express.Router();

/**
 * Add the {@link signUpRouter} to the router
 */
router.put('/', signUpValidators.validator, signUpController);

export default router;