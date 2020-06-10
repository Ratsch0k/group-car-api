import {Router} from 'express';
import createGroupRouter from './create';
import updateGroupRouter from './update';

/**
 * Router for the group route
 */
const groupRouter = Router();

// Add all routes
groupRouter.post('/', createGroupRouter);
groupRouter.put('/:groupId', updateGroupRouter);

export default groupRouter;
