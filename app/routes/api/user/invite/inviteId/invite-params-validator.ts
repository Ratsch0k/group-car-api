import {param} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

export const inviteParamsValidator = [
  param('inviteId')
      .exists()
      .withMessage('inviteId is missing')
      .isNumeric()
      .withMessage('inviteId has to be a number'),
];

const inviteParamsValidationRouter = Router({mergeParams: true}).use(
    '/',
    inviteParamsValidator,
    createValidationResultHandler({
      debugScope: 'group-car:invite',
      requestName: 'access to specific invite',
    }),
);

export default inviteParamsValidationRouter;
