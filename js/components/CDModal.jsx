// ── CDModal Component ──
// Modal dialog for editing the countdown timer duration and label.

const { useState } = React;

function CDModal({cd, onSave, onClose}) {
  const diff = Math.max(0, Math.floor((new Date(cd.iso) - Date.now()) / 1000));
  const [h, setH] = useState(Math.floor(diff / 3600));
  const [m, setM] = useState(Math.floor((diff % 3600) / 60));
  const [s, setS] = useState(diff % 60);
  const [lbl, setLbl] = useState(cd.lbl);

  function apply() {
    onSave({lbl: lbl, iso: new Date(Date.now() + (h * 3600 + m * 60 + s) * 1000).toISOString()});
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
                    <input type="number" min="0" max={item.max} value={item.v} className="inp inp-w-md" onChange={function(e){item.set(Number(e.target.value))}}/>
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