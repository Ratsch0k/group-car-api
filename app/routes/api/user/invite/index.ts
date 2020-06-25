import {Router} from 'express';
import getAllInvitesRouter from './get-all';

const inviteRouter = Router().get(
    '/',
    getAllInvitesRouter,
);

export default inviteRouter;
