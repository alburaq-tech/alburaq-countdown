// ── Ticker Component ──
// Scrolling alert bar showing urgent seat availability messages.
// Depends on: Alburaq.helpers (seatSt)

const seatSt = window.Alburaq.helpers.seatSt;

function Ticker({packages, category}) {
  var filtered = packages;
  if (category) {
    filtered = packages.filter(function(p) {
      if (category === 'ramadhan') return p.is_umrah_ramadhan === true;
      return p.is_umrah_ramadhan !== true;
    });
  }
  const items = [];
  filtered.forEach(function(p){
    p.buses.forEach(function(b){
      const st = seatSt(b.fil, b.cap);
      if(st.t === 'full') items.push('🚫 ' + p.name + ' · ' + b.lbl + ': SUDAH PENUH');
      if(st.t === 'crit') items.push('⚠️ ' + p.name + ' · ' + b.lbl + ': HANYA SISA ' + st.r + ' SEAT LAGI!');
    });
  });
  if(!items.length) return null;
  const txt = items.join('   ◆   ');
  return (
    <div className="ticker">
      <div className="ticker-text">{txt}&nbsp;&nbsp;◆&nbsp;&nbsp;{txt}</div>
    </div>
  );
}

window.Alburaq.Ticker = Ticker;