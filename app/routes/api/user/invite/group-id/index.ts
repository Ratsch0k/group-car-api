import {Router} from 'express';
import joinGroupRouter from './join';
import {createValidationRouter} from '@app/validators';
import {param} from 'express-validator';

const inviteIdRouter = Router({mergeParams: true});

inviteIdRouter.use(
    createValidationRouter(
        'invite-user',
        param('groupId')
            .exists().withMessage('groupId is missing').isNumeric()
            .withMessage('groupId has to be a number'),
        'check-groupId',
    ),
);

inviteIdRouter.use(
    '/join',
    joinGroupRouter,
);

export default inviteIdRouter;
