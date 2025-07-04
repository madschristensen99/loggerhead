var express = require('express');
var router = express.Router();

/* GET currency listing. */
router.get('/', function(req, res, next) {
  res.json({ EUR: '70%', USD: '30%' });
});

module.exports = router;
