type RequestHandler = import('express').RequestHandler;

const generatePbController: RequestHandler = (req, res, next) => {
  // Extract request data from request
  const username = req.query.username;
  const offset = req.query.offset || 0;

  res.send({
    username,
    offset,
  });
};

export default generatePbController;
