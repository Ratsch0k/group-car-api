import debug from 'debug';
import {validationResult} from 'express-validator';
import InvalidRequestError from '@app/errors/invalidRequestError';

type RequestHandler = import('express').RequestHandler;

const log = debug('group-car:signup:controller:log');
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

