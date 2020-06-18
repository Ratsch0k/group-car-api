import {body} from 'express-validator';
import {Router} from 'express';
import {createValidationResultHandler} from '@util/validation-result-handler';


/**
 * The validation chain for the create group request.
 */
export const createGroupValidator = [
  body('name')
      .exists()
      .withMessage('Name is missing')
      .isString()
      .withMessage('Name has to be a string')
      .notEmpty()
      .withMessage('Name has to be a non empty string')
      // Sanitize name
      .trim()
      .escape(),
  body('description')
      // Description doesn't have to exist
      .optional({nullable: true})
      // But if it exists it has to be a non empty string
      .isString()
      .withMessage('Description has to be a string')
      // Sanitize description
      .trim()
      .escape(),
];

/**
 * Router for connecting the validator chain and the validation handler
 */
const createGroupValidationRouter = Router().use(
    '/',
    createGroupValidator,
    createValidationResultHandler({
      debugScope: 'group-car:group:create',
      requestName: 'creation of group',
    }),
);

export default createGroupValidationRouter;
