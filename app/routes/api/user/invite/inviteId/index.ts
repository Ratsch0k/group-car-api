import {Router} from 'express';
import acceptInviteRouter from './accept';
import inviteParamsValidationRouter from './invite-params-validator';

const inviteIdRouter = Router();

inviteIdRouter.use(
    '/*',
    inviteParamsValidationRouter,
);

inviteIdRouter.post(
    '/accept',
    acceptInviteRouter,
);

export default inviteIdRouter;
