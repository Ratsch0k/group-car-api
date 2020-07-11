import {Router} from 'express';
import {leaveGroupController} from './leave';
import groupIdValidationRouter from '../../group-id-validator';

const userGroupGroupIdRouter = Router();

userGroupGroupIdRouter.use(groupIdValidationRouter);
userGroupGroupIdRouter.use('/leave', leaveGroupController);

export default userGroupGroupIdRouter;
export * from './leave';
