import debug from 'debug';
import User from '@app/user/user';
import UserDto from '@app/user/user-dto';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import {UsernameAlreadyExistsError} from '@errors';
import {UniqueConstraintError} from 'sequelize';
import {convertUserToJwtPayload} from '@app/jwt/jwt-util';
import {ProfilePic} from '@app/user';
import generatePb from '@app/util/generate-pb';
import config from '@config';

type RequestHandler = import('express').RequestHandler;

/**
 * Log method for normal debug logging
 */
const log = debug('group-car:sign-up:controller:log');
/**
 * Log method for error logging
 */
const error = debug('group-car:sign-up:controller:error');

const picDim = config.user.pb.dimensions;

/**
 * Signs the user up.\
 * Creates a new user with the given properties.
 * @param req   Http request, information about user in `req.body`
 * @param res   Http response
 * @param next  The next request handler
 */
const signUpController: RequestHandler = (req, res, next) => {
  log('Create new user for "%s"', req.body.username);
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  }).then((user) => {
    generatePb(picDim, req.body.username, req.body.offset ?? 0)
        .then((data: Buffer) => {
          console.log(data);
          return ProfilePic.create({
            data: data,
            userId: user.id,
          });
        }).then(() => {
          log('User "%s" successfully created', req.body.username);
          res.setJwtToken(convertUserToJwtPayload(user), user.username);
          res.status(201).send(ModelToDtoConverter
              .convert<UserDto>(user.get({plain: true}), UserDto));
        });
  }).catch((err) => {
    // Handle unique constraints error differently
    if (err instanceof UniqueConstraintError) {
      error('Couldn\'t create user "%s", because username already exists',
          req.body.username);
      next(new UsernameAlreadyExistsError(req.body.username));
    } else {
      error('Couldn\'t create user "%s"', req.body.username);
      next(err);
    }
  });
};

export default signUpController;

