import {RequestHandler} from 'express';
import {BadRequestError} from '@app/errors';
import {UserService} from '@app/models';

/**
 * Controller for handling search for users.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const searchUserController: RequestHandler = async (req, res, next) => {
  // Check query parameters
  if (typeof req.query.filter !== 'string' ||
      (typeof req.query.limit !== 'string' &&
      typeof req.query.limit !== 'undefined')) {
    throw new BadRequestError();
  }

  const currentUser = req.user;
  const startsWith = req.query.filter;
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

  if (typeof currentUser === 'object') {
    const users = await UserService.findLimitedWithFilter(
        currentUser,
        startsWith,
        limit,
    );

    res.send({users});
  } else {
    throw new BadRequestError();
  }
};
