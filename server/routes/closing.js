/**
 * Routes: /api/closing
 */

var express = require('express');
var router = express.Router();
var closingService = require('../services/closingService');
var schedulerService = require('../services/schedulerService');
var config = require('../config');

/**
 * Validate webhook secret if configured.
 */
function validateWebhook(req, res, next) {
  if (!config.webhookSecret) return next();
  var auth = req.headers['x-webhook-secret'] || req.headers['authorization'];
  if (auth === config.webhookSecret || auth === 'Bearer ' + config.webhookSecret) {
    return next();
  }
  res.status(401).json({ error: 'Invalid webhook secret' });
}

/**
 * POST /api/closing
 * Webhook called by Odoo when a new closing (upload_payment) comes in.
 * Triggers a full refresh of packages and recent buyers.
 * Body: { quotation_no, product_name, product_default_code, city, pax_count, ... }
 */
router.post('/', validateWebhook, async function(req, res) {
  try {
    var data = req.body;
    if (!data.quotation_no) {
      return res.status(400).json({ error: 'quotation_no is required' });
    }

    var lastClosing = await closingService.save(data);

    // Notify SSE clients about the closing event
    if (req.app.locals.sseBroadcast) {
      req.app.locals.sseBroadcast('closing', {
        city: lastClosing.city,
        pax_count: lastClosing.pax_count,
        product_name: lastClosing.product_name,
        quotation_no: lastClosing.quotation_no,
        at: lastClosing.at
      });
    }

    console.log('[CLOSING] New closing from %s, %d pax, %s', data.city, data.pax_count, data.product_name);

    // Trigger full refresh (packages + recent buyers)
    var refreshResult = await schedulerService.refreshNow();

    // Notify SSE clients about full refresh
    if (req.app.locals.sseBroadcast) {
      req.app.locals.sseBroadcast('refresh', {
        packages: refreshResult.packages,
        recentBuyers: refreshResult.buyers,
        lastUpdated: refreshResult.lastUpdated
      });
    }

    res.json({ ok: true, lastUpdated: refreshResult.lastUpdated });
  } catch (err) {
    console.error('[CLOSING] Error:', err.message);
    res.status(500).json({ error: 'Failed to process closing' });
  }
});

/**
 * GET /api/closing/last
 * Returns the last closing event.
 */
router.get('/last', async function(req, res) {
  try {
    var lastClosing = await closingService.getLast();
    res.json(lastClosing || {});
  } catch (err) {
    console.error('[CLOSING] Error fetching last closing:', err.message);
    res.status(500).json({ error: 'Failed to fetch last closing' });
  }
});

module.exports = router;