import {Router} from 'express';
import updateGroupRouter from './update';
import deleteGroupRouter from './delete';
import getGroupRouter from './get';
import inviteUserToGroupRouter from './invite';
import leaveGroupRouter from './leave';
import groupGroupIdAdminRouter from './admin';
import {groupIdValidation} from '@app/validators';

const groupGroupIdRouter = Router({mergeParams: true});

groupGroupIdRouter.use(groupIdValidation);
groupGroupIdRouter.put('/', updateGroupRouter);
groupGroupIdRouter.delete('/', deleteGroupRouter);
groupGroupIdRouter.get('/', getGroupRouter);
groupGroupIdRouter.use('/invite', inviteUserToGroupRouter);
groupGroupIdRouter.use('/leave', leaveGroupRouter);
groupGroupIdRouter.use('/admin', groupGroupIdAdminRouter);

export default groupGroupIdRouter;

export * from './delete';
export * from './get';
export * from './update';
export * from './invite';
export * from './admin';
