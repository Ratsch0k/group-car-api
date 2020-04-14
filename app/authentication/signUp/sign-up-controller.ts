import debug from 'debug';
import {validationResult} from 'express-validator';
import InvalidRequestError from '@app/errors/invalid-request-error';
import User from '@app/users/user';
import UserDto from '@app/users/user-dto';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UsernameAlreadyExistsError from
  '@app/users/username-already-exists-error';
import {UniqueConstraintError} from 'sequelize';

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
const signUpController: RequestHandler = (req, res, next) => {
  log('IP %s requested sign up', req.ip);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Sign up for IP %s failed validation', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    log('Sign up for IP %s passed validation', req.ip);

    User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    }).then((user) => {
      res.send(ModelToDtoConverter
          .convert<UserDto>(user.get({plain: true}), UserDto));
    }).catch((err) => {
      // Handle unique constraints error differently
      if (err instanceof UniqueConstraintError) {
        next(new UsernameAlreadyExistsError(req.body.username));
      } else {
        next(err);
      }
    });
  }
};

export default signUpController;

