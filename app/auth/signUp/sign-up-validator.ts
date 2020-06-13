import * as express from 'express';
import signUpController from '@app/auth/signUp/sign-up-controller';
import {validationResult, body} from 'express-validator';
import {InvalidRequestError} from '@errors';
import debug from 'debug';

const log = debug('group-car:sign-up:router:log');
const error = debug('group-car:sign-up:router:error');
const router: express.Router = express.Router();

/**
 * Handles the result of the validation.
 * @param req  - Http request
 * @param res  - Http response
 * @param next - Next handler
 */
export const signUpValidationHandler: express.RequestHandler = (
    req,
    res,
    next,
) => {
  log('IP %s requested sign up', req.ip);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Sign up for IP %s failed validation', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

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
    signUpValidationHandler,
    signUpController,
);

export default router;
