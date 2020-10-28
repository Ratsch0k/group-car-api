import {asyncWrapper} from '@app/util/async-wrapper';
import {Router} from 'express';
import {getMembersOfGroupController} from './get-members-of-group-controller';

const getMembersOfGroupRouter = Router({mergeParams: true});

getMembersOfGroupRouter.get(
    '/',
    asyncWrapper(getMembersOfGroupController),
);

export default getMembersOfGroupRouter;
