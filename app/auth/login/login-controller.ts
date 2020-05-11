import User from '@app/user/user';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UserDto from '@app/user/user-dto';
import bcrypt from 'bcrypt';
import debug from 'debug';
import InvalidLoginError from '@app/errors/login/invalid-login-error';
import {convertUserToJwtPayload} from '@app/jwt/jwt-util';

type RequestHandler = import('express').RequestHandler;
type UserType = import('@app/user/user').default;

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
      .then((user: UserType | null) => {
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
                  log('Login successful for IP %s', req.ip);
                  res.setJwtToken(convertUserToJwtPayload(user), user.username);
                  res.send(ModelToDtoConverter
                      .convertSequelizeModel(user, UserDto));
                } else {
                  error('Invalid password for IP %s', req.ip);
                  throw new InvalidLoginError();
                }
              });
        }
      }).catch((err) => {
        next(err);
      });
};

export default loginController;
