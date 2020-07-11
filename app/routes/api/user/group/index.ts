import {Router} from 'express';
import userGroupGroupIdRouter from './group-id';

const userGroupRouter = Router();

userGroupRouter.use('/:groupId', userGroupGroupIdRouter);

export default userGroupRouter;
export * from './group-id';
