import * as express from 'express';
import signUpValidators from '@app/auth/signUp/sign-up-validators';
import signUpController from '@app/auth/signUp/sign-up-controller';
import {validationResult} from 'express-validator';
import {InvalidRequestError} from '@app/errors';
import debug from 'debug';

const log = debug('group-car:sign-up:router:log');
const error = debug('group-car:sign-up:router:error');
const router: express.Router = express.Router();

/**
 * Handles the result of the validation.
 * @param req   Http request
 * @param res   Http response
 * @param next  Next handler
 */
export const signUpValidator: express.RequestHandler = (req, res, next) => {
  log('IP %s requested sign up', req.ip);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Sign up for IP %s failed validation', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

/**
 * Add the {@link signUpValidator} to the router
 */
router.put('/', signUpValidators.validator, signUpValidator, signUpController);

export default router;
