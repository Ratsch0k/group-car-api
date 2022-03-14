import express from 'express';
import userController from './user-controller';
import inviteRouter from './invite';
import searchUserRouter from './search';
import settingsRouter from './settings';

const router = express.Router();

router.use('/', userController);
router.use('/invite', inviteRouter);
router.use('/search', searchUserRouter);
router.use('/settings', settingsRouter);

export default router;
