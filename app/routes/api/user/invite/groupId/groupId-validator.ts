import {param} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

export const groupIdParamsValidator = [
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .isNumeric()
      .withMessage('groupId has to be a number'),
];

const groupIdParamsValidatorRouter = Router({mergeParams: true}).use(
    '/',
    groupIdParamsValidator,
    createValidationResultHandler({
      debugScope: 'group-car:invite',
      requestName: (req) => `access invite for group ${req.params.groupId}`,
    }),
);

export default groupIdParamsValidatorRouter;
