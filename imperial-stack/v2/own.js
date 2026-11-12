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
  var cshort = function (iso) { return iso === 'USA' ? 'US' : cname(iso); };
  var CONTROL = { none: 'No controlling owner', controlled: 'Controlled within a group', state: 'State among the largest holders', founder: 'Controlled by its founder', led: 'Founder is the largest holder', disputed: 'Control disputed', unmapped: 'Owners not yet mapped' };
  var CSHORT = { none: 'No controlling owner', controlled: 'Group control', state: 'State holder', founder: 'Founder control', led: 'Founder-led', disputed: 'Control disputed', unmapped: 'Owners not mapped' };
  X.own = { has: has, get data() { return OWN; } };
  X.softSelect(function () { return has(X.sel.firm); });

  /* ---------- on the globe ---------- */
  /* A footprint label starts with its mark, and the mark must sit exactly on the place. The globe centres every label on its point,
     so each one is shifted right by half its own width (measured once in a hidden holder, and again when the zoom level changes its text). */
  var ruler = document.createElement('div'); ruler.className = 'ownruler'; ruler.setAttribute('aria-hidden', 'true'); X.root.appendChild(ruler);
  function anchor(el) { el.style.marginLeft = (el.classList.contains('flip') ? -1 : 1) * Math.max(0, Math.round(el.offsetWidth / 2 - 5)) + 'px'; }
  /* a label that would run under the map-mode panel or off the frame turns round: its text goes to the left of its mark */
  function fit() {
    var g = X.$('globe'); if (!g || !has(X.sel.firm)) return;
    var fr = X.$('frame').getBoundingClientRect(), mm = X.$('mapmodes'), lim = fr.right - 12, changed = false;
    if (mm && mm.getClientRects().length && window.innerWidth > 760) lim = Math.min(lim, mm.getBoundingClientRect().left - 10);
    g.querySelectorAll('.glab.own').forEach(function (el) {
      if (el.style.opacity === '0') return;
      var r = el.getBoundingClientRect(), w = r.width, fl = el.classList.contains('flip'), ax = fl ? r.right - 5 : r.left + 5;
      var want = ax + w - 5 > lim && ax - w > fr.left + 12;
      if (want !== fl) { el.classList.toggle('flip', want); anchor(el); changed = true; }
    });
    if (changed) X.relabel();
  }
  var fitT = [];
  function fitSoon() { fitT.forEach(clearTimeout); fitT = [90, 800, 1700].map(function (ms) { return setTimeout(fit, ms); }); }
  X.on('globe', function () { if (has(X.sel.firm)) fitSoon(); });
  X.on('labels', function () { if (has(X.sel.firm)) fit(); });   /* after every pass that places the labels */
  var ctl = false; X.on('globe', function () { if (ctl || !X.globe) return; ctl = true; try { X.globe.controls().addEventListener('end', function () { setTimeout(fit, 60); }); } catch (e) { /* ignore */ } });
  function mark(text, cls, value, pri) { var el = U.makeLabel(text, 'own ' + cls, value, pri); ruler.appendChild(el); anchor(el); ruler.removeChild(el); return el; }
  X.on('zoom', function () { var g = X.$('globe'); if (g) g.querySelectorAll('.glab.own').forEach(anchor); fitSoon(); });
  X.globeLayer(function (G) {
    var f = G.sel.firm; if (G.rev || !has(f)) return;
    var o = OWN.firms[f.name], seat = o.seat.ll;
    /* the step's own picture steps back: no flows, no rings; only the hub names stay, in grey, to keep the place */
    G.arcs.length = 0; G.rings.length = 0; G.points.length = 0;
    for (var j = G.html.length - 1; j >= 0; j--) { if (!G.html[j].el.classList.contains('hub')) G.html.splice(j, 1); else { G.html[j].el.classList.add('back'); G.html[j].el.dataset.pri = 1; } }   /* a greyed hub name gives way to any footprint label */
    /* seat */
    G.points.push({ ll: seat, alt: .03, rad: .3, color: '#ffffff', label: '<b>' + U.esc(f.name) + '</b><div class="st">Seat: ' + U.esc(o.seat.city) + ', ' + U.esc(cname(o.seat.iso)) + '</div>' });
    G.rings.push({ ll: seat, color: '#ffffff', r: 3, speed: 1.1, period: 2200 });
    var home = (o.sites || []).filter(function (s) { return s.iso === o.seat.iso; }).length;
    G.html.push({ ll: seat, alt: .05, el: mark(f.name, 'seat', o.seat.city + (home >= 3 ? ' · ' + home + ' sites in ' + cshort(o.seat.iso) : ''), 2e9) });
    /* sites, tethered to the seat */
    (o.sites || []).forEach(function (s, k) {
      var ll = llOf(s); if (!ll) return;
      var role = OWN.roles[s.role] || OWN.roles.site, lab = '<b>' + U.esc(f.name) + ' · ' + U.esc(s.city) + '</b><div class="st">' + U.esc(role[0]) + ' · ' + U.esc(cname(s.iso)) + (s.note ? '<br>' + U.esc(s.note) : '') + '</div>';
      G.arcs.push({ s: seat, e: ll, color: ['rgba(228,235,241,.42)', 'rgba(228,235,241,.42)'], stroke: .26, dl: 1, dg: 0, ig: 0, time: 0, label: lab });
      G.points.push({ ll: ll, alt: .014, rad: .16, color: WHITE, label: lab });
      G.html.push({ ll: ll, alt: .02, el: mark(s.city, 'site r-' + s.role, role[0], 8e8 - k * 1e5) });
    });
    /* owners, where they sit; a founder sits on the seat and gets no line */
    var under = 0;
    (o.holders || []).forEach(function (h) {
      var col = h.disputed ? RED : PURPLE, lab = '<b>' + U.esc(h.name) + '</b><div class="v" style="color:' + col + '">' + U.esc(h.txt) + '</div><div class="st">' + U.esc(cname(h.iso)) + ' · ' + U.esc(h.date) + '</div>';
      var far = Math.abs(h.ll[0] - seat[0]) + Math.abs(h.ll[1] - seat[1]) > 3;   /* same region as the seat: listed under it, not drawn on top of it */
      if (far) {
        G.arcs.push({ s: h.ll, e: seat, color: [U.rgba(col, .9), U.rgba(col, .9)], stroke: .22 + Math.min(.8, h.pct / 50), dl: h.disputed ? .012 : .028, dg: h.disputed ? .03 : .014, ig: 0, time: 0, label: lab });
        G.points.push({ ll: h.ll, alt: .02, rad: .2 + Math.min(.22, h.pct / 90), color: col, label: lab });
      }
      var el = mark(h.name.replace(/, founder$/, ''), 'holder' + (h.disputed ? ' disputed' : '') + (h.person ? ' person' : ''), h.short || h.txt, 1.5e9 + h.pct * 1e5);
      if (!far) el.style.marginTop = (2 + 21 * ++under) + 'px';       /* an owner who sits at the seat (a founder) is listed under the seat's name */
      G.html.push({ ll: far ? h.ll : seat, alt: far ? .03 : .05, el: el });
    });
  });

  /* ---------- camera: frame the footprint when it opens ----------
     The seat always stays well inside the picture. The view centres on the seat and the main body of the sites; a site on the far side
     of the globe does not drag the view away (its line still leaves the seat in that direction). Owners widen the view only if they are near.
     With a country, the same function frames that country's sites alone. */
  var RAD = Math.PI / 180;
  function vec(ll) { var la = ll[0] * RAD, lo = ll[1] * RAD; return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)]; }
  function unit(v) { var n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; }
  function ang(a, b) { return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))); }
  function mean(seat, w, list) { var m = [seat[0] * w, seat[1] * w, seat[2] * w]; list.forEach(function (v) { m[0] += v[0]; m[1] += v[1]; m[2] += v[2]; }); return Math.hypot(m[0], m[1], m[2]) < .15 * (w + list.length) ? seat : unit(m); }
  function clamp(lo, hi, x) { return Math.max(lo, Math.min(hi, x)); }
  function centre(o, iso) {
    var seat = vec(o.seat.ll), sites = [], CAP = 62 * RAD, LIM = 42 * RAD, c, keep, far = 0;
    (o.sites || []).forEach(function (s) { var ll = llOf(s); if (ll && (!iso || s.iso === iso)) sites.push(vec(ll)); });
    if (iso) {
      if (!sites.length) return null;
      c = mean(sites[0], 1, sites.slice(1)); sites.forEach(function (v) { far = Math.max(far, ang(c, v)); });
      return { lat: Math.asin(c[2]) / RAD, lng: Math.atan2(c[1], c[0]) / RAD, altitude: clamp(1.05, 1.7, 1.05 + far * 3) };   /* turn to the place rather than dive into it: the globe has no detail below this height */
    }
    c = mean(seat, 2, sites); keep = sites;
    for (var i = 0; i < 2; i++) { keep = sites.filter(function (v) { return ang(c, v) <= CAP; }); c = mean(seat, 2, keep); }
    var near = (o.holders || []).map(function (h) { return vec(h.ll); }).filter(function (v) { return ang(c, v) <= CAP; });
    c = mean(seat, 2, keep.concat(near.map(function (v) { return [v[0] * .5, v[1] * .5, v[2] * .5]; })));   /* near owners count for half a site */
    var ds = ang(c, seat);
    if (ds > LIM) { var t = LIM / ds, sn = Math.sin(ds), a = Math.sin((1 - t) * ds) / sn, b = Math.sin(t * ds) / sn; c = unit([seat[0] * a + c[0] * b, seat[1] * a + c[1] * b, seat[2] * a + c[2] * b]); }
    [seat].concat(keep, near).forEach(function (v) { far = Math.max(far, ang(c, v)); });
    return { lat: Math.asin(c[2]) / RAD, lng: Math.atan2(c[1], c[0]) / RAD, altitude: clamp(1.45, 2.7, 1.15 + far * 1.7) };
  }
  function frameIt() {
    var f = X.sel.firm, g = X.globe; if (!has(f) || !g || X.view !== 'map') return;
    try { g.controls().autoRotate = false; g.pointOfView(centre(OWN.firms[f.name]), X.reduce ? 0 : 1300); } catch (e) { /* ignore */ }
  }
  X.on('select', frameIt);
  /* zooming in on a footprint heads for its seat, so a cluster of sites opens up; the reset button frames the whole footprint again */
  X.zoomAim(function (kind, p) {
    var f = X.sel.firm; if (!has(f)) return null;
    var o = OWN.firms[f.name];
    if (kind === 'reset') return centre(o);
    if (kind !== 'in') return null;
    var dl = ((o.seat.ll[1] - p.lng + 540) % 360) - 180;
    return { lat: p.lat + (o.seat.ll[0] - p.lat) * .6, lng: p.lng + dl * .6 };
  });
  /* stepping on leaves the footprint and brings the step back */
  X.on('step', function () { if (has(X.sel.firm) && !applying) X.select(X.sel.iso); });
  var applying = false, ad0 = X.applyDetail;
  if (ad0) X.applyDetail = function (h) { applying = true; try { ad0(h); } finally { applying = false; } };

  /* ---------- the floating card: the firm's dossier in place of the step, until the reader steps on ---------- */
  /* each country is a button: it turns the globe to this firm's sites there */
  function countries(o) {
    var n = {}, order = []; (o.sites || []).forEach(function (s) { if (!n[s.iso]) { n[s.iso] = 0; order.push(s.iso); } n[s.iso]++; });
    return order.map(function (iso) { return '<button type="button" class="ownc" data-own="go" data-iso="' + iso + '" title="Turn the globe to these sites">' + U.esc(cname(iso)) + (n[iso] > 1 ? ' (' + n[iso] + ')' : '') + '</button>'; });
  }
  X.on('narr', function () {
    var f = X.sel.firm, tx = X.$('t-x'); if (!tx) return;
    X.root.classList.toggle('own-on', has(f));
    if (!has(f)) return;
    var o = OWN.firms[f.name], top = (o.holders || []).slice().sort(function (a, b) { return b.pct - a.pct; })[0];
    X.$('t-k').innerHTML = '<span class="ki" style="color:' + PURPLE + '">' + U.svgIc('all', 15) + '</span><span>Firm · ' + U.esc(o.seat.city.replace(/,.*$/, '')) + ', ' + U.esc(cshort(o.seat.iso)) + '</span><span class="ks">' + U.esc(CSHORT[o.control] || '') + '</span>';
    X.$('t-h').textContent = o.legal;
    X.$('t-p').textContent = o.summary;
    var tv = X.$('t-v'); if (tv._r) cancelAnimationFrame(tv._r);   /* the step's figure may still be counting up */
    tv.textContent = o.fig || (top ? (top.pct >= 10 ? Math.round(top.pct * 10) / 10 : top.pct) + '%' + (top.star ? '*' : '') : '–');
    X.$('t-c').textContent = o.figcap || (top ? (top.votes ? 'of the votes: ' : 'largest holder: ') + top.name.replace(/, founder$/, '') + ' (' + cname(top.iso) + '), ' + top.date : 'owners not yet mapped');
    var cs = countries(o);
    tx.innerHTML = '<div class="ownrow"><span>Operates in</span><b>' + (cs.length ? cs.join(' · ') : 'not yet mapped') + '</b></div>'
      + '<div class="ownacts"><button type="button" class="godeep" data-own="more">Owners, sites and sources <span aria-hidden="true">↓</span></button><button type="button" class="godeep" data-own="back">← Back to the step</button></div>';
    var ess = X.$('t-essay'); if (ess) ess.hidden = true;
    var chip = X.$('vchip'); if (chip && !chip.hidden) { var cb = chip.querySelector('b'), ck = chip.querySelector('.vk'), cx = chip.querySelector('button'); if (cb) cb.textContent = f.name; if (ck) ck.textContent = 'Footprint'; if (cx) cx.innerHTML = '← Back<span class="vl"> to the step</span>'; }
    var more = X.$('t-more'); if (more) more.hidden = true;
  });
  X.on('narr', function () { var more = X.$('t-more'); if (more && !has(X.sel.firm)) more.hidden = false; });
  X.root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-own]'); if (!b) return;
    if (b.dataset.own === 'back') X.select(null);
    else if (b.dataset.own === 'more') { var c = X.$('card'); if (c) U.crisp(c, 12); }
    else if (b.dataset.own === 'go') {
      var f = X.sel.firm, g = X.globe, pv = has(f) && centre(OWN.firms[f.name], b.dataset.iso);
      if (pv && g) { try { g.controls().autoRotate = false; g.pointOfView(pv, X.reduce ? 0 : 1100); } catch (err) { /* ignore */ } }
    }
    else if (b.dataset.own === 'firm') { var t = X.data.FIRMS.filter(function (x) { return x.name === b.dataset.name; })[0]; if (t) X.select(t.iso, t); }
  });
  function roleRows(o) { var seen = [], h = ''; (o.sites || []).forEach(function (s) { if (seen.indexOf(s.role) < 0) { seen.push(s.role); h += '<div class="lr"><i class="ownk site r-' + s.role + '"></i><span>' + U.esc((OWN.roles[s.role] || OWN.roles.site)[0]) + '</span></div>'; } }); return h; }
  /* the legend on the map explains the marks while a footprint is shown */
  X.on('narr', function () {
    var L = X.$('leg6'); if (!L || !has(X.sel.firm)) return;
    L.innerHTML = '<div class="mh">Footprint</div>'
      + '<div class="lr"><i class="ownk seat"></i><span>Seat</span></div>'
      + roleRows(OWN.firms[X.sel.firm.name])
      + '<div class="lr"><i class="ownk holder"></i><span>Owner (line width = share)</span></div>'
      + ((OWN.firms[X.sel.firm.name].holders || []).some(function (h) { return h.disputed; }) ? '<div class="lr"><i class="ownk disputed"></i><span>Control disputed</span></div>' : '')
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
