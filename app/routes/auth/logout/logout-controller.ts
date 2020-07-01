import {RequestHandler} from 'express';

/**
 * A simple controller which removes the jwt cookie for the client.
 * @param req - Request
 * @param res - Response
 */
const logoutController: RequestHandler = (req, res) => {
  res.setJwtToken({});
  res.status(204);
  res.send();
};

export default logoutController;
