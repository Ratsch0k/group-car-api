import {RequestHandler} from 'express';
import {BadRequestError} from '@app/errors';
import {GroupService} from '@app/models';

/**
 * Controller for handling kick request for a user from a group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const kickUserController: RequestHandler = async (req, res, next) => {
  const currentUser = req.user;
  const groupId = parseInt(req.params.groupId, 10);
  const userId = parseInt(req.params.userId, 10);

  if (typeof currentUser === 'object' && !isNaN(groupId) && !isNaN(userId)) {
    // Call to service
    const group = await GroupService.kickUser(currentUser, groupId, userId);
    res.send(group);
  } else {
    throw new BadRequestError();
  }
};
