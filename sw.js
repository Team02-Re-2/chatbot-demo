/* 발표장 인터넷 대비용 저장 도우미 (서비스 워커).
   - 팀 모델 조각·실행 엔진·단어 목록: 한 번 받으면 이 브라우저에 저장해 두고 다음부터는 저장본을 씁니다 (cache-first).
   - 나머지 화면 파일: 늘 인터넷에서 먼저 받고, 인터넷이 안 되거나 4초 넘게 걸리면 저장본을 씁니다 (network-first).
   - 원본 챗봇 파일은 고치지 않습니다. 서버로 보내는 것도 없습니다. 이 브라우저 안의 저장소(Cache Storage)만 씁니다.
   - 모델이 바뀌면 MODEL_VER를 바꿔 주세요. 예전 저장본은 자동으로 지워집니다. */
var MODEL_VER = "v2-220494245";
var MODEL_CACHE = "team2-model-" + MODEL_VER;
var SITE_CACHE = "team2-site-v1";
var KEEP = [MODEL_CACHE, SITE_CACHE];
var BASE = new URL("./", self.location).href;
var ORT_CDN = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/";
var TIMEOUT_MS = 4000;

/* 시연에 꼭 필요한 화면 파일 (설치할 때 미리 저장, 하나가 실패해도 설치는 계속) */
var SHELL = [
  "./", "index.html", "customer-chat/?demo=1", "customer-chat/", "admin/", "ready/",
  "chatbot2/app/index.html", "chatbot2/", "verify/", "verify/bench40.json", "benchmark/", "overview/", "claude/",
  "assets/site.css", "assets/nums.js", "assets/links.js", "assets/bridge.js", "assets/numbers.json", "assets/links.json", "assets/offline.js", "assets/pickle.svg", "script/"
];

function isModel(url) {
  return url.indexOf(BASE + "chatbot2/app/v2/") === 0 || url.indexOf(ORT_CDN) === 0;
}
function isSite(url) {
  return url.indexOf(BASE) === 0 || url.indexOf("https://fonts.googleapis.com/") === 0 || url.indexOf("https://fonts.gstatic.com/") === 0;
}

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SITE_CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (p) {
      var u = new URL(p, BASE).href;
      return fetch(u, { cache: "no-cache" }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("team2-") === 0 && KEEP.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function cacheFirst(req) {
  return caches.open(MODEL_CACHE).then(function (c) {
    return c.match(req.url).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r.ok && (r.type === "basic" || r.type === "cors")) { var cp = r.clone(); c.put(req.url, cp).catch(function () {}); }
        return r;
      });
    });
  });
}

function networkFirst(req) {
  return caches.open(SITE_CACHE).then(function (c) {
    return new Promise(function (resolve, reject) {
      var done = false;
      function fromCache() {
        return c.match(req.url).then(function (hit) { return hit || c.match(req.url, { ignoreSearch: true }); });
      }
      var timer = setTimeout(function () {
        fromCache().then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
      }, TIMEOUT_MS);
      fetch(req).then(function (r) {
        if (r.ok && (r.type === "basic" || r.type === "cors")) { var cp = r.clone(); c.put(req.url, cp).catch(function () {}); }
        clearTimeout(timer);
        if (!done) { done = true; resolve(r); }
      }).catch(function (err) {
        clearTimeout(timer);
        fromCache().then(function (hit) {
          if (done) return;
          done = true;
          if (hit) resolve(hit); else reject(err);
        });
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  var url = req.url;
  if (isModel(url)) { e.respondWith(cacheFirst(req)); return; }
  if (isSite(url)) { e.respondWith(networkFirst(req)); return; }
});

/* 발표 준비 화면이 묻는 질문에 답합니다: 지금 버전, 저장된 모델 조각 수 */
self.addEventListener("message", function (e) {
  var d = e.data || {};
  if (d.type === "version" && e.ports && e.ports[0]) e.ports[0].postMessage({ model: MODEL_CACHE, site: SITE_CACHE });
});
