import * as express from 'express';
import signUpController from '@app/auth/signUp/sign-up-controller';
import {createValidationResultHandler} from '@util/validation-result-handler';
import {body} from 'express-validator';
const router: express.Router = express.Router();


export const signUpValidator = [
  body('username')
      .isString()
      .trim()
      .notEmpty()
      .isLength({min: 4, max: 25})
      .withMessage('Username has to be between 4 and 25 characters long')
      .custom((value: string) => {
        if (/\s/.test(value)) {
          throw new Error('Username should not contain whitespace');
        }
        return true;
      })
      .escape(),
  body('email').escape().trim().isEmail()
      .withMessage('Email has to be a valid email address'),
  body('password').isLength({min: 6, max: 255})
      .withMessage('Password has to be at least 6 characters long'),
];

/**
 * Add the {@link signUpValidationHandler} to the router.
 */
router.put(
    '/',
    signUpValidator,
    createValidationResultHandler({
      debugScope: 'group-car:sign-up',
      requestName: (req) => `Sign up for "${req.body.username}"`,
    }),
    signUpController,
);

export default router;
