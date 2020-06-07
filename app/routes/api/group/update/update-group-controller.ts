import {Membership, Group} from '@app/models';
import {
  BadRequestError,
  NotMemberOfGroupError,
  NotAdminOfGroupError,
  GroupNotFoundError,
} from '@app/errors';
import {Router} from 'express';

type RequestHandler = import('express').RequestHandler;

/**
 * Checks if the request is correct and fulfills constraints before sending it
 * to the handler for execution.
 *
 * The following constraints have to be checked:
 * - The request has to have the userId and the groupId
 * - The user has to be a member of the group he/she requested to update
 * - The user has to be an admin of the group
 * - The group has to exist
 *
 * If all constraints are fulfilled the request will be send to
 * {@link updateGroupRequestHandler}
 * @param req   - Http request
 * @param res   - Http response
 * @param next  - Next function
 */
export const updateGroupRequestChecker: RequestHandler= (req, res, next) => {
  const userId = req.user?.id;
  const groupId = parseInt(req.params.groupId, 10);

  if (userId && groupId) {
    /*
     * Check if user which requested the action is an admin
     * of the group the users intends to update
     */
    Membership.findOne({
      where: {
        userId,
        groupId,
      },
    }).then((membership: Membership | null) => {
      if (membership === null) {
        next(new NotMemberOfGroupError());
      } else if (!membership.isAdmin) {
        next(new NotAdminOfGroupError());
      } else {
        // Check if the group exists
        Group.findByPk(req.params.groupId)
            .then((group: Group | null) => {
              if (group == null) {
                next(new GroupNotFoundError(groupId));
              } else {
                next();
              }
            }).catch((error) => {
              next(error);
            });
      }
    });
  } else {
    throw new BadRequestError();
  }
};

/**
 * Handles the request to update a group.
 *
 * Updates the group and responses with the update group data.
 *
 * ***This handler doesn't check for any constraints.***
 * @param req   - Http request
 * @param res   - Http response
 * @param next  - Next function
 */
export const updateGroupRequestHandler: RequestHandler = (req, res, next) => {
  Group.update(
      {
        name: req.body.name,
        description: req.body.description,
      },
      {
        where: {
          id: req.params.groupId,
        },
        returning: true,
      })
      .then((value: [number, Group[]]) => {
        res.send(value[1][0]);
      }).catch((error) => {
        next(error);
      });
};

const updateGroupController = Router({mergeParams: true}).use(
    '/',
    updateGroupRequestChecker,
    updateGroupRequestHandler,
);

export default updateGroupController;
