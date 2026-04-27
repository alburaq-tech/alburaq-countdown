// ── BusRow Component ──
// Displays a single bus with seat visualization and status.
// Depends on: Alburaq.constants (C), Alburaq.helpers (seatSt)

const C = window.Alburaq.constants;
const seatSt = window.Alburaq.helpers.seatSt;
const clampFil = window.Alburaq.helpers.clampFil;

function BusRow({bus, onEdit, editMode}) {
  const effectiveFil = clampFil(bus.fil, bus.cap);
  const st = seatSt(bus.fil, bus.cap);
  const seats = Array.from({length: bus.cap}, (_, i) => i < effectiveFil);
  const cfgs = {
    full: {cls:'bus-row-full', on:C.red, off:'rgba(192,57,43,.12)', bo:'rgba(192,57,43,.4)'},
    crit: {cls:'bus-row-crit', on:C.orange, off:'rgba(192,98,26,.12)', bo:'rgba(192,98,26,.45)'},
    low:  {cls:'bus-row-low', on:C.g1, off:'rgba(174,140,47,.12)', bo:'rgba(174,140,47,.4)'},
    ok:   {cls:'bus-row-ok', on:C.green, off:'rgba(174,140,47,.1)', bo:'rgba(174,140,47,.2)'},
  };
  const cf = cfgs[st.t];

  return (
    <div className={'bus-row ' + cf.cls}>
      <div className="bus-label">{bus.lbl}</div>
      <div className="bus-seats">
        {seats.map((on, i) => (
          <div key={i} className="bus-seat" style={{background: on ? cf.on : cf.off, border: on ? 'none' : '1px solid ' + cf.bo}}/>
        ))}
      </div>
      <div className="bus-status">
        {st.t === 'full' && <div className="bus-status-full">🚫 SUDAH PENUH!</div>}
        {st.t === 'crit' && (
          <div>
            <div className="bus-status-crit-badge">⚠ HAMPIR HABIS!</div>
            <div className="bus-status-crit-num">Sisa <span className="bus-status-crit-big">{st.r}</span> seat!</div>
          </div>
        )}
        {st.t === 'low' && (
          <div>
            <div className="bus-status-low-label">Sisa Seat</div>
            <div className="bus-status-low-num">{st.r} <span className="bus-status-low-unit">kursi</span></div>
          </div>
        )}
        {st.t === 'ok' && (
          <div>
            <div className="bus-status-ok-label">Tersedia</div>
            <div className="bus-status-ok-num">{st.r} <span className="bus-status-ok-unit">kursi</span></div>
          </div>
        )}
      </div>
      <div className="bus-fill-info">{effectiveFil}/{bus.cap} terisi</div>
      {editMode && (
        <div className="bus-edit-overlay">
          <div className="edit-field">
            <label className="edit-label">Label</label>
            <input value={bus.lbl} className="inp inp-w-lg" onChange={function(e){onEdit(Object.assign({}, bus, {lbl: e.target.value}))}} />
          </div>
          <div className="edit-field">
            <label className="edit-label">Kapasitas</label>
            <input type="number" min="1" max="70" value={bus.cap} className="inp inp-w-sm" onChange={function(e){onEdit(Object.assign({}, bus, {cap: Number(e.target.value)}))}} />
          </div>
          <div className="edit-field">
            <label className="edit-label">Terisi</label>
            <input type="number" min="0" max={bus.cap} value={bus.fil} className="inp inp-w-sm" onChange={function(e){onEdit(Object.assign({}, bus, {fil: Math.min(Number(e.target.value), bus.cap)}))}} />
          </div>
        </div>
      )}
    </div>
  );
}

window.Alburaq.BusRow = BusRow;