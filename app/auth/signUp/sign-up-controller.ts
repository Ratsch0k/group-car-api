import debug from 'debug';
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
const log = debug('group-car:sign-up:controller:log');
/**
 * Log method for error logging
 */
const error = debug('group-car:sign-up:controller:error');

/**
 * Signs the user up.\
 * Creates a new user with the given properties.
 * @param email     Email of the user
 * @param username  Username
 * @param password  Password
 */
const signUpController: RequestHandler = (req, res, next) => {
  log('Create new user for %o', req.body);
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  }).then((user) => {
    log('User %o successfully created', req.body);
    res.send(ModelToDtoConverter
        .convert<UserDto>(user.get({plain: true}), UserDto));
  }).catch((err) => {
    // Handle unique constraints error differently
    if (err instanceof UniqueConstraintError) {
      error('Couldn\'t create user %o, because username already exists',
          req.body);
      next(new UsernameAlreadyExistsError(req.body.username));
    } else {
      error('Couldn\'t create user %o', req.body);
      next(err);
    }
  });
};

export default signUpController;

