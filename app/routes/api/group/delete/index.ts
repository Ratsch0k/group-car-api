export * from './delete-group-controller';
export * from './delete-group-validator';

import {Router} from 'express';
import deleteGroupValidationRouter from './delete-group-validator';
import deleteGroupController from './delete-group-controller';

/**
 * The route for the delete group route.
 */
const deleteGroupRouter = Router({mergeParams: true}).use(
    '/',
    deleteGroupValidationRouter,
    deleteGroupController,
);

export default deleteGroupRouter;
