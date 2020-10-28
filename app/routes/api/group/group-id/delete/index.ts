export * from './delete-group-controller';

import {Router} from 'express';
import deleteGroupController from './delete-group-controller';

/**
 * The route for the delete group route.
 */
const deleteGroupRouter = Router({mergeParams: true}).delete(
    '/',
    deleteGroupController,
);

export default deleteGroupRouter;
