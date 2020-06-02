import express from 'express';
import User from '@app/user/user';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UserDto from '../../user/user-dto';
import {ProfilePic} from '@app/user';
import debug from 'debug';
import {UserNotFoundError} from '@app/errors';

const log = debug('group-car:user-router');
const error = debug('group-car:user-router:error');

const router: express.Router = express.Router();

/**
 * User router
 * @param req Http request
 * @param res Http response
 */
export const userRouter: express.RequestHandler = (req, res) => {
  User.findAll().then((users: User[]) => {
    res.send(ModelToDtoConverter
        .convertAllSequelizeModels<UserDto>(users, UserDto));
  });
};

export const userProfilePicRouter: express.RequestHandler =
(req, res, next) => {
  const userId = Number.parseInt(req.params.userId, 10);
  log('User id: %s', userId);

  ProfilePic.findOne({
    where: {
      userId,
    },
  }).then((pic) => {
    if (pic !== null) {
      log('Profile picture found');
      res.type('image/jpeg');
      res.send(pic.data);
    } else {
      error('Profile picture doesn\'t exist');
      next(new UserNotFoundError(userId));
    }
  }).catch((err: Error) => {
    error('ProfilePic search threw error: %s', err.message);
    next(err);
  });
};

/**
 * Add the routers to the route
 */
router.get('/', userRouter);
router.get('/:userId/profile-pic', userProfilePicRouter);

export default router;