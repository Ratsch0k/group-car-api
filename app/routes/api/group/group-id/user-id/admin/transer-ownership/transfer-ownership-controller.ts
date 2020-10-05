import {RequestHandler} from 'express';
import {BadRequestError} from '@app/errors';
import {GroupService} from '@app/models';

export const transferOwnershipController: RequestHandler = async (
  req,
  res,
  next,
) => {
  const groupId = parseInt(req.params.groupId, 10);
  const userId = parseInt(req.params.userId, 10);
  const currentUser = req.user;

  if (currentUser && !isNaN(groupId) && !isNaN(userId)) {
    const group = await GroupService.transferOwnership(
        currentUser,
        groupId,
        userId,
    );

    res.send(group);
  } else {
    throw new BadRequestError();
  }
};
