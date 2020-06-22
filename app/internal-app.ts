import express from 'express';

/**
 * Internal small express server for admin requests.
 */
const internalApp: express.Application = express();

internalApp.use(express.json());

export default internalApp;
