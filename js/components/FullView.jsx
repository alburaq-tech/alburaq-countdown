// ── FullView Component ──
// Fullscreen overlay for a single package with detailed bus seat visualization.
// Depends on: Alburaq.constants (C), Alburaq.helpers (seatSt)

const { useEffect } = React;
const C = window.Alburaq.constants;
const seatSt = window.Alburaq.helpers.seatSt;
const clampFil = window.Alburaq.helpers.clampFil;

function FullView({pkg, onUpdate, onBack, editMode}) {
  const cap = pkg.buses.reduce(function(s, b){ return s + b.cap; }, 0);
  const fil = pkg.buses.reduce(function(s, b){ return s + clampFil(b.fil, b.cap); }, 0);
  const backendRem = cap - fil;
  const displayRem = pkg.displayRemainingPax != null ? pkg.displayRemainingPax : backendRem;
  const lockedSeats = Math.max(0, backendRem - displayRem);
  const rem = displayRem, pct = Math.round(fil / cap * 100);
  const pctColor = pct >= 90 ? C.red : pct >= 70 ? C.orange : C.g1;
  const barBg = pct >= 100 ? C.red : pct >= 80 ? 'linear-gradient(90deg,#AE8C2F,#C0621A)' : 'linear-gradient(90deg,#AE8C2F,#CBAA48)';
  const remColor = rem === 0 ? C.red : rem <= 10 ? C.orange : C.g1;
  const isOverridden = pkg.displayRemainingPax != null;

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

  useEffect(function(){
    function h(e){ if(e.key === 'Escape') onBack(); }
    window.addEventListener('keydown', h);
    return function(){ window.removeEventListener('keydown', h); };
  }, [onBack]);

  function addBus() {
    const nid = Math.max.apply(null, pkg.buses.map(function(b){ return b.id; })) + 1;
    onUpdate(Object.assign({}, pkg, {buses: pkg.buses.concat({id: nid, lbl: 'BUS ' + nid, cap: 45, fil: 0})}));
  }

  return (
    <div className="fullview">
      <div className="fv-header">
        <button className="fv-back-btn" onClick={onBack}>← Kembali</button>
        <div className="fv-info">
          <h1 className="fv-title">{pkg.name}</h1>
          <div className="fv-meta">
            <span>✈ {pkg.dep}</span>
            <span>🕌 {pkg.dur}</span>
            <span className="fv-meta-price">{pkg.price}</span>
          </div>
        </div>
        <div className="fv-pax">
          <div className="fv-pax-label">TOTAL SISA</div>
          <div className="fv-pax-num" style={{color: remColor, animation: rem === 0 ? 'flash-red 1.5s ease-in-out infinite' : 'glowNum 2s ease-in-out infinite'}}>{rem}</div>
          <div className="fv-pax-sub">dari {cap} kursi</div>
          {isOverridden && (
            <div className="pkg-card-pax-override" onClick={function(e){e.stopPropagation();}}>
              <input type="text" inputMode="numeric" className="pkg-card-pax-override-input"
                value={pkg.displayRemainingPax}
                onChange={function(e){
                  var raw = e.target.value.replace(/[^0-9]/g, '');
                  setDisplayRemaining(raw);
                }}
                onBlur={function(e){
                  var n = parseInt(e.target.value);
                  if (isNaN(n)) setDisplayRemaining(backendRem);
                }}
              />
              <span className="pkg-card-pax-override-label">edit sisa</span>
              <button className="pkg-card-pax-override-reset" onClick={resetDisplayRemaining} title="Reset ke data backend">↩</button>
            </div>
          )}
          {!isOverridden && (
            <div className="pkg-card-pax-override" onClick={function(e){e.stopPropagation(); setDisplayRemaining(backendRem);}}>
              <span className="pkg-card-pax-override-hint">✏ edit sisa</span>
            </div>
          )}
        </div>
      </div>
      <div className="fv-gold-bar"/>
      <div className="fv-body">
        <div className="fv-progress">
          <div className="fv-progress-header">
            <span className="fv-progress-label">TINGKAT PENGISIAN</span>
            <span className="fv-progress-pct" style={{color: pctColor}}>{pct}%</span>
          </div>
          <div className="fv-progress-track">
            <div className="fv-progress-fill" style={{width: pct + '%', background: barBg}}/>
          </div>
        </div>
        <div className="fv-buses">
          {(function(){
            const visible = pkg.buses.filter(function(b){ return b.fil > 0; });
            const list = visible.length ? visible : [pkg.buses[0]];
            var remainingDisplayRem = displayRem;
            return list.map(function(bus){
              const effectiveFil = clampFil(bus.fil, bus.cap);
              const busRem = bus.cap - effectiveFil;
              const busDisplayRem = Math.min(remainingDisplayRem, busRem);
              const busLocked = busRem - busDisplayRem;
              remainingDisplayRem -= busDisplayRem;
              const st = seatSt(bus.fil, bus.cap);
              const seats = Array.from({length: bus.cap}, function(_, i){
                if (i < effectiveFil) return 'filled';
                if (i >= bus.cap - busLocked) return 'locked';
                return 'empty';
              });
              const cfgMap = {
                full: {cls:'fv-bus-row-full', on:C.red, off:'rgba(192,57,43,.12)', bo:'rgba(192,57,43,.35)'},
                crit: {cls:'fv-bus-row-crit', on:C.orange, off:'rgba(192,98,26,.12)', bo:'rgba(192,98,26,.4)'},
                low:  {cls:'fv-bus-row-low', on:C.g1, off:'rgba(174,140,47,.12)', bo:'rgba(174,140,47,.35)'},
                ok:   {cls:'fv-bus-row-ok', on:C.green, off:'rgba(174,140,47,.1)', bo:'rgba(174,140,47,.2)'},
              };
              const cf = cfgMap[st.t];
              return (
                <div key={bus.id} className={'fv-bus-row ' + cf.cls}>
                  <div>
                    <div className="fv-bus-label">{bus.lbl}</div>
                    <div className="fv-bus-fill">{effectiveFil}/{bus.cap} terisi</div>
                    <div className="fv-bus-bar"><div className="fv-bus-bar-fill" style={{width: Math.round(effectiveFil/bus.cap*100) + '%'}}/></div>
                  </div>
                  <div className="fv-bus-seats">
                    {seats.map(function(s, i){
                      if (s === 'filled') return <div key={i} className="fv-bus-seat" style={{background: cf.on}}/>;
                      if (s === 'locked') return <div key={i} className="fv-bus-seat bus-seat-locked" title="Seat terkunci">🔒</div>;
                      return <div key={i} className="fv-bus-seat" style={{background: cf.off, border: '1px solid ' + cf.bo}}/>;
                    })}
                  </div>
                  <div className="fv-bus-status">
                    {st.t === 'full' && <div className="fv-bus-status-full">🚫 SUDAH PENUH!</div>}
                    {st.t === 'crit' && (
                      <div>
                        <div className="fv-bus-status-crit-badge">⚠ HAMPIR HABIS!</div>
                        <div className="fv-bus-status-crit-num">Sisa <span className="fv-bus-status-crit-big">{busDisplayRem}</span> seat!</div>
                      </div>
                    )}
                    {st.t === 'low' && (
                      <div>
                        <div className="fv-bus-status-low-label">Sisa Seat</div>
                        <div className="fv-bus-status-low-num">{busDisplayRem}<span className="fv-bus-status-low-unit"> kursi</span></div>
                      </div>
                    )}
                    {st.t === 'ok' && (
                      <div>
                        <div className="fv-bus-status-ok-label">Tersedia</div>
                        <div className="fv-bus-status-ok-num">{busDisplayRem}<span className="fv-bus-status-ok-unit"> kursi</span></div>
                      </div>
                    )}
                    {busLocked > 0 && <div className="bus-locked-info">🔒 {busLocked} seat terkunci</div>}
                  </div>
                  {editMode && (
                    <div className="fv-bus-edit-overlay">
                      <div className="edit-field">
                        <label className="edit-label">Label</label>
                        <input value={bus.lbl} className="inp inp-w-xl" onChange={function(e){onUpdate(Object.assign({}, pkg, {buses: pkg.buses.map(function(b){return b.id === bus.id ? Object.assign({}, b, {lbl: e.target.value}) : b; })}));}}/>
                      </div>
                      <div className="edit-field">
                        <label className="edit-label">Kapasitas</label>
                        <input type="number" min="1" max="70" value={bus.cap} className="inp inp-w-md" onChange={function(e){onUpdate(Object.assign({}, pkg, {buses: pkg.buses.map(function(b){return b.id === bus.id ? Object.assign({}, b, {cap: Number(e.target.value)}) : b; })}));}}/>
                      </div>
                      <div className="edit-field">
                        <label className="edit-label">Terisi</label>
                        <input type="number" min="0" max={bus.cap} value={bus.fil} className="inp inp-w-md" onChange={function(e){onUpdate(Object.assign({}, pkg, {buses: pkg.buses.map(function(b){return b.id === bus.id ? Object.assign({}, b, {fil: Math.min(Number(e.target.value), bus.cap)}) : b; })}));}}/>
                      </div>
                      {pkg.buses.length > 1 && <button className="del-bus-btn" onClick={function(){onUpdate(Object.assign({}, pkg, {buses: pkg.buses.filter(function(b){return b.id !== bus.id; })}));}}>Hapus</button>}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
        {editMode && <button className="fv-add-bus" onClick={addBus}>+ Tambah Bus</button>}
      </div>
      <div className="fv-footer-bar"/>
      <div className="fv-footer"><span className="fv-footer-text">TEKAN ESC UNTUK KEMBALI</span></div>
    </div>
  );
}

window.Alburaq.FullView = FullView;