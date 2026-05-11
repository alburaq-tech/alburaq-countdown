/**
 * Routes: /api/recent-buyers
 */

var express = require('express');
var router = express.Router();
var recentBuyersService = require('../services/recentBuyersService');
var stateManager = require('../services/stateManager');

/**
 * GET /api/recent-buyers
 * Returns all recent buyers within the configured range.
 */
router.get('/', async function(req, res) {
  try {
    var buyers = await recentBuyersService.getAll();
    var lastUpdated = await stateManager.getLastUpdated();
    res.json({ buyers: buyers, lastUpdated: lastUpdated });
  } catch (err) {
    console.error('[RECENT-BUYERS] Error fetching buyers:', err.message);
    res.status(500).json({ error: 'Failed to fetch recent buyers' });
  }
});

/**
 * GET /api/recent-buyers/random
 * Returns a random buyer from the recent buyers list.
 */
router.get('/random', async function(req, res) {
  try {
    var buyer = await recentBuyersService.getRandom();
    var lastUpdated = await stateManager.getLastUpdated();
    if (!buyer) {
      return res.status(404).json({ error: 'No recent buyers available' });
    }
    res.json({ buyer: buyer, lastUpdated: lastUpdated });
  } catch (err) {
    console.error('[RECENT-BUYERS] Error fetching random buyer:', err.message);
    res.status(500).json({ error: 'Failed to fetch random buyer' });
  }
});

module.exports = router;
