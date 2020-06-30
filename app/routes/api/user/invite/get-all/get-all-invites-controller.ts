import {RequestHandler} from 'express';
import {InviteRepository} from '@app/models/invite/invite-repository';

/**
 * Controller for getting all invites of the currently logged in user.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const getAllInvitesController: RequestHandler = (req, res, next) => {
  InviteRepository.findAllForUser(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    req.user!, {
      withGroupData: true,
      withInvitedByData: true,
    }).then((list) => res.send({invites: list}))
      .catch(next);
};
