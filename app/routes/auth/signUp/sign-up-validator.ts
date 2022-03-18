import * as express from 'express';
import signUpController from '@app/routes/auth/signUp/sign-up-controller';
import {asyncWrapper} from '@util/async-wrapper';
import {
  createValidationRouter,
} from '@app/validators';
import {body} from 'express-validator';
const router: express.Router = express.Router();


export const signUpValidator = [
  body('username').exists().withMessage('username is missing').isUsername(),
  body('email')
      .exists().withMessage('email is missing')
      .escape()
      .trim()
      .isEmail()
      .withMessage('Email has to be a valid email address'),
  body('password').exists().withMessage('password is missing').isPassword(),
];

/**
 * Add the {@link signUpValidationHandler} to the router.
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
