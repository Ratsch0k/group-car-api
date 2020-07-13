import {Router} from 'express';
import joinGroupRouter from './join';
import groupIdValidationRouter from '../../group-id-validator';

const inviteIdRouter = Router({mergeParams: true});

inviteIdRouter.use(
    groupIdValidationRouter,
);

inviteIdRouter.post(
    '/join',
    joinGroupRouter,
);

export default inviteIdRouter;
