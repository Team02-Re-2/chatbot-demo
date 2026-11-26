/* sw.js(발표장 인터넷 대비 저장 도우미)를 켭니다. 원본 챗봇 파일에는 넣지 않고 껍데기 페이지에만 넣습니다.
   끄고 싶으면 주소 끝에 ?nosw=1 을 붙여 한 번 열면 됩니다 (저장 도우미와 저장본을 모두 지움). */
(function () {
  if (!("serviceWorker" in navigator) || !window.caches) return;
  var src = document.currentScript ? document.currentScript.src : "";
  if (!src) return;
  var scope = new URL("../", src).href, swUrl = new URL("../sw.js", src).href;
  if (/[?&]nosw=1/.test(location.search)) {
    navigator.serviceWorker.getRegistrations().then(function (rs) {
      rs.forEach(function (r) { if (r.scope === scope) r.unregister(); });
    });
    caches.keys().then(function (ks) { ks.forEach(function (k) { if (k.indexOf("team2-") === 0) caches.delete(k); }); });
    return;
  }
  navigator.serviceWorker.register(swUrl, { scope: scope }).catch(function () {});
})();
