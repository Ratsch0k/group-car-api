import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {getInvitesForGroupController} from './get-invites-for-group-controller';

const invitesRouter = Router({mergeParams: true});
invitesRouter.get(
    '/',
    asyncWrapper(getInvitesForGroupController),
);

export default invitesRouter;
export * from './get-invites-for-group-controller';
