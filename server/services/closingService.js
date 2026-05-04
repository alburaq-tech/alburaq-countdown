/**
 * Closing service — tracks the last closing event from Odoo webhook.
 */

var stateManager = require('./stateManager');

/**
 * Get the last closing event.
 * @returns {Promise<Object|null>}
 */
async function getLast() {
  var state = await stateManager.read();
  return state.lastClosing || null;
}

/**
 * Save a new closing event (overwrites the previous one).
 * @param {Object} data - Closing payload from Odoo webhook
 * @returns {Promise<Object>}
 */
async function save(data) {
  var lastClosing = {
    quotation_no: data.quotation_no || '',
    product_name: data.product_name || '',
    product_default_code: data.product_default_code || '',
    city: data.city || '',
    pax_count: data.pax_count || 0,
    total_tagihan: data.total_tagihan || 0,
    jumlah_bayar: data.jumlah_bayar || 0,
    tahapan_pembayaran: data.tahapan_pembayaran || '',
    owner_cs: data.owner_cs || '',
    name_cs: data.name_cs || '',
    at: new Date().toISOString()
  };

  await stateManager.update({ lastClosing: lastClosing });
  return lastClosing;
}

module.exports = { getLast, save };