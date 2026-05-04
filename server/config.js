require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  // Odoo JSON-RPC API
  odoo: {
    url: process.env.ODOO_URL || '',
    db: process.env.ODOO_DB || '',
    user: process.env.ODOO_USER || '',
    password: process.env.ODOO_PASSWORD || '',
  },

  // Bus generation
  busCapacity: parseInt(process.env.BUS_CAPACITY, 10) || 45,

  // Package filter: only show departures within this many days from today
  // Set to 0 to show all future departures (no upper limit)
  daysAhead: parseInt(process.env.DAYS_AHEAD, 10) || 0,

  // Webhook auth
  webhookSecret: process.env.WEBHOOK_SECRET || '',

  // State file path
  stateFile: process.env.STATE_FILE || './server/data/state.json',

  // Data refresh interval (ms) — how often to re-fetch from Odoo
  refreshIntervalMs: parseInt(process.env.REFRESH_INTERVAL_MS, 10) || 60000,

  // Auto-refresh interval for background scheduler (default 10 minutes)
  autoRefreshIntervalMs: parseInt(process.env.AUTO_REFRESH_INTERVAL_MS, 10) || 600000,

  // Recent buyers settings
  recentBuyersDays: parseInt(process.env.RECENT_BUYERS_DAYS, 10) || 14,
  recentBuyersMaxCount: parseInt(process.env.RECENT_BUYERS_MAX_COUNT, 10) || 50,
  recentBuyersFile: process.env.RECENT_BUYERS_FILE || './server/data/recent-buyers.json',
};