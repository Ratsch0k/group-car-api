import express = require('express');
import debug = require('debug');
import signUpValidators from 'validators/signUpValidators';
import signUpController from 'controllers/auth/signUpController';
import {validationResult} from 'express-validator';
import InvalidRequestError from 'src/errors/invalidReqestError';
debug('group-car:login');
const router: express.Router = express.Router();

/**
 * Sign up router
 * @param req Http request
 * @param res Http response
 */
const signUpRouter: express.RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

/**
 * Add the {@link signUpRouter} to the router
 */
router.put('/', signUpValidators.validator, signUpRouter, signUpController);

export default router;
