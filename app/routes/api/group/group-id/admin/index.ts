import {Router} from 'express';
import groupGroupIdAdminGrantRouter from './grant';

const groupGroupIdAdminRouter = Router({mergeParams: true});

groupGroupIdAdminRouter.use('/grant', groupGroupIdAdminGrantRouter);

export default groupGroupIdAdminRouter;
export * from './grant';
