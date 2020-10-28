import {Router} from 'express';
import {revokeAdminController} from './revoke-admin-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const groupGroupIdUserIdAdminRevokeRouter = Router({mergeParams: true});

groupGroupIdUserIdAdminRevokeRouter.put(
    '/',
    asyncWrapper(revokeAdminController),
);

export default groupGroupIdUserIdAdminRevokeRouter;
export * from './revoke-admin-controller';
