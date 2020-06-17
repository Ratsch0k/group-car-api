import {Membership, Group} from '@app/models';
import {
  BadRequestError,
  NotMemberOfGroupError,
  GroupNotFoundError,
} from '@app/errors';
import {NotOwnerOfGroupError} from '@app/errors/group/NotOwnerOfGroupError';
import sequelize from '@db';

type RequestHandler = import('express').RequestHandler;

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
            sequelize.transaction((t) => {
              return Membership.destroy({where: {groupId}, transaction: t})
                  .then(() =>
                    group.destroy({transaction: t}));
            }).then(() => {
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
