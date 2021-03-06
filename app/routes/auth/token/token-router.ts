import * as express from 'express';
import tokenController from './token-controller';
import {postLoginJwtValidator} from '@app/routes/auth/jwt/jwt-util';
import debug from 'debug';
import config from '@config';
import expressJwt from 'express-jwt';

const log = debug('group-car:token');
const router: express.Router = express.Router();

const tokenLogger: express.RequestHandler = (req, res, next) => {
  log('IP %s requested login per token', req.ip);
  next();
};

/**
 * Add handler to chain.
 */
router.put('/',
    expressJwt({
      secret: config.jwt.secret,
      getToken: config.jwt.getToken,
      algorithms: ['HS512'],
      requestProperty: 'auth',
    }),
    postLoginJwtValidator,
    tokenLogger,
    tokenController,
);

export default router;
