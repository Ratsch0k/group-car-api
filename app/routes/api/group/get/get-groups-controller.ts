import {RequestHandler} from 'express';
import {GroupService} from '@app/models';
import {BadRequestError} from '@app/errors';
import debug from 'debug';

const log = debug('group-car:group:get-all:controller');
const error = debug('group-car:group:get-all:controller:error');

/**
 * Controller for handling returning all groups of the currently logged in user.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const getGroupsController: RequestHandler = async (req, res, next) => {
  const currentUser = req.user;

  if (typeof currentUser === 'object') {
    log('User %d: Get all groups', currentUser.id);

    const groups = await GroupService.findAllForUser(currentUser);
    res.send({groups});
  } else {
    error('User is missing in request');
    throw new BadRequestError();
  }
};
