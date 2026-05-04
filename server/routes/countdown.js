/**
 * Routes: /api/countdown
 */

var express = require('express');
var router = express.Router();
var countdownService = require('../services/countdownService');

/**
 * GET /api/countdown
 * Returns countdown label and ISO target date.
 */
router.get('/', async function(req, res) {
  try {
    var cd = await countdownService.get();
    res.json(cd);
  } catch (err) {
    console.error('[COUNTDOWN] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch countdown' });
  }
});

/**
 * PUT /api/countdown
 * Update countdown label and ISO target date.
 */
router.put('/', async function(req, res) {
  try {
    var cd = await countdownService.save(req.body);
    res.json(cd);
  } catch (err) {
    console.error('[COUNTDOWN] Error saving:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;