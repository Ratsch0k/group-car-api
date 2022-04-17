import {GroupService} from '@app/models';
import {
  BadRequestError,
} from '@app/errors';
import {RequestHandler} from 'express';

/**
 * Handles the request to update a group.
 * @param req   - Http request
 * @param res   - Http response
 * @param _next  - Next function
 */
export const updateGroupController: RequestHandler = async (
  req,
  res,
  _next,
) => {
  const currentUser = req.user;
  const values = req.body;
  const groupId = parseInt(req.params.groupId, 10);

  if (
    typeof currentUser !== 'object' ||
    isNaN(groupId)
  ) {
    throw new BadRequestError('Incorrect arguments');
  }

  const updatedGroup = await GroupService.update(
      currentUser,
      groupId,
      {name: values.name, description: values.description},
  );

  res.send(updatedGroup);
};

export default updateGroupController;
