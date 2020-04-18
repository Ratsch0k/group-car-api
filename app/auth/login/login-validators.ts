import {check} from 'express-validator';

export default {
  validator: [
    check('username').notEmpty().escape().trim(),
    check('password').notEmpty(),
  ],
};
