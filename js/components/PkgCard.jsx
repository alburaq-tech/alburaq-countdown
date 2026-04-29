// ── PkgCard Component ──
// Package card showing name, dates, price, pax remaining, and bus rows.
// Depends on: Alburaq.constants (C), Alburaq.helpers (seatSt), Alburaq.BusRow

const C = window.Alburaq.constants;
const seatSt = window.Alburaq.helpers.seatSt;
const clampFil = window.Alburaq.helpers.clampFil;
const BusRow = window.Alburaq.BusRow;

function PkgCard({pkg, onUpdate, editMode, onClick}) {
  const cap = pkg.buses.reduce(function(s, b){ return s + b.cap; }, 0);
  const fil = pkg.buses.reduce(function(s, b){ return s + clampFil(b.fil, b.cap); }, 0);
  const rem = cap - fil, pct = Math.round(fil / cap * 100);
  const isSoldOut = rem === 0;
  const urgColor = isSoldOut ? C.red : rem <= 10 ? C.orange : C.g1;
  const pctColor = pct >= 90 ? C.red : pct >= 70 ? C.orange : C.g1;
  const barBg = pct >= 100 ? C.red : pct >= 80 ? 'linear-gradient(90deg,#AE8C2F,#C0621A)' : 'linear-gradient(90deg,#AE8C2F,#CBAA48)';

  function handleBusEdit(busId, updated) {
    onUpdate(Object.assign({}, pkg, {buses: pkg.buses.map(function(b){ return b.id === busId ? updated : b; })}));
  }
  function addBus() {
    const nid = Math.max.apply(null, pkg.buses.map(function(b){ return b.id; })) + 1;
    onUpdate(Object.assign({}, pkg, {buses: pkg.buses.concat({id: nid, lbl: 'BUS ' + nid, cap: 45, fil: 0})}));
  }

  return (
    <div className={'pkg-card' + (editMode ? ' pkg-card-edit' : '') + (isSoldOut && !editMode ? ' pkg-card-soldout' : '')} onClick={editMode ? undefined : (isSoldOut ? undefined : onClick)}>
      <div className="pkg-card-top-bar"/>
      <div className="pkg-card-header">
        <div className="pkg-card-info">
          {editMode
            ? <input value={pkg.name} className="inp pkg-name-input" onChange={function(e){onUpdate(Object.assign({}, pkg, {name: e.target.value}))}} />
            : <h2 className="pkg-card-name">{pkg.name}</h2>}
          <div className="pkg-card-meta">
            {editMode ? (
              <React.Fragment>
                <input value={pkg.dep} className="inp meta-inp inp-w-140" onChange={function(e){onUpdate(Object.assign({}, pkg, {dep: e.target.value}))}} />
                <input value={pkg.dur} className="inp meta-inp inp-w-lg" onChange={function(e){onUpdate(Object.assign({}, pkg, {dur: e.target.value}))}} />
                <input value={pkg.price} className="inp meta-inp inp-w-160" onChange={function(e){onUpdate(Object.assign({}, pkg, {price: e.target.value}))}} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span className="pkg-card-meta-text">✈ {pkg.dep}</span>
                <span className="pkg-card-meta-text">🕌 {pkg.dur}</span>
                <span className="pkg-card-price">{pkg.price}</span>
              </React.Fragment>
            )}
          </div>
        </div>
        <div className="pkg-card-pax-box">
          <div className="pkg-card-pax-label">SISA PAX</div>
          <div className="pkg-card-pax-num" style={{color: urgColor, animation: rem === 0 ? 'flash-red 1.5s ease-in-out infinite' : 'glowNum 2s ease-in-out infinite'}}>{rem}</div>
          <div className="pkg-card-pax-sub">dari {cap} kursi</div>
        </div>
      </div>
      {isSoldOut && !editMode ? (
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
            {(function(){
              const visible = pkg.buses.filter(function(b){ return b.fil > 0; });
              const list = visible.length ? visible : [pkg.buses[0]];
              return list.map(function(bus){
                return <BusRow key={bus.id} bus={bus} editMode={editMode} onEdit={function(u){handleBusEdit(bus.id, u)}} />;
              });
            })()}
            {editMode && <button className="add-bus-btn" onClick={addBus}>+ Tambah Bus</button>}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

window.Alburaq.PkgCard = PkgCard;