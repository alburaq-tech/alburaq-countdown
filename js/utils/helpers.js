// ── Alburaq Countdown – Helpers ──
// Utility functions for localStorage persistence, seat status calculation,
// and initial data loading. Uses data-service.js for data source abstraction.
// Attached to window.Alburaq.helpers for cross-file access without a bundler.

window.Alburaq = window.Alburaq || {};

window.Alburaq.helpers = {

  /**
   * Load state from localStorage.
   * Returns parsed state object or null if not found, version mismatch,
   * or data source changed.
   */
  loadSt: function() {
    try {
      var r = localStorage.getItem('alburaq4');
      if (!r) return null;
      var data = JSON.parse(r);
      // Invalidate cache if dummy data version has been bumped
      var currentVersion = (window.Alburaq.dummyData && window.Alburaq.dummyData._version) || 0;
      var savedVersion = data._version || 0;
      if (savedVersion < currentVersion) {
        localStorage.removeItem('alburaq4');
        return null;
      }
      // Invalidate cache if data source changed (e.g. dummy → api)
      var currentDataSource = window.Alburaq.dataService.getDataSource();
      if (data._dataSource !== currentDataSource) {
        localStorage.removeItem('alburaq4');
        return null;
      }
      return data;
    } catch(e) {
      return null;
    }
  },

  /**
   * Save state to localStorage.
   * Automatically stamps with current data version and data source for cache invalidation.
   */
  saveSt: function(s) {
    try {
      var versioned = Object.assign({}, s, {
        _version: (window.Alburaq.dummyData && window.Alburaq.dummyData._version) || 0,
        _dataSource: window.Alburaq.dataService.getDataSource()
      });
      localStorage.setItem('alburaq4', JSON.stringify(versioned));
    } catch(e) {}
  },

  /**
   * Clear saved state from localStorage (useful for reset).
   */
  clearSt: function() {
    try {
      localStorage.removeItem('alburaq4');
    } catch(e) {}
  },

  /**
   * Clamp filled seats to never exceed capacity.
   * Returns: number (min of fil and cap)
   */
  clampFil: function(fil, cap) {
    return Math.min(fil, cap);
  },

  /**
   * Calculate seat status based on filled vs capacity.
   * Automatically clamps fil to cap so remaining is never negative.
   * Returns: { t: 'full'|'crit'|'low'|'ok', r: number }
   */
  seatSt: function(fil, cap) {
    var clamped = Math.min(fil, cap);
    var r = cap - clamped;
    if (r <= 0) return { t: 'full', r: 0 };
    if (r <= 5) return { t: 'crit', r: r };
    if (r <= 15) return { t: 'low', r: r };
    return { t: 'ok', r: r };
  },

  /**
   * Load initial application data.
   * Priority: localStorage → dataService (dummy or API)
   * Always returns a Promise so callers can use .then() consistently.
   */
  loadInitialData: function() {
    var saved = window.Alburaq.helpers.loadSt();
    if (saved) {
      return Promise.resolve(saved);
    }
    return window.Alburaq.dataService.loadInitialState();
  }
};