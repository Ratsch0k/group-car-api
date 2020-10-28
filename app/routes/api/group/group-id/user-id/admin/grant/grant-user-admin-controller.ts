import {RequestHandler} from 'express';
import {BadRequestError} from '@errors';
import {MembershipService} from '@models';

/**
 * Controller for handling granting a user of a group admin permissions.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const grantUserAdminController: RequestHandler = async (
  req,
  res,
  next,
) => {
  const currentUser = req.user;
  const groupId = parseInt(req.params.groupId, 10);
  const userId = parseInt(req.params.userId, 10);

  if (currentUser !== undefined && !isNaN(groupId) && !isNaN(userId)) {
    await MembershipService.changeAdminPermission(
        currentUser,
        {groupId, userId},
        true,
    );
    res.status(204).send();
  } else {
    throw new BadRequestError();
  }
};
