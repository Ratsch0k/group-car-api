const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Hello World');
});

module.exports = router;
