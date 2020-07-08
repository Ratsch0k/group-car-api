import {Membership, Group} from '@app/models';
import {
  BadRequestError,
  NotMemberOfGroupError,
  GroupNotFoundError,
  NotOwnerOfGroupError,
} from '@errors';
import {RequestHandler} from 'express';

/**
 * Controller for deleting a group.
 *
 * Only deletes a group if the currently logged in user
 * is the owner of that group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
const deleteGroupController: RequestHandler = (req, res, next) => {
  const userId = req.user?.id;
  const groupId = req.params.groupId && parseInt(req.params.groupId, 10);

  if (userId && groupId) {
    Membership.findOne({where: {groupId, userId}}).then((membership) => {
      if (membership === null) {
        next(new NotMemberOfGroupError());
      } else {
        Group.findByPk(groupId).then((group) => {
          if (group === null) {
            next(new GroupNotFoundError(groupId));
          } else if (group.ownerId !== userId) {
            next(new NotOwnerOfGroupError());
          } else {
            return group.destroy().then(() => {
              res.status(204).send();
            }).catch(next);
          }
        });
      }
    });
  } else {
    throw new BadRequestError('Missing parameter');
  }
};

export default deleteGroupController;
