/**
 * Routes: /api/packages
 */

var express = require('express');
var router = express.Router();
var packageService = require('../services/packageService');

/**
 * GET /api/packages
 * Returns all packages with bus data and last_updated timestamp.
 */
router.get('/', async function(req, res) {
  try {
    var packages = await packageService.getAll();
    var stateManager = require('../services/stateManager');
    var lastUpdated = await stateManager.getLastUpdated();
    res.json({ packages: packages, lastUpdated: lastUpdated });
  } catch (err) {
    console.error('[PACKAGES] Error fetching packages:', err.message);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

/**
 * GET /api/packages/:id
 * Returns a single package.
 */
router.get('/:id', async function(req, res) {
  try {
    var pkg = await packageService.getById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    console.error('[PACKAGES] Error fetching package:', err.message);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

/**
 * PUT /api/packages/:id
 * Read-only — packages come from Odoo DB.
 */
router.put('/:id', function(req, res) {
  res.status(405).json({ error: 'Packages are read-only (sourced from Odoo)' });
});

module.exports = router;