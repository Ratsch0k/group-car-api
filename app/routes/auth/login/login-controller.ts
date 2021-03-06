import {User, UserDto} from '@models';
import ModelToDtoConverter from '@util/model-to-dto-converter';
import bcrypt from 'bcrypt';
import debug from 'debug';
import {InvalidLoginError} from '@errors';
import {convertUserToJwtPayload} from '@app/routes/auth/jwt/jwt-util';
import {RequestHandler} from 'express';

const log = debug('group-car:login:controller:log');
const error = debug('group-car:login:controller:error');

/**
 * Login controller
 * @param username - Username of the login request
 * @param password - Password of the login request
 * @returns Whether or not the login was successful
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
