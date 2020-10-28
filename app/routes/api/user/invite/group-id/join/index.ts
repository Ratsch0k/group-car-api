import {Router} from 'express';
import {joinGroupController} from './join-group-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

export * from './join-group-controller';

const joinGroupRouter = Router({mergeParams: true}).post(
    '/',
    asyncWrapper(joinGroupController),
);

export default joinGroupRouter;
