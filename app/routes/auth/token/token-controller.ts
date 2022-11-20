import {NotLoggedInError} from '@errors';
import {RequestHandler} from 'express';

/**
 * Returns the csrf token of the session.
 * @param req  - Http request, expects payload of jwt to be in `req.user`
 * @param res  - Http response
 * @param next - The next request handler
 */
const tokenController: RequestHandler = (req, res, next) => {
  if (req.session.type === 'session') {
    res.send(req.user);
  }

  throw new NotLoggedInError();
};

export default tokenController;
