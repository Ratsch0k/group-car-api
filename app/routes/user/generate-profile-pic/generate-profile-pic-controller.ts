import {RequestHandler} from 'express';
import {UserService} from '@models';

const generateProfilePicController: RequestHandler = async (
  req,
  res,
  _next,
) => {
  // Extract request data from request
  const username: string = req.query.username as string;

  // Because of sanitization chain `query.offset`
  // is not a string but either NaN or an integer
  const queryOffset: number = req.query.offset as unknown as number;

  // If `query.offset` was not provided user 0 as value
  const offset = Number.isNaN(queryOffset) ? 0 : queryOffset;

  const pb = await UserService.generateProfilePicture(req.ip, username, offset);

  res.type('image/jpeg');
  res.send(pb);
};

export default generateProfilePicController;
