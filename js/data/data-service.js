// ── Alburaq Countdown – Data Service ──
// Abstraction layer between the app and data sources.
// Switch between 'dummy' and 'api' by changing DATA_SOURCE below.
//
// When ready to connect to a real backend:
//   1. Set DATA_SOURCE to 'api'
//   2. Fill in the API_BASE_URL and implement the fetch functions
//   3. The rest of the app will automatically use the new data source
//
// API contract (expected endpoints):
//   GET  /api/packages     → { packages: Package[] }
//   GET  /api/packages/:id → Package
//   PUT  /api/packages/:id → Package (update)
//   GET  /api/countdown    → { lbl: string, iso: string }
//   PUT  /api/countdown    → { lbl: string, iso: string }

window.Alburaq = window.Alburaq || {};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️  CONFIGURATION — Change DATA_SOURCE to switch between dummy & API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
var DATA_SOURCE = 'api';  // 'dummy' | 'api'
var API_BASE_URL = '/countdown';  // served under /countdown/ via nginx reverse proxy
var API_HEADERS = {           // customize as needed (auth tokens, etc.)
  'Content-Type': 'application/json'
};

// Frontend config (fetched from /api/config on init)
var _config = {
  notifIntervalMs: 15000,  // default, overridden by server config
  anonymizeBuyers: true
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DATA SERVICE — Public API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

window.Alburaq.dataService = {

  /**
   * Fetch frontend config from server (notification interval, etc.).
   * Falls back to defaults if fetch fails.
   */
  fetchConfig: function() {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/config', { headers: API_HEADERS })
        .then(function(res) { return res.json(); })
        .then(function(cfg) {
          if (cfg.notifIntervalMs) _config.notifIntervalMs = cfg.notifIntervalMs;
          if (typeof cfg.anonymizeBuyers === 'boolean') _config.anonymizeBuyers = cfg.anonymizeBuyers;
          return _config;
        })
        .catch(function() { return _config; });
    }
    return Promise.resolve(_config);
  },

  /**
   * Get the current frontend config.
   */
  getConfig: function() {
    return _config;
  },

  /**
   * Load the initial application state.
   * Returns: { packages: Package[], cd: { lbl: string, iso: string }, recentBuyers: Buyer[] }
   *
   * - dummy mode: returns dummy data immediately
   * - api mode:   fetches config, then /api/packages + /api/countdown + /api/recent-buyers
   */
  loadInitialState: function() {
    if (DATA_SOURCE === 'api') {
      return window.Alburaq.dataService.fetchConfig().then(function() {
        return Promise.all([
          window.Alburaq.dataService.fetchPackages(),
          window.Alburaq.dataService.fetchCountdown(),
          window.Alburaq.dataService.fetchRecentBuyers()
        ]).then(function(results) {
          var lastUpdated = null;
          if (window.Alburaq._lastPackagesResponse) {
            lastUpdated = window.Alburaq._lastPackagesResponse.lastUpdated || null;
          }
          return { packages: results[0], cd: results[1], recentBuyers: results[2], lastUpdated: lastUpdated };
        });
      });
    }
    // dummy mode — return synchronously wrapped in a resolved promise
    var dummy = window.Alburaq.dummyData;
    return Promise.resolve({
      packages: dummy.packages,
      cd: dummy.cd,
      recentBuyers: [],
      lastUpdated: null
    });
  },

  /**
   * Fetch all packages.
   * - dummy mode: returns dummy data
   * - api mode:   GET /api/packages
   */
  fetchPackages: function() {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/packages', { headers: API_HEADERS })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          window.Alburaq._lastPackagesResponse = data;
          return data.packages;
        });
    }
    return Promise.resolve(window.Alburaq.dummyData.packages);
  },

  /**
   * Fetch a single package by ID.
   * - dummy mode: finds in dummy data
   * - api mode:   GET /api/packages/:id
   */
  fetchPackage: function(id) {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/packages/' + id, { headers: API_HEADERS })
        .then(function(res) { return res.json(); });
    }
    var pkg = window.Alburaq.dummyData.packages.find(function(p) { return p.id === id; });
    return Promise.resolve(pkg || null);
  },

  /**
   * Update a package (e.g. after editing buses).
   * - dummy mode: no-op (local state handles it via localStorage)
   * - api mode:   PUT /api/packages/:id
   */
  savePackage: function(pkg) {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/packages/' + pkg.id, {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify(pkg)
      }).then(function(res) { return res.json(); });
    }
    // dummy mode — state is managed locally via localStorage, no server call needed
    return Promise.resolve(pkg);
  },

  /**
   * Fetch countdown timer data.
   * - dummy mode: returns dummy countdown
   * - api mode:   GET /api/countdown
   */
  fetchCountdown: function() {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/countdown', { headers: API_HEADERS })
        .then(function(res) { return res.json(); });
    }
    return Promise.resolve(window.Alburaq.dummyData.cd);
  },

  /**
   * Update countdown timer.
   * - dummy mode: no-op (local state handles it)
   * - api mode:   PUT /api/countdown
   */
  saveCountdown: function(cd) {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/countdown', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify(cd)
      }).then(function(res) { return res.json(); });
    }
    return Promise.resolve(cd);
  },

  /**
   * Fetch recent buyers.
   * - dummy mode: returns empty array
   * - api mode:   GET /api/recent-buyers
   */
  fetchRecentBuyers: function() {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/recent-buyers', { headers: API_HEADERS })
        .then(function(res) { return res.json(); })
        .then(function(data) { return data.buyers || []; });
    }
    return Promise.resolve([]);
  },

  /**
   * Fetch a random recent buyer.
   * - dummy mode: returns null
   * - api mode:   GET /api/recent-buyers/random
   */
  fetchRandomBuyer: function() {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/recent-buyers/random', { headers: API_HEADERS })
        .then(function(res) { return res.json(); })
        .then(function(data) { return data.buyer || null; });
    }
    return Promise.resolve(null);
  },

  /**
   * Subscribe to SSE events from the backend.
   * Calls onClosing(data) when a new closing arrives.
   * Returns an object with a disconnect() method.
   */
  subscribeEvents: function(onClosing) {
    if (DATA_SOURCE !== 'api' || typeof EventSource === 'undefined') {
      return { disconnect: function() {} };
    }
    var es = new EventSource(API_BASE_URL + '/api/events');
    es.addEventListener('closing', function(e) {
      try { onClosing(JSON.parse(e.data)); } catch(err) {}
    });
    return {
      disconnect: function() { es.close(); }
    };
  },

  /**
   * Check current data source mode.
   * Returns 'dummy' or 'api'.
   */
  getDataSource: function() {
    return DATA_SOURCE;
  },

  /**
   * Switch data source at runtime (for debugging / dynamic config).
   * @param {string} source - 'dummy' or 'api'
   * @param {string} [baseUrl] - API base URL (required if source is 'api')
   */
  setDataSource: function(source, baseUrl) {
    DATA_SOURCE = source;
    if (baseUrl) API_BASE_URL = baseUrl;
  },

  getApiBaseUrl: function() {
    return API_BASE_URL;
  }
};