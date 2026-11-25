/* numbers.json 한 곳에서 숫자를 읽어 화면에 채웁니다.
   data-n="키"            : 값+단위
   data-n="키" data-part="value|unit|label|condition|source|detail"
   data-tpl               : 요소 글자 안의 {{키}} (값만), {{키:vu}} (값+단위), {{키:d}} (세부) 를 바꿈 */
(function (g) {
  var SRC = document.currentScript ? document.currentScript.src : "";
  var URL_ = SRC ? new URL("numbers.json", SRC).href : "numbers.json";
  var cache = null;
  function load() {
    if (!cache) cache = fetch(URL_).then(function (r) { return r.json(); }).then(function (a) {
      var m = {}; a.forEach(function (r) { m[r.key] = r; }); return m;
    });
    return cache;
  }
  function vu(r) { return String(r.value) + (r.unit || ""); }
  function part(r, p) {
    if (!r) return "";
    if (p === "value") return String(r.value);
    if (p === "unit") return r.unit || "";
    if (p === "label") return r.label || "";
    if (p === "condition") return r.condition || "";
    if (p === "source") return r.source || "";
    if (p === "detail") return r.detail || "";
    return vu(r);
  }
  function tpl(str, m) {
    return String(str).replace(/\{\{([a-z0-9_]+)(?::(vu|d|n))?\}\}/g, function (all, k, f) {
      var r = m[k]; if (!r) return all;
      return f === "vu" ? vu(r) : f === "d" ? (r.detail || "") : f === "n" ? String(r.value).replace(/,/g, "") : String(r.value);
    });
  }
  function fill(m) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-n]"), function (e) {
      e.textContent = part(m[e.getAttribute("data-n")], e.getAttribute("data-part"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-tpl]"), function (e) {
      e.textContent = tpl(e.textContent, m);
    });
  }
  g.Team2Nums = { load: load, fill: fill, vu: vu, tpl: tpl, part: part, ready: load().then(function (m) { fill(m); return m; }) };
})(window);
