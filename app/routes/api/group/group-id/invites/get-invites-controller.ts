import {BadRequestError} from '@app/errors';
import {InviteService} from '@app/models';
import {RequestHandler} from 'express';

/**
 * Handles request for retrieving all invites of a specified group.
 * Only works if the logged in user is a member of that group
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const getInvitesController: RequestHandler = async (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);
  const user = req.user;

  if (!isNaN(groupId) && user) {
    const invites = await InviteService.findAllForGroup(user, groupId);
    res.send({invites});
  } else {
    throw new BadRequestError('Missing information');
  }
};
