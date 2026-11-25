/* 껍데기 페이지가 iframe 안 챗봇을 "읽기만" 해서 이 브라우저의 localStorage에 시연 기록을 남깁니다.
   iframe 쪽 객체에는 대입도, 함수 호출도 하지 않습니다 (속성 읽기만). 서버로는 아무것도 보내지 않습니다. */
(function (g) {
  var KEY = "team2demo.v1", MAX = 30;

  function loadAll() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY));
      if (o && Array.isArray(o.sessions)) return o;
    } catch (e) {}
    return { sessions: [], updatedAt: 0 };
  }
  function upsert(rec) {
    try {
      var d = loadAll(), i = -1;
      for (var k = 0; k < d.sessions.length; k++) if (d.sessions[k].id === rec.id) { i = k; break; }
      if (i >= 0) d.sessions[i] = rec; else d.sessions.push(rec);
      d.sessions.sort(function (a, b) { return a.startedAt - b.startedAt; });
      d.sessions = d.sessions.slice(-MAX);
      d.updatedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) {}
  }
  function newId(p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function S(x) { return x == null ? "" : String(x); }

  /* ── 챗봇 2: iframe 전역의 st, V2를 읽는다 ─────────────────────────── */
  function watchChatbot2(frame, onInfo) {
    var curObj = null, rec = null, sig = "", handedAt = 0, last = null;
    /* 새로고침하면 엔진 상태가 사라지므로, 이전에 "묻는 중"으로 남은 상담은 정리한다 */
    try {
      var d0 = loadAll(), ch = false;
      d0.sessions.forEach(function (x) { if (x && x.bot === "챗봇2" && x.asking) { x.asking = false; x.abandoned = true; ch = true; } });
      if (ch) { d0.updatedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(d0)); }
    } catch (e0) {}
    function tick() {
      try {
        var win = frame.contentWindow, s = win.st, V = win.V2;
        if (!s && win.__escTest) s = win.__escTest.st;
        if (!V && win.__escTest) V = win.__escTest.V2;
        if (!s || !V) return;
        var sel = win.document.getElementById("engine");
        var picked = sel ? S(sel.value) : "";
        var v2on = V.state === "ready" && picked === "v2";
        var info = { state: S(V.state), pct: Number(V.pct) || 0, mode: v2on ? "v2" : (V.state === "fail" ? "fail" : "rule"), picked: picked, err: S(V.err) };
        if (onInfo) onInfo(info);
        if (s !== curObj) {
          /* 새 상담으로 넘어가면, 묻다가 남겨 둔 이전 상담은 "묻는 중"에서 뺀다 */
          if (last && last.asking) { last.asking = false; last.abandoned = true; upsert(last); }
          curObj = s; rec = null; sig = ""; handedAt = 0; last = null;
        }
        var turns = s.turns || [];
        if (!turns.length && !s.handed && !s.ask) return;
        if (!rec) rec = { id: newId("c2"), bot: "챗봇2", startedAt: Date.now() };
        var tl = [];
        for (var i = 0; i < turns.length; i++) {
          var t = turns[i], j = t.j || {};
          var one = { n: t.n, text: S(t.text), label: t.label, engine: S(t.eng), reason: S(j.reason) };
          if (t.eng === "v2" && j.safety) one.engine = "v2+규칙";
          if (j.v2) one.scores = { complaint: Number(j.v2[0]), immediate: Number(j.v2[1]) };
          tl.push(one);
        }
        var handoff = null;
        if (s.handed) {
          var h = s.handed, ht = h.turn || {}, hj = ht.j || {};
          if (!handedAt) handedAt = Date.now();
          var typeName = "";
          try { if (h.type && win.TYPES && win.TYPES[h.type]) typeName = h.type + " " + S(win.TYPES[h.type][0]); } catch (e2) {}
          var hist = tl.map(function (x) { return S(x.label); }).join(" → ");
          var f = {};
          f["이관 발화"] = "#" + S(ht.n) + " \"" + S(ht.text) + "\"";
          if (hj.cue) f["근거 표현"] = S(hj.cue);
          f["문의 유형"] = typeName || "확인 필요";
          f["고객 요청"] = S(h.request) || "확인 필요";
          f["고객 확인"] = (s.nameOK ? "성함 확인" : "성함 미확인") + " · " + (s.lookup ? S(s.lookup.by) + " 받음" : "번호 미수신");
          if (h.kind === "cumulative") f["연결 의사"] = h.consent === "동의" ? "연결 질문에 고객이 동의" : (s.declined ? "한 번 사양 → 불만이 다시 나와 연결" : "물은 뒤 불만이 다시 나와 연결");
          f["판정 이력"] = hist;
          if (hj.v2) f["v2 점수"] = "불만 " + Number(hj.v2[0]).toFixed(3) + " · 즉시 " + Number(hj.v2[1]).toFixed(3);
          /* 엔진은 이관을 일으킨 턴(h.turn) 기준. 동의 답("네")은 판정하지 않는 턴이라 쓰지 않는다 */
          var hEng = S(ht.eng) + (ht.eng === "v2" && hj.safety ? "+규칙" : "");
          handoff = { kind: h.kind === "immediate" ? "즉시" : "누적", why: S(h.why), fields: f, at: handedAt, engine: hEng };
        }
        var next = {
          id: rec.id, bot: rec.bot, startedAt: rec.startedAt, turns: tl, handoff: handoff,
          asking: !!s.ask && !s.handed,
          conv: (s.conv || []).map(function (m) { return { who: S(m.who), text: S(m.text), n: (m.turn && m.turn.n) || 0 }; }),
          engineState: v2on ? "v2+규칙" : (V.state === "fail" ? "규칙(모델 오류)" : "규칙")
        };
        var sg = JSON.stringify(next);
        if (sg !== sig) { sig = sg; upsert(next); }
        last = next;
      } catch (e) {}
    }
    var timer = setInterval(tick, 500);
    tick();
    return function stop() { clearInterval(timer); };
  }

  /* ── 챗봇 1: iframe 문서의 판정 표와 인계 카드만 읽는다 ───────────────── */
  function watchChatbot1(frame) {
    var obs = null, rec = null, sig = "", prevCount = 0, handedAt = 0;
    function scan() {
      try {
        var doc = frame.contentDocument;
        if (!doc) return;
        var trs = doc.querySelectorAll("#decision-rows tr");
        var n = trs.length;
        if (n < prevCount) { rec = null; sig = ""; handedAt = 0; }
        prevCount = n;
        if (!n) { rec = null; sig = ""; handedAt = 0; return; }
        if (!rec) rec = { id: newId("c1"), bot: "챗봇1", startedAt: Date.now() };
        var tl = [];
        for (var i = 0; i < n; i++) {
          var td = trs[i].querySelectorAll("td");
          if (td.length < 6) continue;
          var lab = S(td[2].textContent).trim(), reason = S(td[5].textContent).trim();
          var one = { n: Number(S(td[0].textContent).trim()) || i + 1, text: S(td[1].textContent).trim(), label: /^\d+$/.test(lab) ? Number(lab) : lab, engine: "규칙", reason: reason };
          var m = reason.match(/불만\s*([0-9.]+)\s*·\s*즉시\s*([0-9.]+)/);
          if (m) { one.scores = { complaint: Number(m[1]), immediate: Number(m[2]) }; one.engine = "모델"; }
          tl.push(one);
        }
        var handoff = null;
        var card = doc.querySelector("#monitor-handoff .handoff-card");
        if (card) {
          if (!handedAt) handedAt = Date.now();
          var dts = card.querySelectorAll("dl dt"), dds = card.querySelectorAll("dl dd"), f = {}, why = "";
          for (var k = 0; k < dts.length && k < dds.length; k++) {
            var key = S(dts[k].textContent).trim(), val = S(dds[k].textContent).trim();
            if (key === "이관 사유") why = val; else f[key] = val;
          }
          var badge = doc.getElementById("cb-badge");
          var bt = badge ? S(badge.textContent) : "";
          handoff = { kind: bt.indexOf("즉시") >= 0 ? "즉시" : "누적", why: why, fields: f, at: handedAt };
        }
        var next = { id: rec.id, bot: rec.bot, startedAt: rec.startedAt, turns: tl, handoff: handoff, asking: false, engineState: "규칙" };
        var sg = JSON.stringify(next);
        if (sg !== sig) { sig = sg; upsert(next); }
      } catch (e) {}
    }
    var timer = null, pending = null;
    function later() { if (pending) return; pending = setTimeout(function () { pending = null; scan(); }, 150); }
    function attach() {
      try {
        if (obs) obs.disconnect();
        rec = null; sig = ""; prevCount = 0; handedAt = 0;
        var doc = frame.contentDocument;
        if (!doc) return;
        obs = new MutationObserver(later);
        ["decision-rows", "monitor-handoff", "cb-badge"].forEach(function (id) {
          var node = doc.getElementById(id);
          if (node) obs.observe(node, { childList: true, subtree: true, characterData: true });
        });
        scan();
      } catch (e) {}
    }
    frame.addEventListener("load", attach);
    attach();
    timer = setInterval(scan, 1500);
    return function stop() { clearInterval(timer); if (obs) obs.disconnect(); };
  }

  g.Team2Bridge = { KEY: KEY, MAX: MAX, loadAll: loadAll, watchChatbot1: watchChatbot1, watchChatbot2: watchChatbot2 };
})(window);
