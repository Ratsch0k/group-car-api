import express from 'express';
import debug from 'debug';
import loginController from './login-controller';
import {validationResult, check} from 'express-validator';
import {InvalidRequestError} from '@errors';

const log = debug('group-car:login:log');
const router: express.Router = express.Router();

/**
 * Login validator
 * @param req - Http request
 * @param res - Http response
 */
export const loginValidationHandler: express.RequestHandler = (
    req,
    res,
    next) => {
  log('IP %s requested login for user "%s"', req.ip, req.body.username);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

export const loginValidator = [
  check('username').notEmpty().escape().trim(),
  check('password').notEmpty(),
];

/**
 * Add the {@link loginValidationHandler} to the router
 */
router.put(
    '/',
    loginValidator,
    loginValidationHandler,
    loginController,
);

export default router;
