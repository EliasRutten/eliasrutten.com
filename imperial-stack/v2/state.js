/* The Imperial Stack v2 · state.js
   A codec, not a store. It writes the state inside a tab into the link (#circuit/07/firm=besi) by reading the page's own
   state, and restores a link by calling the page's own setters. The share button uses the same link. */
(function () {
  'use strict';
  var X = window.ISX; if (!X) return;
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
  X.slug = slug;
  X.firmBySlug = function (k) { var F = X.data.FIRMS; for (var i = 0; i < F.length; i++) if (slug(F[i].name) === k) return F[i]; return null; };

  /* the part of the link after the tab name */
  X.hashDetail = function () {
    if (X.view !== 'map') return '';                       /* the other tabs add theirs in later stages */
    var d = '', sel = X.sel;
    if (X.ring) return '/ring';                            /* B1: the Circuit's closing ring */
    if (X.step > 0 || sel.iso) d += '/' + String(X.step).padStart(2, '0');
    if (sel.firm) d += '/firm=' + slug(sel.firm.name);
    else if (sel.iso) d += '/c=' + sel.iso.toLowerCase();
    return d;
  };
  X.applyDetail = function (hash) {
    if (X.view !== 'map') return;
    var parts = String(hash || '').replace(/^#\/?/, '').split('/').slice(1), st = null, firm = null, iso = null;
    if (parts[0] === 'ring') { if (!X.ring) X.setRing(true); return; }
    if (X.ring && parts.length) X.setRing(false);
    parts.forEach(function (p) {
      if (/^\d{1,2}$/.test(p)) st = +p;
      else if (p.indexOf('firm=') === 0) firm = X.firmBySlug(p.slice(5));
      else if (p.indexOf('c=') === 0) iso = p.slice(2).toUpperCase();
    });
    if (st != null && st >= 0 && st < X.steps.length && st !== X.step) { X.stopPlay(); X.setStep(st); }
    var sel = X.sel;
    if (firm) { if (!sel.firm || sel.firm.name !== firm.name) X.select(firm.iso, firm); }
    else if (iso && X.data.CTY[iso]) { if (sel.iso !== iso || sel.firm) X.select(iso); }
    else if (sel.iso && parts.length) X.select(null);
  };
  /* what the share sheet calls the view */
  X.viewName = function () {
    if (X.view !== 'map') return '';
    var s = X.steps[X.step], sel = X.sel, bits = [];
    if (X.ring) return 'the ring';
    if (X.step > 0) bits.push('step ' + s.n + ', ' + s.t.toLowerCase());
    if (sel.firm) bits.push(sel.firm.name); else if (sel.iso && X.data.CTY[sel.iso]) bits.push(X.data.CTY[sel.iso].name);
    return bits.join(' · ');
  };
  /* a link that arrived with a state inside the tab: restore it once the page has booted */
  var h0 = window.__isxHash0 || '';
  X.deep = !!(h0 && h0 !== '#');
  if (/^#\/?[^/]+\/./.test(h0)) { try { X.applyDetail(h0); } catch (e) { /* a bad link opens the tab as it is */ } }
})();
