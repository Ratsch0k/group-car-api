import {Router} from 'express';
import {joinGroupController} from './join-group-controller';

export * from './join-group-controller';

const joinGroupRouter = Router().use(
    '/',
    joinGroupController,
);

export default joinGroupRouter;
