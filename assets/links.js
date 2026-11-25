/* links.json 한 곳에서 바깥으로 나가는 주소를 읽어 a[data-link="키"]의 href를 바꿉니다.
   값이 비었거나 읽기에 실패하면 HTML에 적힌 기본 href를 그대로 둡니다.
   https: 또는 사이트 안 상대 주소만 허용합니다. 주소가 비어 있고 data-wait가 있는 링크는 "준비 중"으로 막습니다. */
(function () {
  var SRC = document.currentScript ? document.currentScript.src : "";
  var BASE = SRC ? new URL("../", SRC).href : "";
  var URL_ = SRC ? new URL("links.json", SRC).href : "links.json";
  function ok(u) {
    if (typeof u !== "string" || !u) return false;
    if (/^https:\/\//i.test(u)) return true;
    return !/^[a-z][a-z0-9+.-]*:/i.test(u) && u.indexOf("//") !== 0;
  }
  function apply(map) {
    Array.prototype.forEach.call(document.querySelectorAll("a[data-link]"), function (a) {
      var key = a.getAttribute("data-link"), r = map && map[key], u = r && r.url;
      if (ok(u)) {
        var ext = /^https:\/\//i.test(u);
        a.href = ext ? u : new URL(u, BASE).href;
        if (ext) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        a.removeAttribute("aria-disabled");
      } else if (a.hasAttribute("data-wait")) {
        a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.textContent = a.getAttribute("data-wait");
      }
    });
  }
  fetch(URL_).then(function (r) { return r.json(); }).then(apply).catch(function () { apply(null); });
})();
