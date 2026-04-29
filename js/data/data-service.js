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
var DATA_SOURCE = 'dummy';  // 'dummy' | 'api'
var API_BASE_URL = 'http://localhost:3000';  // backend API server
var API_HEADERS = {           // customize as needed (auth tokens, etc.)
  'Content-Type': 'application/json'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DATA SERVICE — Public API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

window.Alburaq.dataService = {

  /**
   * Load the initial application state.
   * Returns: { packages: Package[], cd: { lbl: string, iso: string } }
   *
   * - dummy mode: returns dummy data immediately
   * - api mode:   fetches from /api/packages + /api/countdown
   */
  loadInitialState: function() {
    if (DATA_SOURCE === 'api') {
      return Promise.all([
        window.Alburaq.dataService.fetchPackages(),
        window.Alburaq.dataService.fetchCountdown()
      ]).then(function(results) {
        return { packages: results[0], cd: results[1] };
      });
    }
    // dummy mode — return synchronously wrapped in a resolved promise
    // so callers can always use .then() or await
    var dummy = window.Alburaq.dummyData;
    return Promise.resolve({
      packages: dummy.packages,
      cd: dummy.cd
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
        .then(function(data) { return data.packages; });
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
   * Fetch last closing event.
   * - dummy mode: returns null
   * - api mode:   GET /api/closing/last
   */
  fetchClosing: function() {
    if (DATA_SOURCE === 'api') {
      return fetch(API_BASE_URL + '/api/closing/last', { headers: API_HEADERS })
        .then(function(res) { return res.json(); });
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
  }
};