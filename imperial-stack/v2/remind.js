/* The Imperial Stack v2 · remind.js (guide build, 16 Nov 2026)
   “Set a reminder”: a hint, not a feature. One small panel, opened from the entry's foot and from the guide's closing card
   (any [data-remind]). The visitor picks a time; the panel offers a plain link to Google Calendar and, on the site only, an
   .ics file (the artifact blocks downloads: window.ISX_ART is set by tools/artifact-build.py). Nothing is stored and nothing
   is sent: the event is made in the visitor's own calendar. The link in the event always uses the site's address.
   The guide keeps its place only while the tab stays open (isx-sim-pos is session storage), so the event says where the
   visitor stopped, in words, and that the level is remembered (isx-way). */
(function () {
  'use strict';
  var X = window.ISX, root = document.getElementById('isx-root'); if (!X || !root) return;
  var U = X.util, SITE = 'https://eliasrutten.com/imperial-stack/#simulator';
  var LV = { ground: ['Foundations', 'the basics, then the guide', 'ground'], guide: ['Fluent', 'first principles, then the guide', 'guide'], map: ['Expert', 'the full map', null] };
  var box = null, opener = null, when = null, CX = null;   /* CX: what an entry screen asks the reminder to say (patch of 18 Nov; ISX.remindCtx) */
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var local = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var stamp = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; };
  var utc = function (d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z'; };
  function level() { var k = U.stGet('isx-way'); return LV[k] || LV.guide; }
  function minutes() { if (CX && CX.mins) return CX.mins; var l = level(), m = l[2] && X.mins ? X.mins[l[2]] : 45; return Math.max(15, Math.ceil(m / 15) * 15); }
  /* where the visitor stands, in words: the event cannot hold the place, so it names it */
  function place() {
    var S = X.sim, L = S && S.lines && S.lines[S.line]; if (!L || S.mode !== 'story' || S.beat < 0) return '';
    if (S.beat >= L.steps.length) return L.main ? 'You finished the guide.' : '';
    var st = L.steps[S.beat];
    return 'You stopped at ' + (L.gnd ? 'the basics, screen ' : L.pre ? 'first principles, reveal ' : L.main ? 'step ' : '“' + L.t + '”, step ') + (S.beat + 1) + ' of ' + L.steps.length + ': “' + st.t + '”.';
  }
  function chips() {
    var now = new Date(), at = function (add, h) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, h, 0, 0); return d; };
    var late = now.getHours() >= 20, sat = (6 - now.getDay() + 7) % 7 || 7;
    return [[late ? 'Tomorrow evening' : 'This evening', at(late ? 1 : 0, 20)], [late ? 'The evening after' : 'Tomorrow evening', at(late ? 2 : 1, 20)], ['Saturday morning', at(sat, 10)]];
  }
  function details() {
    if (CX && CX.details) return CX.details;
    var l = level(), p = place();
    return 'The Imperial Stack, the Scott Bessent Simulator. Level: ' + l[0] + ' (' + l[1] + ').' + (p ? ' ' + p : '') + ' ' + SITE + ' Your level is remembered in the same browser, and the bar at the foot of the map jumps to any chapter.';
  }
  function links() {
    var end = new Date(when.getTime() + minutes() * 60000), title = CX && CX.title ? CX.title : 'The Imperial Stack: ' + level()[0], tz = '', SITE1 = CX && CX.url ? CX.url : SITE;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* no zone: the calendar uses its own */ }
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + stamp(when) + '/' + stamp(end) + (tz ? '&ctz=' + encodeURIComponent(tz) : '') + '&details=' + encodeURIComponent(details());
    var esc = function (t) { return String(t).replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n'); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Elias Rutten//The Imperial Stack//EN', 'BEGIN:VEVENT', 'UID:isx-' + utc(when) + '@eliasrutten.com', 'DTSTAMP:' + utc(new Date()), 'DTSTART:' + utc(when), 'DTEND:' + utc(end),
      'SUMMARY:' + esc(title), 'DESCRIPTION:' + esc(details()), 'URL:' + SITE1, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return { g: g, ics: ics };
  }
  function paint() {
    var l = level(), d = when, fmt = '';
    try { fmt = d.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { fmt = local(d).replace('T', ' '); }
    box.querySelector('.rm-sum').textContent = (CX && CX.name ? CX.name : l[0]) + ' · ' + fmt + ' · ' + minutes() + ' minutes';
    box.querySelector('input').value = local(d);
    var L = links(); box.querySelector('.rm-g').href = L.g;
    var f = box.querySelector('.rm-f'); if (f) { try { if (f._u) URL.revokeObjectURL(f._u); f._u = URL.createObjectURL(new Blob([L.ics], { type: 'text/calendar' })); f.href = f._u; } catch (e) { f.hidden = true; } }
    box.querySelectorAll('.rm-chip').forEach(function (c) { c.setAttribute('aria-pressed', String(+c.dataset.t === d.getTime())); });
  }
  function build() {
    box = document.createElement('div');
    box.className = 'rm'; box.id = 'isx-remind'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-labelledby', 'isx-rm-h');
    box.innerHTML = '<button type="button" class="rm-x" data-rmx aria-label="Close">×</button><h3 id="isx-rm-h">Set a reminder</h3><p>Pick a time to come back. The event is made in your own calendar; this page stores nothing.</p>'
      + '<div class="rm-chips" role="group" aria-label="When"></div><label>Or<input type="datetime-local" aria-label="Another day and time"></label><p class="rm-sum" aria-live="polite"></p>'
      + '<div class="rm-acts"><a class="rm-go gold rm-g" target="_blank" rel="noopener">Google Calendar</a>' + (window.ISX_ART ? '' : '<a class="rm-go rm-f" download="imperial-stack-reminder.ics">Calendar file (.ics)</a>') + '</div>'
      + '<p class="rm-note">The guide keeps your place while this tab stays open; the event says where you stopped.</p>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.rmx != null) { close(); return; }
      if (b.dataset.t) { when = new Date(+b.dataset.t); paint(); }
    });
    box.querySelector('input').addEventListener('change', function (e) { var d = new Date(e.target.value); if (!isNaN(d) && d.getTime() > Date.now()) { when = d; paint(); } });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  }
  function open(from) {
    CX = X.remindCtx && from && from.dataset && from.dataset.remind ? X.remindCtx(from.dataset.remind) : null;
    var host = (CX && CX.host) || X.$('cock') || root; if (!box) build();
    box.querySelector('.rm-note').textContent = CX && CX.note ? CX.note : 'The guide keeps your place while this tab stays open; the event says where you stopped.';
    if (box.parentNode !== host) host.appendChild(box);
    opener = from || null;
    var C = chips(); when = C[0][1];
    box.querySelector('.rm-chips').innerHTML = C.map(function (c) { return '<button type="button" class="rm-chip" data-t="' + c[1].getTime() + '" aria-pressed="false">' + c[0] + ' · ' + pad(c[1].getHours()) + ':00</button>'; }).join('');
    box.hidden = false; paint();
    root.querySelectorAll('[data-remind]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var f = box.querySelector('.rm-chip'); if (f) f.focus({ preventScroll: true });
  }
  function close() {
    if (!box || box.hidden) return; box.hidden = true;
    root.querySelectorAll('[data-remind]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (opener && opener.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true }); opener = null;
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-remind]');
    if (b) { e.preventDefault(); if (box && !box.hidden) close(); else open(b); return; }
    if (box && !box.hidden && !box.contains(e.target)) close();
  });
  ['step', 'view', 'fin'].forEach(function (ev) { X.on(ev, function () { if (box && !box.hidden) close(); }); });
  X.remind = { open: open, close: close, get on() { return !!box && !box.hidden; }, get link() { return box && !box.hidden ? box.querySelector('.rm-g').href : null; } };
})();
