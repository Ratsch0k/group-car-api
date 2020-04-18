import User from '@app/users/user';
import {BadRequestError} from '@app/errors';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UserDto from '@app/users/user-dto';

type RequestHandler = import('express').RequestHandler;

/**
 * Login controller
 * @param username Username of the login request
 * @param password Password of the login request
 * @return Whether or not the login was successful
 */
const loginController: RequestHandler = (req, res, next ) => {
  User.findOne({
    where: {
      username: req.body.username,
    },
  }).then((user: User | null) => {
    if (user === null) {
      return Promise.reject(new BadRequestError('User doesn\'t exist'));
    } else {
      res.send(ModelToDtoConverter.convertSequelizeModel(user, UserDto));
    }
  }).catch((err) => {
    next(err);
  });
};

export default loginController;
