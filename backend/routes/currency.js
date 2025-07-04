var express = require('express');
var router = express.Router();

/* GET currency listing. */
// Ideally we want this to return the probability of if it's better to invest in eur
// or usd

const { Flipside } = require("@flipsidecrypto/sdk");

const flipside = new Flipside(
  process.env.FLIPSIDE_API_KEY,
  "https://api-v2.flipsidecrypto.xyz"
);

const sql = `
SELECT
  date_trunc('hour', block_timestamp) as hour,
  count(distinct tx_hash) as tx_count
FROM ethereum.core.fact_transactions
WHERE block_timestamp >= GETDATE() - interval'7 days'
GROUP BY 1
`

const queryResultSet = await flipside.query.run({sql: sql});

router.get('/', function(req, res, next) {
  res.json({ EUR: '70%', USD: '30%' });
});

module.exports = router;
