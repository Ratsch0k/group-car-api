import {Router} from 'express';
import groupGroupIdAdminGrantRouter from './grant';
import groupGroupIdAdminRevokeRouter from './revoke';
import transferOwnershipRouter from './transer-ownership';

const groupGroupIdUserIdAdminRouter = Router({mergeParams: true});

groupGroupIdUserIdAdminRouter.use('/grant', groupGroupIdAdminGrantRouter);
groupGroupIdUserIdAdminRouter.use('/revoke', groupGroupIdAdminRevokeRouter);
groupGroupIdUserIdAdminRouter.use(
    '/transfer-ownership',
    transferOwnershipRouter,
);

export default groupGroupIdUserIdAdminRouter;
export * from './grant';
