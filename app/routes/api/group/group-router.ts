import {Router} from 'express';
import createGroupRouter from './create';

/**
 * Router for the group route
 */
const groupRouter = Router();

// Add all routes
groupRouter.post('/', createGroupRouter);

export default groupRouter;
