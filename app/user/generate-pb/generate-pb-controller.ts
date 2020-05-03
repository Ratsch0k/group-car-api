import generatePb from '@app/util/generate-pb';
import config from '@config';

type RequestHandler = import('express').RequestHandler;

const generatePbController: RequestHandler = (req, res, next) => {
  // Extract request data from request
  const username: string = req.query.username as string;
  const offset = Number.parseInt(req.query.offset as string) || 0;

  generatePb(config.user.pb.dimensions, username, offset).then((image) => {
    res.type('image/jpeg');
    res.send(image);
  });
};

export default generatePbController;
