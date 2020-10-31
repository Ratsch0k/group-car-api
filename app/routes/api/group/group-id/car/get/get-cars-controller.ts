import {BadRequestError} from '@errors';
import {CarService} from '@models';
import {RequestHandler} from 'express';

/**
 * Controller for getting all cars of a group.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const getCarsController: RequestHandler = async (req, res, next) => {
  // Get arguments from request
  const user = req.user;
  const groupId = parseInt(req.params.groupId, 10);

  if (typeof user === 'object' && !isNaN(groupId)) {
    const cars = await CarService.findByGroup(user, groupId);
    res.send({cars});
  } else {
    throw new BadRequestError('Missing arguments');
  }
};
