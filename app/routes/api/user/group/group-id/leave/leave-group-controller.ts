import {RequestHandler} from 'express';
import {BadRequestError} from '@app/errors';
import {UserService} from '@app/models/user/user-service';

/**
 * Handles request, that currently logged in user wants to
 * leave the specified group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const leaveGroupController: RequestHandler = async (req, res, next) => {
  const groupId = parseInt(req.params.groupId);
  const user = req.user;

  if (groupId !== NaN && user !== undefined) {
    await UserService.leaveGroup(user, groupId);
    res.status(204).send();
  } else {
    throw new BadRequestError();
  }
};
