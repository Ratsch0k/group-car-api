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
                'isAdmin',
              ],
              include: [
                {
                  model: User,
                  as: 'User',
                  attributes: [
                    'username',
                    'email',
                    'id',
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
