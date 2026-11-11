/* The Imperial Stack v2 · perf.js
   Loaded before the page script. Two jobs:
   1. a device tier (high, mid, low) that sets how much is drawn: particle and stream counts, pixel ratio, glow;
   2. one registry for every continuous animation loop, so each can be paused when its stage is off-screen,
      the browser tab is hidden, another tab of the interactive is open, or reduced motion is on.
   Nothing here touches the page; the page script asks ISXP.k for its budget and registers its loops. */
(function () {
  'use strict';
  var nav = navigator, doc = document;
  var mq = function (q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } };
  var K = {
    high: { dpr: 2,   streams: 1,   sim: 1,   arm: 1,   rings: 2, glow: true  },
    mid:  { dpr: 1.5, streams: .67, sim: .67, arm: .75, rings: 2, glow: true  },
    low:  { dpr: 1,   streams: .34, sim: .34, arm: .5,  rings: 1, glow: false }   /* rings 1: hubs only */
  };
  function guess() {
    var cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory || 4;
    var coarse = mq('(pointer: coarse)').matches, small = Math.min(window.innerWidth, window.innerHeight) < 500;
    var save = !!(nav.connection && nav.connection.saveData);
    if (save || cores <= 2 || mem <= 2) return 'low';
    if (cores <= 4 || mem <= 4 || (coarse && small)) return 'mid';
    return 'high';
  }
  var forced = null;
  try { forced = (location.search.match(/[?&]tier=(high|mid|low)\b/) || [])[1] || null; } catch (e) { /* ignore */ }
  var tier = forced || guess(), subs = [], loops = [], seen = new Map(), io = null;
  var rm = mq('(prefers-reduced-motion: reduce)');

  function apply() {
    var r = doc.getElementById('isx-root'); if (!r) return;
    r.setAttribute('data-tier', tier);
    r.classList.toggle('rm', !!rm.matches);
  }
  function setTier(t, why) {
    if (!K[t] || t === tier) return;
    tier = t; api.tier = t; api.k = K[t]; apply();
    subs.forEach(function (f) { try { f(t, why); } catch (e) { /* a listener must not break the page */ } });
  }

  /* ---- loops ---- */
  function visible(l) { var el = typeof l.el === 'function' ? l.el() : l.el; if (!el) return true; return seen.has(el) ? seen.get(el) : true; }
  function sync() {
    loops.forEach(function (l) {
      var on = !doc.hidden && !(rm.matches && !l.still) && (!l.want || l.want()) && visible(l);
      try { if (on) l.start(); else l.stop(); } catch (e) { /* ignore */ }
    });
  }
  function loop(l) {
    loops.push(l);
    var el = typeof l.el === 'function' ? l.el() : l.el;
    if (el && 'IntersectionObserver' in window) {
      if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (e) { seen.set(e.target, e.isIntersecting); }); sync(); }, { threshold: 0.02 });
      io.observe(el);
    }
    return l;
  }
  doc.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  var onRm = function () { apply(); subs.forEach(function (f) { try { f(tier, 'motion'); } catch (e) { /* ignore */ } }); sync(); };
  if (rm.addEventListener) rm.addEventListener('change', onRm); else if (rm.addListener) rm.addListener(onRm);

  /* ---- watchdog: if frames stay slow while the page is in view, step down one tier (at most twice) ---- */
  var drops = 0, watching = false;
  function watch() {
    if (watching || forced || drops >= 2 || tier === 'low' || rm.matches) return;
    watching = true;
    var n = 0, slow = 0, last = 0;
    function f(ts) {
      if (doc.hidden) { watching = false; return; }
      if (last) { var d = ts - last; if (d < 250) { n++; if (d > 34) slow++; } }
      last = ts;
      if (n < 120) { requestAnimationFrame(f); return; }
      watching = false;
      if (slow / n > .4) { drops++; setTier(tier === 'high' ? 'mid' : 'low', 'slow'); setTimeout(watch, 4000); }
    }
    requestAnimationFrame(f);
  }

  var api = window.ISXP = {
    tier: tier, k: K[tier], forced: !!forced,
    reduced: function () { return !!rm.matches; },
    on: function (f) { subs.push(f); },
    set: setTier, loop: loop, sync: sync, watch: watch, apply: apply,
    loops: function () { return loops.map(function (l) { return l.name; }); }
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', apply); else apply();
})();
