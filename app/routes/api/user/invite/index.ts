import {Router} from 'express';
import getAllInvitesRouter from './get-all';
import inviteIdRouter from './inviteId';

const inviteRouter = Router();

inviteRouter.get(
    '/',
    getAllInvitesRouter,
);

inviteRouter.use(
    '/:inviteId',
    inviteIdRouter,
);

export default inviteRouter;
