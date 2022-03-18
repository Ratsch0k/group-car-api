import {Router} from 'express';
import {createValidationRouter} from '@app/validators';
import groupGroupIdUserIdAdminRouter from './admin';
import kickUserRouter from './kick';
import {param} from 'express-validator';

const groupGroupIdUserIdRouter = Router({mergeParams: true});

groupGroupIdUserIdRouter.use(
    createValidationRouter(
        'groupId:member:userId',
        param('userId').exists()
            .withMessage('userId is missing')
            .isNumeric()
            .withMessage('userId has to be a number'),
        'check userId',
    ),
);
groupGroupIdUserIdRouter.use('/admin', groupGroupIdUserIdAdminRouter);
groupGroupIdUserIdRouter.use('/kick', kickUserRouter);

export default groupGroupIdUserIdRouter;
export * from './admin';
export * from './kick';
