/*
 * Headline reveal for Craft Radar.
 * The words fade in and rise a little, one after another, then a hand-drawn line is drawn under the emphasised phrase.
 * Plays once, when the headline is visible. Reduced motion leaves the headline as plain text.
 * The underline path follows the approach of "Bouncing Text Entrance", Copyright (c) 2026 PROJECT Y/O,
 * Effect Atlas License 1.0 (effectatlas.com/license). Keep this notice when you copy or adapt the code.
 */
(function () {
  "use strict";
  var h = document.getElementById("h1");
  if (!h) return;
  var original = h.textContent.replace(/\s+/g, " ").trim();
  h.setAttribute("aria-label", original);
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    h.classList.remove("rv-pending");
    return;
  }

  var STEP = 70, EMPHASIS = "picked by hand", TRIGGER = 0.85;
  var words = [], svg = null, paths = [], started = false, played = false, ink = 0;

  function build() {
    var offset = 0;
    h.textContent = "";
    original.split(" ").forEach(function (word, i, all) {
      var w = document.createElement("span");
      w.className = "rv-w";
      w.setAttribute("aria-hidden", "true");
      w.style.transitionDelay = i * STEP + "ms";
      w.textContent = word;
      h.appendChild(w);
      words.push({ el: w, start: offset, end: offset + word.length });
      offset += word.length + 1;
      if (i < all.length - 1) h.appendChild(document.createTextNode(" "));
    });
    h.classList.add("rv");
    h.classList.remove("rv-pending");
    ink = words.length * STEP + 350;
  }

  function underline() {
    if (svg) svg.remove();
    paths = [];
    var at = original.indexOf(EMPHASIS);
    if (at < 0) return;
    var end = at + EMPHASIS.length, box = h.getBoundingClientRect(), lines = [];
    words.forEach(function (w) {
      var s = Math.max(at, w.start), e = Math.min(end, w.end);
      if (s >= e) return;
      var r = document.createRange(), t = w.el.firstChild;
      r.setStart(t, s - w.start);
      r.setEnd(t, e - w.start);
      var b = r.getBoundingClientRect();
      var line = lines.length && Math.abs(lines[lines.length - 1].top - b.top) < 6 ? lines[lines.length - 1] : null;
      if (line) { line.x2 = b.right; }
      else lines.push({ top: b.top, x1: b.left, x2: b.right, h: b.height, bottom: b.bottom });
    });
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "rv-u");
    svg.setAttribute("aria-hidden", "true");
    h.appendChild(svg);
    lines.forEach(function (l) {
      var x1 = l.x1 - box.left - 1, x2 = l.x2 - box.left + 1, dx = x2 - x1;
      var base = l.bottom - box.top - l.h * 0.15, wob = Math.min(3, Math.max(1, l.h * 0.014));
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", "M " + x1 + " " + base + " C " + (x1 + dx * 0.24) + " " + (base - wob) + ", " +
        (x1 + dx * 0.54) + " " + (base + wob) + ", " + (x1 + dx * 0.73) + " " + base + " S " + (x2 - 8) + " " +
        (base + wob * 0.4) + ", " + x2 + " " + (base + wob));
      svg.appendChild(p);
      var len = p.getTotalLength();
      p.style.strokeDasharray = len + " " + (len + 1);
      p.style.strokeDashoffset = String(len + 1);
      p.style.visibility = "hidden";
      paths.push({ el: p, len: len });
      if (started) draw(p, played);
    });
  }

  function draw(p, instant) {
    p.style.visibility = "visible";
    p.style.transition = instant ? "none" : "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1) " + ink + "ms";
    requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.strokeDashoffset = "0"; }); });
  }

  function play() {
    if (started) return;
    started = true;
    h.classList.add("rv-on");
    paths.forEach(function (p) { draw(p.el, false); });
    window.setTimeout(function () { played = true; }, ink + 900);
  }

  function check() {
    if (started || document.hidden) return;
    var r = h.getBoundingClientRect();
    if (r.top + r.height / 2 <= window.innerHeight * TRIGGER && r.bottom > 0) play();
  }

  function init() {
    build();
    underline();
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    document.addEventListener("visibilitychange", check);
    if ("ResizeObserver" in window) {
      var last = h.clientWidth;
      new ResizeObserver(function () {
        if (h.clientWidth !== last) { last = h.clientWidth; underline(); }
      }).observe(h);
    }
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
})();
