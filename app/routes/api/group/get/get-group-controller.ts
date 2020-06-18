import {BadRequestError, GroupNotFoundError} from '@app/errors';
import {Membership, Group} from '@app/models';
import ModelToDtoConverter from '@app/util/model-to-dto-converter';
import {GroupSimpleDto} from '@app/models/group/group-simple-dto';
import {MembershipUserDto} from '@app/models/membership/membership-user-dto';

type RequestHandler = import('express').RequestHandler;

export const getGroupController: RequestHandler = (req, res, next) => {
  const groupId = req.params.groupId && parseInt(req.params.groupId, 10);
  const userId = req.user?.id;

  if (groupId && userId) {
    Membership.findOne({where: {groupId, userId}}).then((membership) => {
      // Get the group
      return Group.findByPk(groupId).then((group) => ({group, membership}));
    }).then(({group, membership}) => {
      if (group === null) {
        next(new GroupNotFoundError(groupId));
      } else if (membership === null) {
        // If the user is not a member of the group, respond
        // with a part of the group data
        // Convert the group to the simple dto object
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
            }).then((memberships) => {
          const members = ModelToDtoConverter
              .convertAllSequelizeModels<MembershipUserDto>(
                  memberships, MembershipUserDto);

          res.send({...group.get({plain: true}), members});
        });
      }
    });
  } else {
    throw new BadRequestError('Missing information');
  }
};
