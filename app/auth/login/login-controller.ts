import User from '@app/users/user';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UserDto from '@app/users/user-dto';
import bcrypt from 'bcrypt';
import debug from 'debug';
import InvalidLoginError from '@app/errors/login/invalid-login-error';
import {generateToken, cookieOptions} from '@app/util/jwt-util';

type RequestHandler = import('express').RequestHandler;

const log = debug('group-car:login:controller:log');
const error = debug('group-car:login:controller:error');

/**
 * Login controller
 * @param username Username of the login request
 * @param password Password of the login request
 * @return Whether or not the login was successful
 */
const loginController: RequestHandler = (req, res, next) => {
  User.findByUsername(req.body.username)
      .then((user: User | null) => {
        if (user === null) {
          error('User "%s" doesn\'t exist', req.body.username);
          throw new InvalidLoginError();
        } else {
          log('Found user "%s"', req.body.username);
          // Compare password
          return bcrypt.compare(req.body.password, user.password)
              .then((result) => {
                // Check if sent password is equal to stored user password
                if (result) {
                  res.cookie('jwt',
                      generateToken(user),
                      cookieOptions);
                  res.send(ModelToDtoConverter
                      .convertSequelizeModel(user, UserDto));
                } else {
                  throw new InvalidLoginError();
                }
              });
        }
      }).catch((err) => {
        next(err);
      });
};

export default loginController;
