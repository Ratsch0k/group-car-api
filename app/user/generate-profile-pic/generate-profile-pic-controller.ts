import generatePic from '@app/util/generate-profile-pic';
import config from '@config';

type RequestHandler = import('express').RequestHandler;

const generateProfilePicController: RequestHandler = (req, res, next) => {
  // Extract request data from request
  const username: string = req.query.username as string;

  // Because of sanitization chain `query.offset`
  // is not a string but either NaN or an integer
  const queryOffset: number = req.query.offset as unknown as number;

  // If `query.offset` was not provided user 0 as value
  const offset = Number.isNaN(queryOffset) ? 0 : queryOffset;

  generatePic(config.user.pb.dimensions, username, offset).then((image) => {
    res.type('image/jpeg');
    res.send(image);
  }).catch((err) => {
    // Forward err to error handler
    next(err);
  });
};

export default generateProfilePicController;
