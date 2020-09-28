import {BadRequestError} from '@app/errors';
import {MembershipService} from '@app/models';
import {RequestHandler} from 'express';

export const getMembersOfGroupController: RequestHandler =
async (req, res, next) => {
  const user = req.user;
  const groupId = parseInt(req.params.groupId, 10);

  if (!isNaN(groupId) && user) {
    const members = await MembershipService.findAllForGroup(user, groupId);
    res.send({members});
  } else {
    throw new BadRequestError('Missing information');
  }
};
