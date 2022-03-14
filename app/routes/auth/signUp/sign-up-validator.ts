import * as express from 'express';
import signUpController from '@app/routes/auth/signUp/sign-up-controller';
import {asyncWrapper} from '@util/async-wrapper';
import {
  emailValidator,
  passwordValidator,
  usernameValidator,
} from '@app/validators/user-validators';
import createValidationRouter from '@app/validators/create-validation-router';
const router: express.Router = express.Router();


export const signUpValidator = [
  usernameValidator(),
  emailValidator(),
  passwordValidator(),
];

/**
 * Add the {@link signUpValidationHandler} to the router.
 */
/*
router.post(
    '/',
    signUpValidator,
    createValidationResultHandler({
      debugScope: 'group-car:sign-up',
      requestName: (req) => `Sign up for "${req.body.username}"`,
    }),
    asyncWrapper(signUpController),
);
*/
router.post(
    '/',
    createValidationRouter(
        'sign-up',
        signUpValidator,
        (req) => `Sign up as \"${req.body.username}\"`,
    ),
    asyncWrapper(signUpController),
);


export default router;
