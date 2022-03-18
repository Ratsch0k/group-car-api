import {query} from 'express-validator';
import {Router} from 'express';
import {createValidationRouter} from '@app/validators';

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
        createValidationRouter(
            'user:search',
            searchUserValidation,
            'search for filtered users',
        ),
    );

export default searchUserValidationRouter;
