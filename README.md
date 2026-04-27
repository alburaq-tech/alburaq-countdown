# Alburaq Countdown

Dashboard ketersediaan seat Umroh real-time untuk **Alburaq United Indonesia**.

Menampilkan countdown promo, ketersediaan seat per bus, notifikasi pembelian, dan mode edit untuk manajemen data.

## Fitur

- ⏳ **Countdown Timer** — Hitung mundur promo dengan label yang bisa dikustomisasi
- 🚌 **Visualisasi Seat** — Tampilan seat per bus dengan warna status (tersedia, hampir habis, penuh)
- 📦 **Paket Umroh** — Card layout masonry (Pinterest-style) dengan info paket
- 🚫 **Sold Out** — Paket sold out otomatis dipindah ke bawah dengan tampilan minimized
- 🔔 **Notifikasi Pembelian** — Banner notif "Hamba Allah baru saja membeli paket X sebanyak Y pax!" (dummy: setiap 5 detik)
- 📺 **Livestream-ready** — UI besar dan kontras tinggi, cocok untuk ditampilkan via tablet/streaming
- ✏️ **Edit Mode** — Panel tweaks untuk edit data paket, bus, dan countdown langsung di browser
- 💾 **Auto-save** — Data disimpan ke localStorage, otomatis restore saat reload
- 🔄 **Data Layer** — Abstraksi data service, mudah switch dari dummy ke API

## Tech Stack

- **React 18.3** (CDN, no build tools)
- **Babel Standalone** (in-browser JSX transpilation)
- **Vanilla CSS** (no framework)
- **No bundler** — buka file HTML langsung di browser

## Struktur Project

```
alburaq-countdown/
├── alburaq-countdown.html    # Entry point
├── styles.css                # Semua styling
├── tweaks-panel.jsx          # Panel tweaks (edit mode UI)
├── assets/
│   └── logo.png              # Logo Alburaq
├── js/
│   ├── utils/
│   │   ├── constants.js      # Warna, konfigurasi, tweak defaults
│   │   └── helpers.js         # localStorage, seat calc, data loading
│   ├── data/
│   │   ├── dummy-data.js     # Data dummy untuk testing
│   │   └── data-service.js   # Abstraksi data (dummy ↔ API)
│   └── components/
│       ├── App.jsx            # Komponen utama
│       ├── CDTimer.jsx        # Countdown timer
│       ├── BusRow.jsx         # Baris seat bus
│       ├── PkgCard.jsx        # Card paket umroh
│       ├── FullView.jsx       # Fullscreen overlay
│       ├── Ticker.jsx         # Scrolling alert bar
│       ├── CDModal.jsx        # Modal edit countdown
│       └── BuyNotif.jsx       # Notifikasi pembelian
└── .gitignore
```

## Cara Menjalankan

Cukup buka `alburaq-countdown.html` di browser, atau serve via HTTP server:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Lalu buka `http://localhost:8080/alburaq-countdown.html`

## Konfigurasi

### Switch ke API Mode

Edit `js/data/data-service.js`:

```js
var DATA_SOURCE = 'api';  // Ganti dari 'dummy' ke 'api'
var API_BASE_URL = 'https://api.example.com';  // Set URL backend
```

### Interval Notifikasi

Edit interval notifikasi di `js/components/App.jsx`:

```jsx
<BuyNotif packages={state.packages} interval={5000}/>  // dalam ms
```

## Data Dummy

Data dummy ada di `js/data/dummy-data.js`. Setiap kali data berubah, naikkan `_version` agar localStorage cache otomatis di-invalidate:

```js
_version: 10,  // Naikkan angka ini saat data berubah
```

## License

Private — Alburaq United Indonesia