import express from 'express';
import userController from './user-controller';
import inviteRouter from './invite';
import searchUserRouter from './search';

const router = express.Router();

router.use('/', userController);
router.use('/invite', inviteRouter);
router.use('/search', searchUserRouter);

export default router;
