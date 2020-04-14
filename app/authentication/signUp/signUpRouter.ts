import express = require('express');
import debug = require('debug');
import signUpValidators from '@app/authentication/signUp/signUpValidators';
import signUpController from '@app/authentication/signUp/signUpController';
import {validationResult} from 'express-validator';
import InvalidRequestError from '@app/errors/invalidRequestError';
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
