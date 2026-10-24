/* Phone layout layer.
   The pages were designed on a fixed 1440px canvas. On phones (<= 760px wide) this
   rewrites the inline layout styles so content reflows into one column:
   fixed widths become fluid, wide side padding shrinks, multi-column grids stack,
   very large type steps down. Drawn compositions (things positioned absolutely
   inside a fixed box, like the exploded drone view) are kept intact and scaled
   down to fit instead. Per-page tweaks live in window.__M (set by each page). */
(function () {
  var PHONE_MAX = 760;
  var cfg = window.__M || {};
  function isPhone() { return (window.innerWidth || document.documentElement.clientWidth) <= PHONE_MAX; }

  function parse(st) {
    var out = [], re = /([a-zA-Z-]+)\s*:\s*((?:[^;(]|\([^)]*\))+)\s*;?/g, m;
    while ((m = re.exec(st))) out.push([m[1].toLowerCase(), m[2].trim()]);
    return out;
  }
  function px(v) { var m = /^(-?\d+(?:\.\d+)?)px$/.exec(v); return m ? parseFloat(m[1]) : null; }
  function shrinkSide(v, max) { var n = px(v); return n !== null && n > max ? max + 'px' : v; }
  function shrinkVert(v) { var n = px(v); return n !== null && n > 40 ? Math.round(n * 0.62) + 'px' : v; }
  function box(val, side) {
    var p = val.split(/\s+(?![^(]*\))/);
    if (p.length === 1) p = [p[0], p[0], p[0], p[0]];
    else if (p.length === 2) p = [p[0], p[1], p[0], p[1]];
    else if (p.length === 3) p = [p[0], p[1], p[2], p[1]];
    return [shrinkVert(p[0]), shrinkSide(p[1], side), shrinkVert(p[2]), shrinkSide(p[3], side)].join(' ');
  }
  function fs(v) {
    var n = px(v);
    if (n === null) return v;
    if (n > 40) return Math.round(40 + (n - 40) * 0.22) + 'px';
    if (n < 12.5) return '12.5px';
    return v;
  }

  var VW = 0;
  function transformEl(el, depth) {
    if (el.nodeType !== 1 || el.__mSkip) return;
    var st0 = el.getAttribute('style');
    if (st0 && el.__mIn !== st0) el.setAttribute('data-o', st0);
    if (el.matches && cfg.skip && el.matches(cfg.skip)) return;
    if (el.matches && cfg.fit && el.matches(cfg.fit)) { fitBox(el); return; }
    if (cfg.fitW) { for (var fi = 0; fi < cfg.fitW.length; fi++) if (el.matches(cfg.fitW[fi][0])) { fitBox(el, cfg.fitW[fi][1]); return; } }
    var st = el.getAttribute('style');
    if (st && el.__mIn !== st) {
      var d = parse(st), map = {}, abs = false, wide = false, W = null;
      d.forEach(function (kv) { map[kv[0]] = kv[1]; });
      abs = map.position === 'absolute' || map.position === 'fixed';
      W = map.width ? px(map.width) : null;
      // drawn composition: a fixed-size box with absolutely placed children -> scale it
      if (!abs && depth > 0 && el.tagName !== 'MAIN' && W && W > VW && hasAbsKids(el) && !(cfg.noFit && el.matches(cfg.noFit))) { fitBox(el); return; }
      var out = d.map(function (kv) {
        var k = kv[0], v = kv[1];
        if (abs && !(W && W >= 1000)) {
          if (k === 'font-size') return [k, fs(v)];
          return kv;
        }
        switch (k) {
          case 'width': { var n = px(v); if (n !== null && n > VW - 20) return [k, el.tagName === 'IMG' || el.tagName === 'VIDEO' ? '100%' : 'auto']; return kv; }
          case 'min-width': { var n2 = px(v); return n2 !== null && n2 > 200 ? [k, '0'] : kv; }
          case 'max-width': { var n3 = px(v); return n3 !== null && n3 > VW ? [k, '100%'] : kv; }
          case 'min-height': { var n4 = px(v); return n4 !== null && n4 > 500 ? [k, '0'] : kv; }
          case 'height': { var n5 = px(v); if (n5 !== null && n5 > 420 && el.tagName !== 'IMG') return [k, depth > 0 && el.tagName !== 'MAIN' && (hasAbsKids(el) || el.querySelector('canvas')) ? Math.min(n5, 380) + 'px' : 'auto']; return kv; }
          case 'padding': case 'margin': return [k, box(v, 18)];
          case 'padding-left': case 'padding-right': case 'margin-left': case 'margin-right': return [k, shrinkSide(v, 18)];
          case 'padding-top': case 'padding-bottom': case 'margin-top': case 'margin-bottom': return [k, shrinkVert(v)];
          case 'grid-template-columns': return [k, (el.matches && cfg.keepGrid && el.matches(cfg.keepGrid)) ? v : 'minmax(0, 1fr)'];
          case 'grid-column': case 'grid-row': return [k, 'auto'];
          case 'gap': case 'column-gap': case 'row-gap': { var g = v.split(/\s+/).map(function (x) { var n6 = px(x); return n6 !== null && n6 > 28 ? '24px' : x; }); return [k, g.join(' ')]; }
          case 'font-size': return [k, fs(v)];
          case 'left': case 'right': if (abs && W && W >= 1000) return [k, '0']; return kv;
          case 'white-space': return v === 'nowrap' && !(el.matches && el.matches('.orn,.mono,.tag')) ? [k, 'normal'] : kv;
        }
        return kv;
      });
      if (abs && W && W >= 1000) out.push(['width', '100%'], ['box-sizing', 'border-box']);
      var ns = out.map(function (kv) { return kv[0] + ': ' + kv[1]; }).join('; ');
      el.__mIn = st; el.__mOut = ns;
      el.setAttribute('style', ns);
      el.__mIn = ns;
    }
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) transformEl(kids[i], depth + 1);
  }
  function hasAbsKids(el) {
    var k = el.children, n = 0;
    for (var i = 0; i < k.length; i++) { var s = k[i].getAttribute && k[i].getAttribute('style') || ''; if (/position:\s*absolute/.test(s)) n++; }
    return n >= 1 && n >= k.length * 0.5;
  }
  function fitBox(el, forceW) {
    var st = el.getAttribute('style') || '';
    var map = {}; parse(st).forEach(function (kv) { map[kv[0]] = kv[1]; });
    el.style.zoom = '';
    var W = forceW || px(map.width || '') || el.offsetWidth;
    var avail;
    if (forceW) avail = el.offsetWidth;
    else avail = el.parentElement ? el.parentElement.clientWidth : VW;
    if (!avail || avail > VW) avail = VW;
    var z = Math.min(1, avail / W);
    if (forceW) { el.style.width = W + 'px'; }
    el.style.zoom = z;
    if (map.margin || map['margin-left']) { el.style.marginLeft = '0'; el.style.marginRight = '0'; }
    el.__mSkip = true; // keep its insides exactly as drawn
    el.__mIn = el.getAttribute('style');
    var ds = el.querySelectorAll('[style]');
    for (var di = 0; di < ds.length; di++) if (!ds[di].hasAttribute('data-o')) ds[di].setAttribute('data-o', ds[di].getAttribute('style'));
    el.setAttribute('data-mfit', '');
  }

  function overflowFix(root) {
    // rows that still overflow after reflow: let them wrap
    var all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.__mSkip || el.closest && el.closest('[data-mfit]')) continue;
      var cs = getComputedStyle(el);
      if (cs.display.indexOf('flex') >= 0 && cs.flexDirection.indexOf('row') === 0 && el.scrollWidth > el.clientWidth + 2 && cs.position !== 'absolute') {
        el.style.flexWrap = 'wrap'; el.__mIn = el.getAttribute('style');
      }
    }
  }

  var busy = false;
  function run() {
    if (!isPhone() || busy) return;
    var app = document.getElementById('app');
    if (!app || !app.firstElementChild) return;
    if (cfg.phoneComponent) return; // page renders its own phone layout
    busy = true;
    VW = document.documentElement.clientWidth;
    try {
      for (var i = 0; i < app.children.length; i++) transformEl(app.children[i], 0);
      overflowFix(app);
      if (cfg.after) cfg.after(app);
    } finally { busy = false; }
  }
  window.__mRun = run;
  var mo = new MutationObserver(function (list) {
    if (busy || !isPhone()) return;
    var need = false;
    for (var i = 0; i < list.length && !need; i++) {
      var r = list[i];
      if (r.type === 'childList' && r.addedNodes.length) need = true;
      if (r.type === 'attributes' && r.target.__mIn !== r.target.getAttribute('style')) need = true;
    }
    if (need) requestAnimationFrame(run);
  });
  function start() {
    var app = document.getElementById('app');
    if (!app) return;
    mo.observe(app, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    run();
    setTimeout(run, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
