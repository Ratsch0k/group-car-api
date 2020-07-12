import {RequestHandler} from 'express';
import {BadRequestError, NotMemberOfGroupError, InternalError} from '@errors';
import {UserService} from '@models';

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
    const removedMemberships = await UserService.leaveGroup(user, groupId);
    if (removedMemberships === 1) {
      res.status(204).send();
    } else if (removedMemberships === 0) {
      throw new NotMemberOfGroupError();
    } else {
      throw new InternalError();
    }
  } else {
    throw new BadRequestError();
  }
};
