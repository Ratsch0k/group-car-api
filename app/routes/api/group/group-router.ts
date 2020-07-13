import {Router} from 'express';
import createGroupRouter from './create';
import groupGroupIdRouter from './group-id';

/**
 * Router for the group route
 */
const groupRouter = Router();

// Add all routes
groupRouter.post('/', createGroupRouter);
groupRouter.use('/:groupId', groupGroupIdRouter);

export default groupRouter;
