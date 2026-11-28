/* The Imperial Stack v2 · analytics.js (round ANA1, 28 Nov 2026)
   The page's one door to the visit counter (Umami Cloud, loaded by a deferred script tag in the head; no cookies).
   What it does: sends the named events of claude/handoffs/analytics-ana1-28-nov.md §4. ANA1 sends only `tab`, once per tab per visit.
   What it never does: send anything that is not on the lists below. An event name or a property that is not listed is dropped, and a value
   must be a short lowercase token (a tab's name, a step number, a skin), so no address, name, text or identifier of a person can pass.
   If the counter's script is blocked (an ad blocker, a privacy setting, the artifact sandbox, the offline copy), window.umami does not exist:
   every call is then a no-op, and one retry at load covers a script that arrives late. The page never waits for it and never breaks on it.
   Later rounds add their events to EVENTS (story_*, explore_start, ask_*, skin_change, sound_on) and call ISX.ana.send(name, props). */
(function () {
  'use strict';
  var X = window.ISX; if (!X || typeof X.on !== 'function') return;

  /* the lists: event name → property → the values it may have (an array), or a pattern for open values such as a step number */
  var TABS = ['circuit', 'simulator', 'profit', 'imperial-arm', 'elite-network'];
  var EVENTS = {
    tab: { name: TABS }
  };
  /* ISX.view → the tab's address name, the same words the page writes in its links (#circuit, #profit …) */
  var SLUG = { map: 'circuit', fin: 'simulator', profit: 'profit', story: 'imperial-arm', arm: 'elite-network' };

  var once = {}, log = [], waiting = [];

  function clean(name, props) {
    var spec = EVENTS[name]; if (!spec) return null;
    var out = {}, k;
    props = props || {};
    for (k in props) {
      if (!Object.prototype.hasOwnProperty.call(props, k)) continue;
      var rule = spec[k], v = props[k];
      if (!rule) return null;                                                   /* a property that is not listed: drop the whole event */
      if (rule instanceof RegExp ? !(typeof v === 'string' && rule.test(v)) : rule.indexOf(v) < 0) return null;
      out[k] = v;
    }
    for (k in spec) if (Object.prototype.hasOwnProperty.call(spec, k) && !Object.prototype.hasOwnProperty.call(out, k)) return null;   /* every listed property is required */
    return out;
  }
  function deliver(name, data) {
    var u = window.umami;
    if (!u || typeof u.track !== 'function') return false;
    try { u.track(name, data); } catch (e) { /* a counter that throws must never reach the page */ }
    return true;
  }
  /* send(name, props, key): once per visit for each `key` (default: the name and its properties) */
  function send(name, props, key) {
    var data = clean(name, props); if (!data) return false;
    var id = key || name + ':' + JSON.stringify(data);
    if (once[id]) return false;
    once[id] = 1; log.push({ name: name, data: data });
    if (!deliver(name, data)) waiting.push([name, data]);
    return true;
  }
  window.addEventListener('load', function () {                               /* a script that was slow, not blocked */
    var w = waiting; waiting = [];
    w.forEach(function (e) { deliver(e[0], e[1]); });
  });

  function tab(v) { var n = SLUG[v]; if (n) send('tab', { name: n }); }
  X.on('view', tab);
  tab(X.view);                                                                /* the tab the visit opened on */

  X.ana = { send: send, get log() { return log.slice(); }, events: Object.keys(EVENTS) };
})();
