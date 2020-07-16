import {Router} from 'express';
import {grantUserAdminController} from './grant-user-admin-controller';
import {asyncWrapper} from '@app/util/async-wrapper';
import {userIdValidation} from '@app/validators';

const grantUserAdminRouter = Router({mergeParams: true});

grantUserAdminRouter.use(userIdValidation);
grantUserAdminRouter.put('/', asyncWrapper(grantUserAdminController));

export default grantUserAdminRouter;
export * from './grant-user-admin-controller';
