import {
  BadRequestError,
} from '@errors';
import {GroupService} from '@models';
import {RequestHandler} from 'express';

/**
 * Invites the user to the group by creating a database entry.
 * @param req   - Request
 * @param res   - Response
 * @param _next  - Next
 */
export const inviteUserController: RequestHandler = async (
  req,
  res,
  _next,
) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user;
  const userId = parseInt(req.body.userId, 10);
  const username = req.body.username;
  const groupId = parseInt(req.params.groupId, 10);

  if (
    typeof user !== 'object' ||
    isNaN(groupId) ||
    (
      isNaN(userId) &&
      typeof username !== 'string'
    )
  ) {
    throw new BadRequestError('Incorrect Parameters');
  }

  // UserId will take precedence
  let idOrUsername: number | string;

  if (isNaN(userId)) {
    idOrUsername = username;
  } else {
    idOrUsername = userId;
  }

  const invite = await GroupService.inviteUser(user, groupId, idOrUsername);

  res.status(201).send(invite);
};

export default inviteUserController;
