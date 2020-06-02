import express from 'express';
import debug from 'debug';
import loginValidators from './login-validators';
import loginController from './login-controller';
import {validationResult} from 'express-validator';
import {InvalidRequestError} from '@app/errors';

const log = debug('group-car:login:log');
const router: express.Router = express.Router();

/**
 * Login router
 * @param req Http request
 * @param res Http response
 */
export const loginValidator: express.RequestHandler = (req, res, next) => {
  log('IP %s requested login for user "%s"', req.ip, req.body.username);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

/**
 * Add the {@link loginRouter} to the router
 */
router.put('/', loginValidators.validator, loginValidator, loginController);

export default router;
