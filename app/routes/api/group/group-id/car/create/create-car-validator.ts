import {CarColor} from '@app/models';
import {createValidationResultHandler} from '@util/validation-result-handler';
import {Router} from 'express';
import {body} from 'express-validator';

export const createCarValidator = [
  body('color')
      .isString()
      .isIn(Object.values(CarColor).filter((value) => isNaN(Number(value))))
      .withMessage('color has to be a available color'),
  body('name')
      .isString()
      .isLength({min: 1})
      .withMessage('name has to be a non empty string'),
];

const createCarValidationRouter = Router({mergeParams: true}).use(
    '/',
    createCarValidator,
    createValidationResultHandler(
        {
          debugScope: 'group-car:group:car:create',
          requestName: (req) =>
            `create car ${req.body.name} for group ${req.params.groupId}`,
        },
    ),
);

export default createCarValidationRouter;
