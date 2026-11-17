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

  var PER_PAGE = 10;
  var state = { topic: "all", q: "", sort: "new", page: 1 };
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
      b.addEventListener("click", function () {
        state.topic = key; state.page = 1; render();
        var top = document.getElementById("issue").getBoundingClientRect().top;
        if (top < 0) document.getElementById("issue").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });
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
    var parts = [
      el("span", "author", i.owner),
      el("span", null, i.stars.toLocaleString("en-US") + " stars"),
      el("span", null, "created " + fmtShort(i.created)),
      el("span", null, "updated " + fmtShort(i.pushed))
    ];
    parts.forEach(function (p, n) {
      if (n) meta.append(" \u00b7 ");
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
    if (state.sort === "new") {
      shown = shown.map(function (i, n) { return [i, n]; }).sort(function (a, b) {
        return a[0].added < b[0].added ? 1 : a[0].added > b[0].added ? -1 : a[1] - b[1];
      }).map(function (p) { return p[0]; });
    }
    var filtered = state.topic !== "all" || state.q;
    status.textContent = shown.length + (shown.length === 1 ? " repository" : " repositories") +
      (state.topic !== "all" ? " in " + TOPIC[state.topic] : "") + (state.q ? " matching \u201c" + state.q + "\u201d" : "");
    if (!shown.length) {
      var e = el("div", "empty");
      e.append(el("h3", null, "Nothing matches that"),
        el("p", null, "No repository in Issue " + D.issue + " contains \u201c" + state.q + "\u201d" + (state.topic !== "all" ? " under " + TOPIC[state.topic] : "") + ". Try a shorter word or clear the filters."));
      var b = el("button", null, "Clear filters");
      b.type = "button";
      b.addEventListener("click", function () { state.topic = "all"; state.q = ""; state.page = 1; search.value = ""; render(); });
      e.append(b);
      list.append(e);
      return;
    }
    var pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
    if (state.page > pages) state.page = pages;
    shown.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE).forEach(function (i) { list.append(item(i, false)); });
    pager(pages);
  }

  var pagerEl = document.createElement("nav");
  pagerEl.className = "pager";
  pagerEl.setAttribute("aria-label", "Pages");
  list.parentNode.append(pagerEl);

  function goTo(n) {
    state.page = n;
    render();
    var issue = document.getElementById("issue");
    if (issue.getBoundingClientRect().top < 0)
      issue.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function pager(pages) {
    pagerEl.replaceChildren();
    pagerEl.hidden = pages < 2;
    if (pages < 2) return;
    function btn(label, n, opts) {
      var b = el("button", "pg", label);
      b.type = "button";
      if (opts && opts.label) b.setAttribute("aria-label", opts.label);
      if (opts && opts.disabled) b.disabled = true;
      if (n === state.page && !(opts && opts.nav)) b.setAttribute("aria-current", "page");
      else b.addEventListener("click", function () { goTo(n); });
      return b;
    }
    pagerEl.append(btn("Previous", state.page - 1, { nav: true, disabled: state.page === 1 }));
    var shownPages = [];
    for (var p = 1; p <= pages; p++) if (pages <= 7 || p === 1 || p === pages || Math.abs(p - state.page) <= 1) shownPages.push(p);
    shownPages.forEach(function (p, n) {
      if (n && p - shownPages[n - 1] > 1) pagerEl.append(el("span", "pg-gap", "\u2026"));
      pagerEl.append(btn(String(p), p, { label: "Page " + p }));
    });
    pagerEl.append(btn("Next", state.page + 1, { nav: true, disabled: state.page === pages }));
  }

  search.addEventListener("input", function () { state.q = search.value.trim(); state.page = 1; render(); });
  search.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { search.value = ""; state.q = ""; state.page = 1; render(); }
  });

  document.getElementById("sort").addEventListener("change", function (ev) { state.sort = ev.target.value; state.page = 1; render(); });

  /* theme: follows the system until the button is used, then the choice is saved */
  var themeBtn = document.getElementById("theme");
  var darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : darkMQ.matches;
  }
  function labelTheme() { themeBtn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme"); }
  var saved = null;
  try { saved = localStorage.getItem("craft-radar-theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
  labelTheme();
  themeBtn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    var root = document.documentElement;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("theming");
      setTimeout(function () { root.classList.remove("theming"); }, 500);
    }
    document.documentElement.setAttribute("data-theme", next);
    labelTheme();
    try { localStorage.setItem("craft-radar-theme", next); } catch (e) {}
  });

  render();
})();
