import {GroupService} from '@app/models';
import {RequestHandler} from 'express';
import {BadRequestError} from '@errors';

/**
 * Controller for handling create group request.
 *
 * Creates a new group with the name and description
 * in the body of the request.
 *
 * Sets the user which sent the request as the owner
 * of that group.
 * @param req  - Express request
 * @param res  - Express response
 * @param next - Next function
 */
const createGroupController: RequestHandler = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const user = req.user;

  if (
    typeof name !== 'string' ||
    (typeof description !== 'string' && description) ||
     typeof user !== 'object'
  ) {
    throw new BadRequestError('Incorrect arguments');
  }

  const group = await GroupService.create(user, {name, description});

  res.status(201).send(group);
};

export default createGroupController;
