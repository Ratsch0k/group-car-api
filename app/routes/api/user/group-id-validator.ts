import {param} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

export const groupIdValidator = [
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .isNumeric()
      .withMessage('groupId has to be a number'),
];

const groupIdValidatorRouter = Router({mergeParams: true}).use(
    '/',
    groupIdValidator,
    createValidationResultHandler({
      debugScope: 'group-car:invite',
      requestName: (req) => `check groupId ${req.params.groupId}`,
    }),
);

export default groupIdValidatorRouter;
