import {
  GroupNotFoundError,
  NotMemberOfGroupError,
  NotAdminOfGroupError,
  UserNotFoundError,
  BadRequestError,
  AlreadyMemberError,
  AlreadyInvitedError,
  GroupIsFullError,
} from '@errors';
import {Group, Membership, User, Invite} from '@models';
import {Router, RequestHandler} from 'express';
import config from '@app/config';

/**
 * Checks if the user tries to invite himself/herself.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkInviteToLoggedInUser: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (req.user?.id == req.body.userId) {
    next(new BadRequestError('You can\'t invite yourself'));
  } else {
    next();
  }
};

/**
 * Checks if the user is a member an admin of the group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkMembership: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userId = req.user!.id!;
  const groupId = parseInt(req.params.groupId, 10);

  // Check if user is admin of group
  Membership.findOne({where: {userId, groupId}}).then((membership) => {
    if (membership === null) {
      next(new NotMemberOfGroupError());
    } else if (!membership.isAdmin) {
      next(new NotAdminOfGroupError());
    } else {
      next();
    }
  }).catch(next);
};

/**
 * Checks if the group exists.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkGroup: RequestHandler = (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);

  Group.findByPk(groupId).then((group) => {
    if (group === null) {
      next(new GroupNotFoundError(groupId));
    } else {
      next();
    }
  }).catch(next);
};

/**
 * Checks if the user which should be invited exists.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkUser: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userId = req.body.userId;

  User.findByPk(userId).then((user) => {
    if (user === null) {
      next(new UserNotFoundError(userId));
    } else {
      next();
    }
  }).catch(next);
};

/**
 * Checks if the user which should be invited is already invited to that group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkAlreadyInvited: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userId = req.body.userId;
  const groupId = parseInt(req.params.groupId, 10);

  Invite.findOne({where: {userId, groupId}}).then((invite) => {
    if (invite !== null) {
      next(new AlreadyInvitedError(userId, groupId));
    } else {
      next();
    }
  }).catch(next);
};

/**
 * Checks if the user which should be invited is already a member of the group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkAlreadyMember: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userId = req.body.userId;
  const groupId = parseInt(req.params.groupId, 10);

  Membership.findOne({where: {userId, groupId}}).then((membership) => {
    if (membership !== null) {
      next(new AlreadyMemberError(userId, groupId));
    } else {
      next();
    }
  }).catch(next);
};

/**
 * Checks if the amount of user who are invited
 * to the group and the amount of members are below
 * the maximum amount of members per group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const checkMaxMembers: RequestHandler = (req, res, next) => {
  const groupId = parseInt(req.params.groupId, 10);

  Promise.all([
    Membership.count({where: {groupId}}),
    Invite.count({where: {groupId}}),
  ]).then((results) => {
    const total = results.reduce((prev, cur) => prev + cur);
    if (total <= config.group.maxMembers) {
      next();
    } else {
      next(new GroupIsFullError());
    }
  }).catch(next);
};

/**
 * Invites the user to the group by creating a database entry.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const inviteUser: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const invitedBy = req.user!.id!;
  const userId = req.body.userId;
  const groupId = parseInt(req.params.groupId, 10);

  Invite.create({
    groupId,
    userId,
    invitedBy,
  }).then((invite) => {
    res.status(201).send(invite);
  }).catch(next);
};

/**
 * Combine request handlers as a controller.
 */
const inviteUserToGroupController = Router({mergeParams: true}).use(
    '/',
    checkInviteToLoggedInUser,
    checkMembership,
    checkGroup,
    checkUser,
    checkAlreadyInvited,
    checkAlreadyMember,
    checkMaxMembers,
    inviteUser,
);

export default inviteUserToGroupController;
