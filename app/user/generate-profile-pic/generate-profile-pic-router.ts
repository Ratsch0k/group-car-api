import express from 'express';
import generatePbValidators from './generate-profile-pic-validators';
import debug from 'debug';
import {validationResult} from 'express-validator';
import {InvalidRequestError} from '@app/errors';
import generateProfilePicController from './generate-profile-pic-controller';

const log = debug('group-car:generate-pb');
const error = debug('group-car:generate-pb:error');
const generatePbRouter: express.Router = express.Router();

/**
 * Router for generating profile pictures.
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

/**
 * Add the {@link generatePbRouter} to the get route
 */
generatePbRouter.get(
    '/',
    generatePbValidators.validator,
    generatePbHandler,
    generateProfilePicController,
);

export default generatePbRouter;
