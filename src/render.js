/* Canvas 2D 渲染：章节聚簇、掌握度环、弱项红环、标签避让 */
window.DSRender = (function () {
  var cv, ctx, W = 0, H = 0, DPR = 1;
  var widthCache = {};

  var CHAPTER_COLORS = {
    c1: "#58a6ff", c2: "#79c0ff", c3: "#3fb950", c4: "#56d364", c5: "#d29922",
    c6: "#39c5cf", c7: "#a371f7", c8: "#f0883e", c9: "#ff7b72"
  };
  var EDGE_COLORS = { prereq: "#58a6ff", part: "#8b949e", contrast: "#d29922", confuse: "#f85149", apply: "#3fb950" };
  var MASTERY = ["#5d6773", "#58a6ff", "#d29922", "#3fb950"];

  function attach(canvas) {
    cv = canvas; ctx = cv.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  var PIXEL_BUDGET = 4200000;   // 画布最多 300 万像素，超出就让浏览器拉伸
  function resize() {
    W = cv.clientWidth || W; H = cv.clientHeight || H;
    var want = Math.min(1.5, window.devicePixelRatio || 1);
    var maxByBudget = Math.sqrt(PIXEL_BUDGET / Math.max(1, W * H));
    DPR = Math.max(0.5, Math.min(want, maxByBudget));
    cv.width = Math.floor(W * DPR);
    cv.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function chColor(ch) { return CHAPTER_COLORS[ch] || "#8b949e"; }

  function frame(S) {
    var cam = S.cam, nodes = S.nodes, edges = S.edges;
    var light = S.theme === "light";
    var bg = light ? "#f6f7f9" : "#0a0c10";
    var fg = light ? "#1b2028" : "#e6edf3";

    ctx.clearRect(0, 0, W, H);

    var sx = function (x) { return (x - cam.x) * cam.k + W / 2; };
    var sy = function (y) { return (y - cam.y) * cam.k + H / 2; };

    var vis = S.filter && S.filter.size > 0;
    var act = S.hovered || S.selected;
    var weak = S.weak || {};

    // ---- 章节名（垫在底下，很淡）----
    if (!S.lite && cam.k < 1.35) {
      var sum = {};
      nodes.forEach(function (n) {
        var o = sum[n.ch] || (sum[n.ch] = { x: 0, y: 0, c: 0 });
        o.x += n.x; o.y += n.y; o.c++;
      });
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      Object.keys(sum).forEach(function (k) {
        var ch = S.chapters.filter(function (c) { return c.id === k; })[0];
        if (!ch) return;
        ctx.globalAlpha = light ? 0.085 : 0.062;
        ctx.fillStyle = chColor(k);
        ctx.font = "600 " + Math.max(13, Math.min(26, 20 * cam.k)) + "px 'Microsoft YaHei', sans-serif";
        ctx.fillText(ch.name, sx(sum[k].x / sum[k].c), sy(sum[k].y / sum[k].c) - 30 * cam.k);
      });
      ctx.restore();
    }

    // ---- 边 ----
    ctx.lineCap = "round";
    edges.forEach(function (e) {
      var a = e._a, b = e._b; if (!a || !b) return;
      var on = !act || act === a.id || act === b.id;
      var inFilter = !vis || S.filter.has(a.ch) || S.filter.has(b.ch);
      var alpha = act ? (on ? 0.9 : 0.13) : (inFilter ? 0.4 : 0.08);
      if (S.weakOnly && !(weak[a.id] || weak[b.id])) alpha *= 0.12;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = EDGE_COLORS[e.k] || "#8b949e";
      ctx.lineWidth = (e.k === "confuse" ? 1.9 : 1.3) * Math.min(1.4, cam.k);
      ctx.setLineDash(e.k === "confuse" ? [5, 5] : []);
      ctx.beginPath();
      ctx.moveTo(sx(a.x), sy(a.y));
      ctx.lineTo(sx(b.x), sy(b.y));
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // ---- 结点 ----
    var labels = [];
    nodes.forEach(function (n) {
      var x = sx(n.x), y = sy(n.y);
      if (x < -100 || y < -100 || x > W + 100 || y > H + 100) return;
      var r = Math.max(6, n.r * cam.k);
      var on = !act || act === n.id || (S.neighbors && S.neighbors.has(n.id));
      var inFilter = !vis || S.filter.has(n.ch);
      var alpha = act ? (on ? 1 : 0.34) : (inFilter ? 1 : 0.22);
      if (S.weakOnly && !weak[n.id]) alpha *= 0.12;
      var col = chColor(n.ch);
      var lv = S.mastery[n.id] || 0;
      var isWeak = !!weak[n.id];

      ctx.globalAlpha = alpha;

      if (S.selected === n.id) {
        ctx.beginPath();
        ctx.arc(x, y, r + 10, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.globalAlpha = 0.15 * alpha; ctx.fill();
        ctx.globalAlpha = alpha;
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = light ? "#ffffff" : "#12161d";
      ctx.fill();
      ctx.lineWidth = 1.6 + (n.hot ? 0.8 : 0);
      ctx.strokeStyle = isWeak ? "#f85149" : col;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.6, r * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = isWeak ? "#f85149" : col; ctx.fill();

      if (lv > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (lv / 3));
        ctx.strokeStyle = MASTERY[lv];
        ctx.lineWidth = 2.6; ctx.stroke();
      }
      if (isWeak) {
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = "#f85149";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      var pri = S.selected === n.id ? 100 : (S.hovered === n.id ? 90 :
        (S.neighbors && S.neighbors.has(n.id) ? 60 : (n.hot ? 40 : 20)));
      labels.push({ n: n, x: x, y: y, r: r, alpha: alpha, pri: pri, lv: lv });
      ctx.globalAlpha = 1;
    });

    // ---- 标签（按优先级抢占，避让）----
    labels.sort(function (a, b) { return b.pri - a.pri; });
    var boxes = [];
    function overlaps(x, y, w, h) {
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
      }
      return false;
    }
    if (S.lite) { ctx.globalAlpha = 1; return; }
    // 密集区域限制标签总数：优先级高的先画，画满就停
    var MAX_LABELS = 999;
    var drawn = 0;
    labels.forEach(function (L) {
      if (drawn >= MAX_LABELS && L.pri < 60) return;
      var show = true;
      if (!show) return;
      var fs = Math.max(8, Math.min(14, 11.5 * Math.sqrt(cam.k)));
      ctx.font = (L.pri >= 60 ? "600 " : "400 ") + fs + "px 'Microsoft YaHei',system-ui,sans-serif";
      var label = L.n.label;
      var key = label + "|" + fs;
      var tw = widthCache[key];
      if (tw === undefined) { tw = ctx.measureText(label).width; widthCache[key] = tw; }
      var lx = L.x - tw / 2 - 4, ly = L.y + L.r + 6, lw = tw + 8, lh = fs + 6;
      if (overlaps(lx, ly, lw, lh)) return;
      boxes.push({ x: lx, y: ly, w: lw, h: lh });
      drawn++;
      ctx.globalAlpha = L.alpha;
      ctx.fillStyle = light ? "rgba(255,255,255,.88)" : "rgba(10,12,16,.8)";
      roundRect(lx, ly, lw, lh, 4);
      ctx.fill();
      ctx.fillStyle = L.pri >= 60 ? fg : (light ? "#2b323c" : "#c9d1d9");
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(label, L.x, ly + 3);
      ctx.globalAlpha = 1;
    });
  }

  function drawGrid(cam, light) {
    var step = 120 * cam.k;
    if (step < 26) return;
    var ox = (W / 2 - cam.x * cam.k) % step;
    var oy = (H / 2 - cam.y * cam.k) % step;
    ctx.strokeStyle = light ? "rgba(0,0,0,.045)" : "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = ox; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (var y = oy; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function view() { return { w: W, h: H }; }
  return { attach: attach, frame: frame, resize: resize, view: view, chColor: chColor, EDGE_COLORS: EDGE_COLORS };
})();