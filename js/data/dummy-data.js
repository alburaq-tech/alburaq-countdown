// ── Alburaq Countdown – Dummy Data ──
// Sample data for development and testing.
// When connecting to a real API, this file can be swapped out
// by changing the DATA_SOURCE in data-service.js from 'dummy' to 'api'.
//
// Schema documentation:
//   Package: { id: number, name: string, dep: string, dur: string, price: string, buses: Bus[] }
//   Bus:     { id: number, lbl: string, cap: number, fil: number }
//   Countdown: { lbl: string, iso: string (ISO 8601 date) }

window.Alburaq = window.Alburaq || {};

window.Alburaq.dummyData = {
  // Increment DATA_VERSION when dummy data changes.
  // This invalidates stale localStorage cache so fresh data is always loaded.
  _version: 16,

  packages: [
    {
      id: 1,
      name: 'Umroh Ramadhan 2025',
      dep: '1 Maret 2025',
      dur: '12 Hari',
      price: 'Rp 38.500.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 45, fil: 45 },
        { id: 2, lbl: 'BUS 2', cap: 45, fil: 45 },
        { id: 3, lbl: 'BUS 3', cap: 45, fil: 45 },
        { id: 4, lbl: 'BUS 4', cap: 45, fil: 45 }
      ]
    },
    {
      id: 2,
      name: 'Umroh Reguler Mei 2025',
      dep: '10 Mei 2025',
      dur: '9 Hari',
      price: 'Rp 28.500.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 45, fil: 45 },
        { id: 2, lbl: 'BUS 2', cap: 45, fil: 45 },
        { id: 3, lbl: 'BUS 3', cap: 45, fil: 30 }
      ]
    },
    {
      id: 3,
      name: 'Umroh Plus Turki Juli 2025',
      dep: '5 Juli 2025',
      dur: '14 Hari',
      price: 'Rp 52.000.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 40, fil: 40 },
        { id: 2, lbl: 'BUS 2', cap: 40, fil: 40 },
        { id: 3, lbl: 'BUS 3', cap: 40, fil: 0 }
      ]
    },
    {
      id: 4,
      name: 'Umroh Akhir Tahun 2025',
      dep: '15 Desember 2025',
      dur: '10 Hari',
      price: 'Rp 32.000.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 45, fil: 12 }
      ]
    },
    {
      id: 5,
      name: 'Umroh Keluarga Agustus 2025',
      dep: '8 Agustus 2025',
      dur: '9 Hari',
      price: 'Rp 29.500.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 45, fil: 45 },
        { id: 2, lbl: 'BUS 2', cap: 45, fil: 18 }
      ]
    },
    {
      id: 6,
      name: 'Umroh Plus Andalusia Oktober 2025',
      dep: '3 Oktober 2025',
      dur: '16 Hari',
      price: 'Rp 65.000.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 35, fil: 35 },
        { id: 2, lbl: 'BUS 2', cap: 35, fil: 10 }
      ]
    },
    {
      id: 7,
      name: 'Umroh Awal Tahun 2026',
      dep: '5 Januari 2026',
      dur: '9 Hari',
      price: 'Rp 27.000.000',
      buses: [
        { id: 1, lbl: 'BUS 1', cap: 45, fil: 0 }
      ]
    }
  ],

  cd: {
    lbl: 'PROMO BERAKHIR DALAM',
    iso: new Date(Date.now() + 2 * 3600000 + 17 * 60000 + 43000).toISOString()
  }
};