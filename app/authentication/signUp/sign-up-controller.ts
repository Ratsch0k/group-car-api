import debug from 'debug';
import {validationResult} from 'express-validator';
import InvalidRequestError from '@app/errors/invalid-request-error';

type RequestHandler = import('express').RequestHandler;

/**
 * Log method for normal debug logging
 */
const log = debug('group-car:signup:controller:log');
/**
 * Log method for error logging
 */
const error = debug('group-car:signup:controller:error');

/**
 * Signs the user up.\
 * Creates a new user with the given properties.
 * @param email     Email of the user
 * @param username  Username
 * @param password  Password
 */
const signUpController: RequestHandler = (req, res) => {
  log('IP %s requested sign up', req.ip);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Sign up for IP %s failed validation', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    log('Sign up for IP %s passed validation', req.ip);
  }
};

export default signUpController;

