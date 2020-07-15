import {Router} from 'express';
import grantUserAdminRouter from './user-id';

const groupGroupIdAdminGrantRouter = Router({mergeParams: true});

groupGroupIdAdminGrantRouter.use('/:userId', grantUserAdminRouter);

export default groupGroupIdAdminGrantRouter;
export * from './user-id';
