import {check} from 'express-validator';

export default {
  validator: [
    check('username').notEmpty().escape().trim(),
    check('email').escape().trim().isEmail()
        .withMessage('Email has to be a valid email address'),
    check('password').isLength({min: 6})
        .withMessage('Password has to be at least 6 characters long'),
  ],
};
