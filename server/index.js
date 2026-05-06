/**
 * Alburaq Countdown — Backend API Server
 *
 * Serves:
 *  - Static frontend files (HTML, JS, CSS, assets)
 *  - REST API: /api/packages, /api/countdown, /api/closing
 *  - SSE: /api/events (real-time push to browser)
 */

var express = require('express');
var cors = require('cors');
var path = require('path');
var config = require('./config');

var packagesRouter = require('./routes/packages');
var countdownRouter = require('./routes/countdown');
var closingRouter = require('./routes/closing');
var recentBuyersRouter = require('./routes/recentBuyers');

var schedulerService = require('./services/schedulerService');

var app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── SSE Clients ───────────────────────────────────────────
var sseClients = [];

/**
 * Broadcast an SSE event to all connected clients.
 * @param {string} event - Event name
 * @param {*} data - Event payload
 */
function sseBroadcast(event, data) {
  var payload = JSON.stringify(data);
  sseClients.forEach(function(client) {
    client.res.write('event: ' + event + '\ndata: ' + payload + '\n\n');
  });
}

// Expose to routes so they can trigger SSE
app.locals.sseBroadcast = sseBroadcast;

// ── SSE Endpoint ──────────────────────────────────────────
app.get('/api/events', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': connected\n\n');

  var client = { id: Date.now(), res: res };
  sseClients.push(client);

  req.on('close', function() {
    sseClients = sseClients.filter(function(c) { return c.id !== client.id; });
  });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/packages', packagesRouter);
app.use('/api/countdown', countdownRouter);
app.use('/api/closing', closingRouter);
app.use('/api/recent-buyers', recentBuyersRouter);

// ── Config endpoint (for frontend) ──────────────────────────
app.get('/api/config', function(req, res) {
  res.json({
    notifIntervalMs: config.notifIntervalMs,
    anonymizeBuyers: config.anonymizeBuyers
  });
});

// ── Static Files (frontend) ───────────────────────────────
var staticDir = path.resolve(__dirname, '..');
app.use(express.static(staticDir, {
  etag: false,
  maxAge: 0,
  setHeaders: function(res) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// SPA fallback: serve the HTML file for any non-API route
app.get('*', function(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(staticDir, 'alburaq-countdown.html'));
});

// ── Start ─────────────────────────────────────────────────
app.listen(config.port, function() {
  console.log('[SERVER] Alburaq Countdown running on http://localhost:%d', config.port);
  console.log('[SERVER] Odoo: %s (db: %s)', config.odoo.url, config.odoo.db);
  console.log('[SERVER] Bus capacity: %d', config.busCapacity);

  // Initial full refresh on startup, then start scheduler
  schedulerService.refreshNow().then(function(result) {
    console.log('[SERVER] Initial refresh completed: %d packages, %d buyers', result.packages.length, result.buyers.length);
    schedulerService.start();
  }).catch(function(err) {
    console.error('[SERVER] Initial refresh failed:', err.message);
    // Still start scheduler so it retries on next interval
    schedulerService.start();
  });
});

module.exports = app;