/* A stand-in for Umami Cloud's script (https://cloud.umami.is/script.js), for the checks only (round ANA1, 28 Nov 2026).
   The sandbox cannot reach Umami, and a check must not send real visits to the live dashboard. tools/smoke-check.js and tools/ana1-check.js
   answer the script's address from this file. It offers what the page uses, window.umami.track(name, data), keeps every call in
   window.__umamiCalls and posts it the way the real tracker does, to /api/send on the script's own host, where the check answers 200.
   It sends no pageview and reads nothing about the visitor: the check looks at exactly what the page hands to track(). */
(function () {
  var s = document.currentScript, host = s ? new URL(s.src).origin : 'https://cloud.umami.is', id = s ? s.getAttribute('data-website-id') : '';
  window.__umamiCalls = [];
  window.umami = {
    track: function (name, data) {
      window.__umamiCalls.push({ name: name, data: data });
      try { fetch(host + '/api/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'event', payload: { website: id, name: name, data: data } }), keepalive: true }).catch(function () {}); } catch (e) {}
    }
  };
})();
