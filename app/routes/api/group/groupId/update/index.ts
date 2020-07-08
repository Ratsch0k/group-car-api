import {Router} from 'express';
import updateGroupController from './update-group-controller';
import updateGroupValidationRouter from './update-group-validator';

export {default as updateGroupController} from './update-group-controller';
export * from './update-group-validator';

// Create update group router
const updateGroupRouter = Router({mergeParams: true}).use(
    '/',
    updateGroupValidationRouter,
    updateGroupController,
);

export default updateGroupRouter;
