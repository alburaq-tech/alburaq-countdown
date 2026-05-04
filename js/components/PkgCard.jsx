// ── PkgCard Component ──
// Package card showing name, dates, price, pax remaining, and bus rows.
// Depends on: Alburaq.constants (C), Alburaq.helpers (seatSt)
//
// Live override: displayRemainingPax can be set per-package to override
// the displayed remaining count. The actual sold count (fil) stays fixed.
// Logic:
//   cap = total seats (sum of bus caps)
//   fil = sold pax (from backend, FIXED)
//   backendRem = cap - fil (actual remaining)
//   displayRem = pkg.displayRemainingPax ?? backendRem
//   lockedSeats = backendRem - displayRem (seats hidden from display)
//   Bus display: show buses based on fil (sold count is fixed),
//     but remaining shown per bus = min(displayRem, busRem)
//     locked seats per bus = busRem - displayed remaining

const C = window.Alburaq.constants;
const seatSt = window.Alburaq.helpers.seatSt;
const clampFil = window.Alburaq.helpers.clampFil;
const BusRow = window.Alburaq.BusRow;

function PkgCard({pkg, onUpdate, onClick}) {
  const cap = pkg.buses.reduce(function(s, b){ return s + b.cap; }, 0);
  const fil = pkg.buses.reduce(function(s, b){ return s + clampFil(b.fil, b.cap); }, 0);
  const backendRem = cap - fil;

  // Live override: displayRemainingPax
  const displayRem = pkg.displayRemainingPax != null ? pkg.displayRemainingPax : backendRem;
  const lockedSeats = Math.max(0, backendRem - displayRem);

  const rem = displayRem, pct = cap > 0 ? Math.round(fil / cap * 100) : 0;
  const isSoldOut = rem <= 0;
  const isOverridden = pkg.displayRemainingPax != null;
  const urgColor = isSoldOut ? C.red : rem <= 10 ? C.orange : C.g1;
  const pctColor = pct >= 90 ? C.red : pct >= 70 ? C.orange : C.g1;
  const barBg = pct >= 100 ? C.red : pct >= 80 ? 'linear-gradient(90deg,#AE8C2F,#C0621A)' : 'linear-gradient(90deg,#AE8C2F,#CBAA48)';

  // Build display buses based on actual fil (sold count is fixed)
  // Only show buses that have fil > 0, or at least 1 bus
  const busCap = pkg.buses.length > 0 ? pkg.buses[0].cap : 45;
  const visibleBuses = pkg.buses.filter(function(b){ return b.fil > 0; });
  const busesToShow = visibleBuses.length ? visibleBuses : [pkg.buses[0]];
  var remainingLocked = lockedSeats;
  var remainingDisplayRem = displayRem;

  const displayBuses = busesToShow.map(function(bus, i) {
    var busRem = bus.cap - bus.fil;
    var busDisplayRem = Math.min(remainingDisplayRem, busRem);
    var busLocked = busRem - busDisplayRem;
    remainingDisplayRem -= busDisplayRem;
    return {
      id: bus.id,
      lbl: bus.lbl,
      cap: bus.cap,
      fil: bus.fil,
      displayRem: busDisplayRem,
      locked: busLocked
    };
  });

  function setDisplayRemaining(val) {
    var n = parseInt(val);
    if (isNaN(n) || n < 0) n = 0;
    if (n > cap) n = cap;
    onUpdate(Object.assign({}, pkg, {displayRemainingPax: n}));
  }
  function resetDisplayRemaining() {
    var updated = Object.assign({}, pkg);
    delete updated.displayRemainingPax;
    onUpdate(updated);
  }

  function handleBusEdit(busId, updated) {
    onUpdate(Object.assign({}, pkg, {buses: pkg.buses.map(function(b){ return b.id === busId ? updated : b; })}));
  }

  return (
    <div className={'pkg-card' + (isSoldOut ? ' pkg-card-soldout' : '')} onClick={isSoldOut ? undefined : onClick}>
      <div className="pkg-card-top-bar"/>
      <div className="pkg-card-header">
        <div className="pkg-card-info">
          <h2 className="pkg-card-name">{pkg.name}</h2>
          <div className="pkg-card-meta">
              <React.Fragment>
                <span className="pkg-card-meta-text">✈ {pkg.dep}</span>
                <span className="pkg-card-meta-text">🕌 {pkg.dur}</span>
                <span className="pkg-card-price">{pkg.price}</span>
              </React.Fragment>
          </div>
        </div>
        <div className="pkg-card-pax-box">
          <div className="pkg-card-pax-label">SISA PAX</div>
          <div className="pkg-card-pax-num" style={{color: urgColor, animation: rem === 0 ? 'flash-red 1.5s ease-in-out infinite' : 'glowNum 2s ease-in-out infinite'}}>{rem}</div>
          <div className="pkg-card-pax-sub">dari {cap} kursi</div>
        </div>
      </div>
      {isSoldOut ? (
        <div className="pkg-card-soldout-body">
          <div className="soldout-badge">🚫 SOLD OUT</div>
          <div className="soldout-summary">{pkg.buses.length} bus · {cap} kursi penuh terisi</div>
        </div>
      ) : (
        <React.Fragment>
          <div className="pkg-card-bar-wrap">
            <div className="pkg-card-bar-header">
              <span className="pkg-card-bar-label">TERISI</span>
              <span className="pkg-card-bar-pct" style={{color: pctColor}}>{pct}%</span>
            </div>
            <div className="pkg-card-bar-track">
              <div className="pkg-card-bar-fill" style={{width: pct + '%', background: barBg}}/>
            </div>
          </div>
          <div className="pkg-card-buses">
            {displayBuses.map(function(bus){
              return <BusRow key={bus.id} bus={bus} onEdit={function(u){handleBusEdit(bus.id, u)}} />;
            })}

          </div>
        </React.Fragment>
      )}
    </div>
  );
}

window.Alburaq.PkgCard = PkgCard;