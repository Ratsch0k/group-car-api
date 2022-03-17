import {param} from 'express-validator';

export const groupIdValidator =
  param('groupId')
      .exists()
      .withMessage('groupId is missing')
      .isNumeric().withMessage('groupId has to be a number');
