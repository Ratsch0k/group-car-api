import {Router} from 'express';
import updateGroupRouter from './update';
import deleteGroupRouter from './delete';
import getGroupRouter from './get';
import inviteUserToGroupRouter from './invite';
import groupIdValidationRouter from './group-id-validator';
import leaveGroupRouter from './leave';

const groupGroupIdRouter = Router({mergeParams: true});

groupGroupIdRouter.use(groupIdValidationRouter);
groupGroupIdRouter.put('/', updateGroupRouter);
groupGroupIdRouter.delete('/', deleteGroupRouter);
groupGroupIdRouter.get('/', getGroupRouter);
groupGroupIdRouter.use('/invite', inviteUserToGroupRouter);
groupGroupIdRouter.use('/leave', leaveGroupRouter);

export default groupGroupIdRouter;

export * from './delete';
export * from './get';
export * from './update';
export * from './invite';
