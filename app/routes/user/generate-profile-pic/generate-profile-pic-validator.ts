import express from 'express';
import generateProfilePicController from './generate-profile-pic-controller';
import {asyncWrapper} from '@util/async-wrapper';
import {createValidationRouter} from '@app/validators';
import {oneOf, query} from 'express-validator';

const generatePbRouter: express.Router = express.Router();

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


generatePbRouter.get(
    '/',
    createValidationRouter(
        'user:pb',
        generatePbValidator,
        'generate profile picture',
    ),
    asyncWrapper(generateProfilePicController),
);

export default generatePbRouter;
