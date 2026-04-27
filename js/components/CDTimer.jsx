// ── CDTimer Component ──
// Countdown timer display showing hours, minutes, seconds remaining.

const { useState, useEffect } = React;

function CDTimer({iso, lbl}) {
  const [t, setT] = useState({h:0, m:0, s:0});

  useEffect(() => {
    function calc() {
      const d = Math.max(0, Math.floor((new Date(iso) - Date.now()) / 1000));
      setT({h: Math.floor(d/3600), m: Math.floor((d%3600)/60), s: d%60});
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [iso]);

  const p = n => String(n).padStart(2, '0');

  return (
    <div className="cd-box">
      <div className="cd-label">⏳ {lbl}</div>
      <div className="cd-digits">
        {[{v:t.h, l:'JAM'}, {v:t.m, l:'MENIT'}, {v:t.s, l:'DETIK'}].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="cd-colon">:</span>}
            <div className="cd-unit">
              <div className="cd-num">{p(item.v)}</div>
              <div className="cd-unit-label">{item.l}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

window.Alburaq.CDTimer = CDTimer;