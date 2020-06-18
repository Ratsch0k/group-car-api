import {Router} from 'express';
import getGroupValidationRouter from './get-group-validator';
export * from './get-group-controller';
export * from './get-group-validator';

import {getGroupController} from './get-group-controller';

const getGroupRouter = Router({mergeParams: true}).use(
    '/',
    getGroupValidationRouter,
    getGroupController,
);

export default getGroupRouter;
