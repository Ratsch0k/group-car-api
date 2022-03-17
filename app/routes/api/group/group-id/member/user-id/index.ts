import {Router} from 'express';
import {userIdValidator} from '@app/validators';
import groupGroupIdUserIdAdminRouter from './admin';
import kickUserRouter from './kick';
import createValidationRouter from '@app/validators/create-validation-router';

const groupGroupIdUserIdRouter = Router({mergeParams: true});

groupGroupIdUserIdRouter.use(
    createValidationRouter(
        'groupId:member:userId',
        userIdValidator(),
        'check userId',
    ),
);
groupGroupIdUserIdRouter.use('/admin', groupGroupIdUserIdAdminRouter);
groupGroupIdUserIdRouter.use('/kick', kickUserRouter);

export default groupGroupIdUserIdRouter;
export * from './admin';
export * from './kick';
