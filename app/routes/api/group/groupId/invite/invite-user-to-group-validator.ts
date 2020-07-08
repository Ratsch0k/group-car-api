import {body} from 'express-validator';
import {Router} from 'express';
import {createValidationResultHandler} from '@util/validation-result-handler';

export const inviteUserToGroupValidator = [
  body('userId')
      .exists().withMessage('userId is missing')
      .isNumeric().withMessage('userId has to be a number'),
];

const inviteUserToGroupValidationRouter = Router({mergeParams: true}).use(
    '/',
    inviteUserToGroupValidator,
    createValidationResultHandler(
        {
          debugScope: 'group-car:group:invite',
          requestName: (req) =>
            `invite user ${req.body.userId} to group ${req.params.groupId}`,
        },
    ),
);

export default inviteUserToGroupValidationRouter;
