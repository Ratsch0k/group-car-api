import {body, validationResult} from 'express-validator';
import debug from 'debug';
import {InvalidRequestError} from '@errors';
import {Router} from 'express';

type RequestHandler = import('express').RequestHandler;

const log = debug('group-car:group:create');
const error = debug('group-car:group:create:error');

/**
 * Handles the validation result of the create group request.
 * @param req   Express request
 * @param res   Express response
 * @param next  Next handler
 */
export const createGroupValidationHandler: RequestHandler = (
    req,
    res,
    next,
) => {
  log('IP %s requested creation of user', req.ip);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Create user request for IP %s failed validation', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

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
      .withMessage('Description has to a string')
      .notEmpty()
      .withMessage('Username has to be a non empty string')
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
    createGroupValidationHandler,
);

export default createGroupValidationRouter;
