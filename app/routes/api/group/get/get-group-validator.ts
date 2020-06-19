import {param} from 'express-validator';
import {Router} from 'express';
import {createValidationResultHandler} from '@util/validation-result-handler';


/**
 * The validation chain for the create group request.
 */
export const getGroupValidator = [
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .isNumeric().withMessage('groupId has to be a number'),
];

/**
 * Router for connecting the validator chain and the validation handler
 */
const getGroupValidationRouter = Router({mergeParams: true}).use(
    '/',
    getGroupValidator,
    createValidationResultHandler({
      debugScope: 'group-car:group:get',
      requestName: (req) => `get group ${req.params.groupId}`,
    }),
);

export default getGroupValidationRouter;
