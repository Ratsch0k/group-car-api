import {Router} from 'express';
import joinGroupRouter from './join';
import {groupIdValidator} from '@app/validators/group-validators';
import createValidationRouter from '@app/validators/create-validation-router';

const inviteIdRouter = Router({mergeParams: true});

inviteIdRouter.use(
    createValidationRouter('invite-user', groupIdValidator, 'check-groupId'),
);

inviteIdRouter.use(
    '/join',
    joinGroupRouter,
);

export default inviteIdRouter;
