import {Router} from 'express';
import joinGroupRouter from './join';
import groupIdParamsValidatorRouter from './groupId-validator';

const inviteIdRouter = Router({mergeParams: true});

inviteIdRouter.use(
    '/*',
    groupIdParamsValidatorRouter,
);

inviteIdRouter.post(
    '/join',
    joinGroupRouter,
);

export default inviteIdRouter;
