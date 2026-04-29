// ── Buy Notification Popup ──
// Displays a toast-style popup when a real closing event arrives via SSE.
// Falls back to random fake notifications in dummy mode.

window.Alburaq = window.Alburaq || {};

window.Alburaq.BuyNotif = function BuyNotif(props) {
  var packages = props.packages;
  var interval = props.interval || 8000; // fallback interval for dummy mode

  var _notif = React.useState(null);
  var notif  = _notif[0];
  var setNotif = _notif[1];

  var _visible = React.useState(false);
  var visible  = _visible[0];
  var setVisible = _visible[1];

  var hideTimerRef = React.useRef(null);
  var subRef = React.useRef(null);

  // Random buyer names for dummy mode fallback
  var buyers = [
    'Hamba Allah', 'Hamba Allah', 'Hamba Allah', 'Hamba Allah',
    'Jamaah dari Jakarta', 'Jamaah dari Bandung', 'Jamaah dari Surabaya',
    'Jamaah dari Medan', 'Jamaah dari Makassar', 'Jamaah dari Semarang'
  ];

  function showNotif(buyer, pkgName, pax) {
    setNotif({ buyer: buyer, pkgName: pkgName, pax: pax, time: new Date() });
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(function() {
      setVisible(false);
    }, 4000);
  }

  // Subscribe to SSE closing events from backend
  React.useEffect(function() {
    var ds = window.Alburaq.dataService;
    if (ds.getDataSource() === 'api') {
      subRef.current = ds.subscribeEvents(function(data) {
        // Real closing event from Odoo webhook
        var buyer = data.city ? 'Jamaah dari ' + data.city : 'Hamba Allah';
        var pkgName = data.product_name || 'paket umroh';
        var pax = data.pax_count || 1;
        showNotif(buyer, pkgName, pax);

        // Re-fetch packages since pax data changed
        ds.fetchPackages().then(function(pkgs) {
          if (pkgs && window.Alburaq._onPackagesUpdate) {
            window.Alburaq._onPackagesUpdate(pkgs);
          }
        });
      });
      return function() {
        if (subRef.current) subRef.current.disconnect();
      };
    }

    // Dummy mode: random notifications
    if (!packages || !packages.length) return;

    function fireDummy() {
      var available = packages.filter(function(pkg) {
        var cap = pkg.buses.reduce(function(s, b) { return s + b.cap; }, 0);
        var fil = pkg.buses.reduce(function(s, b) { return s + Math.min(b.fil, b.cap); }, 0);
        return cap - fil > 0;
      });
      var pool = available.length ? available : packages;
      var pkg = pool[Math.floor(Math.random() * pool.length)];
      var buyer = buyers[Math.floor(Math.random() * buyers.length)];
      var pax = Math.floor(Math.random() * 5) + 1;
      showNotif(buyer, pkg.name, pax);
    }

    var timer = setTimeout(function() {
      fireDummy();
      timer = setInterval(fireDummy, interval);
    }, 2000);

    return function() {
      clearTimeout(timer);
      clearInterval(timer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [packages, interval]);

  if (!notif) return null;

  return (
    <div className={'buy-notif' + (visible ? ' buy-notif-show' : ' buy-notif-hide')}>
      <div className="buy-notif-inner">
        <div className="buy-notif-icon">🛒</div>
        <div className="buy-notif-body">
          <div className="buy-notif-text">
            <strong>{notif.buyer}</strong> baru saja membeli <strong>{notif.pkgName}</strong> sebanyak <strong>{notif.pax} pax</strong>!
          </div>
        </div>
      </div>
    </div>
  );
};