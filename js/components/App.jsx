// ── App Component ──
// Main application component. Orchestrates state, renders header, grid, footer, and modals.
// Depends on: Alburaq.constants, Alburaq.helpers, Alburaq.dataService,
//   Alburaq.CDTimer, Alburaq.PkgCard, Alburaq.FullView, Alburaq.Ticker, Alburaq.CDModal,
//   Alburaq.tweakDefaults, window.useTweaks/TweaksPanel

const { useState, useEffect } = React;

const C        = window.Alburaq.constants;
const helpers  = window.Alburaq.helpers;
const dataService = window.Alburaq.dataService;
const CDTimer  = window.Alburaq.CDTimer;
const PkgCard  = window.Alburaq.PkgCard;
const FullView = window.Alburaq.FullView;
const Ticker   = window.Alburaq.Ticker;
const CDModal  = window.Alburaq.CDModal;
const BuyNotif = window.Alburaq.BuyNotif;

const TWEAK_DEFAULTS = window.Alburaq.tweakDefaults;

function App() {
  const [state, setState]     = useState({ packages: [], cd: { lbl: '', iso: new Date().toISOString() } });
  const [loading, setLoading]  = useState(true);
  const [focusId, setFocusId]   = useState(null);
  const [showCd, setShowCd]     = useState(false);
  const gridRef = React.useRef(null);

  function scrollGrid(dir) {
    var el = gridRef.current;
    if (!el) return;
    el.scrollBy({left: dir * el.offsetWidth, behavior: 'smooth'});
  }

  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // Expose package updater for SSE-triggered refreshes from BuyNotif
  window.Alburaq._onPackagesUpdate = function(pkgs) {
    setState(function(s) { return Object.assign({}, s, { packages: pkgs }); });
  };

  // Load initial data on mount (from localStorage → dataService)
  useEffect(function(){
    helpers.loadInitialData().then(function(data){
      setState(data);
      setLoading(false);
    });
    return function() { window.Alburaq._onPackagesUpdate = null; };
  }, []);

  useEffect(function(){ helpers.saveSt(state); }, [state]);


  function updPkg(u) {
    setState(function(s){ return Object.assign({}, s, {packages: s.packages.map(function(p){ return p.id === u.id ? u : p; })}); });
    // Persist to API if connected
    dataService.savePackage(u);
  }
  function delPkg(id) {
    if(state.packages.length > 1)
      setState(function(s){ return Object.assign({}, s, {packages: s.packages.filter(function(p){ return p.id !== id; })}); });
  }
  function addPkg() {
    const nid = Math.max.apply(null, state.packages.map(function(p){ return p.id; })) + 1;
    setState(function(s){ return Object.assign({}, s, {packages: s.packages.concat({id: nid, name: 'Paket Umroh Baru ' + nid, dep: 'TBD', dur: '9 Hari', price: 'Rp 0', buses: [{id: 1, lbl: 'BUS 1', cap: 45, fil: 0}]})}); });
  }

  function resetData() {
    helpers.clearSt();
    dataService.loadInitialState().then(function(data){
      setState(data);
    });
  }

  const focusPkg = focusId != null ? state.packages.find(function(p){ return p.id === focusId; }) : null;

  if (loading) {
    return (
      <div className="app">
        <div className="cd-box" style={{margin: '80px auto', maxWidth: 400}}>
          <div className="cd-label">⏳ Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <img src="assets/logo-alburaq.png" alt="Alburaq" className="header-logo"/>
          <div>
            <div className="header-title">ALBURAQ UNITED INDONESIA</div>
            <div className="header-subtitle">Ketersediaan Seat Umroh 2025</div>
          </div>
        </div>
        <div className="header-right">
          <button className="gear-btn" onClick={function(){window.postMessage({ type: '__activate_edit_mode' }, '*')}} title="Tweaks">🎨</button>
          <button className="gear-btn" onClick={function(){setShowCd(true)}} title="Setting Countdown">⚙️</button>
          <div className="live-badge">
            <span className="live-dot"/>
            LIVE
          </div>
        </div>
      </header>

      <Ticker packages={state.packages}/>

      <main className="main">
        {tweaks.showCountdown && (
          <div className="cd-wrap">
            <CDTimer iso={state.cd.iso} lbl={state.cd.lbl}/>
          </div>
        )}
        <div className="pkg-grid-wrap">
          <button className="pkg-grid-nav pkg-grid-nav-left" onClick={function(){scrollGrid(-1)}} title="Sebelumnya">‹</button>
          <div className="pkg-grid" ref={gridRef}>
            {state.packages.map(function(pkg){
              return (
                <div key={pkg.id} className="pkg-grid-item">
                  <PkgCard pkg={pkg} onUpdate={updPkg} onClick={function(){setFocusId(pkg.id)}}/>
                </div>
              );
            })}
          </div>
          <button className="pkg-grid-nav pkg-grid-nav-right" onClick={function(){scrollGrid(1)}} title="Selanjutnya">›</button>
        </div>
      </main>

      {tweaks.showNotif && <BuyNotif packages={state.packages} interval={5000}/>}

      {focusPkg && <FullView pkg={focusPkg} onUpdate={updPkg} onBack={function(){setFocusId(null)}}/>}
      {showCd && <CDModal cd={state.cd} onClose={function(){setShowCd(false)}} onSave={function(c){setState(function(s){return Object.assign({}, s, {cd: c});}); dataService.saveCountdown(c); setShowCd(false);}}/>}

      <window.TweaksPanel>
        <window.TweakSection label="Tampilan"/>
        <window.TweakToggle label="Tampilkan Countdown" value={tweaks.showCountdown} onChange={function(v){setTweak('showCountdown', v)}}/>
        <window.TweakToggle label="Tampilkan Notifikasi" value={tweaks.showNotif} onChange={function(v){setTweak('showNotif', v)}}/>

        <window.TweakSection label="Timer"/>
        <window.TweakButton label="✏ Edit Countdown" onClick={function(){setShowCd(true)}}/>
        <window.TweakSection label="Reset"/>
        <window.TweakButton label="Reset ke Data Awal" onClick={resetData}/>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));