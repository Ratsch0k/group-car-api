import {body, validationResult, param} from 'express-validator';
import debug from 'debug';
import {InvalidRequestError} from '@errors';
import {Router} from 'express';

type RequestHandler = import('express').RequestHandler;

const log = debug('group-car:group:update');
const error = debug('group-car:group:update:error');

/**
 * Handles the validation result of the create group request.
 * @param req  -  Express request
 * @param res  -  Express response
 * @param next -  Next handler
 */
export const updateGroupValidationHandler: RequestHandler = (
    req,
    res,
    next,
) => {
  log('IP %s requested update of user', req.ip);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Update user request for IP %s failed validation', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

/**
 * The validation chain for the create group request.
 */
export const updateGroupValidator = [
  body('name')
      .optional()
      .isString()
      .withMessage('Name has to be a string')
      .notEmpty()
      .withMessage('Name has to be a non empty string')
      .trim()
      .escape(),
  body('description')
      .optional()
      .isString()
      .withMessage('Description has to be a string')
      .trim()
      .escape(),
  body('ownerId')
      .not()
      .exists()
      .withMessage('OwnerId can\'t be changed by this request. ' +
        'Use the transfer ownership request'),
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .toInt(),
];

/**
 * Router for connecting the validator chain and the validation handler
 */
const createGroupValidationRouter = Router({mergeParams: true}).use(
    '/',
    updateGroupValidator,
    updateGroupValidationHandler,
);

export default createGroupValidationRouter;
