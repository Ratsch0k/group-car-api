import {RequestHandler} from 'express';
import {InviteService} from '@models';
import {BadRequestError} from '@errors';

/**
 * Controller for handling request to let
 * the currently logged in user join a group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const joinGroupController: RequestHandler = async (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);

  if (req.user && !isNaN(groupId)) {
    await InviteService.assignUserToGroup(req.user, groupId);
    res.status(204).send();
  } else {
    throw new BadRequestError();
  }
};
