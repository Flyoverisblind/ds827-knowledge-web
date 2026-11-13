/* 交互层：拖拽、缩放、选中、掌握度、错题、真题、图解、星图、搜索 */
(function () {
  var D = window.DS_DATA;
  var nodes = D.nodes.map(function (n) { return Object.assign({}, n); });
  var edges = D.edges.map(function (e) { return { s: e[0], t: e[1], k: e[2] }; });
  var chapters = D.chapters;

  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  var adj = {};
  nodes.forEach(function (n) { adj[n.id] = []; });
  edges.forEach(function (e) {
    if (!byId[e.s] || !byId[e.t]) return;
    adj[e.s].push({ id: e.t, k: e.k });
    adj[e.t].push({ id: e.s, k: e.k });
  });
  nodes.forEach(function (n) {
    n.deg = adj[n.id].length;
    n.r = Math.max(11, Math.min(23, 9.5 + Math.sqrt(n.deg) * 3.2));
  });

  // ---------- 真题文件 ----------
  var PAPER_A = "10-12、14、17-21年真题.pdf";
  var PAPER_B = "22-25年真题及24年真题答案.pdf";
  var ANS_A = "10-12、19-21年真题答案.pdf";
  function paperFor(y) { return "../1_真题/" + encodeURIComponent(y >= 22 ? PAPER_B : PAPER_A); }
  function ansFor(y) {
    if (y === 24) return "../1_真题/" + encodeURIComponent(PAPER_B);
    if ((y >= 10 && y <= 12) || (y >= 19 && y <= 21)) return "../1_真题/" + encodeURIComponent(ANS_A);
    return null;
  }

  // ---------- 存储 ----------
  var STORE = "ds827.graph.v4";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { saved = {}; }
  var mastery = saved.mastery || {};
  var answered = saved.answered || {};
  var weak = saved.weak || {};
  var theme = saved.theme || "dark";
  var ui = saved.ui || 1.15;
  if (theme === "light") document.body.classList.add("light");
  function applyUi() {
    document.documentElement.style.setProperty("--ui", ui);
  }
  applyUi();

  var cam = { x: 0, y: 0, k: 1 };
  var selected = null, hovered = null;
  var filter = new Set();
  var weakOnly = false;
  var neighbors = new Set();
  var dragNode = null, panning = false;
  var last = { x: 0, y: 0 };
  var movedPx = 0;         // 本次按下累计位移，用来区分“点”和“拖”
  var suppressClick = false;
  var anim = null;

  var REL = { prereq: "前置", part: "包含", contrast: "对比", confuse: "易混", apply: "应用" };
  var LV = ["未学", "看过", "在做", "掌握"];

  var cv = document.getElementById("stage");
  DSRender.attach(cv);
  DSPhysics.init(nodes, edges);
  DSPhysics.warm(80);   // 只预热一点，开局能看到自己摊开

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ mastery: mastery, weak: weak, theme: theme, answered: answered, ui: ui }));
    } catch (e) {}
  }

  function toWorld(px, py) {
    return { x: (px - cv.clientWidth / 2) / cam.k + cam.x, y: (py - cv.clientHeight / 2) / cam.k + cam.y };
  }
  function toScreen(n) {
    return { x: (n.x - cam.x) * cam.k + cv.clientWidth / 2, y: (n.y - cam.y) * cam.k + cv.clientHeight / 2 };
  }
  function hit(px, py) {
    var best = null, bd = 1e9;
    nodes.forEach(function (n) {
      var p = toScreen(n);
      var d = Math.hypot(p.x - px, p.y - py);
      var r = Math.max(9, n.r * cam.k) + 5;
      if (d < r && d < bd) { bd = d; best = n; }
    });
    return best;
  }

  var running = true;
  // 只有“刚发生过变化”才重画，避免空转 60fps 把 CPU 打满
  var lastAct = performance.now();
  var lastDraw = 0;
  var lastLite = false;
  var lastInput = 0;
  function act() { lastAct = performance.now(); }
  function input() { lastInput = lastAct = performance.now(); }
  var bgEl = document.getElementById("bg");
  // 网格固定在屏幕上，不跟随相机：省掉每帧对整层做 style 写入 + 重绘
  function syncGrid() { /* 保持静态 */ }
  function loop() {
    var now = performance.now();
    // 布局持续运行：结点永远在缓慢漂移，缩放/拖动之后也不会“死掉”
    DSPhysics.step();
    act();
    if (!document.body.classList.contains("modal")) {
      DSRender.frame({
        lite: false,
        nodes: nodes, edges: edges, cam: cam, chapters: chapters,
        selected: selected ? selected.id : null,
        hovered: hovered ? hovered.id : null,
        neighbors: neighbors, filter: filter, mastery: mastery,
        weak: weak, weakOnly: weakOnly, theme: theme
      });
    }
    requestAnimationFrame(loop);
  }
  loop();

  function fit(pad) {
    pad = pad || 130;
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    nodes.forEach(function (n) {
      minX = Math.min(minX, n.x - n.r); maxX = Math.max(maxX, n.x + n.r);
      minY = Math.min(minY, n.y - n.r); maxY = Math.max(maxY, n.y + n.r);
    });
    var w = Math.max(1, maxX - minX + pad * 2), h = Math.max(1, maxY - minY + pad * 2);
    var availW = cv.clientWidth - (window.innerWidth > 900 ? 380 : 24);
    var availH = cv.clientHeight - 140;
    cam.k = Math.max(0.45, Math.min(1.5, Math.min(availW / w, availH / h)));
    cam.x = (minX + maxX) / 2;
    cam.y = (minY + maxY) / 2;
    act();
  }

  // 柔和推到结点：220ms ease-out，落在面板左侧可视区的中心
  function glideTo(n) {
    var from = { x: cam.x, y: cam.y, k: cam.k };
    var nk = Math.min(1.45, Math.max(cam.k, 0.92));
    var vw = DSRender.view().w || cv.clientWidth;
    var avail = Math.max(320, vw - panelPx());
    var targetX = avail / 2;
    var to = {
      x: n.x - (targetX - vw / 2) / nk,
      y: n.y,
      k: nk
    };
    var t0 = performance.now(), dur = 220;
    if (anim) cancelAnimationFrame(anim);
    (function step() {
      var t = Math.min(1, (performance.now() - t0) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      cam.x = from.x + (to.x - from.x) * e;
      cam.y = from.y + (to.y - from.y) * e;
      cam.k = from.k + (to.k - from.k) * e;
      act();
      if (t < 1) anim = requestAnimationFrame(step);
    })();
  }

  function panelPx() {
    var p = document.getElementById("panel");
    if (!p.classList.contains("open")) return 0;
    return Math.min(p.getBoundingClientRect().width || 800, (DSRender.view().w || 1200) * 0.92);
  }

  function flyTo(n, k) {
    var nk = k || Math.max(cam.k, 0.95);
    var target = { x: n.x, y: n.y, k: nk };
    var from = { x: cam.x, y: cam.y, k: cam.k };
    var t0 = performance.now(), dur = 420;
    if (anim) cancelAnimationFrame(anim);
    (function step() {
      var t = Math.min(1, (performance.now() - t0) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      cam.x = from.x + (target.x - from.x) * e;
      cam.y = from.y + (target.y - from.y) * e;
      cam.k = from.k + (target.k - from.k) * e;
      act();
      if (t < 1) anim = requestAnimationFrame(step);
    })();
  }

  function setNeighbors(n) {
    neighbors = new Set();
    if (!n) return;
    neighbors.add(n.id);
    adj[n.id].forEach(function (a) { neighbors.add(a.id); });
  }

  var camBefore = null;
  function select(n, fly) {
    if (!document.body.classList.contains("modal")) camBefore = { x: cam.x, y: cam.y, k: cam.k };
    selected = n;
    setNeighbors(n);
    try { history.replaceState(null, "", "#" + n.id); } catch (e) {}
    renderPanel();
    if (fly) glideTo(n);
  }

  // ---------- 图卡 / 题目 ----------
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderFigures(n) {
    var host = document.getElementById("pFigs");
    var d = n.figs && window.DSFigures[n.figs];
    if (!d) { host.innerHTML = ""; return; }
    host.innerHTML = d.map(function (f, i) {
      return '<figure class="fig-card">' + f.s +
        '<figcaption class="fig-cap"><span class="fig-idx">' + (i + 1) + " / " + d.length + "</span>" +
        esc(f.t) + "</figcaption></figure>";
    }).join("");
  }

  function questionCard(q) {
    var letter = "ABCD";
    var picked = answered[q.id];
    var opts = (q.options || []).map(function (o, i) {
      var cls = "q-opt";
      if (picked) {
        if (letter[i] === q.answer) cls += " ok";
        else if (letter[i] === picked) cls += " no";
      }
      return '<button class="' + cls + '" data-qid="' + q.id + '" data-k="' + letter[i] + '"' +
        (picked ? " disabled" : "") + "><b>" + letter[i] + ".</b> " + esc(o) + "</button>";
    }).join("");
    var tip = "";
    if (picked) {
      tip = picked === q.answer
        ? '<div class="q-tip ok">答对了</div>'
        : '<div class="q-tip no">答错了，正确答案是 ' + q.answer + "</div>";
    }
    var ansBlock = picked
      ? '<div class="q-ans"><b>答案 ' + q.answer + "</b>" +
        (q.explain ? '<span class="ex">' + esc(q.explain) + "</span>" : "") + "</div>"
      : '<button class="q-tog">看答案</button><div class="q-ans" hidden><b>' + q.answer + "</b>" +
        (q.explain ? '<span class="ex">' + esc(q.explain) + "</span>" : "") + "</div>";
    return '<div class="q">' +
      '<div class="q-head"><span class="q-type">' + esc(q.type) + '</span>' +
      '<span class="q-src">' + esc(q.src || "") + "</span>" +
      (picked ? '<button class="q-redo" data-redo="' + q.id + '">重做</button>' : "") + "</div>" +
      '<div class="q-stem">' + esc(q.stem) + "</div>" +
      (opts ? '<div class="q-opts">' + opts + "</div>" : "") +
      tip + ansBlock + "</div>";
  }

  function bindToggles(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".q-tog"), function (b) {
      b.onclick = function () {
        var ans = b.nextElementSibling;
        var open = !ans.hidden;
        ans.hidden = open;
        b.textContent = open ? "看答案" : "收起答案";
      };
    });
    Array.prototype.forEach.call(root.querySelectorAll(".q-opt"), function (btn) {
      btn.onclick = function () { pickOption(btn.dataset.qid, btn.dataset.k); };
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-redo]"), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        resetQuestion(b.dataset.redo);
      };
    });
  }

  function resetQuestion(qid) {
    var q = (window.DS_QUESTIONS || []).filter(function (x) { return x.id === qid; })[0];
    if (!q) return;
    delete answered[qid];
    var kp = q.kp;
    if (mastery[kp] === 3) mastery[kp] = 2;
    if (selected && mastery[selected.id] === 3 &&
        !(window.DS_QUESTIONS || []).some(function (x) { return x.kp === selected.id; })) {
      mastery[selected.id] = 2;
    }
    save();
    if (selected) renderPanel();
    updateHud(); renderStars();
    toast("已清空这题，可以重做");
  }

  function pickOption(qid, k) {
    if (answered[qid]) return;
    var q = (window.DS_QUESTIONS || []).filter(function (x) { return x.id === qid; })[0];
    if (!q) return;
    answered[qid] = k;
    save();
    if (k === q.answer) {
      var Q = window.DS_QUESTIONS || [];
      var pool = Q.filter(function (x) { return x.kp === q.kp; });
      // 该考点没有专属题时，用它所在章的题作为“这一点的题”
      var target = q.kp;
      if (!pool.length && selected) {
        var ids = {};
        nodes.forEach(function (m) { if (m.ch === selected.ch) ids[m.id] = 1; });
        pool = Q.filter(function (x) { return ids[x.kp]; });
        target = selected.id;
      }
      if (!pool.length) pool = [q];
      var doneAll = pool.every(function (x) { return answered[x.id] === x.answer; });
      if (doneAll) {
        mastery[target] = 3;
        toast("「" + byId[target].label + "」全对，已标为掌握");
      } else if ((mastery[target] || 0) < 2) {
        mastery[target] = 2;
      }
    }
    if (selected) renderPanel();
    updateHud(); renderStars(); act();
  }

  function renderQuestions(n) {
    var host = document.getElementById("pQuestions");
    var all = window.DS_QUESTIONS || [];
    var mine = all.filter(function (q) { return q.kp === n.id; });
    var rightN = mine.filter(function (q) { return answered[q.id] === q.answer; }).length;
    var head = document.getElementById("pQHead");
    if (head) {
      head.textContent = mine.length ? "答对 " + rightN + " / " + mine.length + (rightN === mine.length && mine.length ? " · 全对即掌握" : "") : "";
    }
    var list = mine;
    var fallback = false;
    if (!list.length) {
      var ids = {};
      nodes.forEach(function (m) { if (m.ch === n.ch) ids[m.id] = 1; });
      list = all.filter(function (q) { return ids[q.kp]; }).slice(0, 2);
      fallback = true;
    }
    if (!list.length) {
      host.innerHTML = '<div class="q" style="color:var(--dim);font-size:12.5px">这个点暂时没有配题，题库共 ' +
        all.length + " 道。</div>";
      return;
    }
    host.innerHTML = (fallback
      ? '<div style="font-size:11.5px;color:var(--dim);margin-bottom:2px">本考点暂无专属题，先看同章的：</div>'
      : "") + list.map(questionCard).join("");
    bindToggles(host);
  }

  // ---------- 面板 ----------
  var panel = document.getElementById("panel");
  function renderPanel() {
    var n = selected;
    var scrim = document.getElementById("scrim");
    if (!n) { panel.classList.remove("open"); scrim.classList.remove("on"); return; }
    panel.classList.add("open");
    document.body.classList.add("modal");
    scrim.classList.add("on");
    var keepScroll = panel.scrollTop;
    document.getElementById("pTitle").textContent = n.label;

    var chName = (chapters.filter(function (c) { return c.id === n.ch; })[0] || { name: "" }).name;
    var meta = '<span class="tag ch">' + chName + "</span>";
    if (n.hot) meta += '<span class="tag hot">高频</span>';
    meta += '<span class="tag">' + n.deg + " 个关联</span>";
    document.getElementById("pMeta").innerHTML = meta;

    document.getElementById("pNote").textContent = n.note || "";
    var cxBar = document.getElementById("pCx");
    cxBar.innerHTML = n.cx && n.cx !== "—" ? "<span>" + esc(n.cx) + "</span>" : "";

    // 真题年份 + 入口
    var yw = document.getElementById("pYears");
    var ex = document.getElementById("pExams");
    yw.innerHTML = ""; ex.innerHTML = "";
    if (n.freq) yw.innerHTML = '<span class="yr">' + n.freq + "</span>";
    if (n.years && n.years.length) {
      yw.innerHTML += n.years.map(function (y) {
        return '<span class="yr">20' + String(y).padStart(2, "0") + "</span>";
      }).join("");
    }
    if (n.years && n.years.length) {
      var ys = n.years.slice(-5);
      var head = document.createElement("span");
      head.className = "lab"; head.textContent = "真题";
      ex.appendChild(head);
      ys.forEach(function (y) {
        var a = document.createElement("a");
        a.href = paperFor(y); a.target = "_blank"; a.rel = "noopener";
        a.textContent = "20" + String(y).padStart(2, "0");
        ex.appendChild(a);
      });
      var ansList = ys.filter(function (y) { return ansFor(y); });
      if (ansList.length) {
        var row = document.createElement("div");
        row.className = "exrow";
        var h2 = document.createElement("span");
        h2.className = "lab"; h2.textContent = "答案";
        row.appendChild(h2);
        ansList.forEach(function (y) {
          var a = document.createElement("a");
          a.href = ansFor(y); a.target = "_blank"; a.rel = "noopener";
          a.className = "ans";
          a.textContent = "20" + String(y).padStart(2, "0");
          row.appendChild(a);
        });
        ex.appendChild(row);
      }
    }

    // 图卡 + 题目
    renderFigures(n);
    renderQuestions(n);

    // 掌握度
    var mb = document.getElementById("pMastery");
    mb.innerHTML = "";
    for (var i = 0; i < 4; i++) {
      (function (v) {
        var b = document.createElement("button");
        b.className = "mbtn" + ((mastery[n.id] || 0) === v ? " on" : "");
        b.dataset.v = v;
        b.textContent = LV[v];
        b.onclick = function () { setMastery(n.id, v); };
        mb.appendChild(b);
      })(i);
    }
    var wb = document.getElementById("pWeak");
    wb.classList.toggle("on", !!weak[n.id]);
    wb.onclick = function () { toggleWeak(n.id); };

    // 相邻
    var list = document.getElementById("pNeighbors");
    list.innerHTML = "";
    var items = adj[n.id].slice().sort(function (a, b) { return a.k.localeCompare(b.k); });
    document.getElementById("pNeighborCount").textContent = items.length ? "（" + items.length + "）" : "";
    items.forEach(function (it) {
      var o = byId[it.id];
      var li = document.createElement("li");
      li.innerHTML = '<i style="background:' + (DSRender.EDGE_COLORS[it.k] || "#8b949e") + '"></i>' +
        "<span>" + o.label + "</span><em>" + REL[it.k] + "</em>";
      li.onclick = function () { select(o, true); };
      list.appendChild(li);
    });
    panel.scrollTop = keepScroll;
  }

  function setMastery(id, v) {
    mastery[id] = v;
    save();
    if (selected) renderPanel();
    updateHud();
    renderStars();
    toast(LV[v] + "：" + byId[id].label);
  }

  function toggleWeak(id) {
    if (weak[id]) { delete weak[id]; toast("取消易错：" + byId[id].label); }
    else { weak[id] = 1; toast("标记易错：" + byId[id].label); }
    save();
    if (selected) renderPanel();
    updateHud();
    renderWeakList();
  }

  // ---------- 统计 / 星图 / 错题 ----------
  function updateHud() {
    var total = nodes.length;
    var done = nodes.filter(function (n) { return (mastery[n.id] || 0) >= 3; }).length;
    var wk = Object.keys(weak).length;
    document.getElementById("statTotal").textContent = total;
    document.getElementById("statMastered").textContent = done;
    document.getElementById("statWeak").textContent = wk;
    document.getElementById("statPct").textContent = Math.round(done / total * 100) + "%";
    document.getElementById("statQ").textContent = (window.DS_QUESTIONS || []).length;
  }

  function renderStars() {
    var grid = document.getElementById("starGrid");
    grid.innerHTML = "";
    var lit = 0;
    chapters.forEach(function (c) {
      var ns = nodes.filter(function (n) { return n.ch === c.id; });
      var done = ns.filter(function (n) { return (mastery[n.id] || 0) >= 3; }).length;
      var pct = ns.length ? done / ns.length : 0;
      if (pct >= 1) lit++;
      var d = document.createElement("div");
      d.className = "star" + (pct >= 1 ? " done" : "");
      d.innerHTML = '<div class="s-name">' + c.name + "</div>" +
        '<div class="s-num">' + done + "/" + ns.length + "</div>" +
        '<div class="bar" style="width:' + (pct * 100) + "%;background:" +
        (pct >= 1 ? "var(--green)" : "var(--blue)") + '"></div>';
      d.onclick = function () {
        filter = new Set([c.id]);
        weakOnly = false;
        syncChips();
        toast("只看：" + c.name);
      };
      grid.appendChild(d);
    });
    document.getElementById("starSub").textContent = lit + "/" + chapters.length + " 章成网";
  }

  function renderWeakList() {
    var ul = document.getElementById("weakItems");
    ul.innerHTML = "";
    var ids = Object.keys(weak);
    document.getElementById("weakSub").textContent = ids.length ? "（" + ids.length + "）" : "";
    if (!ids.length) {
      ul.innerHTML = '<li style="color:var(--dim);cursor:default">还没有标记，做题错了就在这里点“易错”。</li>';
      return;
    }
    ids.forEach(function (id) {
      var n = byId[id];
      if (!n) return;
      var li = document.createElement("li");
      li.innerHTML = "<i></i><span>" + n.label + "</span><em>" + n.note.slice(0, 10) + "…</em>";
      li.onclick = function (ev) {
        if (ev.target.tagName === "BUTTON") return;
        select(n, true);
      };
      var btn = document.createElement("button");
      btn.textContent = "×";
      btn.title = "取消易错";
      btn.onclick = function (ev) { ev.stopPropagation(); toggleWeak(id); };
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  document.getElementById("starBtn").onclick = function () {
    var s = document.getElementById("starmap");
    document.getElementById("weaklist").classList.remove("open");
    s.classList.toggle("open");
    renderStars();
  };
  function renderQBank() {
    var host = document.getElementById("qbankList");
    var all = window.DS_QUESTIONS || [];
    document.getElementById("qbankSub").textContent = "（" + all.length + " 道）";
    host.innerHTML = "";
    chapters.forEach(function (c) {
      var ns = nodes.filter(function (n) { return n.ch === c.id; });
      var ids = {};
      ns.forEach(function (n) { ids[n.id] = n; });
      var qs = all.filter(function (q) { return ids[q.kp]; });
      if (!qs.length) return;
      var h = document.createElement("div");
      h.className = "grp";
      h.textContent = c.name + " · " + qs.length + " 道";
      host.appendChild(h);
      qs.forEach(function (q) {
        var d = document.createElement("div");
        d.className = "item";
        d.innerHTML = esc(q.stem.split("\n")[0].slice(0, 34)) + "…<em>" + esc(q.type) + "</em>";
        d.onclick = function () {
          var target = ids[q.kp];
          document.getElementById("qbank").classList.remove("open");
          select(target, true);
          setTimeout(function () { renderQuestions(target); }, 60);
        };
        host.appendChild(d);
      });
    });
  }

  document.getElementById("qbankBtn").onclick = function () {
    var b = document.getElementById("qbank");
    var wasOpen = b.classList.contains("open");
    document.getElementById("starmap").classList.remove("open");
    document.getElementById("weaklist").classList.remove("open");
    b.classList.toggle("open", !wasOpen);
    if (!wasOpen) {
      selected = null; neighbors = new Set();
      document.getElementById("panel").classList.remove("open");
      renderQBank();
    }
  };

  document.getElementById("weakBtn").onclick = function () {
    var w = document.getElementById("weaklist");
    document.getElementById("starmap").classList.remove("open");
    w.classList.toggle("open");
    renderWeakList();
  };

  // ---------- 顶部 ----------
  var chipsEl = document.getElementById("chips");
  var allChip = document.createElement("button");
  allChip.className = "chip on";
  allChip.textContent = "全部";
  allChip.onclick = function () { filter = new Set(); weakOnly = false; syncChips(); };
  chipsEl.appendChild(allChip);
  chapters.forEach(function (c) {
    var b = document.createElement("button");
    b.className = "chip";
    b.textContent = c.name;
    b.dataset.ch = c.id;
    b.onclick = function () {
      if (filter.has(c.id)) filter.delete(c.id); else filter.add(c.id);
      weakOnly = false;
      syncChips();
    };
    chipsEl.appendChild(b);
  });
  function syncChips() {
    allChip.classList.toggle("on", filter.size === 0 && !weakOnly);
    Array.prototype.forEach.call(chipsEl.querySelectorAll("[data-ch]"), function (b) {
      b.classList.toggle("on", filter.has(b.dataset.ch));
    });
  }

  function bumpUi(d) {
    ui = Math.max(0.85, Math.min(1.6, Math.round((ui + d) * 100) / 100));
    applyUi(); save();
  }
  document.getElementById("uiUp").onclick = function () { bumpUi(0.1); };
  document.getElementById("uiDown").onclick = function () { bumpUi(-0.1); };

  document.getElementById("theme").onclick = function () {
    theme = theme === "dark" ? "light" : "dark";
    document.body.classList.toggle("light", theme === "light");
    save(); act();
  };

  var q = document.getElementById("q");
  q.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter") return;
    var s = q.value.trim().toLowerCase();
    if (!s) return;
    var hitN = nodes.filter(function (n) {
      return n.label.toLowerCase().indexOf(s) >= 0 || n.id.indexOf(s) >= 0;
    })[0];
    if (hitN) { select(hitN, true); toast("跳到：" + hitN.label); }
    else toast("没找到「" + q.value + "」");
  });

  function closePanel() {
    selected = null;
    neighbors = new Set();
    panel.classList.remove("open");
    document.body.classList.remove("modal");     // 关键：恢复画布
    if (camBefore) { cam.x = camBefore.x; cam.y = camBefore.y; cam.k = camBefore.k; camBefore = null; }
    var sc = document.getElementById("scrim");
    if (sc) sc.classList.remove("on");
    act();
  }
  document.addEventListener("pointerdown", function (ev) {
    if (!document.body.classList.contains("modal")) return;
    var p = document.getElementById("panel");
    if (p && !p.contains(ev.target)) closePanel();
  });
  document.getElementById("closePanel").onclick = closePanel;
  var scrimEl = document.getElementById("scrim");
  if (scrimEl) scrimEl.onclick = closePanel;
  var bgLayer = document.getElementById("bg");
  if (bgLayer) bgLayer.addEventListener("click", function () {
    if (document.body.classList.contains("modal")) closePanel();
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && document.activeElement !== q) { ev.preventDefault(); q.focus(); }
    if (ev.key === "Escape") {
      closePanel();
      document.getElementById("starmap").classList.remove("open");
      document.getElementById("weaklist").classList.remove("open");
    }
    if (ev.key === "f") fit();
    if (selected && ev.key >= "0" && ev.key <= "3") setMastery(selected.id, +ev.key);

  });

  // ---------- 指针 ----------
  cv.addEventListener("pointerdown", function (ev) {
    try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    movedPx = 0;
    suppressClick = false;
    var n = hit(ev.clientX, ev.clientY);
    last = { x: ev.clientX, y: ev.clientY };
    if (n) {
      dragNode = n; n.fixed = true; n.vx = 0; n.vy = 0; running = true;
    } else {
      panning = true;
      cv.classList.add("dragging");
    }
  });

  cv.addEventListener("pointermove", function (ev) {
    var dx = ev.clientX - last.x, dy = ev.clientY - last.y;
    if (ev.buttons) movedPx += Math.abs(dx) + Math.abs(dy);
    last = { x: ev.clientX, y: ev.clientY };
    if (dragNode) { dragNode.x += dx / cam.k; dragNode.y += dy / cam.k; input(); return; }
    if (panning) { cam.x -= dx / cam.k; cam.y -= dy / cam.k; input(); return; }
    var n = hit(ev.clientX, ev.clientY);
    if (n !== hovered) { hovered = n; cv.style.cursor = n ? "pointer" : "grab"; input(); }
  });

  function endDrag() {
    if (dragNode) {
      dragNode.fixed = false;
      dragNode.vx = 0; dragNode.vy = 0;
      dragNode = null;
      running = true;        // 松手后让邻居重新找位置
    }
    if (movedPx > 6) suppressClick = true;
    panning = false;
    cv.classList.remove("dragging");
  }
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);

  cv.addEventListener("click", function (ev) {
    if (suppressClick) { suppressClick = false; return; }
    if (Math.abs(ev.clientX - last.x) > 3) return;
    var n = hit(ev.clientX, ev.clientY);
    if (n) { select(n, true); }
    else { selected = null; neighbors = new Set(); closePanel(); }
  });

  cv.addEventListener("dblclick", function (ev) {
    var n = hit(ev.clientX, ev.clientY);
    if (n) { select(n, true); flyTo(n, 1.25); }
  });

  cv.addEventListener("wheel", function (ev) {
    ev.preventDefault();
    var before = toWorld(ev.clientX, ev.clientY);
    var factor = Math.exp(-ev.deltaY * 0.0012);
    cam.k = Math.max(0.28, Math.min(2.6, cam.k * factor));
    var after = toWorld(ev.clientX, ev.clientY);
    cam.x += before.x - after.x;
    cam.y += before.y - after.y;
    input();
  }, { passive: false });

  var toastEl = document.getElementById("toast"), toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1600);
  }

  window.addEventListener("resize", function () { act(); });
  window.addEventListener("load", function () { DSRender.resize(); fit(); act(); });
  setTimeout(function () {
    var qs = new URLSearchParams(location.search);
    if (qs.get("theme") === "light") { theme = "light"; document.body.classList.add("light"); }
    if (qs.get("noanim") === "1") document.body.classList.add("no-anim");

    if (qs.get("probe") === "1") {
      window.addEventListener("error", function (e) { document.title = "ERR:" + e.message; });
      try {
        var t0 = performance.now();
        for (var i = 0; i < 12; i++) {
          cv.dispatchEvent(new WheelEvent("wheel", { deltaY: -40, clientX: 800, clientY: 520, bubbles: true }));
        }
        select(byId["dijkstra"], true);
        // 模拟：滚轮缩放 + 点击结点
        var tgt = byId["clink"];
        cv.dispatchEvent(new WheelEvent("wheel", { deltaY: -180, clientX: 800, clientY: 500, bubbles: true, cancelable: true }));
        var sp = toScreen(tgt);
        cv.dispatchEvent(new PointerEvent("pointerdown", { clientX: sp.x, clientY: sp.y, bubbles: true, pointerId: 1 }));
        cv.dispatchEvent(new PointerEvent("pointerup", { clientX: sp.x, clientY: sp.y, bubbles: true, pointerId: 1 }));
        cv.dispatchEvent(new MouseEvent("click", { clientX: sp.x, clientY: sp.y, bubbles: true }));
        var picked = selected ? selected.id : "none";
        var n0 = byId["adt"];
        selected = n0; setNeighbors(n0);
        var t0b = Date.now();
        for (var k = 0; k < 40; k++) {
          DSRender.frame({ lite: false, nodes: nodes, edges: edges, cam: cam, chapters: chapters,
            selected: n0.id, hovered: null, neighbors: neighbors, filter: filter,
            mastery: mastery, weak: weak, weakOnly: false, theme: theme });
        }
        var frameMs = (Date.now() - t0b) / 40;
        var t1 = performance.now();
        setTimeout(function () {
          document.getElementById("closePanel").click();
          setTimeout(function () {
            var st = document.getElementById("stage");
            var cs = getComputedStyle(st);
            var ctx2 = st.getContext("2d");
            var px = ctx2.getImageData(Math.floor(st.width / 2), Math.floor(st.height / 2), 1, 1).data;
            document.title = "aftclose display=" + cs.display + " w=" + st.width + " h=" + st.height +
              " px=" + px[0] + "," + px[1] + "," + px[2] + "," + px[3] +
              " bodyModal=" + document.body.classList.contains("modal");
          }, 400);
        }, 400);
        document.getElementById("qbankBtn").click();
        var t2 = performance.now();
        setTimeout(function () {
          document.title = "picked=" + picked + " errs=" + (window.__errs.join("|") || "none") + " qbank=" + Math.round(t2 - t1) +
            "ms items=" + document.querySelectorAll("#qbankList .item").length +
            " open=" + document.getElementById("qbank").classList.contains("open");
        }, 900);
      } catch (err) { document.title = "ERR:" + err.message; }
    }

    fit(); updateHud(); renderStars(); renderWeakList();

    var h = (location.hash || "").replace("#", "");
    if (h && byId[h]) { select(byId[h], true); }
    if (qs.get("stars") === "1") { document.getElementById("starmap").classList.add("open"); renderStars(); }
    if (qs.get("qbank") === "1") { document.getElementById("qbank").classList.add("open"); renderQBank(); }
    if (qs.get("weak") === "1") { document.getElementById("weaklist").classList.add("open"); renderWeakList(); }
  }, 60);
})();