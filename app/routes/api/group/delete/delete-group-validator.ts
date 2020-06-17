import {param} from 'express-validator';
import {Router} from 'express';
import {createValidationResultHandler} from '@util/validation-result-handler';

/**
 * The validation chain for the delete group request.
 */
export const deleteGroupValidator = [
  param('groupId')
      .exists().withMessage('Group id is missing'),
];

const deleteGroupValidationRouter = Router({mergeParams: true}).use(
    '/',
    deleteGroupValidator,
    createValidationResultHandler({
      debugScope: 'group-car:group:delete',
      requestName: 'deletion of group',
    }),
);

export default deleteGroupValidationRouter;
