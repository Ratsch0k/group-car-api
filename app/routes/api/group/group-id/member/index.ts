import {Router} from 'express';
import getController from './get';
import groupUserIdRouter from './user-id';

const groupMemberRouter = Router({mergeParams: true});

groupMemberRouter.get('/', getController);
groupMemberRouter.use('/:userId', groupUserIdRouter);

export default groupMemberRouter;

export * from './get';
export * from './user-id';
