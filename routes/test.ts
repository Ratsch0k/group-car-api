import express = require('express');
const router: express.Router = express.Router();

router.get('/', (req, res, next) => {
  res.send('Server is reachable');
});

module.exports = router;
