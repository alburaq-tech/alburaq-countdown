// ── Buy Notification Popup ──
// Displays a toast-style popup: "Hamba Allah baru saja membeli paket X sebanyak Y pax!"
// In dummy mode, fires every 5 seconds with random package/pax.
// In production, this would be triggered by a real-time event (WebSocket, SSE, etc.).

window.Alburaq = window.Alburaq || {};

window.Alburaq.BuyNotif = function BuyNotif(props) {
  var packages = props.packages;
  var interval = props.interval || 5000;

  var _notif = React.useState(null);
  var notif  = _notif[0];
  var setNotif = _notif[1];

  var _visible = React.useState(false);
  var visible  = _visible[0];
  var setVisible = _visible[1];

  var timerRef = React.useRef(null);
  var hideTimerRef = React.useRef(null);

  // Random buyer names for dummy
  var buyers = [
    'Hamba Allah', 'Hamba Allah', 'Hamba Allah', 'Hamba Allah',
    'Jamaah dari Jakarta', 'Jamaah dari Bandung', 'Jamaah dari Surabaya',
    'Jamaah dari Medan', 'Jamaah dari Makassar', 'Jamaah dari Semarang'
  ];

  function fireNotif() {
    if (!packages || !packages.length) return;

    // Pick a random available package (not sold out)
    var available = packages.filter(function(pkg) {
      var cap = pkg.buses.reduce(function(s, b) { return s + b.cap; }, 0);
      var fil = pkg.buses.reduce(function(s, b) { return s + Math.min(b.fil, b.cap); }, 0);
      return cap - fil > 0;
    });

    var pool = available.length ? available : packages;
    var pkg = pool[Math.floor(Math.random() * pool.length)];
    var buyer = buyers[Math.floor(Math.random() * buyers.length)];
    var pax = Math.floor(Math.random() * 5) + 1; // 1-5 pax

    setNotif({
      buyer: buyer,
      pkgName: pkg.name,
      pax: pax,
      time: new Date()
    });
    setVisible(true);

    // Auto-hide after 4 seconds
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(function() {
      setVisible(false);
    }, 4000);
  }

  React.useEffect(function() {
    if (!packages || !packages.length) return;

    // Fire first one after 2 seconds
    timerRef.current = setTimeout(function() {
      fireNotif();
      // Then every N seconds
      timerRef.current = setInterval(fireNotif, interval);
    }, 2000);

    return function() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        clearInterval(timerRef.current);
      }
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