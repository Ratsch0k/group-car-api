const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/', (req, res, next) => {
  res.send('This is path /nested');
});

module.exports = router;
