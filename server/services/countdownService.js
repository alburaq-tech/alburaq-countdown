/**
 * Countdown service — reads/writes countdown data from state.json.
 */

var stateManager = require('./stateManager');

/**
 * Get countdown config.
 * @returns {Promise<{lbl: string, iso: string}>}
 */
async function get() {
  var state = await stateManager.read();
  return state.countdown || { lbl: 'PROMO BERAKHIR DALAM', iso: new Date(Date.now() + 2 * 3600000).toISOString() };
}

/**
 * Update countdown config.
 * @param {{lbl: string, iso: string}} cd
 * @returns {Promise<{lbl: string, iso: string}>}
 */
async function save(cd) {
  if (!cd || !cd.lbl || !cd.iso) {
    throw new Error('Countdown must have lbl and iso fields');
  }
  await stateManager.update({ countdown: { lbl: cd.lbl, iso: cd.iso } });
  return cd;
}

module.exports = { get, save };