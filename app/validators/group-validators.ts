import {param, ValidationChain} from 'express-validator';

export const groupIdValidator =
  (location = param('groupId')): ValidationChain =>
    location
        .exists()
        .withMessage('groupId is missing')
        .isNumeric().withMessage('groupId has to be a number');

export const carIdValidator =
  (location = param('carId')): ValidationChain => location
      .exists()
      .withMessage('carId is missing')
      .isNumeric().withMessage('carId has to be a number');
