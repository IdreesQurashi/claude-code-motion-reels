/* Screens: "The white on your screen isn't white." Voice first: every cut comes from the voiceover timing
   (FILM.timing per line, FILM.words per word), and big captions carry the words. Theme: electric. */
window.buildScene = function () {
  var F = window.FILM, r = Reel.create(F), tl = r.tl, E = r.E, px = r.px, rnd = r.rnd, W = r.W;
  var L = r.line, RGB = ["#ff2b3a", "#29ff6a", "#2b6dff"];
  // Time a spoken word: first word in `line` starting with `stem`.
  function at(line, stem) {
    var w = (F.words || []).filter(function (x) { return x.line === line && x.w.toLowerCase().replace(/[^a-z0-9 ]/g, "").indexOf(stem) === 0; })[0];
    return w ? w.t : L(line).start;
  }
  function cut(i) { return L(i).start - 0.1; }

  // =====================================================================
  // A. HOOK (line 0 and 1): a phone and a laptop glowing white. "It's not actually white": a lens reveals the truth.
  // =====================================================================
  var sA = r.scene(0, cut(2), true);
  r.glow(sA, 540, 760, 1100, 0, cut(2));
  var lap = E("div", "lap", sA); px(lap, 300, 470, 700, 450);
  E("div", "white", lap);
  var lapb = E("div", "lapbase", sA); px(lapb, 250, 918, 800, 34);
  var ph = E("div", "phone", sA); px(ph, 90, 560, 330, 660);
  E("div", "white", ph);
  tl.fromTo([lap, lapb], { y: 120, autoAlpha: 0, filter: "blur(14px)" }, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" }, 0.05);
  tl.fromTo(ph, { y: 200, rotation: -10, autoAlpha: 0, filter: "blur(14px)" }, { y: 0, rotation: -4, autoAlpha: 1, filter: "blur(0px)", duration: 0.8, ease: "expo.out" }, 0.15);
  tl.fromTo([lap, lapb], { y: 0 }, { y: -18, duration: cut(2) - 0.8, ease: "sine.inOut" }, 0.8);
  tl.fromTo(ph, { y: 0 }, { y: -30, duration: cut(2) - 0.9, ease: "sine.inOut", immediateRender: false }, 0.9);
  r.flashAt(0.05, 0.25, 0.5);
  var lensBox = E("div", "layer", sA);
  var lens = E("div", "lens", lensBox); px(lens, 150, 640, 300, 300);
  E("div", "rgb", lens);
  var hdl = E("div", "handle", lensBox); px(hdl, 410, 905, 34, 170); gsap.set(hdl, { rotation: -40 });
  var tNot = at(1, "not");
  tl.fromTo(lensBox, { x: 520, y: 260, rotation: 25, autoAlpha: 0 }, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, tNot - 0.35);
  tl.fromTo(lens, { scale: 0.85 }, { scale: 1.15, duration: 0.5, ease: "back.out(2)", immediateRender: false }, tNot + 0.1);
  r.flashAt(tNot, 0.3, 0.3);

  // =====================================================================
  // B. QUESTION (line 2): dive into the lens, a sea of tiny lights.
  // =====================================================================
  var sB = r.scene(cut(2), cut(3));
  r.sIn(sB, cut(2), { scale: 0.4 });
  var sea = E("div", "rgb", sB);
  sea.style.inset = "-120px";
  tl.fromTo(sea, { scale: 3.2 }, { scale: 1.0, duration: L(2).end - L(2).start + 0.3, ease: "power2.out" }, cut(2));
  var q = E("div", "layer", sB);
  q.style.background = "radial-gradient(60% 40% at 50% 46%, rgba(3,5,11,0.15) 0%, rgba(3,5,11,0.85) 100%)";
  var qm = r.txt(sB, "h1", "*?*", 600, 420);
  r.slam(qm.inner, cut(2) + 0.25, 2.4);

  // =====================================================================
  // C. RED, GREEN, BLUE (line 3): three bars light up, then three lights overlap into white.
  // =====================================================================
  var sC = r.scene(cut(3), cut(4));
  r.sIn(sC, cut(3), { scale: 1.3 });
  r.glow(sC, 540, 820, 1000, cut(3), cut(4));
  var bars = RGB.map(function (c, i) {
    var b = E("div", "bar", sC); px(b, 250 + i * 200, 420, 160, 620);
    b.style.background = "linear-gradient(180deg, " + c + ", " + c + "cc)";
    b.style.boxShadow = "0 0 60px " + c;
    return b;
  });
  [at(3, "red"), at(3, "green"), at(3, "blue")].forEach(function (t, i) {
    tl.fromTo(bars[i], { autoAlpha: 0.12, scaleY: 0.7 }, { autoAlpha: 1, scaleY: 1, duration: 0.3, ease: "back.out(2)" }, t);
  });
  var tTurn = at(3, "turn");
  tl.fromTo(bars, { autoAlpha: 1, filter: "blur(0px)" }, { autoAlpha: 0, filter: "blur(16px)", duration: 0.35, ease: "power2.in", immediateRender: false }, tTurn - 0.1);
  var vennBox = E("div", "layer", sC);
  vennBox.style.isolation = "isolate";
  var VP = [[540, 640], [445, 805], [635, 805]];
  var vs = RGB.map(function (c, i) {
    var v = E("div", "venn", vennBox); px(v, VP[i][0] - 190, VP[i][1] - 190, 380, 380);
    v.style.background = "radial-gradient(circle, " + c + " 0%, " + c + " 62%, transparent 72%)";
    return v;
  });
  vs.forEach(function (v, i) {
    var a = (i / 3) * Math.PI * 2;
    tl.fromTo(v, { x: Math.cos(a) * 320, y: Math.sin(a) * 320, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out" }, tTurn + i * 0.08);
  });
  var tWhite = at(3, "white");
  var core = E("div", "layer", sC);
  core.style.background = "radial-gradient(circle at 540px 750px, rgba(255,255,255,0.95) 0px, rgba(255,255,255,0.4) 90px, transparent 220px)";
  tl.fromTo(core, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, tWhite);
  r.flashAt(tWhite, 0.35, 0.35);

  // =====================================================================
  // D. LAPTOP (line 4): backlight, shutters, colour filters, your eye. Side view.
  // =====================================================================
  var sD = r.scene(cut(4), cut(5));
  r.sIn(sD, cut(4), { x: 520 });
  r.sOut(sD, cut(5) - 0.28, { x: -520 });
  r.glow(sD, 540, 800, 1000, cut(4), cut(5));
  var back = E("div", "panel", sD); px(back, 120, 470, 70, 640);
  back.style.background = "linear-gradient(90deg, #ffffff, #dfe9ff)"; back.style.boxShadow = "0 0 90px rgba(255,255,255,0.8)";
  var tLight = at(4, "light");
  tl.fromTo(back, { autoAlpha: 0, scaleY: 0.3 }, { autoAlpha: 1, scaleY: 1, duration: 0.5, ease: "expo.out" }, tLight - 0.1);
  var slats = [];
  for (var si = 0; si < 9; si++) {
    var s = E("div", "slat", sD); px(s, 400, 480 + si * 70, 26, 58);
    slats.push(s);
  }
  var tShut = at(4, "shutters");
  tl.fromTo(slats, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "expo.out", stagger: 0.03 }, tShut - 0.3);
  slats.forEach(function (s, i) {
    tl.fromTo(s, { scaleY: 1, rotation: 0 }, { scaleY: i % 3 === 0 ? 0.15 : 0.55, rotation: i % 2 ? 20 : -20, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 5 }, tShut + i * 0.05);
  });
  var filt = E("div", "panel", sD); px(filt, 640, 470, 46, 640);
  filt.style.background = "repeating-linear-gradient(180deg, #ff2b3a 0 70px, #29ff6a 70px 140px, #2b6dff 140px 210px)";
  tl.fromTo(filt, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "expo.out" }, tShut + 0.4);
  for (var ry = 0; ry < 9; ry++) {
    var y = 505 + ry * 70;
    var r1 = E("div", "ray", sD); px(r1, 200, y, 190, 6); r1.style.background = "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.3))";
    var r2 = E("div", "ray", sD); px(r2, 440, y, 190, 6); r2.style.background = "rgba(255,255,255," + (ry % 3 === 0 ? 0.15 : 0.6) + ")";
    var r3 = E("div", "ray", sD); px(r3, 700, y, 240, 6); r3.style.background = RGB[ry % 3]; r3.style.boxShadow = "0 0 14px " + RGB[ry % 3];
    tl.fromTo([r1, r2, r3], { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.35, ease: "power2.out", stagger: 0.18 }, tLight + 0.3 + ry * 0.04);
  }
  [["light", 155], ["shutters", 413], ["colors", 663]].forEach(function (t, i) {
    var tg = E("div", "tag2", sD, t[0]); px(tg, t[1], 1130);
    tl.fromTo(tg, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "expo.out" }, [tLight, tShut, tShut + 0.4][i]);
  });

  // =====================================================================
  // E. PHONE (line 5): every dot lights itself. Freezes on line 6.
  // =====================================================================
  var fz = F.freeze;
  var sE = r.scene(cut(5), fz.until);
  r.sIn(sE, cut(5), { x: 520 });
  r.glow(sE, 540, 820, 1000, cut(5), fz.at);
  var ph2 = E("div", "phone", sE); px(ph2, 250, 380, 580, 860);
  ph2.style.background = "#020308";
  var dots = [];
  for (var dy = 0; dy < 11; dy++) for (var dx = 0; dx < 7; dx++) {
    var d = E("div", "dot", ph2); px(d, 38 + dx * 70, 50 + dy * 70, 46, 46);
    var c = RGB[(dx + dy * 2) % 3]; d.style.background = c; d.style.boxShadow = "0 0 18px " + c;
    dots.push(d);
  }
  tl.fromTo(ph2, { y: 300, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, cut(5));
  var tOwn = at(5, "every");
  dots.forEach(function (d, i) {
    var t0 = tOwn + rnd(0, 1.6);
    tl.fromTo(d, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, t0);
  });
  r.freeze(sE, fz.at, fz.until);

  // =====================================================================
  // F. BLACK IS OFF (rest of line 6, line 7): half the screen goes black; the lens shows dots switched off. OFF.
  // =====================================================================
  var sF = r.scene(fz.until, cut(8));
  r.sOut(sF, cut(8) - 0.28, { scale: 0.8 });
  r.glow(sF, 540, 820, 1000, fz.until, cut(8));
  var ph3 = E("div", "phone", sF); px(ph3, 250, 380, 580, 860);
  var img = E("div", "layer", ph3);
  img.style.background = "linear-gradient(160deg, #46c8ff 0%, #7a5cff 45%, #ff3b6b 100%)";
  var blk = E("div", "layer", ph3); blk.style.background = "#000";
  var tBlack = at(7, "black");
  tl.fromTo(blk, { yPercent: 100 }, { yPercent: 45, duration: 0.6, ease: "expo.inOut" }, tBlack - 0.2);
  var lens2Box = E("div", "layer", sF);
  var lens2 = E("div", "lens", lens2Box); px(lens2, 380, 860, 320, 320);
  lens2.style.background = "#000";
  for (var oy = 0; oy < 4; oy++) for (var ox = 0; ox < 4; ox++) {
    var od = E("div", "dot", lens2); px(od, 30 + ox * 70, 30 + oy * 70, 46, 46);
    od.style.background = "#14161c"; od.style.border = "2px solid #262a36";
  }
  var tDots = at(7, "those");
  tl.fromTo(lens2Box, { x: 500, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.55, ease: "expo.out" }, tDots - 0.3);
  var tOff = at(7, "off");
  var offW = E("div", "tw", sF); offW.style.top = "430px";
  var offT = E("div", "off", offW, "OFF.");
  r.slam(offT, tOff - 0.05, 3);
  r.flashAt(tOff, 0.5, 0.3);
  r.shake(tOff, 0.35, 18);
  var bat = E("div", "batt", sF); px(bat, 480, 720); E("s", "", bat);
  tl.fromTo(bat, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, at(7, "using"));

  // =====================================================================
  // G. MADE IN A VACUUM (line 8): heat to 300 degrees, colours rise through a stencil, land on glass dot by dot.
  // =====================================================================
  var sG = r.scene(cut(8), cut(9));
  r.sIn(sG, cut(8), { scale: 1.25 });
  r.sOut(sG, cut(9) - 0.28, { y: -320 });
  r.glow(sG, 540, 900, 1000, cut(8), cut(9));
  var jar = E("div", "jar", sG); px(jar, 150, 380, 780, 820);
  var glass = E("div", "glass", sG); px(glass, 220, 520, 640, 30);
  var mask = E("div", "mask", sG); px(mask, 220, 760, 640, 22);
  var heater = E("div", "heater", sG); px(heater, 260, 1150, 560, 26);
  var temp = E("div", "temp", sG, "0°C"); px(temp, 380, 1040);
  tl.fromTo([jar, glass, mask, heater], { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.06 }, cut(8));
  var tHeat = at(8, "heating"), tp = { v: 0 };
  tl.fromTo(tp, { v: 0 }, { v: 300, duration: 0.9, ease: "power2.out", onUpdate: function () { temp.textContent = Math.round(tp.v) + "°C"; } }, tHeat);
  tl.fromTo(temp, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, tHeat);
  tl.fromTo(heater, { filter: "brightness(0.6)" }, { filter: "brightness(1.4)", duration: 0.9, ease: "power2.out", immediateRender: false }, tHeat);
  var tLand = at(8, "letting");
  for (var pI = 0; pI < 42; pI++) {
    var hole = pI % 14, cx = 220 + 41 + hole * 48 - 7, c2 = RGB[pI % 3];
    var p = E("div", "dot", sG); px(p, cx + rnd(-8, 8), 1110, 14, 14);
    p.style.background = c2; p.style.boxShadow = "0 0 12px " + c2;
    var t1 = tLand - 1.0 + rnd(0, 2.2);
    tl.fromTo(p, { y: 0, x: 0, autoAlpha: 0 }, { y: -560, x: (cx + 7 - (cx + rnd(-8, 8))), autoAlpha: 1, duration: 0.9, ease: "power1.out" }, t1);
  }
  for (var gI = 0; gI < 14; gI++) {
    var gd = E("div", "dot", sG); px(gd, 220 + 41 + gI * 48 - 9, 552, 18, 18);
    var c3 = RGB[gI % 3]; gd.style.background = c3; gd.style.boxShadow = "0 0 14px " + c3;
    tl.fromTo(gd, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, tLand + 0.2 + gI * 0.12);
  }
  r.chip(sG, "300°C in a high vacuum", 418, tHeat + 0.6);

  // =====================================================================
  // H. SCALE + THE COUNTER (line 9): six million lights, then the redraw counter lands.
  // =====================================================================
  var sH = r.scene(cut(9), F.cta.at);
  r.sIn(sH, cut(9), { scale: 1.3 });
  r.glow(sH, 540, 820, 1100, cut(9), F.cta.at);
  var grid = E("div", "rgb", sH);
  grid.style.inset = "-200px";
  grid.style.opacity = 0.22;
  tl.fromTo(grid, { scale: 2.5 }, { scale: 0.35, duration: F.cta.at - cut(9), ease: "power1.inOut" }, cut(9));
  var tSix = at(9, "six");
  var mw = E("div", "tw", sH); mw.style.top = "560px";
  var mn = E("div", "bignum2", mw, "0");
  var mc = { v: 0 };
  tl.fromTo(mc, { v: 0 }, { v: 6220800, duration: 1.2, ease: "expo.out", onUpdate: function () { mn.textContent = Kit.fmt(Math.floor(mc.v)); } }, tSix - 0.2);
  tl.fromTo(mw, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out" }, tSix - 0.2);
  var ml = r.txt(sH, "kick", "tiny lights. One Full HD screen.", 740, 30);
  r.rise(ml, tSix + 0.3, { dy: 20 });
  var tWatch = at(9, "while");
  tl.fromTo([mw, ml.inner], { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: -60, filter: "blur(14px)", duration: 0.35, ease: "power2.in", immediateRender: false }, tWatch - 0.2);
  var bw = E("div", "tw", sH); bw.style.top = "620px";
  var big = E("div", "bignum2", bw);
  big.style.fontSize = "230px";
  r.counterMirror(big);
  var bl = r.txt(sH, "kick", "times your screen redrew", 880, 34);
  if (r.hud) tl.fromTo(r.hud, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.12, immediateRender: false }, tWatch);
  tl.fromTo(big, { y: -420, scale: 0.3, autoAlpha: 0, filter: "blur(8px)" }, { y: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.75, ease: "expo.out" }, tWatch);
  r.rise(bl, tWatch + 0.4, { dy: 20 });
  var land = F.counter.by;
  tl.fromTo(big, { scale: 1 }, { scale: 1.12, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, land);
  tl.fromTo(big, { color: r.theme.ink }, { color: r.theme.finalColor, duration: 0.2, immediateRender: false }, land);
  r.flashAt(land, 0.3, 0.4);

  // =====================================================================
  // I. CTA (line 10) + captions over everything
  // =====================================================================
  r.ctaCard(F.cta);
  r.captions((F.words || []).filter(function (w) { return w.line !== F.cta.at_line; }), { top: 1290 });
  return r.end();
};
