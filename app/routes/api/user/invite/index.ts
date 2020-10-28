import {Router} from 'express';
import getAllInvitesRouter from './get-all';
import inviteIdRouter from './group-id';

const inviteRouter = Router();

inviteRouter.use(
    '/',
    getAllInvitesRouter,
);

inviteRouter.use(
    '/:groupId',
    inviteIdRouter,
);

export default inviteRouter;
