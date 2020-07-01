import {RequestHandler} from 'express';
import {InviteRepository} from '@app/models/invite/invite-repository';
import {NotLoggedInError} from '@app/errors/not-logged-in-error';

/**
 * Controller for getting all invites of the currently logged in user.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const getAllInvitesController: RequestHandler = (req, res, next) => {
  /*
   * Check if user is set on request.
   * This should never be the case as this route is protected by
   * the and not defined user should have been caught in an earlier
   * request handler.
   */
  if (req.user === undefined) {
    next(new NotLoggedInError());
  } else {
    InviteRepository.findAllForUser(
        req.user, {
          withGroupData: true,
          withInvitedByData: true,
        }).then((list) => res.send({invites: list}))
        .catch(next);
  }
};
