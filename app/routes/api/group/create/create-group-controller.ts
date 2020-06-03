import {Group, User} from '@app/models';
import {UserNotFoundError} from '@app/errors';

type RequestHandler = import('express').RequestHandler;

const createGroupController: RequestHandler = (req, res, next) => {
  // Get id of user
  User.findByPk(req.user?.id).then((user: User | null) => {
    if (user) {
      Group.create({
        name: req.body.name,
        description: req.body.description,
        ownerId: user.id,
      }).then((group: Group) => {
        res.status(201).send(group);
      });
    } else {
      next(new UserNotFoundError(req.user!.id!));
    }
  }).catch((err: any) => {
    next(err);
  });
};

export default createGroupController;
