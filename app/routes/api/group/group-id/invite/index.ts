import {Router} from 'express';
import inviteUserToGroupValidationRouter from
  './invite-user-to-group-validator';
import inviteUserToGroupController from './invite-user-to-group-controller';

const inviteUserToGroupRouter = Router({mergeParams: true}).post(
    '/',
    inviteUserToGroupValidationRouter,
    inviteUserToGroupController,
);

export default inviteUserToGroupRouter;

export * from './invite-user-to-group-controller';
export * from './invite-user-to-group-validator';
