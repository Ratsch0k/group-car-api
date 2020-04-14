import express from 'express';
const router: express.Router = express.Router();
import User from '@app/users/user';

/**
 * User router
 * @param req Http request
 * @param res Http response
 */
const userRouter: express.RequestHandler = (req, res) => {
  User.findAll().then((users: User[]) => {
    res.send(users);
  });
};

/**
 * Add the {@link userRouter} to the get route
 */
router.get('/', userRouter);

export default router;
