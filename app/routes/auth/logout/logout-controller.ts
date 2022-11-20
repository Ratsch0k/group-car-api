import {RequestHandler} from 'express';

/**
 * A simple controller which removes the jwt cookie for the client.
 * @param req - Request
 * @param res - Response
 */
const logoutController: RequestHandler = async (req, res) => {
  await req.destroySession();

  res.status(204).send();
};

export default logoutController;
