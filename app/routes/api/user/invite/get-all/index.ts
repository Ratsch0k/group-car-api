import {Router} from 'express';
import {getAllInvitesController} from './get-all-invites-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const getAllInvitesRouter = Router().get(
    '/',
    asyncWrapper(getAllInvitesController),
);

export default getAllInvitesRouter;
