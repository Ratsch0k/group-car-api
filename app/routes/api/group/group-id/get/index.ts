import {Router} from 'express';

import {getGroupController} from './get-group-controller';
import {asyncWrapper} from '@app/util/async-wrapper';

const getGroupRouter = Router({mergeParams: true}).get(
    '/',
    asyncWrapper(getGroupController),
);

export default getGroupRouter;
export * from './get-group-controller';
