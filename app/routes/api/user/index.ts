import express from 'express';
import userController from './user-controller';
import inviteRouter from './invite';

const router = express.Router();

router.use('/', userController);
router.use('/invite', inviteRouter);

export default router;
