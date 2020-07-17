import {Router} from 'express';
import groupGroupIdAdminGrantRouter from './grant';
import groupGroupIdAdminRevokeRouter from './revoke';

const groupGroupIdUserIdAdminRouter = Router({mergeParams: true});

groupGroupIdUserIdAdminRouter.use('/grant', groupGroupIdAdminGrantRouter);
groupGroupIdUserIdAdminRouter.use('/revoke', groupGroupIdAdminRevokeRouter);

export default groupGroupIdUserIdAdminRouter;
export * from './grant';
