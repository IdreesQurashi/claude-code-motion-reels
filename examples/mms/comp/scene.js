/* M&M's: "This candy was built for war. So why doesn't it melt in your hand?"
   Beats (film.json): 0 hook + question, 4 shaping, 8 coating, 12 color (freezes at 16), 16.55 payoff "sugar armor",
   21 printing the m, 25 finale "still here after 85 years", 30 CTA. */
window.buildScene = function () {
  var F = window.FILM, r = Reel.create(F), tl = r.tl, E = r.E, px = r.px, rnd = r.rnd, W = r.W, H = r.H;
  var COLORS = ["#e2231a", "#ff7a00", "#ffd200", "#2fb54a", "#1f6fd1", "#5a3220"];
  function mm(parent, x, y, d, color, withM) {
    var c = E("div", "mm", parent);
    px(c, x, y, d, d);
    c.style.setProperty("--c", color);
    var m = E("span", "", c);
    m.style.fontSize = Math.round(d * 0.52) + "px";
    if (!withM) m.style.opacity = 0;
    return { el: c, m: m };
  }
  function lent(parent, x, y, w, color) {
    var l = E("div", "lent", parent);
    px(l, x, y, w, Math.round(w * 0.52));
    l.style.setProperty("--c", color);
    return l;
  }

  // =====================================================================
  // 1. HOOK + QUESTION (0 to 4): a rain of candy, "1941. Built for war." Then the question.
  // =====================================================================
  var s1 = r.scene(0, 4.0, true);
  s1.style.transformOrigin = "540px 960px";
  var rain = E("div", "layer", s1);
  for (var i = 0; i < 70; i++) {
    var depth = i % 3, d = depth === 0 ? rnd(40, 62) : depth === 1 ? rnd(72, 96) : rnd(110, 150);
    var v = depth === 0 ? rnd(380, 520) : depth === 1 ? rnd(600, 800) : rnd(900, 1150);
    var y0 = rnd(-v * 4.1, H), x0 = rnd(-40, W - 40);
    var c = mm(rain, x0, y0, d, COLORS[i % 6], R2(i));
    if (depth === 0) { c.el.style.opacity = 0.45; c.el.style.filter = "blur(2px)"; }
    var r0 = rnd(-180, 180);
    tl.fromTo(c.el, { y: 0, x: 0, rotation: r0 }, { y: v * 4.1, x: rnd(-90, 90), rotation: r0 + rnd(-220, 220), duration: 4.1, ease: "none" }, 0);
  }
  function R2(i) { return i % 4 !== 3; }
  var dimA = E("div", "layer", s1);
  dimA.style.background = "radial-gradient(75% 30% at 50% 44%, rgba(10,8,6,0.86) 0%, rgba(10,8,6,0.45) 55%, rgba(10,8,6,0.1) 100%)";
  var dimB = E("div", "layer", s1);
  dimB.style.background = "rgba(8,6,4,0.8)";
  tl.fromTo(dimB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 1.95);
  r.glow(s1, 540, 820, 1000, 0, 4);
  var n41 = r.txt(s1, "h1", "*1941*", 640, 250);
  var bfw = r.txt(s1, "h2", "Built for *war.*", 905, 96);
  r.slam(n41.inner, 0.04, 2.8);
  r.flashAt(0.06, 0.35, 0.5);
  r.rise(bfw, 0.4, { st: 0.1 });
  r.drift(n41, 0, 2.2, 40);
  r.drift(bfw, 0, 2.2, 30);
  r.leave(n41, 1.9, { dy: -90 });
  r.leave(bfw, 1.96, { dy: -60 });

  var hero = E("div", "layer", s1);
  hero.style.transformOrigin = "540px 960px";
  for (var hi = 0; hi < 7; hi++) {
    var hw = E("div", "heat", hero);
    px(hw, 330 + hi * 70, 1060, 6, rnd(90, 160));
    tl.fromTo(hw, { y: 0, autoAlpha: 0 }, { y: -rnd(220, 320), autoAlpha: 1, duration: 1.2, ease: "power1.out", repeat: 1, repeatDelay: 0.05 }, 2.3 + hi * 0.06);
  }
  var hm = mm(hero, 350, 770, 380, "#e2231a", true);
  tl.fromTo(hm.el, { x: 900, rotation: 160, autoAlpha: 0 }, { x: 0, rotation: -8, autoAlpha: 1, duration: 0.85, ease: "expo.out" }, 2.0);
  tl.fromTo(hero, { scale: 1 }, { scale: 1.07, duration: 1.7, ease: "none" }, 2.3);
  var q1 = r.txt(s1, "serif", "So why doesn't it", 630, 100);
  var q2 = r.txt(s1, "h2", "*melt* in your hand?", 1200, 88);
  r.rise(q1, 2.12);
  r.rise(q2, 2.55, { st: 0.08 });
  r.drift(q1, 2.1, 4, 22);
  r.drift(q2, 2.5, 4, 18);
  r.sOut(s1, 3.72, { scale: 2.6 });

  // =====================================================================
  // 2. SHAPING (4 to 8): liquid chocolate pours, rollers press it, lentils drop onto a belt.
  // =====================================================================
  var s2 = r.scene(4.0, 8.0);
  r.sIn(s2, 4.0, { scale: 0.7 });
  r.sOut(s2, 7.72, { y: -320 });
  r.glow(s2, 540, 1000, 1000, 4, 8);
  var h2t = r.txt(s2, "h1", ["It starts as", "*chocolate.*"], 450, 112);
  r.rise(h2t, 4.12);
  r.drift(h2t, 4, 8, 30);
  var pourBox = E("div", "layer", s2);
  var stream = E("div", "stream", pourBox);
  px(stream, 505, 690, 70, 250);
  var vat = E("div", "vat", pourBox);
  px(vat, 280, 920, 520, 110);
  var vatFill = E("s", "", vat);
  tl.fromTo(stream, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: "power2.in" }, 4.15);
  tl.fromTo(stream, { backgroundPosition: "0px 0px" }, { backgroundPosition: "0px 600px", duration: 1.5, ease: "none" }, 4.15);
  tl.fromTo(vatFill, { scaleY: 0 }, { scaleY: 0.85, duration: 1.1, ease: "power1.out" }, 4.5);
  tl.fromTo(pourBox, { y: 0, autoAlpha: 1, filter: "blur(0px)" }, { y: -260, autoAlpha: 0, filter: "blur(12px)", duration: 0.35, ease: "power3.in", immediateRender: false }, 5.45);
  var forming = E("div", "layer", s2);
  var rlA = E("div", "roller", forming); px(rlA, 250, 790, 290, 290); E("i", "", rlA);
  var rlB = E("div", "roller", forming); px(rlB, 540, 790, 290, 290); E("i", "", rlB);
  var sheet = E("div", "stream", forming);
  px(sheet, 515, 690, 50, 190);
  var belt = E("div", "belt", forming);
  px(belt, null, 1150, null, 46);
  tl.fromTo(forming, { y: 300, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" }, 5.5);
  tl.fromTo(rlA, { rotation: 0 }, { rotation: 400, duration: 2.5, ease: "none" }, 5.5);
  tl.fromTo(rlB, { rotation: 0 }, { rotation: -400, duration: 2.5, ease: "none" }, 5.5);
  tl.fromTo(sheet, { backgroundPosition: "0px 0px" }, { backgroundPosition: "0px 500px", duration: 2.5, ease: "none" }, 5.5);
  tl.fromTo(belt, { backgroundPosition: "0px 0px" }, { backgroundPosition: "-700px 0px", duration: 2.5, ease: "none" }, 5.5);
  for (var li = 0; li < 14; li++) {
    var at = 5.75 + li * 0.16;
    var L = lent(forming, 494, 1060, 92, "#6b3a1c");
    tl.fromTo(L, { y: -70, autoAlpha: 0, scale: 0.6 }, { y: 44, autoAlpha: 1, scale: 1, duration: 0.22, ease: "power2.in" }, at);
    tl.fromTo(L, { x: 0 }, { x: -280 * (8.0 - at - 0.22), duration: 8.0 - at - 0.22, ease: "none" }, at + 0.22);
  }
  var sub2 = r.txt(s2, "serif", "shaped into tiny lentils.", 1290, 84);
  r.rise(sub2, 5.75);
  r.drift(sub2, 5.7, 8, 16);

  // =====================================================================
  // 3. COATING (8 to 12): a spinning drum, syrup sprayed in, layers build up.
  // =====================================================================
  var s3 = r.scene(8.0, 12.0);
  r.sIn(s3, 8.0, { y: 420 });
  r.sOut(s3, 11.72, { x: -420 });
  r.glow(s3, 540, 1060, 1000, 8, 12);
  var h3 = r.txt(s3, "h1", ["Then they", "*spin.*"], 450, 112);
  r.rise(h3, 8.05);
  r.drift(h3, 8, 12, 24);
  var sub3 = r.txt(s3, "serif", "coat after coat of sugar syrup.", 690, 62);
  r.rise(sub3, 8.5, { st: 0.05 });
  r.drift(sub3, 8.4, 12, 14);
  var drum = E("div", "drum-body", s3);
  px(drum, 270, 800, 540, 540);
  var bolts = E("div", "layer", drum);
  for (var bi = 0; bi < 12; bi++) {
    var ba = bi / 12 * Math.PI * 2, bt = E("div", "bolt", bolts);
    px(bt, 270 + 248 * Math.cos(ba) - 9, 270 + 248 * Math.sin(ba) - 9);
  }
  tl.fromTo(bolts, { rotation: 0 }, { rotation: 300, duration: 4, ease: "none" }, 8.0);
  var hole = E("div", "drum-hole", s3);
  px(hole, 330, 860, 420, 420);
  var pile = E("div", "layer", hole);
  pile.style.transformOrigin = "210px 210px";
  for (var pi = 0; pi < 46; pi++) {
    var ang = rnd(0.15, 0.85) * Math.PI, rad = rnd(60, 190);
    var pc = mm(pile, 210 + rad * Math.cos(ang) - 26, 210 + rad * Math.sin(ang) - 26, 52, pi % 3 ? "#efe4d0" : "#d9c6a6", false);
    tl.fromTo(pc.el, { rotation: rnd(-90, 90), y: 0 }, { rotation: rnd(-400, 400), y: rnd(-30, 10), duration: rnd(0.35, 0.6), ease: "sine.inOut", yoyo: true, repeat: 7 }, 8.0 + rnd(0, 0.3));
  }
  tl.fromTo(pile, { rotation: -28 }, { rotation: 28, duration: 0.95, ease: "sine.inOut", yoyo: true, repeat: 3 }, 8.0);
  var nz = E("div", "nozzle", s3);
  px(nz, 495, 760, 90, 120);
  var mist = E("div", "mist", s3);
  px(mist, 390, 890, 300, 360);
  tl.fromTo([nz, mist], { y: -200, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out", stagger: 0.12 }, 8.3);
  for (var dr = 0; dr < 26; dr++) {
    var dp = E("div", "drop", s3);
    px(dp, 536 + rnd(-10, 10), 900);
    var dat = 8.7 + rnd(0, 3.0), dd = rnd(0.3, 0.42);
    tl.fromTo(dp, { x: 0, y: 0, autoAlpha: 0 }, { x: rnd(-120, 120), y: rnd(220, 300), autoAlpha: 1, duration: dd, ease: "power1.in" }, dat);
    tl.fromTo(dp, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.05, immediateRender: false }, dat + dd);
  }
  var inLbl = E("div", "lbl", s3, "Layer by layer");
  px(inLbl, 40, 1372);
  var inset = r.svg("svg", { width: 210, height: 210, viewBox: "-105 -105 210 210" }, s3);
  inset.style.cssText = "position:absolute;left:40px;top:1150px;overflow:visible";
  r.svg("circle", { r: 100, fill: "rgba(20,14,8,0.85)", stroke: "rgba(244,183,64,0.5)", "stroke-width": 3 }, inset);
  r.svg("ellipse", { rx: 46, ry: 26, fill: "#6b3a1c" }, inset);
  var rings = [];
  for (var ri = 0; ri < 8; ri++) rings.push(r.svg("ellipse", { rx: 52 + ri * 5.5, ry: 31 + ri * 5.2, fill: "none", stroke: ri % 2 ? "#f3ead8" : "#d9c6a6", "stroke-width": 5 }, inset));
  tl.fromTo([inLbl, inset], { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "expo.out" }, 8.5);
  rings.forEach(function (rg, i) { tl.fromTo(rg, { autoAlpha: 0, scale: 0.85, svgOrigin: "0 0" }, { autoAlpha: 1, scale: 1, svgOrigin: "0 0", duration: 0.25, ease: "back.out(2)" }, 8.8 + i * 0.32); });

  // =====================================================================
  // 4. COLOR (12 to 16.55): a colour wave across a grid. Freezes at 16.0.
  // =====================================================================
  var s4 = r.scene(12.0, 16.55);
  r.sIn(s4, 12.0, { x: 520 });
  r.glow(s4, 540, 1100, 1000, 12, 16);
  var h4 = r.txt(s4, "h1", ["Every *color.*", "Same taste."], 450, 112);
  r.rise(h4, 12.05);
  r.drift(h4, 12, 16, 22);
  var grid = E("div", "layer", s4);
  grid.style.transformOrigin = "540px 1100px";
  for (var gy = 0; gy < 4; gy++) for (var gx = 0; gx < 5; gx++) {
    var gc = mm(grid, 105 + gx * 180, 760 + gy * 180, 150, COLORS[(gx + gy * 2) % 6], false);
    var wash = E("div", "wash", gc.el);
    var wt = 12.35 + (gx + gy) * 0.11;
    tl.fromTo(wash, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, wt);
    tl.fromTo(gc.el, { scale: 1 }, { scale: 1.14, duration: 0.15, ease: "power2.out", yoyo: true, repeat: 1 }, wt);
  }
  tl.fromTo(grid, { scale: 0.92, rotation: -4, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, 12.05);
  tl.fromTo(grid, { scale: 1, rotation: 0 }, { scale: 1.05, rotation: 3, duration: 3.35, ease: "none", immediateRender: false }, 12.65);
  r.freeze(s4, F.freeze.at, F.freeze.until, F.freeze.line);

  // =====================================================================
  // 5. PAYOFF (16.55 to 21): SUGAR ARMOR. A cross section, the heat, the soldiers.
  // =====================================================================
  var s5 = r.scene(16.55, 21.0);
  r.sOut(s5, 20.75, { scale: 0.8 });
  var bk = E("div", "layer", s5);
  bk.style.background = "radial-gradient(80% 60% at 50% 50%, #241406 0%, #070504 72%)";
  r.glow(s5, 540, 1060, 1100, 16.55, 21);
  var sa = r.txt(s5, "h1", ["*Sugar*", "*armor.*"], 760, 176);
  sa.wrap.setAttribute("data-layout-allow-occlusion", "");
  tl.fromTo(sa.units, { autoAlpha: 0, scale: 2.2, filter: "blur(22px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.42, ease: "expo.out", stagger: 0.36 }, 16.62);
  r.flashAt(16.64, 0.6, 0.35);
  r.shake(16.66, 0.4, 22);
  r.flashAt(17.0, 0.35, 0.3);
  r.shake(17.02, 0.3, 14);
  tl.fromTo(sa.wrap, { y: 0 }, { y: -330, duration: 0.55, ease: "expo.inOut" }, 17.95);
  tl.fromTo(sa.inner, { scale: 1 }, { scale: 0.55, duration: 0.55, ease: "expo.inOut", immediateRender: false }, 17.95);
  var sub5 = r.txt(s5, "serif", "so soldiers could carry it into the heat.", 700, 58);
  r.rise(sub5, 18.9, { st: 0.04 });
  r.drift(sub5, 18.9, 21, 10);
  var cs = r.svg("svg", { width: 700, height: 420, viewBox: "-350 -210 700 420" }, s5);
  cs.style.cssText = "position:absolute;left:190px;top:850px;overflow:visible";
  var csd = r.svg("defs", {}, cs);
  var gShell = r.svg("radialGradient", { id: "gShell", cx: "40%", cy: "30%", r: "75%" }, csd);
  [["0", "#ff6a5c"], ["0.55", "#e2231a"], ["1", "#8e130d"]].forEach(function (s) { r.svg("stop", { offset: s[0], "stop-color": s[1] }, gShell); });
  var gCore = r.svg("radialGradient", { id: "gCore", cx: "42%", cy: "35%", r: "70%" }, csd);
  [["0", "#9a5a2c"], ["0.6", "#5e3216"], ["1", "#3a1c0a"]].forEach(function (s) { r.svg("stop", { offset: s[0], "stop-color": s[1] }, gCore); });
  r.svg("ellipse", { rx: 310, ry: 170, fill: "url(#gShell)" }, cs);
  var shellLines = [];
  for (var sl = 0; sl < 6; sl++) shellLines.push(r.svg("ellipse", { rx: 300 - sl * 6, ry: 160 - sl * 5.5, fill: "none", stroke: "rgba(255,240,220,0.35)", "stroke-width": 2 }, cs));
  r.svg("ellipse", { rx: 262, ry: 128, fill: "#f4ead8" }, cs);
  r.svg("ellipse", { rx: 252, ry: 120, fill: "url(#gCore)" }, cs);
  var coreLbl = r.svg("text", { x: 0, y: 12, "text-anchor": "middle", fill: "#ffe9c9", "font-family": "Kit Mono, monospace", "font-weight": 700, "font-size": 34, "letter-spacing": 6 }, cs);
  coreLbl.textContent = "CHOCOLATE";
  tl.fromTo(cs, { scale: 0.3, rotation: -20, autoAlpha: 0, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, autoAlpha: 1, transformOrigin: "50% 50%", duration: 0.6, ease: "expo.out" }, 18.1);
  shellLines.forEach(function (p, i) { r.drawOn(p, 18.35 + i * 0.07, 0.5); });
  var shTag = E("div", "lbl", s5, "Hard sugar shell");
  px(shTag, 600, 800);
  tl.fromTo(shTag, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }, 18.6);
  for (var hw2 = 0; hw2 < 9; hw2++) {
    var ht = E("div", "heat", s5);
    px(ht, 230 + hw2 * 75, 1300, 7, rnd(120, 200));
    tl.fromTo(ht, { y: 40, autoAlpha: 0 }, { y: -170, autoAlpha: 1, duration: 0.9, ease: "power1.out", repeat: 1, repeatDelay: 0.02 }, 19.2 + hw2 * 0.05);
  }
  tl.fromTo(cs, { filter: "drop-shadow(0 0 0px rgba(255,120,40,0))" }, { filter: "drop-shadow(0 0 40px rgba(255,120,40,0.9))", duration: 0.6, ease: "power2.out", immediateRender: false }, 19.3);
  r.chip(s5, "Sold only to the military in WWII", 1390, 19.6);

  // =====================================================================
  // 6. PRINTING (21 to 25): candies ride under a roller; each one gets its m.
  // =====================================================================
  var s6 = r.scene(21.0, 25.0);
  r.sIn(s6, 21.0, { scale: 1.25 });
  r.sOut(s6, 24.75, { scale: 0.82 });
  r.glow(s6, 540, 1080, 1000, 21, 25);
  var h6 = r.txt(s6, "h1", ["Then every one", "gets its *m.*"], 450, 104);
  r.rise(h6, 21.05);
  r.drift(h6, 21, 25, 18);
  var belt6 = E("div", "belt", s6);
  px(belt6, null, 1010, null, 180);
  tl.fromTo(belt6, { backgroundPosition: "0px 0px" }, { backgroundPosition: "-1680px 0px", duration: 4, ease: "none" }, 21.0);
  var V = 420, row = E("div", "layer", s6), prints = [];
  for (var k = 0; k < 14; k++) {
    var L0 = -460 + k * 200, cx0 = L0 + 75, tk = 21 + (cx0 - 540) / V;
    var cnd = mm(row, L0, 1025, 150, COLORS[k % 6], false);
    if (tk <= 21) cnd.m.style.opacity = 1;
    else if (tk < 25) prints.push({ m: cnd.m, t: tk });
  }
  tl.fromTo(row, { x: 0 }, { x: -V * 4, duration: 4, ease: "none" }, 21.0);
  var roller = E("div", "roller-p", s6);
  px(roller, 455, 780, 170, 170);
  for (var rb = 0; rb < 6; rb++) { var rbi = E("i", "", roller); var raa = rb / 6 * Math.PI * 2; px(rbi, 85 + 62 * Math.cos(raa) - 7, 85 + 62 * Math.sin(raa) - 7); }
  tl.fromTo(roller, { rotation: 0 }, { rotation: -720, duration: 4, ease: "none" }, 21.0);
  var press = E("div", "press", s6);
  px(press, 450, 975);
  tl.fromTo([roller, press], { y: -300, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" }, 21.1);
  prints.forEach(function (p) {
    tl.fromTo(p.m, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.14, ease: "power3.out" }, p.t);
    tl.fromTo(press, { y: 0 }, { y: 16, duration: 0.06, ease: "power2.in", yoyo: true, repeat: 1, immediateRender: false }, p.t - 0.06);
  });
  r.chip(s6, "Black in 1950. White since 1954.", 1380, 22.4);

  // =====================================================================
  // 7. FINALE (25 to 30): built for war in 1941, still here after 85 years.
  // =====================================================================
  var s7 = r.scene(25.0, F.cta.at);
  r.sIn(s7, 25.0, { scale: 1.25 });
  var fl = E("div", "layer", s7);
  for (var fi2 = 0; fi2 < 16; fi2++) {
    var fd = rnd(60, 120), fc2 = mm(fl, rnd(-30, W - 90), rnd(500, H), fd, COLORS[fi2 % 6], true);
    fc2.el.style.opacity = 0.32;
    fc2.el.style.filter = "blur(" + (fd < 85 ? 3 : 1) + "px)";
    var fr0 = rnd(-60, 60);
    tl.fromTo(fc2.el, { y: 0, rotation: fr0 }, { y: -rnd(250, 500), rotation: fr0 + rnd(-90, 90), duration: 5, ease: "none" }, 25.0);
  }
  r.finale(s7, { at: F.finale.at, end: F.cta.at, lead: F.finale.lead, claim: F.finale.claim, payoff: F.finale.payoff, punch: F.counter.by });

  // =====================================================================
  // 8. CTA (30 to 34)
  // =====================================================================
  r.ctaCard(F.cta);
  return r.end();
};
