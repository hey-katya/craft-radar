(function () {
  var D = window.RADAR;
  var GROUPS = [
    { name: "Design", topics: [
      ["explainers", "Visual explainers"],
      ["taste", "Taste and rules"],
      ["systems", "Interfaces and systems"] ] },
    { name: "Motion", topics: [
      ["motion", "Interface motion"],
      ["video", "Demo videos"] ] },
    { name: "Product", topics: [
      ["product", "Product work"] ] }
  ];
  var TOPIC = {};
  GROUPS.forEach(function (g) { g.topics.forEach(function (t) { TOPIC[t[0]] = t[1]; }); });

  var state = { topic: "all", q: "" };
  var rail = document.getElementById("rail");
  var list = document.getElementById("list");
  var status = document.getElementById("status");
  var search = document.getElementById("q");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtDate(s) {
    var d = new Date(s + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }
  function fmtShort(s) {
    var d = new Date(s + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  }
  function count(topic) {
    return D.items.filter(function (i) { return topic === "all" || i.topic === topic; }).length;
  }

  function buildRail() {
    rail.replaceChildren();
    function chip(key, label) {
      var b = el("button", "chip");
      b.type = "button";
      b.dataset.topic = key;
      b.setAttribute("aria-pressed", String(state.topic === key));
      b.append(el("span", "lab", label), el("span", "n", String(count(key))));
      b.addEventListener("click", function () { state.topic = key; render(); });
      return b;
    }
    rail.append(chip("all", "All"));
    GROUPS.forEach(function (g) {
      rail.append(el("h2", null, g.name));
      g.topics.forEach(function (t) { rail.append(chip(t[0], t[1])); });
    });
  }

  function matches(i) {
    if (state.topic !== "all" && i.topic !== state.topic) return false;
    if (!state.q) return true;
    var hay = (i.name + " " + i.owner + " " + i.text + " " + TOPIC[i.topic]).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  function media(i) {
    var a = el("a", "media");
    a.href = i.repo ? "https://github.com/" + i.repo : "#";
    a.tabIndex = -1;
    a.setAttribute("aria-hidden", "true");
    function fallback() {
      a.replaceChildren(el("div", "fallback", i.name));
    }
    if (!i.img) { fallback(); return a; }
    var img = new Image();
    img.src = i.img;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", fallback);
    var frame = el("div", "frame");
    frame.append(img);
    a.append(frame);
    if (i.gif && !reduce) {
      var still = i.img;
      var swap = function (on) { img.src = on ? i.gif : still; };
      a.addEventListener("pointerenter", function () { swap(true); });
      a.addEventListener("pointerleave", function () { swap(false); });
    }
    return a;
  }

  function item(i, lead) {
    var art = el("article", "item" + (lead ? " lead" : ""));
    var m = media(i);
    var body = el("div", "body");
    var row = el("div", "titlerow");
    var h = el("h3");
    var link = el("a", null, i.name);
    link.href = "https://github.com/" + i.repo;
    link.target = "_blank";
    link.rel = "noopener";
    h.append(link);
    row.append(h, el("span", "tag", TOPIC[i.topic]));
    body.append(row, el("p", "text", i.text));
    var meta = el("p", "meta");
    var unclear = i.license === "none" || i.license === "NOASSERTION";
    var parts = [
      el("span", "author", i.owner),
      el("span", null, i.stars.toLocaleString("en-US") + " stars"),
      el("span", unclear ? "warn" : null, i.license === "NOASSERTION" ? "licence unclear" : i.license === "none" ? "no licence" : i.license),
      el("span", null, "created " + fmtShort(i.created)),
      el("span", null, "updated " + fmtShort(i.pushed))
    ];
    parts.forEach(function (p, n) {
      if (n) meta.append(" · ");
      meta.append(p);
    });
    body.append(meta);
    var links = el("div", "links");
    var gh = el("a", null, "Open on GitHub");
    gh.href = "https://github.com/" + i.repo;
    gh.target = "_blank";
    gh.rel = "noopener";
    links.append(gh);
    if (i.demo) {
      var d = el("a", null, "Try the live demo");
      d.href = i.demo;
      d.target = "_blank";
      d.rel = "noopener";
      links.append(d);
    }
    body.append(links);
    art.append(m, body);
    return art;
  }

  function render() {
    buildRail();
    list.replaceChildren();
    var shown = D.items.filter(matches);
    var filtered = state.topic !== "all" || state.q;
    status.textContent = shown.length + (shown.length === 1 ? " repository" : " repositories") +
      (state.topic !== "all" ? " in " + TOPIC[state.topic] : "") + (state.q ? " matching “" + state.q + "”" : "");
    if (!shown.length) {
      var e = el("div", "empty");
      e.append(el("h3", null, "Nothing matches that"),
        el("p", null, "No repository in Issue " + D.issue + " contains “" + state.q + "”" + (state.topic !== "all" ? " under " + TOPIC[state.topic] : "") + ". Try a shorter word or clear the filters."));
      var b = el("button", null, "Clear filters");
      b.type = "button";
      b.addEventListener("click", function () { state.topic = "all"; state.q = ""; search.value = ""; render(); });
      e.append(b);
      list.append(e);
      return;
    }
    shown.forEach(function (i, n) { list.append(item(i, false)); });
  }

  search.addEventListener("input", function () { state.q = search.value.trim(); render(); });
  search.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { search.value = ""; state.q = ""; render(); }
  });

  /* theme: auto follows the system, light and dark are explicit */
  var themeBtns = document.querySelectorAll("[data-theme-set]");
  function applyTheme(t) {
    var root = document.documentElement;
    if (t === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    themeBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.themeSet === t)); });
  }
  var saved = "auto";
  try { saved = localStorage.getItem("craft-radar-theme") || "auto"; } catch (e) {}
  applyTheme(saved);
  themeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      applyTheme(b.dataset.themeSet);
      try { localStorage.setItem("craft-radar-theme", b.dataset.themeSet); } catch (e) {}
    });
  });

  render();
})();
