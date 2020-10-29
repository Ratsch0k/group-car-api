import {BadRequestError} from '@errors';
import {CarService} from '@models';
import debug from 'debug';
import {RequestHandler} from 'express';

const log = debug('group-car:group:car:create');
const error = debug('group-car:group:car:create:error');

export const createCarController: RequestHandler = async (req, res, next) => {
  const currentUser = req.user;
  const groupId = parseInt(req.params.groupId, 10);

  if (typeof currentUser === 'object' && !isNaN(groupId)) {
    log('User %d: create car for group %d', currentUser.id, groupId);

    const group = await CarService.create(
        currentUser,
        groupId,
        req.body.name,
        req.body.color,
        {
          withDriverData: false,
        },
    );

    res.status(201).send(group.get({plain: true}));
  } else {
    error('At least one parameter is missing');
    throw new BadRequestError();
  }
};
