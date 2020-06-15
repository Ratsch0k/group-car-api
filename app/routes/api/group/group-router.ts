import {Router} from 'express';
import createGroupRouter from './create';
import updateGroupRouter from './update';
import deleteGroupRouter from './delete';

/**
 * Router for the group route
 */
const groupRouter = Router();

// Add all routes
groupRouter.post('/', createGroupRouter);
groupRouter.put('/:groupId', updateGroupRouter);
groupRouter.delete('/:groupId', deleteGroupRouter);

export default groupRouter;
