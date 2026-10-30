/* How cigarettes are made: 30 s vertical explainer.
   One paused timeline, seeded randomness only, so every frame renders the same way twice.
   Beats: 0 hook, 4 curing, 8 aging + casing, 11 shredding, 13 rod, 16 freeze, 16.55 filter, 21 scan + pack, 25 scale + finale. */
window.buildScene = function () {
  var f = Kit.format();
  var W = f.width, H = f.height;
  var root = Kit.root();
  document.documentElement.style.background = "#0a0806";
  var tl = gsap.timeline({ paused: true });
  var R = Kit.rng(11);
  var E = Kit.el;
  function rnd(a, b) { return a + R() * (b - a); }
  function px(n, x, y, w, h) {
    if (x != null) n.style.left = x + "px";
    if (y != null) n.style.top = y + "px";
    if (w != null) n.style.width = w + "px";
    if (h != null) n.style.height = h + "px";
    return n;
  }
  function svgEl(tag, attrs, parent) { return Kit.svg(tag, attrs, parent); }

  // ---------- text: floating words that rise out of a blur ----------
  function txt(parent, cls, lines, top, size, mark) {
    var wrap = E("div", "tw", parent);
    wrap.style.top = top + "px";
    var inner = E("div", "ti " + cls, wrap);
    if (size) inner.style.fontSize = size + "px";
    var units = [], rows = [];
    [].concat(lines).forEach(function (ln) {
      var l = E("div", "ln", inner);
      rows.push(l);
      units = units.concat(Kit.words(l, ln, mark || "gold").units);
    });
    return { wrap: wrap, inner: inner, units: units, rows: rows };
  }
  function rise(t, at, o) {
    o = o || {};
    tl.fromTo(t.units,
      { autoAlpha: 0, y: o.dy == null ? 80 : o.dy, rotationX: o.rx == null ? -65 : o.rx, transformPerspective: 900, filter: "blur(18px)" },
      { autoAlpha: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: o.d || 0.85, ease: "expo.out", stagger: o.st == null ? 0.075 : o.st }, at);
  }
  function slam(node, at, from) {
    tl.fromTo(node, { scale: from || 2.6, autoAlpha: 0, filter: "blur(30px)" },
      { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, at);
  }
  function drift(t, a, b, amt) { tl.fromTo(t.wrap, { y: 0 }, { y: -(amt == null ? 30 : amt), duration: b - a, ease: "none" }, a); }
  function leave(t, at, o) {
    o = o || {};
    tl.fromTo(t.inner, { autoAlpha: 1, y: 0, filter: "blur(0px)" },
      { autoAlpha: 0, y: o.dy == null ? -70 : o.dy, filter: "blur(18px)", duration: o.d || 0.36, ease: "power2.in", immediateRender: false }, at);
  }
  function chip(parent, text, top, at) {
    var cw = E("div", "tw", parent);
    cw.style.top = top + "px";
    var c = E("div", "chip", cw);
    E("i", "", c);
    E("span", "", c, text);
    tl.fromTo(c, { autoAlpha: 0, y: 30, scale: 0.92, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, at);
    return c;
  }
  function glow(parent, cx, cy, size, a, b) {
    var g = E("div", "glow", parent);
    px(g, cx - size / 2, cy - size / 2, size, size);
    tl.fromTo(g, { scale: 0.85, opacity: 0.6 }, { scale: 1.12, opacity: 1, duration: b - a, ease: "sine.inOut" }, a);
    return g;
  }

  // ---------- a cigarette, side view, filter on the left ----------
  function cig(parent, x, y, len, dia, lite) {
    var c = E("div", "cig", parent);
    px(c, x, y, len, dia);
    c.style.borderRadius = Math.max(3, dia * 0.12) + "px";
    E("div", "tip", c);
    if (!lite) { E("div", "band", c); E("div", "end", c); }
    return c;
  }

  // ---------- atmosphere ----------
  E("div", "bg", root);
  [[-300, 80, 1000, "rgba(150,85,30,0.28)"], [380, 820, 1100, "rgba(110,60,22,0.30)"], [-240, 1300, 900, "rgba(170,100,40,0.20)"], [520, -240, 820, "rgba(120,70,30,0.22)"]].forEach(function (s, i) {
    var d = E("div", "smoke", root);
    px(d, s[0], s[1], s[2], s[2]);
    d.style.background = "radial-gradient(circle, " + s[3] + " 0%, transparent 65%)";
    tl.fromTo(d, { x: 0, y: 0, scale: 1 }, { x: i % 2 ? -220 : 240, y: i % 2 ? 140 : -180, scale: 1.3, duration: 30, ease: "sine.inOut" }, 0);
  });
  for (var di = 0; di < 44; di++) {
    var dd = E("div", "dust", root), ds = rnd(2, 6);
    px(dd, rnd(0, W), rnd(160, H), ds, ds);
    dd.style.opacity = rnd(0.12, 0.6).toFixed(2);
    tl.fromTo(dd, { x: 0, y: 0 }, { x: rnd(-90, 90), y: -rnd(250, 700), duration: 30, ease: "none" }, 0);
  }

  var stage = E("div", "stage", root);
  function scene(a, b, first) {
    var s = E("div", "scene", stage);
    if (first) {
      s.style.visibility = "visible";
      tl.fromTo(s, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001, immediateRender: false }, b);
    } else Kit.show(tl, s, a, b);
    return s;
  }
  function sIn(s, at, from) {
    var fr = { filter: "blur(16px)" }, to = { filter: "blur(0px)", duration: 0.5, ease: "expo.out" };
    Object.keys(from).forEach(function (k) { fr[k] = from[k]; to[k] = k === "scale" ? 1 : 0; });
    tl.fromTo(s, fr, to, at);
  }
  function sOut(s, at, to) {
    var fr = { filter: "blur(0px)" }, t2 = { filter: "blur(16px)", duration: 0.28, ease: "power3.in", immediateRender: false };
    Object.keys(to).forEach(function (k) { fr[k] = k === "scale" ? 1 : 0; t2[k] = to[k]; });
    tl.fromTo(s, fr, t2, at);
  }

  // ---------- HUD: the live counter (333 a second, 10,000 by the end) ----------
  var hud = E("div", "hud", root);
  var lab = E("div", "lab", hud);
  var dot = E("b", "", lab);
  E("span", "", lab, "Cigarettes made");
  var num = E("div", "num", hud, "0");
  var big = null;
  var cnt = { v: 0 };
  function showCount() {
    var s = Kit.fmt(Math.floor(cnt.v + 1e-6));
    num.textContent = s;
    if (big) big.textContent = s;
  }
  tl.fromTo(cnt, { v: 0 }, { v: 10000, duration: 29.4, ease: "none", onUpdate: showCount }, 0);
  tl.fromTo(dot, { opacity: 1 }, { opacity: 0.2, duration: 0.45, ease: "sine.inOut", repeat: 63, yoyo: true }, 0);
  tl.fromTo(lab, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.15);

  // Process progress: eight steps under the counter.
  var prog = E("div", "prog", root);
  var bars = E("div", "bars", prog);
  var stepBox = E("div", "step", prog);
  var STEPS = [["Curing", 4, 8], ["Aging", 8, 9.4], ["Casing", 9.4, 11], ["Cutting", 11, 13], ["Making", 13, 16.55], ["Filter", 16.55, 21], ["Inspection", 21, 23], ["Packing", 23, 25]];
  STEPS.forEach(function (s, i) {
    var b = E("div", "bar", bars), fl = E("s", "", b);
    tl.fromTo(fl, { scaleX: 0 }, { scaleX: 1, duration: s[2] - s[1], ease: "none" }, s[1]);
    var sp = E("span", "", stepBox, "Step 0" + (i + 1) + " / 08   " + s[0]);
    tl.fromTo(sp, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" }, s[1]);
    if (i < STEPS.length - 1) tl.fromTo(sp, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.2, ease: "power2.in", immediateRender: false }, s[2] - 0.2);
  });
  tl.fromTo(prog, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, 3.9);
  tl.fromTo(prog, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, 25.0);

  // ---------- overlays ----------
  var ff = E("div", "freeze-frame", root);
  for (var fi = 0; fi < 4; fi++) E("i", "", ff);
  E("div", "vignette", root).setAttribute("data-layout-allow-occlusion", "");
  var grain = E("div", "grain", root);
  grain.setAttribute("data-layout-allow-occlusion", "");
  var flash = E("div", "flash", root);
  flash.setAttribute("data-layout-allow-occlusion", "");
  function flashAt(at, peak, d) { tl.fromTo(flash, { opacity: peak }, { opacity: 0, duration: d || 0.35, ease: "power2.out", immediateRender: false }, at); }
  var gp = { k: 0 };
  tl.fromTo(gp, { k: 0 }, { k: 720, duration: 30, ease: "none", onUpdate: function () {
    var k = Math.floor(gp.k);
    grain.style.backgroundPosition = ((k * 137) % 260) + "px " + ((k * 91) % 260) + "px";
  } }, 0);
  // Camera shake: amplitude follows sin(pi p), so it starts and ends at rest from any seek.
  function shake(at, d, amp) {
    var o = { p: 0 }, seed = at * 7.3;
    tl.fromTo(o, { p: 0 }, { p: 1, duration: d, ease: "none", onUpdate: function () {
      var a = amp * Math.sin(Math.PI * o.p);
      gsap.set(stage, { x: a * Math.sin(o.p * 71 + seed), y: a * Math.cos(o.p * 53 + seed * 1.7) });
    } }, at);
  }

  // =====================================================================
  // 1. HOOK (0 to 4): a river of cigarettes, 20,000 a minute, then the filter question.
  // =====================================================================
  var s1 = scene(0, 4.0, true);
  s1.style.transformOrigin = "257px 962px";
  var rv = E("div", "", s1);
  rv.style.cssText = "position:absolute;left:-760px;top:-560px;width:2600px;height:3040px;";
  gsap.set(rv, { rotation: -16 });
  var DEPTH = [
    { lanes: 7, sc: 0.5, sp: 800, op: 0.28, f: "blur(2px)" },
    { lanes: 6, sc: 0.78, sp: 1400, op: 0.6, f: "url(#mblur2)" },
    { lanes: 5, sc: 1.12, sp: 2200, op: 1, f: "url(#mblur)" }
  ];
  DEPTH.forEach(function (L) {
    var len = 260 * L.sc, dia = 46 * L.sc, pitch = len * 1.6;
    for (var j = 0; j < L.lanes; j++) {
      var sp = L.sp * rnd(0.9, 1.12), travel = sp * 4.1;
      var count = Math.ceil((2600 + travel) / pitch) + 1;
      var lane = E("div", "lane", rv);
      px(lane, 0, (j + rnd(0.1, 0.9)) * (3040 / L.lanes), count * pitch, dia);
      lane.style.opacity = L.op;
      lane.style.filter = L.f;
      for (var k = 0; k < count; k++) cig(lane, k * pitch + rnd(0, pitch * 0.2), 0, len, dia, true);
      var x0 = -rnd(0, pitch);
      tl.fromTo(lane, { x: x0 }, { x: x0 - travel, duration: 4.1, ease: "none" }, 0);
    }
  });
  tl.fromTo(rv, { scale: 1 }, { scale: 1.12, duration: 4, ease: "none" }, 0);
  var dimA = E("div", "layer", s1);
  dimA.style.background = "radial-gradient(75% 30% at 50% 44%, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.5) 55%, rgba(10,8,6,0.12) 100%)";
  var dimB = E("div", "layer", s1);
  dimB.style.background = "rgba(8,6,4,0.8)";
  tl.fromTo(dimB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 1.95);
  glow(s1, 540, 800, 1000, 0, 4);

  var n20 = txt(s1, "h1", "*20,000*", 640, 236);
  var cpm = txt(s1, "h2", "Cigarettes a minute.", 900, 78);
  slam(n20.inner, 0.04, 2.8);
  flashAt(0.06, 0.35, 0.5);
  rise(cpm, 0.42, { st: 0.09 });
  drift(n20, 0, 2.2, 40);
  drift(cpm, 0, 2.2, 30);
  leave(n20, 1.9, { dy: -90 });
  leave(cpm, 1.96, { dy: -60 });

  var hero = E("div", "layer", s1);
  hero.style.transformOrigin = "257px 962px";
  var hc = cig(hero, 130, 900, 820, 124);
  tl.fromTo(hc, { x: 1000, rotation: 10, autoAlpha: 0 }, { x: 0, rotation: 0, autoAlpha: 1, duration: 0.85, ease: "expo.out" }, 2.0);
  tl.fromTo(hero, { scale: 1 }, { scale: 1.07, duration: 1.7, ease: "none" }, 2.3);
  [0, 1].forEach(function (i) {
    var r = E("div", "ring", hero);
    px(r, 107, 812, 300, 300);
    tl.fromTo(r, { scale: 0.3, autoAlpha: 0 }, { scale: 1.2, autoAlpha: 1, duration: 0.5, ease: "expo.out" }, 2.55 + i * 0.35);
    tl.fromTo(r, { scale: 1.2, autoAlpha: 1 }, { scale: 1.7, autoAlpha: 0, duration: 0.45, ease: "power2.in", immediateRender: false }, 3.05 + i * 0.3);
  });
  var btf = txt(s1, "serif", "But the filter?", 650, 110);
  var nwyt = txt(s1, "h2", "Not what you *think.*", 1130, 84);
  rise(btf, 2.15);
  rise(nwyt, 2.85, { st: 0.08 });
  drift(btf, 2.1, 4, 24);
  drift(nwyt, 2.8, 4, 20);
  sOut(s1, 3.72, { scale: 2.8 });

  // =====================================================================
  // 2. CURING (4 to 8): a green leaf turns gold in a hot barn.
  // =====================================================================
  var s2 = scene(4.0, 8.0);
  sIn(s2, 4.0, { scale: 0.7 });
  sOut(s2, 7.72, { y: -320 });
  glow(s2, 590, 1060, 1000, 4, 8);
  var h2t = txt(s2, "h1", ["Cured in", "hot *barns.*"], 450, 112);
  rise(h2t, 4.15);
  drift(h2t, 4, 8, 34);

  var barn = svgEl("svg", { width: 760, height: 660, viewBox: "0 0 760 660" }, s2);
  barn.style.cssText = "position:absolute;left:210px;top:760px;overflow:visible";
  var barnLines = ["M40 640 L40 250 L380 40 L720 250 L720 640 Z", "M300 640 L300 430 L460 430 L460 640", "M300 430 L460 640 M460 430 L300 640", "M110 250 L650 250"].map(function (d) {
    return svgEl("path", { d: d, fill: "none", stroke: "rgba(244,183,64,0.38)", "stroke-width": 4, "stroke-linejoin": "round" }, barn);
  });
  barnLines.forEach(function (p, i) { Kit.draw(tl, p, 4.2 + i * 0.15, 1.0, "power2.inOut"); });

  var heat = E("div", "", s2);
  heat.style.cssText = "position:absolute;left:250px;top:980px;width:680px;height:520px;";
  var hs = svgEl("svg", { width: 680, height: 520, viewBox: "0 0 680 520" }, heat);
  for (var hi = 0; hi < 6; hi++) {
    var hx = 40 + hi * 120;
    svgEl("path", { d: "M" + hx + " 520 q 22 -40 0 -80 q -22 -40 0 -80 q 22 -40 0 -80 q -22 -40 0 -80 q 22 -40 0 -80", fill: "none", stroke: "rgba(255,140,60,0.35)", "stroke-width": 5, "stroke-linecap": "round" }, hs);
  }
  tl.fromTo(heat, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: -120, duration: 3.4, ease: "none" }, 4.6);

  var LEAF = "M200 880 C 110 770, 18 590, 32 400 C 46 210, 140 70, 200 14 C 262 72, 356 214, 368 404 C 380 594, 290 772, 200 880 Z";
  var leafBox = E("div", "", s2);
  leafBox.style.cssText = "position:absolute;left:446px;top:730px;width:288px;height:648px;";
  var lsv = svgEl("svg", { width: 288, height: 648, viewBox: "0 0 400 900" }, leafBox);
  lsv.style.overflow = "visible";
  var defs = svgEl("defs", {}, lsv);
  var lg = svgEl("linearGradient", { id: "lgGreen", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  [["0", "#86c95f"], ["0.5", "#4f8f3c"], ["1", "#2b5824"]].forEach(function (s) { svgEl("stop", { offset: s[0], "stop-color": s[1] }, lg); });
  var lgg = svgEl("linearGradient", { id: "lgGold", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  [["0", "#ffe9a6"], ["0.45", "#f2b544"], ["0.8", "#c27a22"], ["1", "#8a4f12"]].forEach(function (s) { svgEl("stop", { offset: s[0], "stop-color": s[1] }, lgg); });
  var cg = svgEl("clipPath", { id: "cpGold", clipPathUnits: "userSpaceOnUse" }, defs);
  var cgRect = svgEl("rect", { x: -60, y: 920, width: 520, height: 1000 }, cg);
  var cl = svgEl("clipPath", { id: "cpLeaf", clipPathUnits: "userSpaceOnUse" }, defs);
  svgEl("path", { d: LEAF }, cl);
  var fb = svgEl("filter", { id: "fbFront", x: "-20%", y: "-200%", width: "140%", height: "500%" }, defs);
  svgEl("feGaussianBlur", { stdDeviation: 10 }, fb);
  svgEl("path", { d: LEAF, fill: "url(#lgGreen)" }, lsv);
  svgEl("path", { d: LEAF, fill: "url(#lgGold)", "clip-path": "url(#cpGold)" }, lsv);
  var frontG = svgEl("g", { "clip-path": "url(#cpLeaf)" }, lsv);
  var front = svgEl("rect", { x: -60, y: 905, width: 520, height: 30, fill: "#ffe2a0", filter: "url(#fbFront)" }, frontG);
  svgEl("path", { d: LEAF, fill: "none", stroke: "rgba(255,255,235,0.35)", "stroke-width": 4 }, lsv);
  var veins = [svgEl("path", { d: "M200 876 C 196 640, 204 300, 200 34", fill: "none", stroke: "rgba(255,250,220,0.7)", "stroke-width": 7, "stroke-linecap": "round" }, lsv)];
  for (var vy = 790; vy >= 140; vy -= 82) {
    var p = Math.sin(Math.PI * (880 - vy) / 866), hw = 168 * Math.pow(Math.max(p, 0.05), 0.75);
    [-1, 1].forEach(function (sgn) {
      veins.push(svgEl("path", { d: "M200 " + vy + " Q " + (200 + sgn * hw * 0.45) + " " + (vy - 40) + " " + (200 + sgn * hw * 0.88) + " " + (vy - 104), fill: "none", stroke: "rgba(255,250,220,0.5)", "stroke-width": 3.5, "stroke-linecap": "round" }, lsv));
    });
  }
  tl.fromTo(leafBox, { scale: 0.4, rotation: -25, y: 200, autoAlpha: 0 }, { scale: 1, rotation: 0, y: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out" }, 4.05);
  tl.fromTo(leafBox, { rotation: 0 }, { rotation: 3, duration: 3.0, ease: "sine.inOut", immediateRender: false }, 4.95);
  veins.forEach(function (v, i) {
    var len = v.getTotalLength();
    v.style.strokeDasharray = len + " " + len;
    tl.fromTo(v, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 4.3 + i * 0.03);
  });
  tl.fromTo(cgRect, { attr: { y: 920 } }, { attr: { y: -30 }, duration: 2.3, ease: "power1.inOut" }, 5.0);
  tl.fromTo(front, { attr: { y: 905 } }, { attr: { y: -45 }, duration: 2.3, ease: "power1.inOut" }, 5.0);

  var th = E("div", "thermo", s2);
  px(th, 92, 880, 44, 400);
  var thf = E("s", "", th);
  var fcl = E("div", "lbl", s2, "Flue cured");
  px(fcl, 44, 828);
  var day = E("div", "daytag", s2, "DAY 01");
  px(day, 44, 1300);
  tl.fromTo(th, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out" }, 4.4);
  tl.fromTo([fcl, day], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.1 }, 4.6);
  tl.fromTo(thf, { scaleY: 0 }, { scaleY: 1, duration: 2.4, ease: "power1.inOut" }, 4.9);
  var dp = { v: 0 };
  tl.fromTo(dp, { v: 0 }, { v: 1, duration: 2.3, ease: "power1.inOut", onUpdate: function () { day.textContent = "DAY 0" + (1 + Math.min(6, Math.floor(dp.v * 7))); } }, 5.0);
  var sub2 = txt(s2, "serif", "until it turns *gold.*", 1418, 84);
  rise(sub2, 5.6);
  drift(sub2, 5.5, 8, 18);

  // =====================================================================
  // 3. AGING + CASING (8 to 11): time spins, then the leaf is sprayed.
  // =====================================================================
  var s3 = scene(8.0, 11.0);
  sIn(s3, 8.0, { y: 420 });
  sOut(s3, 10.72, { x: -420 });
  glow(s3, 540, 1040, 1000, 8, 11);
  var h3a = txt(s3, "h1", ["Aged for", "*years.*"], 450, 112);
  rise(h3a, 8.05);
  drift(h3a, 8, 9.4, 22);
  leave(h3a, 9.22);

  var dialBox = E("div", "", s3);
  dialBox.style.cssText = "position:absolute;left:240px;top:760px;width:600px;height:600px;";
  var dsv = svgEl("svg", { width: 600, height: 600, viewBox: "0 0 600 600" }, dialBox);
  var dd2 = svgEl("defs", {}, dsv);
  var ag = svgEl("linearGradient", { id: "arcG", x1: 0, y1: 0, x2: 1, y2: 1 }, dd2);
  [["0", "#fff0c4"], ["1", "#e0952f"]].forEach(function (s) { svgEl("stop", { offset: s[0], "stop-color": s[1] }, ag); });
  svgEl("circle", { cx: 300, cy: 300, r: 240, fill: "rgba(20,14,8,0.6)", stroke: "rgba(255,230,180,0.14)", "stroke-width": 16 }, dsv);
  for (var tk = 0; tk < 72; tk++) {
    var an = tk / 72 * Math.PI * 2, r1 = 266, r2 = tk % 6 ? 280 : 294;
    svgEl("line", { x1: 300 + r1 * Math.cos(an), y1: 300 + r1 * Math.sin(an), x2: 300 + r2 * Math.cos(an), y2: 300 + r2 * Math.sin(an), stroke: "rgba(255,230,180," + (tk % 6 ? 0.25 : 0.55) + ")", "stroke-width": 3 }, dsv);
  }
  var arcG = svgEl("g", {}, dsv);
  svgEl("circle", { cx: 300, cy: 300, r: 240, fill: "none", stroke: "url(#arcG)", "stroke-width": 16, "stroke-linecap": "round", "stroke-dasharray": "420 1508" }, arcG);
  var mon = E("div", "h2", dialBox, "JAN");
  mon.style.cssText = "position:absolute;left:0;right:0;top:232px;text-align:center;font-size:110px;";
  var yr = E("div", "lbl", dialBox, "Year 01");
  yr.style.cssText = "left:0;right:0;top:362px;text-align:center;font-size:28px;";
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  tl.fromTo(dialBox, { scale: 0.6, rotation: -40, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.7, ease: "expo.out" }, 8.05);
  var mp = { v: 0 };
  tl.fromTo(mp, { v: 0 }, { v: 1, duration: 1.3, ease: "power2.inOut", onUpdate: function () {
    var k = Math.min(23, Math.floor(mp.v * 24));
    mon.textContent = MONTHS[k % 12];
    yr.textContent = "Year 0" + (1 + Math.floor(k / 12));
    gsap.set(arcG, { rotation: -90 + mp.v * 720, svgOrigin: "300 300" });
  } }, 8.1);
  tl.fromTo(dialBox, { scale: 1, autoAlpha: 1, filter: "blur(0px)" }, { scale: 0.5, autoAlpha: 0, filter: "blur(14px)", duration: 0.3, ease: "power3.in", immediateRender: false }, 9.28);

  var h3b = txt(s3, "h1", ["Sprayed with", "sugars + *flavor.*"], 450, 90);
  rise(h3b, 9.4, { st: 0.06 });
  drift(h3b, 9.4, 11, 20);
  var NZ = [240, 540, 840].map(function (cx) {
    var m = E("div", "mist", s3);
    px(m, cx - 150, 832);
    var n = E("div", "nozzle", s3);
    px(n, cx - 45, 700);
    return { n: n, m: m, cx: cx };
  });
  tl.fromTo(NZ.map(function (o) { return o.n; }), { y: -280, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", stagger: 0.06 }, 9.35);
  tl.fromTo(NZ.map(function (o) { return o.m; }), { scaleY: 0, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, duration: 0.4, ease: "power3.out", stagger: 0.05 }, 9.7);
  var bed = E("div", "bed", s3);
  px(bed, null, 1236, null, 120);
  tl.fromTo(bed, { y: 300, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: "expo.out" }, 9.45);
  tl.fromTo(bed, { filter: "brightness(1) saturate(1)" }, { filter: "brightness(1.3) saturate(1.25)", duration: 1.0, ease: "none", immediateRender: false }, 9.9);
  for (var dr = 0; dr < 42; dr++) {
    var o = NZ[dr % 3], d = E("div", "drop", s3);
    px(d, o.cx + rnd(-14, 14), 866);
    var at = 9.75 + rnd(0, 0.95), dur = rnd(0.32, 0.46);
    tl.fromTo(d, { x: 0, y: 0, autoAlpha: 0 }, { x: rnd(-125, 125), y: rnd(330, 380), autoAlpha: 1, duration: dur, ease: "power1.in" }, at);
    tl.fromTo(d, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.05, immediateRender: false }, at + dur);
  }
  chip(s3, "Casing: sugars, glycerol, flavorings", 1404, 9.95);

  // =====================================================================
  // 4. SHREDDING (11 to 13): a spinning drum, hair thin strands.
  // =====================================================================
  var s4 = scene(11.0, 13.0);
  sIn(s4, 11.0, { x: 520 });
  sOut(s4, 12.72, { y: 340 });
  glow(s4, 540, 930, 900, 11, 13);
  var SH = 150, NS = 7, slInner = [];
  for (var si = 0; si < NS; si++) {
    var band = E("div", "slice", s4);
    var bh = SH / NS;
    px(band, 0, 440 + si * bh, null, bh + 1);
    band.style.right = "0";
    var bi = E("div", "h1", band, "Shredded");
    bi.style.cssText += "font-size:150px;line-height:" + SH + "px;top:" + (-si * bh) + "px;height:" + SH + "px;";
    bi.setAttribute("data-layout-allow-overflow", "");
    slInner.push(bi);
    tl.fromTo(bi, { x: si % 2 ? 900 : -900 }, { x: 0, duration: 0.55, ease: "expo.out" }, 11.02 + si * 0.03);
    tl.fromTo(bi, { x: 0 }, { x: si % 2 ? 16 : -16, duration: 0.05, ease: "none", yoyo: true, repeat: 1, immediateRender: false }, 11.9);
  }
  var sub4 = txt(s4, "serif", "a millimeter thin.", 612, 82);
  rise(sub4, 11.35);
  drift(sub4, 11.3, 13, 16);

  var sheet = E("div", "sheet", s4);
  px(sheet, -20, 917, 420, 26);
  sheet.style.background = "repeating-linear-gradient(90deg, #c88a34 0 18px, #e8b04e 18px 26px, #9a6424 26px 40px)";
  tl.fromTo(sheet, { backgroundPosition: "0px 0px" }, { backgroundPosition: "640px 0px", duration: 2, ease: "none" }, 11.0);
  var drum = E("div", "drum", s4);
  px(drum, 360, 750, 360, 360);
  var dsg = svgEl("svg", { width: 360, height: 360, viewBox: "0 0 360 360" }, drum);
  var mdef = svgEl("defs", {}, dsg);
  var mg = svgEl("radialGradient", { id: "metal", cx: "40%", cy: "35%", r: "70%" }, mdef);
  [["0", "#f2eee6"], ["0.55", "#8a847a"], ["1", "#24201b"]].forEach(function (s) { svgEl("stop", { offset: s[0], "stop-color": s[1] }, mg); });
  svgEl("circle", { cx: 180, cy: 180, r: 176, fill: "url(#metal)", stroke: "rgba(255,230,180,0.6)", "stroke-width": 3 }, dsg);
  for (var bl = 0; bl < 14; bl++) {
    var ba = bl / 14 * Math.PI * 2, bb = ba + 0.12;
    svgEl("path", { d: "M" + (180 + 58 * Math.cos(ba)) + " " + (180 + 58 * Math.sin(ba)) + " L" + (180 + 174 * Math.cos(ba)) + " " + (180 + 174 * Math.sin(ba)) + " L" + (180 + 150 * Math.cos(bb)) + " " + (180 + 150 * Math.sin(bb)) + " Z", fill: "rgba(255,252,245,0.85)", stroke: "rgba(60,50,40,0.6)", "stroke-width": 1.5 }, dsg);
  }
  svgEl("circle", { cx: 180, cy: 180, r: 54, fill: "#1e1a15", stroke: "#f4b740", "stroke-width": 4 }, dsg);
  svgEl("circle", { cx: 180, cy: 180, r: 14, fill: "#f4b740" }, dsg);
  tl.fromTo(drum, { rotation: 0 }, { rotation: 1080, duration: 2, ease: "none" }, 11.0);
  for (var stI = 0; stI < 72; stI++) {
    var sd = E("div", "strand", s4);
    px(sd, rnd(430, 650), 1080, rnd(2.5, 4), rnd(50, 115));
    sd.style.background = "linear-gradient(180deg, " + (R() > 0.5 ? "#f0bd5c" : "#d39a3e") + ", " + (R() > 0.5 ? "#8a5a1e" : "#6e4514") + ")";
    var r0 = rnd(-30, 30);
    tl.fromTo(sd, { y: 0, rotation: r0, autoAlpha: 0 }, { y: rnd(150, 215), rotation: r0 + rnd(-25, 25), autoAlpha: 1, duration: rnd(0.4, 0.6), ease: "power1.in" }, 11.1 + stI * 0.024);
  }
  var rul = E("div", "ruler", s4);
  px(rul, 160, 1468, 480, 50);
  for (var ri = 0; ri <= 16; ri++) {
    var tick = E("i", "", rul);
    px(tick, ri * 30 - 1.5, 0, null, ri % 5 ? 18 : 34);
    if (ri === 14 || ri === 15) { tick.style.background = "#f4b740"; tick.style.height = "46px"; tick.style.boxShadow = "0 0 12px #f4b740"; }
  }
  var co = E("div", "callout", s4, "≈ 1 MM");
  px(co, 672, 1452);
  tl.fromTo(rul, { autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out" }, 11.55);
  tl.fromTo(co, { autoAlpha: 0, x: 40, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, 11.7);

  // =====================================================================
  // 5. THE ROD (13 to 16): shreds become one endless wrapped rod, sliced. Freezes at 16.
  // =====================================================================
  var s5 = scene(13.0, 16.55);
  sIn(s5, 13.0, { y: -420 });
  glow(s5, 540, 1060, 900, 13, 16.55);
  var h5 = txt(s5, "h1", ["One endless", "*rod.*"], 450, 112);
  rise(h5, 13.05);
  drift(h5, 13, 16, 24);
  var sub5 = txt(s5, "serif", "wrapped in paper, then sliced.", 694, 62);
  rise(sub5, 13.55, { st: 0.05 });
  drift(sub5, 13.5, 16, 14);

  var V = 700, KX = 260, ROD_Y = 1040, ROD_H = 76;
  var hop = E("div", "hopper", s5);
  px(hop, 690, 826, 300, 150);
  for (var sh = 0; sh < 26; sh++) {
    var fs = E("div", "strand", s5);
    px(fs, rnd(800, 880), 966, 3, rnd(26, 50));
    tl.fromTo(fs, { y: 0, autoAlpha: 1, rotation: rnd(-20, 20) }, { y: 70, autoAlpha: 0.2, duration: 0.32, ease: "power1.in", repeat: 8, repeatDelay: 0.02 }, 13.0 + rnd(0, 0.32));
  }
  var winB = E("div", "win", s5);
  px(winB, 600, ROD_Y, 480, ROD_H);
  var tob = E("div", "tobacco", winB);
  px(tob, 0, 0, 3200, ROD_H);
  tl.fromTo(tob, { x: 0 }, { x: -V * 3, duration: 3, ease: "none" }, 13.0);
  var winW = E("div", "win", s5);
  px(winW, 0, ROD_Y, 560, ROD_H);
  var strip = E("div", "", winW);
  strip.style.cssText = "position:absolute;left:0;top:0;height:100%;width:4000px;";
  tl.fromTo(strip, { x: 0 }, { x: -V * 3, duration: 3, ease: "none" }, 13.0);
  var knife = E("div", "knife", s5);
  px(knife, KX - 9, 900, 18, 150);
  var spark = E("div", "spark", s5);
  px(spark, KX - 30, ROD_Y - 10, 60, 60);
  for (var sg = 0; sg < 19; sg++) {
    var L0 = sg * 175 - 525, seg = E("div", "seg", strip);
    px(seg, L0 + 525, 0, 175, ROD_H);
    seg.style.left = L0 + "px";
    var tc = 13 + (L0 + 175 - KX) / V;
    if (tc < 13) tl.fromTo(seg, { x: -200 * (13 - tc) }, { x: -200 * (16 - tc), duration: 3, ease: "none" }, 13.0);
    else if (tc < 16) {
      tl.fromTo(seg, { x: 0 }, { x: -200 * (16 - tc), duration: 16 - tc, ease: "none" }, tc);
      tl.fromTo(knife, { y: 0 }, { y: 78, duration: 0.05, ease: "power2.in", yoyo: true, repeat: 1, immediateRender: false }, tc - 0.06);
      tl.fromTo(spark, { opacity: 1, scale: 0.6 }, { opacity: 0, scale: 1.6, duration: 0.16, ease: "power2.out", immediateRender: false }, tc);
    }
  }
  var garn = E("div", "garn", s5);
  px(garn, 470, 986, 200, 184);
  var gl = E("div", "lbl", garn, "Paper");
  gl.style.cssText = "left:0;right:0;top:76px;text-align:center;font-size:24px;";
  [["Knife", KX], ["Paper wrap", 570], ["Tobacco", 860]].forEach(function (t, i) {
    var tg = E("div", "tag", s5, t[0]);
    px(tg, t[1], 1196);
    tl.fromTo(tg, { xPercent: -50, autoAlpha: 0, y: 24 }, { xPercent: -50, autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }, 13.65 + i * 0.12);
  });
  tl.fromTo([hop, garn, knife, winB, winW], { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 }, 13.05);

  // The freeze: motion stops at 16.0, colour drains, brackets snap on.
  tl.fromTo(s5, { filter: "grayscale(0) brightness(1) contrast(1)" }, { filter: "grayscale(1) brightness(0.45) contrast(1.3)", duration: 0.06, ease: "none", immediateRender: false }, 16.0);
  tl.fromTo(ff, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: "power3.out" }, 16.0);
  tl.fromTo(ff, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, immediateRender: false }, 16.55);
  flashAt(16.0, 0.85, 0.22);
  var s5b = scene(16.0, 16.55);
  var nf = txt(s5b, "serif", "Now, the filter.", 1268, 120);
  rise(nf, 16.04, { d: 0.4, st: 0.05, dy: 50 });

  // =====================================================================
  // 6. THE FILTER (16.55 to 21): not cotton, plastic.
  // =====================================================================
  var s6 = scene(16.55, 21.0);
  sOut(s6, 20.75, { scale: 0.8 });
  var bk = E("div", "layer", s6);
  bk.style.background = "radial-gradient(80% 60% at 50% 50%, #1c100a 0%, #070504 72%)";
  var rg = E("div", "redglow", s6);
  px(rg, -60, 450, 1200, 1200);
  tl.fromTo(rg, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out" }, 17.55);
  tl.fromTo(rg, { autoAlpha: 1 }, { autoAlpha: 0.35, duration: 1.2, ease: "power2.out", immediateRender: false }, 18.5);

  var nc = txt(s6, "h1", ["Not", "cotton."], 770, 150);
  var cu = nc.units[1];
  var strike = E("div", "strike", s6);
  px(strike, 60 + cu.offsetLeft - 16, 770 + cu.offsetTop + cu.offsetHeight * 0.5 - 7, cu.offsetWidth + 32, 14);
  tl.fromTo(nc.units, { autoAlpha: 0, scale: 1.8, filter: "blur(20px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.4, ease: "expo.out", stagger: 0.18 }, 16.6);
  tl.fromTo(strike, { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "power3.out" }, 17.08);
  tl.fromTo(nc.rows[1], { opacity: 1 }, { opacity: 0.45, duration: 0.2, immediateRender: false }, 17.12);
  leave(nc, 17.42, { dy: 0, d: 0.14 });
  tl.fromTo(strike, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.14, immediateRender: false }, 17.42);

  var pl = txt(s6, "h1 hot-solid", "Plastic.", 838, 176);
  slam(pl.inner, 17.55, 3.4);
  tl.fromTo(pl.inner, { textShadow: "-26px 0px 0px rgba(0,240,255,0.85), 26px 0px 0px rgba(255,0,90,0.85)" },
    { textShadow: "-5px 0px 0px rgba(0,240,255,0.5), 5px 0px 0px rgba(255,0,90,0.5)", duration: 0.7, ease: "power3.out" }, 17.55);
  flashAt(17.56, 0.7, 0.35);
  shake(17.58, 0.45, 26);
  tl.fromTo(pl.wrap, { y: 0 }, { y: -384, duration: 0.55, ease: "expo.inOut" }, 18.55);
  tl.fromTo(pl.inner, { scale: 1 }, { scale: 0.6, duration: 0.55, ease: "expo.inOut", immediateRender: false }, 18.55);
  var sub6 = txt(s6, "serif", "thousands of fibers, one plug.", 606, 62);
  rise(sub6, 19.1, { st: 0.05 });
  drift(sub6, 19.1, 21, 12);

  var fc = E("div", "fcross", s6);
  px(fc, 310, 820, 460, 460);
  var fsv = svgEl("svg", { width: 460, height: 460, viewBox: "0 0 460 460" }, fc);
  var fibers = [];
  for (var fbI = 0; fbI < 80; fbI++) {
    var x1 = rnd(-20, 480), y1 = rnd(-20, 480);
    fibers.push(svgEl("path", {
      d: "M" + x1 + " " + y1 + " C " + (x1 + rnd(-160, 160)) + " " + (y1 + rnd(-160, 160)) + ", " + (x1 + rnd(-200, 200)) + " " + (y1 + rnd(-200, 200)) + ", " + (x1 + rnd(-240, 240)) + " " + (y1 + rnd(-240, 240)),
      fill: "none", stroke: R() > 0.3 ? "rgba(140,128,110,0.55)" : "rgba(255,255,255,0.9)", "stroke-width": rnd(1.2, 2.6), "stroke-linecap": "round"
    }, fsv));
  }
  tl.fromTo(fc, { scale: 0.2, rotation: -40, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, 18.65);
  tl.fromTo(fc, { scale: 1 }, { scale: 1.1, duration: 0.65, ease: "none", immediateRender: false }, 19.25);
  tl.fromTo(fc, { scale: 1.1, autoAlpha: 1, filter: "blur(0px)" }, { scale: 0.3, autoAlpha: 0, filter: "blur(12px)", duration: 0.28, ease: "power3.in", immediateRender: false }, 19.9);
  fibers.forEach(function (fp, i) {
    var len = fp.getTotalLength();
    fp.style.strokeDasharray = len + " " + len;
    tl.fromTo(fp, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 18.75 + i * 0.008);
  });
  chip(s6, "Cellulose acetate", 1380, 19.05);

  // One plug between two rods, wrapped in tipping paper, cut in the middle: two cigarettes.
  var gL = E("div", "", s6), gR = E("div", "", s6);
  [gL, gR].forEach(function (g) { g.style.cssText = "position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px 1050px;"; });
  var rodL = E("div", "seg", gL); px(rodL, 165, 1013, 300, 74);
  var plugL = E("div", "plug", gL); px(plugL, 465, 1013, 75, 74);
  var tipL = E("div", "tipping", gL); px(tipL, 430, 1009, 110, 82); tipL.style.transformOrigin = "100% 50%";
  var rodR = E("div", "seg", gR); px(rodR, 615, 1013, 300, 74);
  var plugR = E("div", "plug", gR); px(plugR, 540, 1013, 75, 74);
  var tipR = E("div", "tipping", gR); px(tipR, 540, 1009, 110, 82); tipR.style.transformOrigin = "0% 50%";
  var cut = E("div", "cutline", s6); px(cut, 538, 985, 5, 130);
  tl.fromTo(rodL, { x: -720 }, { x: 0, duration: 0.4, ease: "expo.out" }, 20.0);
  tl.fromTo(rodR, { x: 720 }, { x: 0, duration: 0.4, ease: "expo.out" }, 20.0);
  tl.fromTo([plugL, plugR], { y: -520, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "expo.out" }, 20.02);
  tl.fromTo([tipL, tipR], { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power3.inOut" }, 20.34);
  tl.fromTo(cut, { scaleY: 0, autoAlpha: 1 }, { scaleY: 1, duration: 0.1, ease: "power2.out" }, 20.58);
  tl.fromTo(cut, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15, immediateRender: false }, 20.7);
  tl.fromTo(gL, { x: 0, rotation: 0 }, { x: -56, rotation: -3, duration: 0.3, ease: "expo.out" }, 20.62);
  tl.fromTo(gR, { x: 0, rotation: 0 }, { x: 56, rotation: 3, duration: 0.3, ease: "expo.out" }, 20.62);

  // =====================================================================
  // 7. INSPECTION + PACK (21 to 25)
  // =====================================================================
  var s7 = scene(21.0, 25.0);
  sIn(s7, 21.0, { scale: 1.25 });
  sOut(s7, 24.75, { scale: 0.82 });
  glow(s7, 540, 1050, 1000, 21, 25);
  var h7a = txt(s7, "h1", ["Every stick", "*scanned.*"], 450, 112);
  rise(h7a, 21.05);
  drift(h7a, 21, 23, 18);
  leave(h7a, 22.82);

  var win = E("div", "win", s7);
  px(win, 0, 700, 1080, 720);
  win.style.webkitMaskImage = win.style.maskImage = "linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)";
  var col = E("div", "layer", win);
  tl.fromTo(col, { y: 0 }, { y: -1500, duration: 2.0, ease: "none" }, 21.0);
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24"><path d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';
  for (var ci = 0; ci < 8; ci++) {
    var top = 600 + ci * 120, ti = 21 + (top + 33 - 340) / 750, bad = ci === 4;
    var c = cig(col, 230, top, 560, 66);
    var hl = E("div", "hl", c);
    tl.fromTo(hl, { opacity: 0 }, { opacity: 0.9, duration: 0.08, yoyo: true, repeat: 1, ease: "none" }, ti - 0.06);
    var tk2 = E("div", "tick " + (bad ? "bad" : "ok"), col);
    tk2.innerHTML = bad ? CROSS : CHECK;
    px(tk2, 820, top + 6, 54, 54);
    tl.fromTo(tk2, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(2.5)" }, ti);
    if (bad) {
      var rj = E("div", "rej", col, "Reject");
      px(rj, 790, top + 70);
      tl.fromTo(rj, { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.25, ease: "power3.out" }, ti + 0.05);
      tl.fromTo(c, { x: 0, rotation: 0 }, { x: -1000, rotation: -35, duration: 0.45, ease: "power2.in" }, ti + 0.2);
      for (var pf = 0; pf < 12; pf++) {
        var pu = E("div", "puff", col);
        px(pu, 760, top + 22);
        tl.fromTo(pu, { x: 0, y: 0, scale: 0.3, autoAlpha: 0.9 }, { x: rnd(-300, -60), y: rnd(-70, 70), scale: rnd(1.5, 3.2), autoAlpha: 0, duration: 0.5, ease: "power2.out" }, ti + 0.2);
      }
    }
  }
  var sf = E("div", "scanfield", s7);
  px(sf, 150, 980, 780, 120);
  var sl = E("div", "scanline", s7);
  px(sl, 150, 1037, 780, 6);
  tl.fromTo([sl, sf], { scaleX: 0, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.4, ease: "expo.out" }, 21.1);
  tl.fromTo([win, sl, sf], { autoAlpha: 1, filter: "blur(0px)" }, { autoAlpha: 0, filter: "blur(14px)", duration: 0.3, ease: "power2.in", immediateRender: false }, 22.85);

  var h7b = txt(s7, "h1", "20 per *pack.*", 450, 118);
  rise(h7b, 23.0);
  drift(h7b, 23, 25, 18);
  var pack = E("div", "pack", s7);
  px(pack, 170, 880, 740, 312);
  var butts = [], ROWS = [7, 6, 7];
  ROWS.forEach(function (n, r) {
    for (var c2 = 0; c2 < n; c2++) {
      var bt = E("div", "butt", pack);
      var bx = 30 + (r === 1 ? 49 : 0) + c2 * 98, by = 30 + r * 80;
      px(bt, bx, by, 92, 92);
      butts.push({ el: bt, d: Math.hypot(bx + 46 - 370, by + 46 - 156) });
    }
  });
  butts.sort(function (a, b) { return a.d - b.d; });
  tl.fromTo(pack, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "expo.out" }, 22.95);
  butts.forEach(function (b, i) {
    tl.fromTo(b.el, { y: -520, scale: 1.4, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(1.7)" }, 23.05 + i * 0.022);
  });
  chip(s7, "7 / 6 / 7", 1240, 23.55);
  var foil = E("div", "foil", pack);
  tl.fromTo(foil, { scaleX: 0 }, { scaleX: 1, duration: 0.32, ease: "power3.inOut" }, 24.0);
  var sheen = E("div", "sheen", pack);
  px(sheen, -300, null);
  tl.fromTo(sheen, { x: 0 }, { x: 1300, duration: 0.35, ease: "power2.inOut" }, 24.3);
  var stamp = E("div", "stamp", s7, "Sealed.");
  px(stamp, 540, 1036);
  tl.fromTo(stamp, { xPercent: -50, yPercent: -50, scale: 2.4, rotation: -14, autoAlpha: 0 }, { xPercent: -50, yPercent: -50, scale: 1, rotation: -8, autoAlpha: 1, duration: 0.3, ease: "power4.out" }, 24.35);
  flashAt(24.37, 0.3, 0.25);
  shake(24.38, 0.25, 10);

  // =====================================================================
  // 8. SCALE + FINALE (25 to 30): five trillion a year; the live counter lands on 10,000.
  // =====================================================================
  var s8 = scene(25.0);
  sIn(s8, 25.0, { scale: 1.25 });
  var ar = txt(s8, "kick", "Around", 446, 34);
  var tr = txt(s8, "h1", "*5 trillion*", 498, 140);
  var ay = txt(s8, "serif", "a year.", 660, 84);
  rise(ar, 25.05, { dy: 30 });
  slam(tr.inner, 25.15, 2.2);
  rise(ay, 25.5);
  [ar, tr, ay].forEach(function (t) { drift(t, 25, 27, 16); leave(t, 26.7); });

  var gb = E("div", "globe", s8);
  px(gb, 220, 760, 640, 640);
  var gsv = svgEl("svg", { width: 640, height: 640, viewBox: "-320 -320 640 640" }, gb);
  var gd = svgEl("defs", {}, gsv);
  var gr = svgEl("radialGradient", { id: "gfill", cx: "45%", cy: "40%", r: "60%" }, gd);
  [["0", "rgba(244,183,64,0.16)"], ["1", "rgba(244,183,64,0.02)"]].forEach(function (s) { svgEl("stop", { offset: s[0], "stop-color": s[1] }, gr); });
  var GR = 280, TILT = 0.18;
  svgEl("circle", { cx: 0, cy: 0, r: GR, fill: "url(#gfill)", stroke: "rgba(244,183,64,0.55)", "stroke-width": 2.5 }, gsv);
  [-60, -30, 0, 30, 60].forEach(function (lat) {
    var la = lat * Math.PI / 180;
    svgEl("ellipse", { cx: 0, cy: -GR * Math.sin(la), rx: GR * Math.cos(la), ry: GR * Math.cos(la) * TILT, fill: "none", stroke: "rgba(244,183,64,0.2)", "stroke-width": 2 }, gsv);
  });
  var mers = [];
  for (var mi = 0; mi < 6; mi++) mers.push(svgEl("ellipse", { cx: 0, cy: 0, rx: GR, ry: GR, fill: "none", stroke: "rgba(244,183,64,0.2)", "stroke-width": 2 }, gsv));
  var GDOTS = [], GN = 180, golden = Math.PI * (3 - Math.sqrt(5));
  for (var gi = 0; gi < GN; gi++) {
    GDOTS.push({ lat: Math.asin(1 - 2 * (gi + 0.5) / GN), lon: gi * golden, el: svgEl("circle", { r: 3, fill: "#ffd27a" }, gsv) });
  }
  function globeAt(rot) {
    mers.forEach(function (m, i) { m.setAttribute("rx", (GR * Math.abs(Math.sin(i * Math.PI / 6 + rot))).toFixed(1)); });
    GDOTS.forEach(function (g) {
      var lon = g.lon + rot, cz = Math.cos(g.lat) * Math.cos(lon);
      g.el.setAttribute("cx", (GR * Math.cos(g.lat) * Math.sin(lon)).toFixed(1));
      g.el.setAttribute("cy", (-GR * Math.sin(g.lat) + GR * TILT * cz).toFixed(1));
      g.el.setAttribute("r", (1.8 + 2.6 * Math.max(0, cz)).toFixed(2));
      g.el.setAttribute("opacity", (cz > 0 ? 0.35 + 0.65 * cz : 0.08).toFixed(2));
    });
  }
  globeAt(0);
  var go = { r: 0 };
  tl.fromTo(go, { r: 0 }, { r: 2.2, duration: 2.0, ease: "none", onUpdate: function () { globeAt(go.r); } }, 25.0);
  tl.fromTo(gb, { scale: 0.4, autoAlpha: 0, rotation: -20 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.8, ease: "expo.out" }, 25.05);
  tl.fromTo(gb, { scale: 1, autoAlpha: 1, filter: "blur(0px)" }, { scale: 1.5, autoAlpha: 0, filter: "blur(16px)", duration: 0.35, ease: "power3.in", immediateRender: false }, 26.7);

  var w1 = txt(s8, "serif", "And while you watched,", 640, 76);
  var w2 = txt(s8, "h2", "This machine made", 780, 80);
  rise(w1, 26.9, { st: 0.06 });
  rise(w2, 27.35, { st: 0.07 });
  drift(w1, 26.9, 30, 18);
  drift(w2, 27.3, 30, 14);
  var bw = E("div", "tw", s8);
  bw.style.top = "900px";
  big = E("div", "bignum", bw, num.textContent);
  tl.fromTo(hud, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.12, immediateRender: false }, 26.95);
  tl.fromTo(big, { y: -650, scale: 0.33, autoAlpha: 0, filter: "blur(8px)" }, { y: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.75, ease: "expo.out" }, 26.95);
  var mo = txt(s8, "h1", "*more.*", 1132, 150);
  slam(mo.inner, 28.2, 2.0);
  drift(mo, 28.2, 30, 10);
  tl.fromTo(big, { scale: 1 }, { scale: 1.14, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, 29.4);
  tl.fromTo(big, { color: "#fff7e8" }, { color: "#ffd36b", duration: 0.2, immediateRender: false }, 29.4);
  [0, 1].forEach(function (i) {
    var rr = E("div", "ring", s8);
    px(rr, 240, 700, 600, 600);
    tl.fromTo(rr, { scale: 0.2, autoAlpha: 0 }, { scale: 0.2, autoAlpha: 1, duration: 0.01 }, 29.4 + i * 0.12);
    tl.fromTo(rr, { scale: 0.2, autoAlpha: 1 }, { scale: 1.7, autoAlpha: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, 29.41 + i * 0.12);
  });
  flashAt(29.4, 0.32, 0.4);
  var bloom = E("div", "layer", s8);
  bloom.style.background = "radial-gradient(60% 40% at 50% 52%, rgba(255,196,90,0.38) 0%, rgba(255,160,60,0.1) 45%, transparent 75%)";
  tl.fromTo(bloom, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1.05, duration: 0.5, ease: "expo.out" }, 29.4);

  tl.set({}, {}, 30);
  return tl;
};
