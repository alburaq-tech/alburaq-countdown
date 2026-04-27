// ── Alburaq Countdown – Constants ──
// Color palette and UI configuration.
// Attached to window.Alburaq for cross-file access without a bundler.
// Data (packages, countdown) is in js/data/dummy-data.js and accessed via data-service.js.

window.Alburaq = window.Alburaq || {};

window.Alburaq.constants = {
  bg:'#FFFEF7', bg2:'#FDF8EC', bg3:'#F9F2DA',
  g1:'#AE8C2F', g2:'#CBAA48', dg:'#473202',
  dark:'#1C1C1C', dark2:'#3a3220',
  red:'#C0392B', orange:'#C0621A', green:'#1A7A40', white:'#FFFFFF',
};

window.Alburaq.tweakDefaults = /*EDITMODE-BEGIN*/{
  "showCountdown": true,
  "editMode": false
}/*EDITMODE-END*/;