import {param} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

/**
 * The validation chain for the create group request.
 */
export const groupIdValidator = [
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .isNumeric().withMessage('groupId has to be a number'),
];

/**
 * Router for connecting the validator chain and the validation handler
 */
const groupIdValidationRouter = Router({mergeParams: true}).use(
    '/',
    groupIdValidator,
    createValidationResultHandler({
      debugScope: 'group-car:group:get',
      requestName: (req) => `get group ${req.params.groupId}`,
    }),
);

export default groupIdValidationRouter;
