import {
  BadRequestError,
  GroupNotFoundError,
  UnauthorizedError,
} from '@errors';
import {
  Membership,
  Group, Invite,
  GroupSimpleDto,
  User,
} from '@models';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';

type RequestHandler = import('express').RequestHandler;

export const getGroupController: RequestHandler = (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);
  const userId = req.user?.id;

  if (groupId && userId) {
    Membership.findOne({where: {groupId, userId}}).then((membership) => {
      // Get the group
      return Group.findByPk(groupId).then((group) => ({group, membership}));
    }).then(({group, membership}) => {
      return Invite.findOne({where: {groupId, userId}}).then((invite) => ({
        group, membership, invite,
      }));
    }).then(({group, membership, invite}) => {
      if (membership === null && invite === null) {
        next(new UnauthorizedError());
      } else if (group === null) {
        next(new GroupNotFoundError(groupId));
      } else if (membership === null && invite !== null) {
        res.send(ModelToDtoConverter.convertSequelizeModel<GroupSimpleDto>(
            group, GroupSimpleDto));
        return;
      } else {
        // Get all members of the group
        Membership.findAll(
            {
              where:
              {
                groupId,
              },
              attributes:
              [
                'userId',
                'isAdmin',
              ],
              include: [
                {
                  model: User,
                  as: 'User',
                  attributes: [
                    'username',
                    'email',
                  ],
                },
              ],
            }).then((members) => {
          res.send({...group.get({plain: true}), members});
        });
      }
    });
  } else {
    throw new BadRequestError('Missing information');
  }
};
