import {Router} from 'express';
import updateGroupController from './update-group-controller';
import {
  createValidationRouter,
} from '@app/validators';
import {body} from 'express-validator';
import {asyncWrapper} from '@util/async-wrapper';

export {default as updateGroupController} from './update-group-controller';

// Create update group router
const updateGroupRouter = Router({mergeParams: true}).use(
    '/',
    createValidationRouter(
        'group:update',
        [
          body('name')
              .optional()
              .isGroupName(),
          body('description')
              .optional()
              .isGroupDescription(),
          body('ownerId')
              .not()
              .exists()
              .withMessage('OwnerId can\'t be changed by this request. ' +
              'Use the transfer ownership request'),
        ],
        'update group',
    ),
    asyncWrapper(updateGroupController),
);

export default updateGroupRouter;
