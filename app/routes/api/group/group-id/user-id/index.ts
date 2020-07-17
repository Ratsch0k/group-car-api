import {Router} from 'express';
import {userIdValidation} from '@app/validators';
import groupGroupIdUserIdAdminRouter from './admin';

const groupGroupIdUserIdRouter = Router({mergeParams: true});

groupGroupIdUserIdRouter.use(userIdValidation);
groupGroupIdUserIdRouter.use('/admin', groupGroupIdUserIdAdminRouter);

export default groupGroupIdUserIdRouter;
export * from './admin';
