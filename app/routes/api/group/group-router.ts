import {Router} from 'express';
import createGroupRouter from './create';
import updateGroupRouter from './update';
import deleteGroupRouter from './delete';
import getGroupRouter from './get';
import inviteUserToGroupRouter from './invite';

/**
 * Router for the group route
 */
const groupRouter = Router();

// Add all routes
groupRouter.post('/', createGroupRouter);
groupRouter.put('/:groupId', updateGroupRouter);
groupRouter.delete('/:groupId', deleteGroupRouter);
groupRouter.get('/:groupId', getGroupRouter);
groupRouter.post('/:groupId/invite', inviteUserToGroupRouter);

export default groupRouter;
