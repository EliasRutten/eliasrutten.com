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
    /* B4: the Arm holds its relation and selection, the Revenue map its sector */
    if (X.view === 'arm') {
      if (X.armMode === 'rev') return X.revSec && X.revSec !== 'all' ? '/sec=' + X.revSec : '';
      return (X.armRel && X.armRel !== 'all' ? '/rel=' + X.armRel : '') + (X.armSel ? '/node=' + X.armSel.toLowerCase() : '') + (X.armLay === 'reach' && X.armView === 'orbit' ? '/v=orbit' : '');   /* round 6: the phone drawing, only when it is Orbit */
    }
    if (X.view !== 'map') return '';                       /* the other tabs add theirs in later stages */
    var d = '', sel = X.sel;
    if (X.ring) return '/ring';                            /* B1: the Circuit's closing ring */
    if (X.step > 0 || sel.iso) d += '/' + String(X.step).padStart(2, '0');
    if (sel.firm) d += '/firm=' + slug(sel.firm.name);
    else if (sel.iso) d += '/c=' + sel.iso.toLowerCase();
    return d;
  };
  X.applyDetail = function (hash) {
    if (X.view === 'arm') {
      String(hash || '').replace(/^#\/?/, '').split('/').slice(1).forEach(function (p) {
        if (p.indexOf('rel=') === 0 || p.indexOf('sec=') === 0) X.setArmRel(p.slice(4));
        else if (p.indexOf('node=') === 0) X.setArmSel(p.slice(5).toUpperCase());
        else if (p.indexOf('v=') === 0 && X.setArmView) X.setArmView(p.slice(2));
      });
      return;
    }
    /* round 6: #scenarios/<id> opens a case's gallery card (the Arm's doors; whereNow writes the same slug), /NN a step, /close its close */
    if (X.view === 'story' && X.openCase) {
      var sp = String(hash || '').replace(/^#\/?/, '').split('/');
      if (sp[1]) X.openCase(sp[1].toLowerCase(), sp[2] === 'close' ? 'close' : /^\d{1,2}$/.test(sp[2] || '') ? +sp[2] - 1 : null);
      return;
    }
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
