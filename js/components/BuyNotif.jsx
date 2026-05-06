// ── Buy Notification Popup ──
// Displays a toast-style popup when a real closing event arrives via SSE.
// Falls back to random recent buyers from API in api mode.
// Falls back to random fake notifications in dummy mode.

window.Alburaq = window.Alburaq || {};

window.Alburaq.BuyNotif = function BuyNotif(props) {
  var packages = props.packages;
  var recentBuyersProp = props.recentBuyers || [];
  var interval = props.interval || 8000; // fallback interval for dummy mode

  var _notif = React.useState(null);
  var notif  = _notif[0];
  var setNotif = _notif[1];

  var _visible = React.useState(false);
  var visible  = _visible[0];
  var setVisible = _visible[1];

  var hideTimerRef = React.useRef(null);
  var subRef = React.useRef(null);

  // Recent buyers from API (shuffled) — stored in ref to avoid infinite loop
  var recentBuyersRef = React.useRef([]);
  var buyerIndexRef = React.useRef(0);

  // Random buyer names for dummy mode fallback
  var buyers = [
    'Hamba Allah', 'Hamba Allah', 'Hamba Allah', 'Hamba Allah',
    'Jamaah dari Jakarta', 'Jamaah dari Bandung', 'Jamaah dari Surabaya',
    'Jamaah dari Medan', 'Jamaah dari Makassar', 'Jamaah dari Semarang'
  ];

  function showNotif(buyer, pkgName, pax, purchaseDate) {
    setNotif({ buyer: buyer, pkgName: pkgName, pax: pax, time: new Date(), purchaseDate: purchaseDate });
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(function() {
      setVisible(false);
    }, 4000);
  }

  // Shuffle array (Fisher-Yates)
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // Format date to Indonesian short format
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Subscribe to SSE closing events from backend
  React.useEffect(function() {
    var ds = window.Alburaq.dataService;
    if (ds.getDataSource() === 'api') {
      // Use recent buyers from props if available, otherwise fetch
      if (recentBuyersProp.length > 0) {
        recentBuyersRef.current = shuffle(recentBuyersProp);
      } else {
        ds.fetchRecentBuyers().then(function(buyers) {
          if (buyers && buyers.length) {
            recentBuyersRef.current = shuffle(buyers);
          }
        });
      }

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

      // Random recent buyer notifications
      var randomTimer = setTimeout(function() {
        randomTimer = setInterval(function() {
          if (recentBuyersRef.current.length === 0) return;
          var b = recentBuyersRef.current[buyerIndexRef.current % recentBuyersRef.current.length];
          buyerIndexRef.current++;
          var buyerText = b.jamaah_name + (b.city ? ' dari ' + b.city : '');
          showNotif(buyerText, b.product_name || 'paket umroh', b.pax_count || 1, b.purchase_date);
        }, interval);
      }, 2000);

      return function() {
        if (subRef.current) subRef.current.disconnect();
        clearTimeout(randomTimer);
        clearInterval(randomTimer);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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
  }, [packages, interval, recentBuyersProp]);

  if (!notif) return null;

  return (
    <div className={'buy-notif' + (visible ? ' buy-notif-show' : ' buy-notif-hide')}>
      <div className="buy-notif-inner">
        <div className="buy-notif-icon">🛒</div>
        <div className="buy-notif-body">
          <div className="buy-notif-text">
            <strong>{notif.buyer}</strong> baru saja membeli <strong>{notif.pkgName}</strong> sebanyak <strong>{notif.pax} pax</strong>!
            {notif.purchaseDate ? (
              <div className="buy-notif-date">pada {fmtDate(notif.purchaseDate)}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};