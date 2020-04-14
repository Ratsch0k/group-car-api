import * as express from 'express';
import signUpValidators from '@app/authentication/signUp/signUpValidators';
import signUpController from '@app/authentication/signUp/signUpController';

const router: express.Router = express.Router();

/**
 * Add the {@link signUpRouter} to the router
 */
router.put('/', signUpValidators.validator, signUpController);

export default router;
