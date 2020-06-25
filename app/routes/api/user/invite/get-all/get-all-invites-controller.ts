import {RequestHandler} from 'express';
import {InviteRepository} from '@app/models/invite/invite-repository';

export const getAllInvitesController: RequestHandler = (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  InviteRepository.findAllForUser(req.user!).then(res.send);
};
