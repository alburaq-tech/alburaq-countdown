/**
 * State manager — reads/writes server/data/state.json.
 * Simple JSON file persistence for countdown & last closing.
 */

var fs = require('fs');
var path = require('path');
var config = require('../config');

var STATE_PATH = path.resolve(process.cwd(), config.stateFile);

var DEFAULT_STATE = {
  countdown: {
    lbl: 'PROMO BERAKHIR DALAM',
    iso: new Date(Date.now() + 2 * 3600000).toISOString()
  },
  lastClosing: null,
  lastUpdated: null
};

/**
 * Ensure the state file and its directory exist.
 */
function ensureFile() {
  var dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
  }
}

/**
 * Read the current state from file.
 * @returns {Promise<Object>}
 */
async function read() {
  return new Promise(function(resolve, reject) {
    ensureFile();
    fs.readFile(STATE_PATH, 'utf8', function(err, data) {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve(DEFAULT_STATE);
      }
    });
  });
}

/**
 * Merge updates into the state file.
 * @param {Object} updates - Partial state to merge
 * @returns {Promise<Object>} Updated full state
 */
async function update(updates) {
  var current = await read();
  var merged = Object.assign({}, current, updates);
  return new Promise(function(resolve, reject) {
    ensureFile();
    fs.writeFile(STATE_PATH, JSON.stringify(merged, null, 2), 'utf8', function(err) {
      if (err) return reject(err);
      resolve(merged);
    });
  });
}

/**
 * Update the last_updated timestamp.
 * @returns {Promise<Object>}
 */
async function updateLastUpdated() {
  return update({ lastUpdated: new Date().toISOString() });
}

/**
 * Get the last_updated timestamp.
 * @returns {Promise<string|null>}
 */
async function getLastUpdated() {
  var state = await read();
  return state.lastUpdated || null;
}

module.exports = { read, update, updateLastUpdated, getLastUpdated };