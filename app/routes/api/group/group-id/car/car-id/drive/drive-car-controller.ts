import {BadRequestError} from '@app/errors';
import {CarService} from '@app/models';
import {RequestHandler} from 'express';

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
