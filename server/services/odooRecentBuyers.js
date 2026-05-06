/**
 * Odoo Recent Buyers Fetcher
 * Queries umrah.quotation from Odoo and transforms into RecentBuyer[]
 *
 * Note: umrah.quotation does NOT have partner_id, amount_total, or city fields.
 * - Customer name comes from lead_id (Many2one → crm.lead), which returns [id, name]
 * - Total price uses est_total_price (not amount_total)
 * - City comes from lead_id.city_id (Many2one → alburaq.id.district)
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
    fields: ['name', 'lead_id', 'create_date', 'est_total_price', 'paket_umrah_id'],
    order: 'create_date desc',
    limit: config.recentBuyersMaxCount * 2
  });

  if (!quotations || !quotations.length) {
    return [];
  }

  // 2. Collect unique lead IDs to fetch city info
  var leadIds = [];
  quotations.forEach(function(q) {
    if (q.lead_id && Array.isArray(q.lead_id)) {
      leadIds.push(q.lead_id[0]);
    }
  });
  var uniqueLeadIds = leadIds.filter(function(v, i, a) { return a.indexOf(v) === i; });

  // 3. Read leads to get city_id (Many2one → alburaq.id.district)
  var leadCityMap = {}; // leadId → city name
  if (uniqueLeadIds.length) {
    var leads = await odoo.read('crm.lead', uniqueLeadIds, ['city_id']);
    leads.forEach(function(l) {
      if (l.city_id && Array.isArray(l.city_id)) {
        leadCityMap[l.id] = l.city_id[1] || '';
      }
    });
  }

  // 4. Collect all paket_umrah_id (product IDs)
  var productIds = [];
  quotations.forEach(function(q) {
    if (q.paket_umrah_id && Array.isArray(q.paket_umrah_id)) {
      productIds.push(q.paket_umrah_id[0]);
    }
  });

  // 5. Read products to get names
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

  // 6. Build buyers array — one entry per quotation
  var buyers = [];
  quotations.forEach(function(q) {
    // lead_id returns [id, name] — the name is the contact/lead name
    var jamaahName = '';
    if (q.lead_id && Array.isArray(q.lead_id)) {
      jamaahName = q.lead_id[1] || '';
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

    // City comes from lead_id.city_id (resolved in step 3)
    var cityName = '';
    if (q.lead_id && Array.isArray(q.lead_id)) {
      cityName = leadCityMap[q.lead_id[0]] || '';
    }

    buyers.push({
      quotation_no: q.name || '',
      jamaah_name: jamaahName,
      city: cityName,
      product_name: productName,
      product_default_code: productCode,
      pax_count: 1, // umrah.quotation is per person typically
      purchase_date: q.create_date,
      total_tagihan: q.est_total_price || 0
    });
  });

  return buyers;
}

module.exports = { fetchRecentBuyers: fetchRecentBuyers };
