import {GroupService} from '@app/models';
import {
  BadRequestError,
} from '@errors';
import {RequestHandler} from 'express';

/**
 * Controller for deleting a group.
 *
 * Only deletes a group if the currently logged-in user
 * is the owner of that group.
 * @param req   - Request
 * @param res   - Response
 * @param _next  - Next
 */
const deleteGroupController: RequestHandler = async (
  req,
  res,
  _next,
) => {
  const user = req.user;
  const groupId = parseInt(req.params.groupId, 10);

  if (typeof user !== 'object' || isNaN(groupId)) {
    throw new BadRequestError('Incorrect arguments');
  }

  await GroupService.delete(user, groupId);

  res.status(204).send();
};

export default deleteGroupController;
