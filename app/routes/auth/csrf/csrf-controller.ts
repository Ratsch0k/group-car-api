import {isBaseSession} from '@app/auth/session/session';
import config from '@app/config';
import {InvalidSessionError} from '@app/errors';
import {NextFunction, Request, Response} from 'express';

/**
 * Request handler for retrieving the csrf token.
 *
 * If the request has a valid session attached the
 * corresponding csrf token is attached to the
 * response as a custom header.
 * @param req - Request
 * @param res - Response
 * @param next - Next
 */
const csrfController = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
  if (!isBaseSession(req.session)) {
    throw new InvalidSessionError();
  }

  res.status(204);
  res.setHeader(config.auth.csrfTokenName, req.session.csrfToken);
  res.send();
};

export default csrfController;
