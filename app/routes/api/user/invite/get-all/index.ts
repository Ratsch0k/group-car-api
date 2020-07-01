import {Router} from 'express';
import {getAllInvitesController} from './get-all-invites-controller';

const getAllInvitesRouter = Router().use(
    '/',
    getAllInvitesController,
);

export default getAllInvitesRouter;
