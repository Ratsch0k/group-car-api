import express from 'express';
import User from '@app/users/user';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import UserDto from './user-dto';
import debug from 'debug';

const log = debug('group-car:user:router:log');
const router: express.Router = express.Router();

/**
 * User router
 * @param req Http request
 * @param res Http response
 */
const userRouter: express.RequestHandler = (req, res) => {
  User.findAll().then((users: User[]) => {
    log(users);
    res.send(ModelToDtoConverter
        .convertAllSequelizeModels<UserDto>(users, UserDto));
  });
};

/**
 * Add the {@link userRouter} to the get route
 */
router.get('/users', userRouter);

export default router;
