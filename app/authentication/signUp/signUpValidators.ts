import {check} from 'express-validator';

export default {
  validator: [
    check('username').notEmpty(),
    check('email').isEmail(),
    check('password').isLength({min: 6, max: Number.POSITIVE_INFINITY}),
  ],
};
