/* 力导向布局：斥力 + 弹簧 + 向心 + 碰撞，无依赖 */
window.DSPhysics = (function () {
  var nodes = [], edges = [], byId = {};
  var REP = 11000, SPRING = 0.012, LEN = 190, GRAV = 0.0016, DAMP = 0.92, MAXV = 26;
  var JITTER = 0.035;   // 持续微动，让布局永不彻底静止

  function init(ns, es) {
    nodes = ns; edges = es;
    byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    var groups = {};
    nodes.forEach(function (n) { (groups[n.ch] = groups[n.ch] || []).push(n); });
    var keys = Object.keys(groups);
    keys.forEach(function (k, ci) {
      var ang = (ci / keys.length) * Math.PI * 2;
      var gx = Math.cos(ang) * 265, gy = Math.sin(ang) * 265;
      groups[k].forEach(function (n, i) {
        n._chx = gx; n._chy = gy;
        var a = (i / Math.max(1, groups[k].length)) * Math.PI * 2;
        n.x = gx + Math.cos(a) * 70 + (Math.random() - 0.5) * 20;
        n.y = gy + Math.sin(a) * 70 + (Math.random() - 0.5) * 20;
        n.vx = 0; n.vy = 0;
      });
    });
    edges.forEach(function (e) { e._a = byId[e.s]; e._b = byId[e.t]; });
  }

  function step() {
    var i, j, a, b, dx, dy, d2, d, f;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y;
        d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 1; }
        if (d2 > 360000) continue;
        d = Math.sqrt(d2);
        f = REP / d2;
        var ux = dx / d, uy = dy / d;
        a.vx -= ux * f; a.vy -= uy * f;
        b.vx += ux * f; b.vy += uy * f;
      }
    }
    for (i = 0; i < edges.length; i++) {
      var e = edges[i]; a = e._a; b = e._b;
      if (!a || !b) continue;
      dx = b.x - a.x; dy = b.y - a.y;
      d = Math.sqrt(dx * dx + dy * dy) || 1;
      f = (d - LEN) * SPRING;
      var vx = (dx / d) * f, vy = (dy / d) * f;
      a.vx += vx; a.vy += vy;
      b.vx -= vx; b.vy -= vy;
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      a.vx += -a.x * GRAV + (Math.random() - 0.5) * JITTER;
      a.vy += -a.y * GRAV + (Math.random() - 0.5) * JITTER;
      if (a._chx !== undefined) {        // 章节聚簇：把同章结点拉在一起
        a.vx += (a._chx - a.x) * 0.0012;
        a.vy += (a._chy - a.y) * 0.0012;
      }
      if (a.fixed) { a.vx = 0; a.vy = 0; continue; }
      a.vx *= DAMP; a.vy *= DAMP;
      var sp = Math.hypot(a.vx, a.vy);
      if (sp > MAXV) { a.vx = a.vx / sp * MAXV; a.vy = a.vy / sp * MAXV; }
      a.x += a.vx; a.y += a.vy;
    }
    // 碰撞：避免结点叠在一起
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = b.x - a.x; dy = b.y - a.y;
        d = Math.hypot(dx, dy) || 1;
        var min = (a.r || 10) + (b.r || 10) + 14;
        if (d < min) {
          var push = (min - d) * 0.5;
          var nx = dx / d, ny = dy / d;
          if (!a.fixed) { a.x -= nx * push; a.y -= ny * push; }
          if (!b.fixed) { b.x += nx * push; b.y += ny * push; }
        }
      }
    }
  }

  function warm(n) { for (var i = 0; i < n; i++) step(); }

  return { init: init, step: step, warm: warm, get nodes() { return nodes; } };
})();