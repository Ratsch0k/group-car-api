import {query} from 'express-validator';
import {Router} from 'express';
import {
  createValidationResultHandler,
} from '@app/util/validation-result-handler';

export const searchUserValidation = [
  query('filter')
      .exists().withMessage('filter has to be set')
      .bail()
      .isString().withMessage('filter has to be a string'),
  query('limit')
      .optional()
      .isNumeric().withMessage('limit has to be a number'),
];

const searchUserValidationRouter = Router()
    .use(
        searchUserValidation,
        createValidationResultHandler({
          debugScope: 'group-car:user:search',
          requestName: 'search for filtered users',
        }),
    );

export default searchUserValidationRouter;
