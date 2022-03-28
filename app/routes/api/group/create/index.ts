import {Router} from 'express';
import createGroupController from './create-group-controller';
import {
  createValidationRouter,
} from '@app/validators';
import {body} from 'express-validator';

const validationChain = [
  body('name').exists().withMessage('name is missing').isGroupName(),
  body('description').optional({nullable: true}).isGroupDescription(),
];

/**
 * Router for the create group route
 */
const createGroupRouter = Router().use(
    createValidationRouter(
        'group:create',
        validationChain,
        'check group fields',
    ),
    createGroupController,
);

export default createGroupRouter;
