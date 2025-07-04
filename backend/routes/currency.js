var express = require('express');
var router = express.Router();

/* GET currency listing. */
// Ideally we want this to return the probability of if it's better to invest in eur
// or usd
router.get('/', function(req, res, next) {
  res.json({ EUR: '70%', USD: '30%' });
});

module.exports = router;
