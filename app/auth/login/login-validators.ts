import {check} from 'express-validator';

export default {
  validator: [
    check('username').notEmpty().escape().trim(),
    check('password').isLength({min: 6})
        .withMessage('Password has to be at least 6 characters long'),
  ],
};
