/* The Imperial Stack v2 · own.js
   Who owns a firm and where it operates, on the Circuit. Selecting a mapped firm draws its footprint on the globe:
   its seat, its sites by role, and its owners where they sit (purple), with the step's flows faint behind it.
   The floating card and the card under the map carry the same facts with dates and sources.
   Data: /imperial-stack/data/ownership.json; adding a firm, an owner or a site is one entry there. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var U = X.util, C = X.data.C, CTY = X.data.CTY, OWN = null;
  var PURPLE = C.cap, WHITE = '#e4ebf1', RED = '#ff8a5c';
  var has = function (f) { return !!(f && OWN && OWN.firms[f.name]); };
  var cname = function (iso) { return iso === 'USA' ? 'United States' : (CTY[iso] ? CTY[iso].name : iso); };
  var llOf = function (o) { return o.ll || (o.llk && X.data.LL[o.llk]) || null; };
  var CONTROL = { none: 'No controlling owner', controlled: 'Controlled within a group', state: 'State among the largest holders', founder: 'Founder-controlled or founder-led', disputed: 'Control disputed', unmapped: 'Owners not yet mapped' };
  X.own = { has: has, get data() { return OWN; } };

  /* ---------- on the globe ---------- */
  function fade(col, a) { return String(col).replace(/rgba\(([^)]+),\s*[\d.]+\)/, function (m, rgb) { return 'rgba(' + rgb + ',' + a + ')'; }); }
  function mark(text, cls, value, pri, title) { var el = U.makeLabel(text, 'own ' + cls, value, pri); if (title) el.title = title; return el; }
  X.globeLayer(function (G) {
    var f = G.sel.firm; if (G.rev || !has(f)) return;
    var o = OWN.firms[f.name], seat = o.seat.ll;
    /* the step's own picture steps back: faint tracks, no streams, no rings, only the hub names */
    for (var i = G.arcs.length - 1; i >= 0; i--) { var a = G.arcs[i]; if (!a.track) { G.arcs.splice(i, 1); continue; } a.color = [fade(a.color[0], .05), fade(a.color[1], .05)]; a.dl = 1; a.dg = 0; a.label = ''; }
    G.rings.length = 0; G.points.length = 0;
    for (var j = G.html.length - 1; j >= 0; j--) { if (!G.html[j].el.classList.contains('hub')) G.html.splice(j, 1); else G.html[j].el.classList.add('back'); }
    /* seat */
    G.points.push({ ll: seat, alt: .03, rad: .55, color: '#ffffff', label: '<b>' + U.esc(f.name) + '</b><div class="st">Seat: ' + U.esc(o.seat.city) + ', ' + U.esc(cname(o.seat.iso)) + '</div>' });
    G.rings.push({ ll: seat, color: '#ffffff', r: 3, speed: 1.1, period: 2200 });
    G.html.push({ ll: seat, alt: .05, el: mark(f.name, 'seat', o.seat.city, 2e9) });
    /* sites, tethered to the seat */
    (o.sites || []).forEach(function (s, k) {
      var ll = llOf(s); if (!ll) return;
      var role = OWN.roles[s.role] || OWN.roles.site, lab = '<b>' + U.esc(f.name) + ' · ' + U.esc(s.city) + '</b><div class="st">' + U.esc(role[0]) + ' · ' + U.esc(cname(s.iso)) + (s.note ? '<br>' + U.esc(s.note) : '') + '</div>';
      G.arcs.push({ s: seat, e: ll, color: ['rgba(228,235,241,.42)', 'rgba(228,235,241,.42)'], stroke: .26, dl: 1, dg: 0, ig: 0, time: 0, label: lab });
      G.points.push({ ll: ll, alt: .014, rad: .3, color: WHITE, label: lab });
      G.html.push({ ll: ll, alt: .02, el: mark(s.city, 'site r-' + s.role, role[0], 8e8 - k * 1e5) });
    });
    /* owners, where they sit; a founder sits on the seat and gets no line */
    (o.holders || []).forEach(function (h, k) {
      var col = h.disputed ? RED : PURPLE, lab = '<b>' + U.esc(h.name) + '</b><div class="v" style="color:' + col + '">' + U.esc(h.txt) + '</div><div class="st">' + U.esc(cname(h.iso)) + ' · ' + U.esc(h.date) + '</div>';
      var far = Math.abs(h.ll[0] - seat[0]) + Math.abs(h.ll[1] - seat[1]) > .6;
      if (far) {
        G.arcs.push({ s: h.ll, e: seat, color: [U.rgba(col, .9), U.rgba(col, .9)], stroke: .32 + Math.min(1.5, h.pct / 22), dl: h.disputed ? .012 : .028, dg: h.disputed ? .03 : .014, ig: 0, time: 0, label: lab });
        G.points.push({ ll: h.ll, alt: .02, rad: .3 + Math.min(.5, h.pct / 40), color: col, label: lab });
      }
      G.html.push({ ll: far ? h.ll : seat, alt: far ? .03 : .09 + k * .035, el: mark(h.name.replace(/, founder$/, ''), 'holder' + (h.disputed ? ' disputed' : '') + (h.person ? ' person' : ''), h.txt, 1.5e9 + h.pct * 1e5) });
    });
  });

  /* ---------- camera: frame the footprint (seat, sites and, lightly, owners) when it opens ---------- */
  function centre(o) {
    var pts = [[o.seat.ll, 2]], R = Math.PI / 180, x = 0, y = 0, z = 0;
    (o.sites || []).forEach(function (s) { var ll = llOf(s); if (ll) pts.push([ll, 1]); });
    (o.holders || []).forEach(function (h) { pts.push([h.ll, .3]); });
    pts.forEach(function (p) { var la = p[0][0] * R, lo = p[0][1] * R; x += p[1] * Math.cos(la) * Math.cos(lo); y += p[1] * Math.cos(la) * Math.sin(lo); z += p[1] * Math.sin(la); });
    var n = Math.hypot(x, y, z), tot = pts.reduce(function (a, p) { return a + p[1]; }, 0);
    if (n / tot < .25) return { lat: o.seat.ll[0] * .85, lng: o.seat.ll[1], altitude: 2.2 };          /* spread round the globe: stay on the seat */
    var lat = Math.asin(z / n) / R, lng = Math.atan2(y, x) / R, max = 0;
    pts.forEach(function (p) { if (p[1] < 1) return; var d = U.gcMid([lat, lng], p[0], .5).dist; if (d > max) max = d; });
    return { lat: lat, lng: lng, altitude: Math.max(1.45, Math.min(2.6, 1.25 + max * 1.05)) };
  }
  function frameIt() {
    var f = X.sel.firm, g = X.globe; if (!has(f) || !g || X.view !== 'map') return;
    try { g.controls().autoRotate = false; g.pointOfView(centre(OWN.firms[f.name]), X.reduce ? 0 : 1300); } catch (e) { /* ignore */ }
  }
  X.on('select', frameIt);
  /* stepping on leaves the footprint and brings the step back */
  X.on('step', function () { if (has(X.sel.firm) && !applying) X.select(X.sel.iso); });
  var applying = false, ad0 = X.applyDetail;
  if (ad0) X.applyDetail = function (h) { applying = true; try { ad0(h); } finally { applying = false; } };

  /* ---------- the floating card: the firm's dossier in place of the step, until the reader steps on ---------- */
  function countries(o) { var seen = [], out = []; (o.sites || []).forEach(function (s) { if (seen.indexOf(s.iso) < 0) { seen.push(s.iso); out.push(cname(s.iso)); } }); return out; }
  X.on('narr', function () {
    var f = X.sel.firm, tx = X.$('t-x'); if (!tx) return;
    X.root.classList.toggle('own-on', has(f));
    if (!has(f)) return;
    var o = OWN.firms[f.name], top = (o.holders || []).slice().sort(function (a, b) { return b.pct - a.pct; })[0];
    X.$('t-k').innerHTML = '<span class="ki" style="color:' + PURPLE + '">' + U.svgIc('all', 15) + '</span><span>Firm · ' + U.esc(o.seat.city) + ', ' + U.esc(cname(o.seat.iso)) + '</span><span class="ks">' + U.esc(CONTROL[o.control] || '') + '</span>';
    X.$('t-h').textContent = o.legal;
    X.$('t-p').textContent = o.summary;
    var tv = X.$('t-v'); if (tv._r) cancelAnimationFrame(tv._r);   /* the step's figure may still be counting up */
    tv.textContent = top ? (top.pct >= 10 ? Math.round(top.pct * 10) / 10 : top.pct) + '%' + (top.star ? '*' : '') : '–';
    X.$('t-c').textContent = top ? (top.votes ? 'of the votes: ' : 'largest holder: ') + top.name.replace(/, founder$/, '') + ' (' + cname(top.iso) + '), ' + top.date : 'owners not yet mapped';
    var cs = countries(o);
    tx.innerHTML = '<div class="ownrow"><span>Operates in</span><b>' + (cs.length ? U.esc(cs.join(' · ')) : 'not yet mapped') + '</b></div>'
      + '<div class="ownacts"><button type="button" class="godeep" data-own="more">Owners, sites and sources <span aria-hidden="true">↓</span></button><button type="button" class="godeep" data-own="back">← Back to the step</button></div>';
    var ess = X.$('t-essay'); if (ess) ess.hidden = true;
    var chip = X.$('vchip'); if (chip && !chip.hidden) { var cb = chip.querySelector('b'), ck = chip.querySelector('.vk'), cx = chip.querySelector('button'); if (cb) cb.textContent = f.name; if (ck) ck.textContent = 'Footprint'; if (cx) cx.textContent = '← Back to the step'; }
    var more = X.$('t-more'); if (more) more.hidden = true;
  });
  X.on('narr', function () { var more = X.$('t-more'); if (more && !has(X.sel.firm)) more.hidden = false; });
  X.root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-own]'); if (!b) return;
    if (b.dataset.own === 'back') X.select(null);
    else if (b.dataset.own === 'more') { var c = X.$('card'); if (c) U.crisp(c, 12); }
    else if (b.dataset.own === 'firm') { var t = X.data.FIRMS.filter(function (x) { return x.name === b.dataset.name; })[0]; if (t) X.select(t.iso, t); }
  });
  function roleRows(o) { var seen = [], h = ''; (o.sites || []).forEach(function (s) { if (seen.indexOf(s.role) < 0) { seen.push(s.role); h += '<div class="lr"><i class="ownk site r-' + s.role + '"></i><span>' + U.esc((OWN.roles[s.role] || OWN.roles.site)[0]) + '</span></div>'; } }); return h; }
  /* the legend on the map explains the marks while a footprint is shown */
  X.on('narr', function () {
    var L = X.$('leg6'); if (!L || !has(X.sel.firm)) return;
    L.innerHTML = '<div class="mh">Footprint</div>'
      + '<div class="lr"><i class="ownk seat"></i><span>Seat</span></div>'
      + roleRows(OWN.firms[X.sel.firm.name])
      + '<div class="lr"><i class="ownk holder"></i><span>Owner, at its head office; wider line, larger share</span></div>'
      + ((OWN.firms[X.sel.firm.name].holders || []).some(function (h) { return h.disputed; }) ? '<div class="lr"><i class="ownk disputed"></i><span>Owner whose control is disputed</span></div>' : '')
      + '<div class="lw">Dated snapshot. * not confirmed in a filing.</div>'
      + '<button type="button" class="lfull" data-own="more">Owners, sites and sources →</button>';
  });

  /* ---------- the card under the map ---------- */
  function srcLink(o, i) { var s = o.src[i]; if (!s) return ''; return s[2] ? '<a href="' + U.esc(s[2]) + '" target="_blank" rel="noopener">' + U.esc(s[0]) + '</a>, ' + U.esc(s[1]) : U.esc(s[0]) + ', ' + U.esc(s[1]); }
  X.on('card', function () {
    var f = X.sel.firm, boxEl = X.$('c-firm').querySelector('.firmbox'); if (!f || !boxEl) return;
    var d = document.createElement('div'); d.className = 'own2';
    if (!has(f)) {
      d.innerHTML = OWN ? '<p class="ownno">Ownership and sites: not yet mapped. ' + Object.keys(OWN.firms).length + ' of ' + X.data.FIRMS.length + ' firms are, marked with a purple dot in “Firms in the stack”.</p>' : '';
      boxEl.appendChild(d); return;
    }
    var o = OWN.firms[f.name], R = OWN.roles;
    var hold = (o.holders || []).map(function (h) {
      var nm = h.firm ? '<button type="button" class="ownf" data-own="firm" data-name="' + U.esc(h.firm) + '">' + U.esc(h.name) + '</button>' : U.esc(h.name);
      return '<li' + (h.disputed ? ' class="disputed"' : '') + '><b>' + nm + '</b> <i>' + U.esc(cname(h.iso)) + (h.state ? ' · state' : '') + '</i><span class="pc">' + U.esc(h.txt) + '</span><em>' + U.esc(h.date) + ' · ' + srcLink(o, h.src) + '</em>' + (h.note ? '<small>' + U.esc(h.note) + '</small>' : '') + '</li>';
    }).join('');
    var byRole = {}; (o.sites || []).forEach(function (s) { (byRole[s.role] = byRole[s.role] || []).push(s); });
    var sites = Object.keys(byRole).map(function (r) {
      return '<li><b>' + U.esc((R[r] || R.site)[0]) + '</b> ' + byRole[r].map(function (s) { return '<span class="sv" title="' + U.esc((s.note || '') + (s.star ? ' (secondary source)' : '')) + '">' + U.esc(s.city) + ', ' + U.esc(cname(s.iso)) + (s.star ? '*' : '') + '</span>'; }).join(' · ')
        + '<small>' + byRole[r].filter(function (s) { return s.note; }).map(function (s) { return U.esc(s.city) + ': ' + U.esc(s.note); }).join('. ') + '</small></li>';
    }).join('');
    var links = (o.links || []).map(function (l) { return '<li><button type="button" class="ownf" data-own="firm" data-name="' + U.esc(l.to) + '">' + U.esc(l.to) + '</button> ' + U.esc(l.t) + '</li>'; }).join('');
    d.innerHTML = '<dl class="ownd">'
      + '<dt>Home</dt><dd>' + U.esc(o.legal) + ' · ' + U.esc(o.seat.city) + ', ' + U.esc(cname(o.seat.iso)) + '<br><span class="dim">' + U.esc(o.listing) + '</span></dd>'
      + '<dt>Owners</dt><dd><span class="octl c-' + o.control + '">' + U.esc(CONTROL[o.control] || '') + '</span>' + (hold ? '<ul class="ownl">' + hold + '</ul>' : '<p class="ownno">Not yet mapped.</p>') + '</dd>'
      + '<dt>Operates</dt><dd>' + (sites ? '<ul class="ownl sites">' + sites + '</ul>' : '<p class="ownno">Sites not yet mapped.</p>') + '</dd>'
      + (links ? '<dt>On this map</dt><dd><ul class="ownl links">' + links + '</ul></dd>' : '')
      + (o.open && o.open.length ? '<dt>Still open</dt><dd><ul class="ownl open">' + o.open.map(function (t) { return '<li>' + U.esc(t) + '</li>'; }).join('') + '</ul></dd>' : '')
      + '<dt>Sources</dt><dd><ul class="ownl srcs">' + o.src.map(function (s, i) { return '<li>' + srcLink(o, i) + '</li>'; }).join('') + '</ul><p class="ownnote">' + U.esc(OWN.note) + ' As of ' + U.esc(OWN.asof) + '.</p></dd>'
      + '</dl>';
    boxEl.appendChild(d);
  });

  /* ---------- firms panel: a purple dot on the firms that are mapped ---------- */
  function dots() {
    if (!OWN) return;
    X.root.querySelectorAll('.firm').forEach(function (b) { var on = !!OWN.firms[b.dataset.name]; b.classList.toggle('mapped', on); if (on && !b.title) b.title = 'Ownership and sites mapped: select to see the footprint on the globe'; });
    var box = X.$('firmsbox'); if (box && !box.querySelector('.ownkey')) { var p = document.createElement('p'); p.className = 'ownkey'; p.innerHTML = '<i></i>Ownership and sites mapped (' + Object.keys(OWN.firms).length + ' of ' + X.data.FIRMS.length + '): select one to see who owns it and where it operates.'; box.appendChild(p); }
  }
  new MutationObserver(dots).observe(X.$('firmlist'), { childList: true });
  X.on('card', dots);

  X.load('ownership').then(function (d) {
    OWN = d; dots();
    if (X.view === 'map') { if (X.sel.firm) { X.renderGlobe(false); X.recard(); frameIt(); } X.emit('narr'); }
  }).catch(function () { /* without the data the firm cards stay as they were */ });
})();
