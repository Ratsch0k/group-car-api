import {Router} from 'express';
import {grantUserAdminController} from './grant-user-admin-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const groupGroupIdAdminGrantRouter = Router({mergeParams: true});

groupGroupIdAdminGrantRouter.put('/', asyncWrapper(grantUserAdminController));

export default groupGroupIdAdminGrantRouter;
export * from './grant-user-admin-controller';
