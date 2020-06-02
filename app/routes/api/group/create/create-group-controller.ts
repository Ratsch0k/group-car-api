type RequestHandler = import('express').RequestHandler;

const createGroupController: RequestHandler = (req, res, next) => {
  res.send(201);
};

export default createGroupController;
