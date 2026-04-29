// ── CDModal Component ──
// Modal dialog for editing the countdown timer duration and label.

const { useState } = React;

function CDModal({cd, onSave, onClose}) {
  const diff = Math.max(0, Math.floor((new Date(cd.iso) - Date.now()) / 1000));
  const [h, setH] = useState(String(Math.floor(diff / 3600)));
  const [m, setM] = useState(String(Math.floor((diff % 3600) / 60)));
  const [s, setS] = useState(String(diff % 60));
  const [lbl, setLbl] = useState(cd.lbl);

  function apply() {
    var hn = Math.min(99, Math.max(0, parseInt(h) || 0));
    var mn = Math.min(59, Math.max(0, parseInt(m) || 0));
    var sn = Math.min(59, Math.max(0, parseInt(s) || 0));
    onSave({lbl: lbl, iso: new Date(Date.now() + (hn * 3600 + mn * 60 + sn) * 1000).toISOString()});
  }

  function clampOnBlur(val, max) {
    var n = Math.min(max, Math.max(0, parseInt(val) || 0));
    return String(n);
  }

  return (
    <div className="cd-modal-bg">
      <div className="cd-modal">
        <div className="cd-modal-bar"/>
        <h3 className="cd-modal-title">⏱ Edit Countdown Timer</h3>
        <div className="cd-modal-fields">
          <div>
            <label className="cd-modal-label">Label</label>
            <input value={lbl} className="inp inp-w-full" onChange={function(e){setLbl(e.target.value)}}/>
          </div>
          <div>
            <label className="cd-modal-label">Durasi (dari sekarang)</label>
            <div className="cd-modal-dur">
              {[{v:h, set:setH, max:99, l:'Jam'}, {v:m, set:setM, max:59, l:'Menit'}, {v:s, set:setS, max:59, l:'Detik'}].map(function(item, i){
                return (
                  <div key={i} className="cd-modal-dur-item">
                    <input type="text" inputMode="numeric" value={item.v} className="inp inp-w-md"
                      onChange={function(e){
                        var raw = e.target.value.replace(/[^0-9]/g, '');
                        item.set(raw);
                      }}
                      onBlur={function(e){
                        item.set(clampOnBlur(e.target.value, item.max));
                      }}
                    />
                    <span className="cd-modal-dur-label">{item.l}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="cd-modal-btns">
            <button className="cd-modal-btn-apply" onClick={apply}>✓ Terapkan</button>
            <button className="cd-modal-btn-cancel" onClick={onClose}>Batal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Alburaq.CDModal = CDModal;