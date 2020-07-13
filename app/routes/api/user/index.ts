import express from 'express';
import userController from './user-controller';
import inviteRouter from './invite';

const router = express.Router();

router.use('/', userController);
router.use('/invite', inviteRouter);

export default router;
export * from './group-id-validator';
export {default as groupIdValidator} from './group-id-validator';
