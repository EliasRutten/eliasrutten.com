/* eliasrutten.com: small enhancements. All content is in the HTML; this file only adds behaviour. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* toast */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, 1900);
  }
  function copy(text, label) {
    var done = function () { toast(label + " copied"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    else { fallback(text); done(); }
  }
  function fallback(text) {
    var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(t);
  }

  /* nav: shadow on scroll, mobile menu */
  var nav = $(".nav"), links = $("#links"), menuBtn = $("#menu-btn");
  window.addEventListener("scroll", function () { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }, { passive: true });
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });
  }

  /* showcase slider */
  var car = $("#carousel");
  if (car) {
    var slides = $$(".slide", car), segs = $$(".seg", car), counter = $("#counter"), pauseBtn = $("#pause");
    var n = slides.length, idx = 0, userPaused = reduce, hovering = false, focused = false, inView = true;
    var pad = function (k) { return (k < 10 ? "0" : "") + k; };
    function show(k) {
      idx = (k + n) % n;
      slides.forEach(function (s, i) {
        var on = i === idx; s.classList.toggle("on", on); s.setAttribute("aria-hidden", on ? "false" : "true");
        $$("a, button", s).forEach(function (a) { if (on) a.removeAttribute("tabindex"); else a.setAttribute("tabindex", "-1"); });
      });
      segs.forEach(function (s, i) {
        s.classList.remove("on"); s.classList.toggle("done", i < idx); s.setAttribute("aria-current", i === idx ? "true" : "false");
        if (i === idx) { void s.offsetWidth; s.classList.add("on"); }
      });
      if (counter) counter.textContent = pad(idx + 1) + " / " + pad(n);
    }
    function sync() {
      car.classList.toggle("paused", userPaused || hovering || focused || document.hidden || !inView);
      if (!pauseBtn) return;
      pauseBtn.setAttribute("aria-label", userPaused ? "Play slideshow" : "Pause slideshow");
      pauseBtn.innerHTML = userPaused
        ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></svg>';
    }
    car.addEventListener("animationend", function (e) { if (e.target.classList.contains("fill")) show(idx + 1); });
    car.addEventListener("click", function (e) { var s = e.target.closest(".seg"); if (s) show(+s.getAttribute("data-i")); });
    $("#prev").addEventListener("click", function () { show(idx - 1); });
    $("#next").addEventListener("click", function () { show(idx + 1); });
    pauseBtn.addEventListener("click", function () { userPaused = !userPaused; sync(); });
    var stage = $(".stage", car);
    stage.addEventListener("mouseenter", function () { hovering = true; sync(); });
    stage.addEventListener("mouseleave", function () { hovering = false; sync(); });
    car.addEventListener("focusin", function () { focused = true; sync(); });
    car.addEventListener("focusout", function () { focused = false; sync(); });
    document.addEventListener("visibilitychange", sync);
    car.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    var sx = null, sy = null;
    stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: .2 }).observe(car);
    }
    show(0); sync();
  }

  /* portrait drifts a little while scrolling */
  var pImg = $(".portrait img");
  if (pImg && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        pImg.style.setProperty("--py", (y * .12).toFixed(1) + "px");
        ticking = false;
      });
    }, { passive: true });
  }

  /* reveal on scroll */
  var rv = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* active section in nav */
  var navLinks = $$("#links a[href^='#']");
  if ("IntersectionObserver" in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { var t = $(a.getAttribute("href")); if (t) map[t.id] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target.classList.contains("hero")) { if (e.isIntersecting) navLinks.forEach(function (x) { x.removeAttribute("aria-current"); }); return; }
        var a = map[e.target.id]; if (!a) return;
        if (e.isIntersecting) { navLinks.forEach(function (x) { x.removeAttribute("aria-current"); }); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { so.observe(document.getElementById(id)); });
    var hero = $(".hero"); if (hero) so.observe(hero);
  }

  /* protected email: the address is never in the page source; it is assembled only when someone asks for it */
  var emailBox = $("#email-box");
  if (emailBox) {
    var parts = ["moc", "nettursaile", "saile"]; // reversed pieces
    var rev = function (s) { return s.split("").reverse().join(""); };
    var addr = function () { return rev(parts[2]) + String.fromCharCode(64) + rev(parts[1]) + "." + rev(parts[0]); };
    $("#email-show").addEventListener("click", function () {
      var a = addr();
      var link = document.createElement("a");
      link.className = "v"; link.href = "mailto:" + a; link.textContent = a;
      emailBox.innerHTML = ""; emailBox.appendChild(link);
      var acts = $("#email-acts");
      acts.innerHTML = "";
      var c = document.createElement("button"); c.type = "button"; c.className = "btn btn-ghost btn-sm"; c.textContent = "Copy";
      c.addEventListener("click", function () { copy(a, "Email address"); });
      var w = document.createElement("a"); w.className = "btn btn-primary btn-sm"; w.href = "mailto:" + a; w.textContent = "Write";
      acts.appendChild(c); acts.appendChild(w);
      link.focus();
    });
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () { copy(b.getAttribute("data-copy"), b.getAttribute("data-label") || "Text"); });
  });

  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
