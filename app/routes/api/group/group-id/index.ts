import {Router} from 'express';
import updateGroupRouter from './update';
import deleteGroupRouter from './delete';
import getGroupRouter from './get';
import inviteUserToGroupRouter from './invite';
import leaveGroupRouter from './leave';
import {groupIdValidation} from '@app/validators';
import groupGroupIdInvitesRouter from './invites';
import groupMemberRouter from './member';

const groupGroupIdRouter = Router({mergeParams: true});

groupGroupIdRouter.use(groupIdValidation);
groupGroupIdRouter.put('/', updateGroupRouter);
groupGroupIdRouter.delete('/', deleteGroupRouter);
groupGroupIdRouter.get('/', getGroupRouter);
groupGroupIdRouter.use('/invites', groupGroupIdInvitesRouter);
groupGroupIdRouter.use('/member', groupMemberRouter);
groupGroupIdRouter.use('/invite', inviteUserToGroupRouter);
groupGroupIdRouter.use('/leave', leaveGroupRouter);

export default groupGroupIdRouter;

export * from './delete';
export * from './get';
export * from './update';
export * from './invite';
export * from './member/user-id';
export * from './invites';
export * from './member';
