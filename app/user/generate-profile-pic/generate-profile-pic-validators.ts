import {check} from 'express-validator';

export default {
  validator: [
    check('username').notEmpty()
        .withMessage('Username should not be empty').escape().trim(),
  ],
};
