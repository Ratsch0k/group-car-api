import express from 'express';
import debug from 'debug';
import {validationResult, query, oneOf} from 'express-validator';
import {InvalidRequestError} from '@app/errors';
import generateProfilePicController from './generate-profile-pic-controller';

const log = debug('group-car:generate-pb');
const error = debug('group-car:generate-pb:error');
const generatePbRouter: express.Router = express.Router();

/**
 * Handler for generating profile pictures.
 * @param req Http request
 * @param res Http response
 */
const generatePbHandler: express.RequestHandler = (req, res, next) => {
  log('IP %s requested generation of profile picture', req.ip);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    error('Request of IP %s for generation of profile ' +
        'picture denied, because request is malformed', req.ip);
    throw new InvalidRequestError(errors);
  } else {
    next();
  }
};

export const generatePbValidator = [
  query('username').notEmpty()
      .withMessage('Username should not be empty').escape().trim(),
  oneOf([
    query('offset').optional(),
    query('offset').isNumeric({no_symbols: true})
        .withMessage('Offset has to be either undefined or ' +
            'a string which represents an integer').toInt(10),
  ]),
];


/**
 * Add the {@link generatePbHandler} to the get route
 */
generatePbRouter.get(
    '/',
    generatePbValidator,
    generatePbHandler,
    generateProfilePicController,
);

export default generatePbRouter;
