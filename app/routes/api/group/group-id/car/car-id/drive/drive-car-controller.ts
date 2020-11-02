import {BadRequestError} from '@app/errors';
import {CarService} from '@app/models';
import {RequestHandler} from 'express';

/**
 * Controller for a user to request to drive the specified car.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const driveCarController: RequestHandler = async (req, res, next) => {
  const user = req.user;
  const groupId = parseInt(req.params.groupId, 10);
  const carId = parseInt(req.params.carId, 10);

  if (typeof user === 'object' && !isNaN(groupId) && !isNaN(carId)) {
    await CarService.registerDriver(user, groupId, carId);
    res.status(204).send();
  } else {
    throw new BadRequestError('Missing parameter');
  }
};
