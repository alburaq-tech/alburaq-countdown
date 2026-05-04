/**
 * Odoo Recent Buyers Fetcher
 * Queries umrah.quotation from Odoo and transforms into RecentBuyer[]
 */

var odoo = require('../odooClient');
var config = require('../config');

/**
 * Fetch recent buyers from Odoo umrah.quotations.
 * @returns {Promise<Array>} RecentBuyer[]
 */
async function fetchRecentBuyers() {
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.recentBuyersDays);
  var cutoffStr = cutoff.toISOString().split('T')[0] + ' 00:00:00';

  // 1. Fetch umrah.quotations within date range (exclude refunded)
  var quotations = await odoo.searchRead('umrah.quotation', [
    ['create_date', '>=', cutoffStr],
    ['state', 'in', ['accepted', 'fully_paid', 'done']],
    ['is_refunded', '=', false]
  ], {
    fields: ['name', 'partner_id', 'create_date', 'amount_total', 'paket_umrah_id', 'city'],
    order: 'create_date desc',
    limit: config.recentBuyersMaxCount * 2
  });

  if (!quotations || !quotations.length) {
    return [];
  }

  // 2. Collect all paket_umrah_id (product IDs)
  var productIds = [];
  quotations.forEach(function(q) {
    if (q.paket_umrah_id && Array.isArray(q.paket_umrah_id)) {
      productIds.push(q.paket_umrah_id[0]);
    }
  });

  // 3. Read products to get names
  var productMap = {}; // productId -> { name, default_code }
  if (productIds.length) {
    var uniqueProductIds = productIds.filter(function(v, i, a) { return a.indexOf(v) === i; });
    var products = await odoo.read('product.template', uniqueProductIds, ['name', 'default_code']);
    products.forEach(function(p) {
      productMap[p.id] = {
        name: p.name || '',
        default_code: p.default_code || ''
      };
    });
  }

  // 4. Build buyers array — one entry per quotation
  var buyers = [];
  quotations.forEach(function(q) {
    var partnerName = '';
    if (q.partner_id && Array.isArray(q.partner_id)) {
      partnerName = q.partner_id[1] || '';
    }

    var productName = '';
    var productCode = '';
    if (q.paket_umrah_id && Array.isArray(q.paket_umrah_id)) {
      var p = productMap[q.paket_umrah_id[0]];
      if (p) {
        productName = p.name;
        productCode = p.default_code;
      }
    }

    buyers.push({
      quotation_no: q.name || '',
      jamaah_name: partnerName,
      city: q.city || '',
      product_name: productName,
      product_default_code: productCode,
      pax_count: 1, // umrah.quotation is per person typically
      purchase_date: q.create_date,
      total_tagihan: q.amount_total || 0
    });
  });

  return buyers;
}

module.exports = { fetchRecentBuyers: fetchRecentBuyers };
