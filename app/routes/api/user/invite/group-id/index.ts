import {Router} from 'express';
import joinGroupRouter from './join';
import {groupIdValidation} from '@app/validators';

const inviteIdRouter = Router({mergeParams: true});

inviteIdRouter.use(
    groupIdValidation,
);

inviteIdRouter.post(
    '/join',
    joinGroupRouter,
);

export default inviteIdRouter;
