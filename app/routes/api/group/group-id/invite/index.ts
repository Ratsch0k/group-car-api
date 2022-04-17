import {Router} from 'express';
import inviteUserController from './invite-user-to-group-controller';
import {
  createValidationRouter,
} from '@app/validators';
import {body, oneOf} from 'express-validator';
import {asyncWrapper} from '@util/async-wrapper';

const inviteUserToGroupRouter = Router({mergeParams: true}).post(
    '/',
    // Cannot use `createValidator` because it cannot handle oneOf
    createValidationRouter(
        'group:invite',
        oneOf([
          body('userId')
              .exists().withMessage('userId is missing')
              .isNumeric().withMessage('userId has to be a number'),
          body('username')
              .exists().withMessage('username is missing')
              .isString().withMessage('username has to be a string'),
        ]),
        'invite user',
    ),
    asyncWrapper(inviteUserController),
);

export default inviteUserToGroupRouter;

export * from './invite-user-to-group-controller';
