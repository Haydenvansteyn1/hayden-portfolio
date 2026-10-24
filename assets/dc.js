/* Tiny runtime that renders the exported Claude Design pages with Preact. */
(function () {
  var P = window.preact;
  window.__S = function (x) { return x == null || x === false ? '' : x; };
  class DCLogic extends P.Component {
    constructor(p) { super(p); this.state = {}; }
    render() { return this.__T(this.renderVals() || {}); }
  }
  window.DCLogic = DCLogic;

  var PHONE_MAX = 760;
  function isPhone() { return (window.innerWidth || document.documentElement.clientWidth) <= PHONE_MAX; }
  var mounted = null;

  function fit() {
    var app = document.getElementById('app');
    if (!app) return;
    var phone = isPhone();
    document.body.classList.toggle('m', phone);
    if (phone) { app.style.zoom = ''; return; }
    var w = document.documentElement.clientWidth;
    app.style.zoom = Math.min(1, w / 1440);
  }

  window.__mount = function (Cls, T, props) {
    var app = document.getElementById('app');
    function go() {
      var usePhone = isPhone() && window.__PHONE;
      var key = isPhone() ? 'phone' : 'desk';
      if (mounted === key) return;
      mounted = key;
      if (usePhone) {
        var ph = window.__PHONE;
        if (!document.getElementById('phone-head')) {
          var d = document.createElement('div'); d.id = 'phone-head'; d.innerHTML = ph.head; document.head.appendChild(d.querySelector('style') || d);
        }
        ph.C.prototype.__T = ph.T;
        P.render(null, app);
        P.render(P.h(ph.C, ph.P), app);
      } else {
        Cls.prototype.__T = T;
        P.render(null, app);
        P.render(P.h(Cls, props), app);
      }
      fit();
    }
    go();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { fit(); go(); }, 120); });
    fit();
  };
})();
