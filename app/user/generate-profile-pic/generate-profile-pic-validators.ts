import {query, oneOf} from 'express-validator';

export default {
  validator: [
    query('username').notEmpty()
        .withMessage('Username should not be empty').escape().trim(),
    oneOf([
      query('offset').optional(),
      query('offset').isNumeric({no_symbols: true})
          .withMessage('Offset has to be either undefined or ' +
            'a string which represents an integer').toInt(10),
    ]),
  ],
};
