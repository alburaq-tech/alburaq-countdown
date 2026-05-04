/**
 * Package service — fetches data from Odoo via JSON-RPC API
 * and transforms into Package[] for the frontend.
 */

var odoo = require('../odooClient');
var busService = require('./busService');
var config = require('../config');
var format = require('../utils/format');

// Cached packages data
var cachedPackages = null;
var cachedAt = 0;
var CACHE_TTL = 30000; // 30 seconds

// Packages excluded from dashboard (same as original SQL query)
var EXCLUDED_PACKAGES = [
  "Lion CGK,SUB,YIA Umrah Sya'ban 1447 H (9D)",
  'LA Umrah Awal Ramadan 1447 H',
  'Lion, Garuda Awal Ramadhan'
];

/**
 * Fetch all packages from Odoo and transform to frontend shape.
 * Uses caching to avoid hitting Odoo on every request.
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Array>} Package[]
 */
async function getAll(forceRefresh) {
  var now = Date.now();
  if (!forceRefresh && cachedPackages && (now - cachedAt) < CACHE_TTL) {
    return cachedPackages;
  }

  // Filter: departure >= today, optionally capped by DAYS_AHEAD (0 = no limit)
  var today = new Date();
  var todayStr = today.toISOString().split('T')[0];
  var domain = [
    ['is_umrah_product', '=', true],
    ['sale_ok', '=', true],
    ['departure_date', '>=', todayStr]
  ];
  // If DAYS_AHEAD > 0, only show departures within that many days
  if (config.daysAhead > 0) {
    var maxDate = new Date(today.getTime() + config.daysAhead * 86400000);
    domain.push(['departure_date', '<=', maxDate.toISOString().split('T')[0]]);
  }

  var products = await odoo.searchRead('product.template', domain, {
    fields: [
      'id', 'name', 'default_code', 'product_code',
      'departure_date', 'return_date',
      'quota', 'quota_male', 'quota_female',
      'registered_jamaah_count', 'remaining_quota',
      'group_product', 'list_price'
    ],
    order: 'departure_date asc',
    limit: 200
  });

  // Group by group_product if set, otherwise use product name
  var groups = {};
  var order = [];

  products.forEach(function(p) {
    var name = p.name || '';
    // group_product is either a string or false (not null)
    var hasGroup = p.group_product && typeof p.group_product === 'string' && p.group_product.trim() !== '';
    var key = hasGroup ? p.group_product : name;

    // Exclude specific packages
    if (EXCLUDED_PACKAGES.indexOf(key) !== -1) return;

    if (!groups[key]) {
      groups[key] = {
        product_id: p.id,
        product_name: key,
        product_code: p.product_code || p.default_code || '',
        first_departure_date: p.departure_date,
        first_return_date: p.return_date || null,
        quota: p.quota || 0,
        list_price: p.list_price || 0,
        pax_count: 0
      };
      order.push(key);
    }

    var g = groups[key];
    // Update to earliest departure date
    if (p.departure_date && (!g.first_departure_date || p.departure_date < g.first_departure_date)) {
      g.first_departure_date = p.departure_date;
    }
    // Use max quota across group
    if ((p.quota || 0) > g.quota) {
      g.quota = p.quota;
    }
    // Use highest price across group
    if ((p.list_price || 0) > g.list_price) {
      g.list_price = p.list_price;
    }
    // Sum registered jamaah counts
    g.pax_count += (p.registered_jamaah_count || 0);
  });

  var packages = order.map(function(key) {
    var g = groups[key];
    return {
      id: g.product_id,
      name: g.product_name,
      dep: format.formatTanggalID(g.first_departure_date),
      dur: format.formatDurasi(g.first_departure_date, g.first_return_date),
      price: format.formatRupiah(g.list_price),
      buses: busService.generateBuses(g.pax_count, config.busCapacity),
      _departure_date: g.first_departure_date // internal sort key
    };
  });

  // Sort by departure date ascending (earliest first)
  packages.sort(function(a, b) {
    return new Date(a._departure_date) - new Date(b._departure_date);
  });

  // Remove internal sort key before returning
  packages.forEach(function(p) { delete p._departure_date; });

  cachedPackages = packages;
  cachedAt = Date.now();
  return packages;
}

/**
 * Fetch a single package by ID.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function getById(id) {
  var all = await getAll();
  return all.find(function(p) { return p.id === Number(id); }) || null;
}

/**
 * Force refresh packages from Odoo (clear cache).
 * @returns {Promise<Array>}
 */
async function refresh() {
  cachedPackages = null;
  cachedAt = 0;
  return getAll(true);
}

module.exports = { getAll: getAll, getById: getById, refresh: refresh };