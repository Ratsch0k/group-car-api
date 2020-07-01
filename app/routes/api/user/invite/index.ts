import {Router} from 'express';
import getAllInvitesRouter from './get-all';
import inviteIdRouter from './groupId';

const inviteRouter = Router();

inviteRouter.get(
    '/',
    getAllInvitesRouter,
);

inviteRouter.use(
    '/:groupId',
    inviteIdRouter,
);

export default inviteRouter;
