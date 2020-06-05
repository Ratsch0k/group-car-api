type RequestHandler = import('express').RequestHandler;

const updateGroupController: RequestHandler= (req, res) => {
  res.send(req.params.groupId);
};

export default updateGroupController;
