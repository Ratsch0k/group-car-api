import {Router} from 'express';
import {grantUserAdminController} from './grant-user-admin-controller';

const grantUserAdminRouter = Router({mergeParams: true});

grantUserAdminRouter.put('/', grantUserAdminController);

export default grantUserAdminRouter;
export * from './grant-user-admin-controller';
