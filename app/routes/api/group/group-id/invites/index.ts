import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {getInvitesController} from './get-invites-controller';

const invitesRouter = Router({mergeParams: true});
invitesRouter.get(
    '/',
    asyncWrapper(getInvitesController),
);

export default invitesRouter;
export * from './get-invites-controller';
