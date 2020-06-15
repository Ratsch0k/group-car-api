import {body, param} from 'express-validator';
import {Router} from 'express';
import {createValidationResultHandler} from '@util/validation-result-handler';

/**
 * The validation chain for the create group request.
 */
export const updateGroupValidator = [
  body('name')
      .optional()
      .isString()
      .withMessage('Name has to be a string')
      .notEmpty()
      .withMessage('Name has to be a non empty string')
      .trim()
      .escape(),
  body('description')
      .optional()
      .isString()
      .withMessage('Description has to be a string')
      .trim()
      .escape(),
  body('ownerId')
      .not()
      .exists()
      .withMessage('OwnerId can\'t be changed by this request. ' +
        'Use the transfer ownership request'),
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .toInt(10),
];

/**
 * Router for connecting the validator chain and the validation handler
 */
const createGroupValidationRouter = Router({mergeParams: true}).use(
    '/',
    updateGroupValidator,
    createValidationResultHandler({
      debugScope: 'group-car:group:update',
      requestName: 'update of user',
    }),
);

export default createGroupValidationRouter;
