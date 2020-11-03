import {BadRequestError} from '@app/errors';
import {CarService} from '@app/models';
import {RequestHandler} from 'express';

/**
 * Controller for handling parking of the specified car.
 * @param req   - Request
 * @param res   - Response
 * @param next  - Next
 */
export const parkCarController: RequestHandler = async (req, res, next) => {
  const user = req.user;
  const groupId = parseInt(req.params.groupId, 10);
  const carId = parseInt(req.params.carId, 10);
  const lat = parseFloat(req.body.latitude);
  const lon = parseFloat(req.body.longitude);

  if (typeof user === 'object' &&
      !isNaN(groupId) &&
      !isNaN(carId) &&
      !isNaN(lat) &&
      !isNaN(lon)) {
    await CarService.parkCar(user, groupId, carId, lat, lon);

    res.status(204).send();
  } else {
    throw new BadRequestError('Missing parameter');
  }
};
