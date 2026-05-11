/**
 * Scheduler Service — background auto-fetch from Odoo every 10 minutes.
 * Performs full refresh of packages and recent buyers.
 */

var packageService = require('./packageService');
var recentBuyersService = require('./recentBuyersService');
var odooRecentBuyers = require('./odooRecentBuyers');
var stateManager = require('./stateManager');
var config = require('../config');

var intervalId = null;

/**
 * Perform a full refresh now.
 * 1. Refresh packages from Odoo
 * 2. Fetch recent buyers from Odoo
 * 3. Update last_updated timestamp
 * 4. Return refreshed data
 * @returns {Promise<{packages: Array, buyers: Array, lastUpdated: string}>}
 */
async function refreshNow() {
  console.log('[SCHEDULER] Starting full refresh...');
  var start = Date.now();

  try {
    // 1. Refresh packages
    var packages = await packageService.refresh();
    console.log('[SCHEDULER] Packages refreshed: %d items', packages.length);

    // 2. Fetch recent buyers
    var buyers = await odooRecentBuyers.fetchRecentBuyers();
    console.log('[SCHEDULER] Recent buyers fetched: %d items', buyers.length);

    // 3. Save buyers (filter + limit)
    await recentBuyersService.save(buyers);

    // 4. Update last_updated
    var lastUpdated = new Date().toISOString();
    await stateManager.updateLastUpdated();

    var elapsed = Date.now() - start;
    console.log('[SCHEDULER] Full refresh completed in %dms', elapsed);

    return {
      packages: packages,
      buyers: buyers,
      lastUpdated: lastUpdated
    };
  } catch (err) {
    console.error('[SCHEDULER] Full refresh failed:', err.message);
    throw err;
  }
}

/**
 * Start the background scheduler.
 */
function start() {
  if (intervalId) {
    console.log('[SCHEDULER] Already running');
    return;
  }

  console.log('[SCHEDULER] Starting auto-refresh every %d ms', config.autoRefreshIntervalMs);

  intervalId = setInterval(function() {
    refreshNow().catch(function(err) {
      console.error('[SCHEDULER] Scheduled refresh error:', err.message);
    });
  }, config.autoRefreshIntervalMs);
}

/**
 * Stop the background scheduler.
 */
function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SCHEDULER] Stopped');
  }
}

/**
 * Check if scheduler is running.
 * @returns {boolean}
 */
function isRunning() {
  return !!intervalId;
}

module.exports = {
  refreshNow: refreshNow,
  start: start,
  stop: stop,
  isRunning: isRunning
};
