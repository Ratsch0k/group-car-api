import {
  BadRequestError,
} from '@errors';
import {
  GroupService,
} from '@models';
import {RequestHandler} from 'express';

/**
 * Depending on who the requesting user is, respond with the group data.
 *
 * Only a user who is either invite to the group or is a member of the group
 * is authorized to view group data. If the user is not a member the user
 * will only receive partial data. If the user is a member the user will
 * receive all data of the group and a list of members.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const getGroupController: RequestHandler = async (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);
  const user = req.user;

  if (!isNaN(groupId) && user) {
    const group = await GroupService.findById(user, groupId);
    res.send(group);
  } else {
    throw new BadRequestError('Missing information');
  }
};
