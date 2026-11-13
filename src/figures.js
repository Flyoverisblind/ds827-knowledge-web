/* 静态图卡：直接产出 SVG 字符串，不依赖运行时绘制，永远能显示 */
window.DSFigures = (function () {

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function wrap(inner) {
    return '<svg class="fig-svg" viewBox="0 0 340 210" xmlns="http://www.w3.org/2000/svg">' +
      '<style>' +
      '.fn{fill:var(--panel);stroke:var(--blue);stroke-width:1.6}' +
      '.fn.red{stroke:var(--red)}.fn.amber{stroke:var(--amber)}.fn.green{stroke:var(--green)}' +
      '.ft{fill:var(--fg);font:600 11px Consolas,monospace;text-anchor:middle;dominant-baseline:middle}' +
      '.fl{fill:var(--muted);font:9px Consolas,monospace;text-anchor:middle}' +
      '.fw{fill:var(--muted);font:10px Consolas,monospace;text-anchor:middle}' +
      '.fe{stroke:var(--dim);stroke-width:1.4;fill:none}' +
      '.fe.hot{stroke:var(--red);stroke-width:2.4}' +
      '.fh{stroke:var(--amber);stroke-width:1.6;fill:none;stroke-dasharray:4 3}' +
      '.fb{fill:var(--panel2);stroke:var(--line);stroke-width:1.2}' +
      '.fcell{fill:var(--blue);stroke:none}' +
      '.fnum{fill:var(--amber);font:10px Consolas,monospace;text-anchor:middle}' +
      '</style>' + inner + "</svg>";
  }

  function node(x, y, label, cls) {
    return '<circle class="fn ' + (cls || "") + '" cx="' + x + '" cy="' + y + '" r="13"/>' +
      '<text class="ft" x="' + x + '" y="' + y + '">' + esc(label) + "</text>";
  }

  function arrow(x1, y1, x2, y2, cls, w) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L;
    var ax = x1 + ux * 13, ay = y1 + uy * 13;
    var bx = x2 - ux * 15, by = y2 - uy * 15;
    var mx = (ax + bx) / 2, my = (ay + by) / 2;
    var hot = cls === "hot";
    var col = hot ? "var(--red)" : "var(--dim)";
    return '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by +
      '" stroke="' + col + '" stroke-width="' + (hot ? 2.2 : 1.4) + '"/>' +
      '<polygon points="' + bx + "," + by + " " + (bx - ux * 7 - uy * 3.6) + "," + (by - uy * 7 + ux * 3.6) +
      " " + (bx - ux * 7 + uy * 3.6) + "," + (by - uy * 7 - ux * 3.6) +
      '" fill="' + col + '"/>' +
      (w === "" || w === undefined ? "" :
        '<circle cx="' + mx + '" cy="' + my + '" r="8" fill="var(--bg)"/>' +
        '<text class="fw" x="' + mx + '" y="' + my + '">' + esc(w) + "</text>");
  }

  // ---------------- AOE ----------------
  var A = { v1: [36, 108], v2: [116, 40], v3: [116, 176], v4: [206, 108], v5: [206, 176], v6: [300, 108] };
  var AE = [["v1", "v2", 3], ["v1", "v3", 2], ["v2", "v4", 2], ["v3", "v4", 4], ["v2", "v5", 3], ["v4", "v6", 3], ["v5", "v6", 2]];
  var VE = { v1: 0, v2: 3, v3: 2, v4: 6, v5: 6, v6: 9 };
  var VL = { v1: 0, v2: 4, v3: 2, v4: 6, v5: 7, v6: 9 };

  function aoeBase(opt) {
    var s = "";
    AE.forEach(function (e, i) {
      var a = A[e[0]], b = A[e[1]];
      var hot = opt.crit && [1, 3, 5].indexOf(i) >= 0;
      s += arrow(a[0], a[1], b[0], b[1], hot ? "hot" : "", e[2]);
    });
    Object.keys(A).forEach(function (k) {
      var cls = "";
      if (opt.crit && ["v1", "v3", "v4", "v6"].indexOf(k) >= 0) cls = "red";
      s += node(A[k][0], A[k][1], k.slice(1), cls);
      if (opt.ve) {
        s += '<text class="fl" x="' + A[k][0] + '" y="' + (A[k][1] - 20) + '" style="fill:var(--green)">ve' + VE[k] + "</text>";
      }
      if (opt.vl) {
        s += '<text class="fl" x="' + A[k][0] + '" y="' + (A[k][1] + 22) + '" style="fill:var(--amber)">vl' + VL[k] + "</text>";
      }
    });
    return s;
  }

  var aoe = [
    { t: "AOE 网：顶点是事件，边是活动，权是持续时间。这张网只有 6 个事件、7 个活动。", s: wrap(aoeBase({})) },
    { t: "按拓扑序算最早发生时间 ve：ve[1]=0，ve[2]=3，ve[3]=2。前驱只有一个时直接加上边权。", s: wrap(aoeBase({ ve: true })) },
    { t: "汇合点取最大：ve[4]=max(3+2, 2+4)=6，ve[5]=3+3=6，ve[6]=max(6+3, 6+2)=9。总工期 9 天。", s: wrap(aoeBase({ ve: true })) },
    { t: "逆拓扑求最晚发生时间 vl：vl[6]=9 倒推，vl[5]=7（9−2），vl[4]=6（9−3），vl[2]=min(6−2,7−3)=4。", s: wrap(aoeBase({ ve: true, vl: true })) },
    { t: "ve 与 vl 相等的活动就是关键活动。连起来 v1→v3→v4→v6，长度 9，一天都不能拖。", s: wrap(aoeBase({ ve: true, vl: true, crit: true })) }
  ];

  // ---------------- AVL ----------------
  function avlTree(stage) {
    var P, E;
    if (stage < 2) {
      P = { 50: [170, 40], 30: [104, 108], 70: [236, 108] };
      if (stage >= 1) P[20] = [58, 176];
      E = [[50, 30], [50, 70]];
      if (stage >= 1) E.push([30, 20]);
    } else {
      P = { 30: [156, 38], 20: [86, 110], 50: [226, 110], 70: [286, 178] };
      E = [[30, 20], [30, 50], [50, 70]];
    }
    var s = "";
    E.forEach(function (e) {
      var a = P[e[0]], b = P[e[1]];
      s += arrow(a[0], a[1], b[0], b[1], "", "");
    });
    Object.keys(P).forEach(function (k) {
      var cls = "";
      if (stage === 1 && k === "50") cls = "red";
      if (stage === 2 && (k === "30" || k === "50")) cls = "amber";
      if (stage >= 3) cls = "green";
      s += node(P[k][0], P[k][1], k, cls);
    });
    var bf = stage === 0 ? {} : (stage <= 2 ? { 50: "+2", 30: "+1", 70: "0", 20: "0" } : { 30: "0", 20: "0", 50: "+1", 70: "0" });
    Object.keys(bf).forEach(function (k) {
      if (!P[k]) return;
      s += '<text class="fl" x="' + P[k][0] + '" y="' + (P[k][1] - 19) + '">BF ' + bf[k] + "</text>";
    });
    if (stage === 2) {
      s += '<path class="fh" d="M120,120 Q170,150 210,120"/>';
    }
    return s;
  }

  var avl = [
    { t: "插入之前：50 是根，左孩子 30、右孩子 70，两边一样高，平衡因子 0。", s: wrap(avlTree(0)) },
    { t: "插入 20，落在左子树的左子树（LL）。50 的左子树高 2、右子树高 1，BF=+2，失衡。", s: wrap(avlTree(1)) },
    { t: "LL 型做一次右旋：30 提到根，50 变成 30 的右孩子。注意旋转的是最小失衡子树。", s: wrap(avlTree(2)) },
    { t: "旋转后各结点 BF 回到 0 或 ±1。记忆：LL 右旋、RR 左旋、LR 先左后右、RL 先右后左。", s: wrap(avlTree(3)) }
  ];

  // ---------------- KMP ----------------
  var PAT = ["a", "b", "a", "b", "a", "a"];
  var NXT = [0, 1, 1, 2, 3, 4];

  function kmpFig(upto) {
    var bw = 32, gap = 6, n = 6;
    var total = n * bw + (n - 1) * gap, x0 = (340 - total) / 2, y0 = 62;
    var s = "";
    for (var i = 0; i < n; i++) {
      var x = x0 + i * (bw + gap);
      var filled = i < upto;
      s += '<rect class="' + (filled ? "fcell" : "fb") + '" x="' + x + '" y="' + y0 + '" width="' + bw + '" height="' + bw + '" rx="7"/>';
      s += '<text class="ft" x="' + (x + bw / 2) + '" y="' + (y0 + bw / 2) + '" style="fill:' + (filled ? "#fff" : "var(--dim)") + '">' + PAT[i] + "</text>";
      s += '<text class="fl" x="' + (x + bw / 2) + '" y="' + (y0 - 12) + '">' + (i + 1) + "</text>";
      if (filled && i > 1) {
        s += '<text class="fnum" x="' + (x + bw / 2) + '" y="' + (y0 + bw + 22) + '">' + NXT[i] + "</text>";
      }
    }
    s += '<text class="fl" x="170" y="' + (y0 + bw + 44) + '">next[j]</text>';
    if (upto >= 4) {
      var len = NXT[upto - 1] - 1;
      if (len > 0) {
        var xa = x0, xb = x0 + (upto - 1) * (bw + gap) - gap;
        s += '<line class="fh" x1="' + xa + '" y1="' + (y0 - 26) + '" x2="' + (xa + len * (bw + gap) - gap) + '" y2="' + (y0 - 26) + '"/>';
        s += '<line class="fh" x1="' + (xb - len * (bw + gap) + gap) + '" y1="' + (y0 - 40) + '" x2="' + xb + '" y2="' + (y0 - 40) + '"/>';
        s += '<text class="fl" x="170" y="' + (y0 - 52) + '" style="fill:var(--green)">前缀 = 后缀</text>';
      }
    }
    return s;
  }

  var kmp = [
    { t: "模式串 ababaa，下标从 1 起。约定 next[1]=0、next[2]=1，其余靠“最长相等前后缀”推。", s: wrap(kmpFig(2)) },
    { t: "P[3]=a 与 P[1]=a 相等，最长相等前后缀是 a（长 1），所以 next[3]=1+1=2。", s: wrap(kmpFig(3)) },
    { t: "P[4]=b 与 P[2]=b 相等，前缀 ab 也是后缀 ab，next[4]=3；同理 next[5]=4。", s: wrap(kmpFig(5)) },
    { t: "P[6]=a 与 P[4]=b 不等，j 退到 next[4]=3 再比，最终 next[6]=4。整串 next = 0 1 1 2 3 4。", s: wrap(kmpFig(6)) }
  ];

  return { aoe: aoe, avl: avl, kmp: kmp };
})();