import express from 'express';
import {UserService} from '@models';
import {BadRequestError} from '@errors';
import {asyncWrapper} from '@util/async-wrapper';

const router: express.Router = express.Router();

/**
 * Controller to handle getting the profile picture of a specific user
 * @param req - Request
 * @param res - Response
 * @param _next - Unused next
 */
export const userProfilePicController: express.RequestHandler =
async (req, res, _next) => {
  const userId = Number.parseInt(req.params.userId, 10);

  if (isNaN(userId) || typeof req.user !== 'object') {
    throw new BadRequestError('Missing fields');
  }

  const pb = await UserService.getProfilePicture(req.user, userId);

  res.type('image/jpeg');
  res.send(pb.data);
};

/**
 * Add the routers to the route
 */
router.get('/:userId/profile-pic', asyncWrapper(userProfilePicController));

export default router;
