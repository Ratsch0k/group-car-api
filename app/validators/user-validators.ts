import {body, param, ValidationChain} from 'express-validator';

export const passwordValidator =
  (location = body('password')): ValidationChain => location
      .isString()
      .withMessage('password has to be a string')
      .isLength({min: 6, max: 255})
      .withMessage('Password has to be at least 6 characters long');

export const usernameValidator =
  (location = body('username')): ValidationChain => location
      .isString()
      .trim()
      .notEmpty()
      .isLength({min: 4, max: 25})
      .withMessage('Username has to be between 4 and 25 characters long')
      .custom((value: string) => {
        if (/\s/.test(value)) {
          throw new Error('Username should not contain whitespace');
        }
        return true;
      })
      .escape();

export const emailValidator =
  (location = body('email')): ValidationChain => location
      .escape()
      .trim()
      .isEmail()
      .withMessage('Email has to be a valid email address');

export const userIdValidator =
  (location = param('userId')): ValidationChain => location
      .exists()
      .withMessage('userId is missing')
      .isNumeric()
      .withMessage('userId has to be a number');
