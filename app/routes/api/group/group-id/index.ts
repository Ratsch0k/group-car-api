import {Router} from 'express';
import updateGroupRouter from './update';
import deleteGroupRouter from './delete';
import getGroupRouter from './get';
import inviteUserToGroupRouter from './invite';
import leaveGroupRouter from './leave';
import groupGroupIdInvitesRouter from './invites';
import groupMemberRouter from './member';
import groupCarRouter from './car';
import createValidationRouter from '@app/validators/create-validation-router';
import {groupIdValidator} from '@app/validators';

const groupGroupIdRouter = Router({mergeParams: true});

groupGroupIdRouter.use(
    createValidationRouter('groupId', groupIdValidator(), 'check-groupId'));
groupGroupIdRouter.put('/', updateGroupRouter);
groupGroupIdRouter.delete('/', deleteGroupRouter);
groupGroupIdRouter.get('/', getGroupRouter);
groupGroupIdRouter.use('/invites', groupGroupIdInvitesRouter);
groupGroupIdRouter.use('/member', groupMemberRouter);
groupGroupIdRouter.use('/invite', inviteUserToGroupRouter);
groupGroupIdRouter.use('/leave', leaveGroupRouter);
groupGroupIdRouter.use('/car', groupCarRouter);

export default groupGroupIdRouter;

export * from './delete';
export * from './get';
export * from './update';
export * from './invite';
export * from './member/user-id';
export * from './invites';
export * from './member';
export * from './car';
