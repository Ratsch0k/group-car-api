import {Router} from 'express';
import {userIdValidation} from '@app/validators';
import groupGroupIdUserIdAdminRouter from './admin';
import kickUserRouter from './kick';

const groupGroupIdUserIdRouter = Router({mergeParams: true});

groupGroupIdUserIdRouter.use(userIdValidation);
groupGroupIdUserIdRouter.use('/admin', groupGroupIdUserIdAdminRouter);
groupGroupIdUserIdRouter.use('/kick', kickUserRouter);

export default groupGroupIdUserIdRouter;
export * from './admin';
export * from './kick';
