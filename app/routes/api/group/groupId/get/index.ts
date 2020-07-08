import {Router} from 'express';
export * from './get-group-controller';

import {getGroupController} from './get-group-controller';

const getGroupRouter = Router({mergeParams: true}).get(
    '/',
    getGroupController,
);

export default getGroupRouter;
