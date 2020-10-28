import {RequestHandler} from 'express';
import {NotLoggedInError} from '@errors';
import {InviteService} from '@models';

/**
 * Controller for getting all invites of the currently logged in user.
 * @param req   - Request
 * @param res   - Response
 * @param _next  - Next
 */
export const getAllInvitesController: RequestHandler =
async (req, res, next) => {
  /*
   * Check if user is set on request.
   * This should never be the case as this route is protected by
   * the and not defined user should have been caught in an earlier
   * request handler.
   */
  if (req.user === undefined) {
    throw new NotLoggedInError();
  } else {
    const list = await InviteService.findAllForUser(req.user, req.user.id);
    res.send({invites: list});
  }
};
