/**
 * Recent Buyers Service — manages recent buyer data in a JSON file.
 * Stores up to recentBuyersMaxCount buyers within recentBuyersDays.
 */

var fs = require('fs');
var path = require('path');
var config = require('../config');

var BUYERS_PATH = path.resolve(process.cwd(), config.recentBuyersFile);

var DEFAULT_BUYERS = {
  buyers: [],
  lastUpdated: null
};

/**
 * Ensure the buyers file and its directory exist.
 */
function ensureFile() {
  var dir = path.dirname(BUYERS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(BUYERS_PATH)) {
    fs.writeFileSync(BUYERS_PATH, JSON.stringify(DEFAULT_BUYERS, null, 2), 'utf8');
  }
}

/**
 * Read the current buyers data from file.
 * @returns {Promise<Object>}
 */
async function read() {
  return new Promise(function(resolve, reject) {
    ensureFile();
    fs.readFile(BUYERS_PATH, 'utf8', function(err, data) {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve(DEFAULT_BUYERS);
      }
    });
  });
}

/**
 * Overwrite the buyers file with new data.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function write(data) {
  return new Promise(function(resolve, reject) {
    ensureFile();
    fs.writeFile(BUYERS_PATH, JSON.stringify(data, null, 2), 'utf8', function(err) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

/**
 * Get all recent buyers (already filtered & sorted).
 * @returns {Promise<Array>}
 */
async function getAll() {
  var data = await read();
  return data.buyers || [];
}

/**
 * Get a random buyer from the recent buyers list.
 * @returns {Promise<Object|null>}
 */
async function getRandom() {
  var buyers = await getAll();
  if (!buyers.length) return null;
  return buyers[Math.floor(Math.random() * buyers.length)];
}

/**
 * Save a full array of buyers (from Odoo fetch).
 * Automatically filters by date range and limits count.
 * @param {Array} buyers
 * @returns {Promise<Object>}
 */
async function save(buyers) {
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.recentBuyersDays);

  var filtered = (buyers || [])
    .filter(function(b) {
      return b.purchase_date && new Date(b.purchase_date) >= cutoff;
    })
    .sort(function(a, b) {
      return new Date(b.purchase_date) - new Date(a.purchase_date);
    })
    .slice(0, config.recentBuyersMaxCount);

  return write({
    buyers: filtered,
    lastUpdated: new Date().toISOString()
  });
}

/**
 * Cleanup old buyers (same logic as save but without new data).
 * @returns {Promise<Object>}
 */
async function cleanup() {
  var data = await read();
  return save(data.buyers || []);
}

module.exports = {
  read: read,
  write: write,
  getAll: getAll,
  getRandom: getRandom,
  save: save,
  cleanup: cleanup
};
