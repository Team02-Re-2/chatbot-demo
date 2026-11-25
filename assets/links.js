/* links.json 한 곳에서 바깥으로 나가는 주소를 읽어 a[data-link="키"]의 href를 바꿉니다.
   값이 비었거나 읽기에 실패하면 HTML에 적힌 기본 href를 그대로 둡니다.
   https: 또는 사이트 안 주소만 허용합니다. 주소가 비어 있고 data-wait가 있는 링크는 "준비 중"으로 막습니다. */
(function () {
  var SRC = document.currentScript ? document.currentScript.src : "";
  var BASE = SRC ? new URL("../", SRC).href : "";
  var URL_ = SRC ? new URL("links.json", SRC).href : "links.json";
  var HOME = SRC ? new URL(BASE) : null;
  var BACKSLASH = String.fromCharCode(92);
  /* 먼저 URL로 풀고 나서 검사한다: 제어문자·공백·역슬래시가 든 값은 버리고, https: 이거나 사이트 안 주소만 허용 */
  function resolve(u) {
    if (typeof u !== "string" || !u || /[\u0000- ]/.test(u) || u.indexOf(BACKSLASH) >= 0) return null;
    try {
      var x = new URL(u, BASE);
      if (x.protocol === "https:") return x;
      if (HOME && x.origin === HOME.origin) return x;
    } catch (e) {}
    return null;
  }
  function apply(map) {
    Array.prototype.forEach.call(document.querySelectorAll("a[data-link]"), function (a) {
      var key = a.getAttribute("data-link"), r = map && map[key], x = resolve(r && r.url);
      if (x) {
        a.href = x.href;
        if (HOME && x.origin !== HOME.origin) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        a.removeAttribute("aria-disabled");
      } else if (a.hasAttribute("data-wait")) {
        a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.textContent = a.getAttribute("data-wait");
      }
    });
  }
  fetch(URL_).then(function (r) { return r.json(); }).then(apply).catch(function () { apply(null); });
})();
