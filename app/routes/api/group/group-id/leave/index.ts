import {Router} from 'express';
import {leaveGroupController} from './leave-group-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const leaveGroupRouter = Router({mergeParams: true});

leaveGroupRouter.post(
    '/',
    asyncWrapper(leaveGroupController),
);

export default leaveGroupRouter;
export * from './leave-group-controller';
