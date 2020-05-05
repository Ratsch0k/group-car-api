import express from 'express';
import User from '@app/user/user';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UserDto from '../../user/user-dto';
import {ProfilePic} from '@app/user';
import NotFoundError from '@app/errors/not-found-error';
import debug from 'debug';

const log = debug('group-car:user-router');
const error = debug('group-car:user-router:error');

const router: express.Router = express.Router();

/**
 * User router
 * @param req Http request
 * @param res Http response
 */
const userRouter: express.RequestHandler = (req, res) => {
  User.findAll().then((users: User[]) => {
    res.send(ModelToDtoConverter
        .convertAllSequelizeModels<UserDto>(users, UserDto));
  });
};

const userProfilePicRouter: express.RequestHandler = (req, res, next) => {
  const userId = req.params.userId;
  log('User id: %s', userId);

  ProfilePic.findOne({
    where: {
      userId,
    },
  }).then((pic) => {
    if (pic !== null) {
      log('Profile picture found');
      console.log(pic.data);
      res.type('image/jpeg');
      res.send(pic.data);
    } else {
      error('Profile picture doesn\'t exist');
      next(new NotFoundError());
    }
  });
};

/**
 * Add the {@link userRouter} to the get route
 */
router.get('/', userRouter);
router.get('/:userId/profile-pic', userProfilePicRouter);

export default router;
