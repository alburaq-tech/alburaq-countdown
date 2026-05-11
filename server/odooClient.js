/**
 * Odoo JSON-RPC Client
 * Authenticates via /web/session/authenticate, then calls model methods
 * via /web/dataset/call_kw.
 */

var https = require('https');
var http = require('http');
var config = require('./config');

var sessionId = null;
var sessionCookie = null;

/**
 * Make an HTTP/HTTPS request.
 */
function request(url, body) {
  return new Promise(function(resolve, reject) {
    var parsed = new URL(url);
    var mod = parsed.protocol === 'https:' ? https : http;
    var data = body ? JSON.stringify(body) : '';
    var options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    var req = mod.request(options, function(res) {
      var chunks = [];
      res.on('data', function(chunk) { chunks.push(chunk); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString('utf8');
        // Capture session cookie from response
        var setCookie = res.headers['set-cookie'];
        if (setCookie) {
          // Extract session_id cookie
          var sid = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
          // Keep only session_id=... part
          var match = sid.match(/session_id=[^;]+/);
          if (match) {
            sessionCookie = match[0];
          }
        }
        try {
          var json = JSON.parse(raw);
          if (json.error) {
            reject(new Error(json.error.data ? json.error.data.message : JSON.stringify(json.error)));
            return;
          }
          resolve(json.result || json);
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + raw.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);

    if (data) req.write(data);
    req.end();
  });
}

/**
 * Authenticate to Odoo and store session.
 */
async function authenticate() {
  var url = config.odoo.url.replace(/\/$/, '') + '/web/session/authenticate';
  var body = {
    jsonrpc: '2.0',
    params: {
      db: config.odoo.db,
      login: config.odoo.user,
      password: config.odoo.password
    }
  };

  var result = await request(url, body);
  if (result && result.uid) {
    sessionId = result.session_id || null;
    console.log('[ODOO] Authenticated as %s (uid: %s)', result.username || config.odoo.user, result.uid);
    return result;
  }
  throw new Error('Odoo authentication failed');
}

/**
 * Ensure we have a valid session (re-authenticate if needed).
 */
async function ensureSession() {
  if (!sessionCookie) {
    await authenticate();
  }
}

/**
 * Call an Odoo model method via JSON-RPC.
 * @param {string} model - Odoo model name (e.g. 'product.template')
 * @param {string} method - Method name (e.g. 'search_read')
 * @param {Array} args - Positional args (usually [domain, fields])
 * @param {Object} kwargs - Keyword args
 */
async function callKw(model, method, args, kwargs) {
  await ensureSession();
  var url = config.odoo.url.replace(/\/$/, '') + '/web/dataset/call_kw';
  var body = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      model: model,
      method: method,
      args: args || [],
      kwargs: kwargs || {}
    }
  };

  try {
    return await request(url, body);
  } catch (err) {
    // Session might have expired, retry once
    if (err.message && (err.message.includes('session') || err.message.includes('401') || err.message.includes('Credential'))) {
      sessionCookie = null;
      await authenticate();
      return await request(url, body);
    }
    throw err;
  }
}

/**
 * Search and read records from an Odoo model.
 * @param {string} model - Model name
 * @param {Array} domain - Search domain
 * @param {Object} options - { fields: [...], limit: N, offset: N, order: 'field' }
 */
async function searchRead(model, domain, options) {
  var opts = options || {};
  var kwargs = {};
  if (opts.fields) kwargs.fields = opts.fields;
  if (opts.limit) kwargs.limit = opts.limit;
  if (opts.offset) kwargs.offset = opts.offset;
  if (opts.order) kwargs.order = opts.order;

  return callKw(model, 'search_read', [domain], kwargs);
}

/**
 * Read specific records by ID.
 * @param {string} model - Model name
 * @param {Array} ids - Record IDs
 * @param {Array} fields - Fields to read
 */
async function read(model, ids, fields) {
  return callKw(model, 'read', [ids], { fields: fields });
}

/**
 * Execute a raw SQL query via Odoo (requires appropriate access).
 * This uses the 'query' method on a custom model or base.
 * Falls back to search_read if not available.
 */
async function rawQuery(sql, params) {
  // Try using ir.cron or a custom method to execute SQL
  // This may not be available in all Odoo instances
  throw new Error('Raw SQL not supported via Odoo API. Use search_read instead.');
}

module.exports = {
  authenticate: authenticate,
  searchRead: searchRead,
  read: read,
  callKw: callKw,
  ensureSession: ensureSession
};