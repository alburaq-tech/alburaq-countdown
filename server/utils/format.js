/**
 * Formatting utilities for Indonesian locale.
 */

var BULAN = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format a number as Indonesian Rupiah string.
 * @param {number|null|undefined} amount
 * @returns {string} e.g. "Rp 38.500.000"
 */
function formatRupiah(amount) {
  if (amount == null || amount === 0) return '-';
  var num = Math.round(Number(amount));
  var formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'Rp ' + formatted;
}

/**
 * Format a date string into Indonesian date format.
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} e.g. "1 Maret 2026"
 */
function formatTanggalID(dateStr) {
  if (!dateStr) return 'TBD';
  var d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : dateStr;
  if (isNaN(d.getTime())) return 'TBD';
  return d.getDate() + ' ' + BULAN[d.getMonth() + 1] + ' ' + d.getFullYear();
}

/**
 * Compute trip duration from departure and return dates.
 * @param {string|Date} dep - Departure date
 * @param {string|Date} ret - Return date
 * @returns {string} e.g. "9 Hari"
 */
function formatDurasi(dep, ret) {
  if (!dep || !ret) return '9 Hari';
  var d1 = typeof dep === 'string' ? new Date(dep + 'T00:00:00') : dep;
  var d2 = typeof ret === 'string' ? new Date(ret + 'T00:00:00') : ret;
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '9 Hari';
  var diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (diff <= 0) return '9 Hari';
  return diff + ' Hari';
}

module.exports = { formatRupiah, formatTanggalID, formatDurasi };