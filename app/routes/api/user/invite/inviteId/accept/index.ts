import {Router} from 'express';
import {acceptInviteController} from './accept-invite-controller';

export * from './accept-invite-controller';

const acceptInviteRouter = Router({mergeParams: true}).use(
    '/',
    acceptInviteController,
);

export default acceptInviteRouter;
