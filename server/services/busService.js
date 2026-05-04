/**
 * Bus generation service.
 * Splits sold pax into buses of fixed capacity.
 */

/**
 * Generate bus data from sold pax count.
 * @param {number} soldPax - Total confirmed (non-waitlist) pax
 * @param {number} capacity - Bus seat capacity (default 45)
 * @returns {Array<{id: number, lbl: string, cap: number, fil: number}>}
 */
function generateBuses(soldPax, capacity) {
  if (!capacity || capacity <= 0) capacity = 45;
  soldPax = soldPax || 0;

  var buses = [];
  var remaining = soldPax;
  var num = 1;

  while (remaining > 0) {
    var fil = Math.min(remaining, capacity);
    buses.push({ id: num, lbl: 'BUS ' + num, cap: capacity, fil: fil });
    remaining -= fil;
    num++;
  }

  // Always show at least 1 bus (empty if no pax)
  if (buses.length === 0) {
    buses.push({ id: 1, lbl: 'BUS 1', cap: capacity, fil: 0 });
  }

  return buses;
}

module.exports = { generateBuses };