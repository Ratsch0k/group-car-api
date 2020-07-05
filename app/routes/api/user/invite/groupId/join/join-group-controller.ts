import {RequestHandler} from 'express';
import {InviteService} from '@app/models/invite/invite-service';
import {BadRequestError} from '@errors';

export const joinGroupController: RequestHandler = async (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);

  if (req.user && !isNaN(groupId)) {
    await InviteService.assignUserToGroup(req.user, groupId);
    res.status(204).send();
  } else {
    throw new BadRequestError();
  }
};
