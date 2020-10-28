import {Router} from 'express';
import createGroupValidationRouter from './create-group-validator';
import createGroupController from './create-group-controller';

/**
 * Router for the create group route
 */
const createGroupRouter = Router().use(
    createGroupValidationRouter,
    createGroupController,
);

export default createGroupRouter;
