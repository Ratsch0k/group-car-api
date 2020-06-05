import {Group} from '@app/models';

type RequestHandler = import('express').RequestHandler;

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
const createGroupController: RequestHandler = (req, res, next) => {
  Group.create({
    name: req.body.name,
    description: req.body.description,
    ownerId: req.user?.id,
  }).then((group: Group) => {
    res.status(201).send(group);
  }).catch(next);
};

export default createGroupController;
