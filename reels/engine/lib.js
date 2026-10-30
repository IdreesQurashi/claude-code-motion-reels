/* Reel engine: the shared machinery of a "how it's made" reel, lifted from the cigarettes film.
   A film's scene.js calls Reel.create(window.FILM) and only draws what is specific to its object.
   Deterministic: one paused GSAP timeline, seeded randomness, no clocks.

   FILM (comp/film.js, generated from film.json by tools/sync_film.py):
     duration            total seconds (the 30 s story + the CTA card)
     counter             { label, to, by }   live HUD counter from 0 to `to`, landing at `by` seconds (optional)
     steps               [[label, from, to], ...]   progress bar under the counter (optional)
     progress            [showAt, hideAt]
     cta                 { at, keyword, line, sub, handle }   comment-keyword end card (optional)
*/
(function () {
  var THEMES = {
    gold: { bg: "#0a0806", bgMid: "#140e08", bgCenter: "#2a1d10", ink: "#f7efe2", inkSoft: "#efe2cb", muted: "#a39581", accent: "#f4b740",
      accentHi: "#fff3cf", accentMid: "#f7c65a", accentLo: "#d88f2a", accentDeep: "#9c5b16", accentSoft: "#e8c27a", hot: "#ff3b2b",
      accentRGB: "244,183,64", glowRGB: "255,196,90", finalColor: "#ffd36b", ctaBg: "#22150b",
      smoke: ["rgba(150,85,30,0.28)", "rgba(110,60,22,0.30)", "rgba(170,100,40,0.20)", "rgba(120,70,30,0.22)"] },
    electric: { bg: "#03050b", bgMid: "#06102a", bgCenter: "#0f2a66", ink: "#eef6ff", inkSoft: "#cfe3ff", muted: "#8197bd", accent: "#46c8ff",
      accentHi: "#e6f9ff", accentMid: "#8fdcff", accentLo: "#2a8cff", accentDeep: "#1546a8", accentSoft: "#a6dcff", hot: "#ff3b6b",
      accentRGB: "70,200,255", glowRGB: "70,170,255", finalColor: "#9fe6ff", ctaBg: "#0a1838",
      smoke: ["rgba(40,90,230,0.30)", "rgba(140,50,220,0.22)", "rgba(20,150,230,0.22)", "rgba(70,60,210,0.20)"] }
  };
  function create(F) {
    var f = Kit.format();
    var W = f.width, H = f.height;
    var root = Kit.root();
    var tl = gsap.timeline({ paused: true });
    var R = Kit.rng(F.seed || 11);
    var E = Kit.el;
    var api = { tl: tl, root: root, W: W, H: H, E: E, svg: Kit.svg };
    // ---------- theme: every film gets its own colour world (FILM.theme = preset name or token object) ----------
    var T = Object.assign({}, THEMES.gold, typeof F.theme === "string" ? THEMES[F.theme] : (F.theme || {}));
    var VARS = { bg: "--bg", bgMid: "--bg-mid", bgCenter: "--bg-center", ink: "--ink", inkSoft: "--ink-soft", muted: "--muted", accent: "--accent",
      accentHi: "--accent-hi", accentMid: "--accent-mid", accentLo: "--accent-lo", accentDeep: "--accent-deep", accentSoft: "--accent-soft", hot: "--hot" };
    Object.keys(VARS).forEach(function (k) { if (T[k]) root.style.setProperty(VARS[k], T[k]); });
    document.documentElement.style.background = T.bg;
    api.theme = T;
    function rgba(a) { return "rgba(" + T.accentRGB + "," + a + ")"; }
    api.rgba = rgba;
    function rnd(a, b) { return a + R() * (b - a); }
    function px(n, x, y, w, h) {
      if (x != null) n.style.left = x + "px";
      if (y != null) n.style.top = y + "px";
      if (w != null) n.style.width = w + "px";
      if (h != null) n.style.height = h + "px";
      return n;
    }
    api.rnd = rnd; api.R = R; api.px = px;

    // ---------- text ----------
    api.txt = function (parent, cls, lines, top, size, mark) {
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
    };
    api.rise = function (t, at, o) {
      o = o || {};
      tl.fromTo(t.units,
        { autoAlpha: 0, y: o.dy == null ? 80 : o.dy, rotationX: o.rx == null ? -65 : o.rx, transformPerspective: 900, filter: "blur(18px)" },
        { autoAlpha: 1, y: 0, rotationX: 0, filter: "blur(0px)", duration: o.d || 0.85, ease: "expo.out", stagger: o.st == null ? 0.075 : o.st }, at);
    };
    api.slam = function (node, at, from) {
      tl.fromTo(node, { scale: from || 2.6, autoAlpha: 0, filter: "blur(30px)" },
        { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, at);
    };
    api.drift = function (t, a, b, amt) { tl.fromTo(t.wrap, { y: 0 }, { y: -(amt == null ? 30 : amt), duration: b - a, ease: "none" }, a); };
    api.leave = function (t, at, o) {
      o = o || {};
      tl.fromTo(t.inner, { autoAlpha: 1, y: 0, filter: "blur(0px)" },
        { autoAlpha: 0, y: o.dy == null ? -70 : o.dy, filter: "blur(18px)", duration: o.d || 0.36, ease: "power2.in", immediateRender: false }, at);
    };
    api.chip = function (parent, text, top, at) {
      var cw = E("div", "tw", parent);
      cw.style.top = top + "px";
      var c = E("div", "chip", cw);
      E("i", "", c);
      E("span", "", c, text);
      tl.fromTo(c, { autoAlpha: 0, y: 30, scale: 0.92, filter: "blur(10px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, at);
      return c;
    };
    api.glow = function (parent, cx, cy, size, a, b) {
      var g = E("div", "glow", parent);
      px(g, cx - size / 2, cy - size / 2, size, size);
      tl.fromTo(g, { scale: 0.85, opacity: 0.6 }, { scale: 1.12, opacity: 1, duration: b - a, ease: "sine.inOut" }, a);
      return g;
    };
    // Draws an SVG stroke on, without a sound cue (for many small strokes).
    api.drawOn = function (path, at, d, ease) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len + " " + len;
      // Hidden until it starts: a zero length dash with a round cap would show as a dot.
      tl.fromTo(path, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at);
      tl.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: d || 0.5, ease: ease || "power2.out" }, at);
    };

    // ---------- atmosphere ----------
    E("div", "bg", root);
    [[-300, 80, 1000, T.smoke[0]], [380, 820, 1100, T.smoke[1]], [-240, 1300, 900, T.smoke[2]], [520, -240, 820, T.smoke[3]]].forEach(function (s, i) {
      var d = E("div", "smoke", root);
      px(d, s[0], s[1], s[2], s[2]);
      d.style.background = "radial-gradient(circle, " + s[3] + " 0%, transparent 65%)";
      tl.fromTo(d, { x: 0, y: 0, scale: 1 }, { x: i % 2 ? -220 : 240, y: i % 2 ? 140 : -180, scale: 1.3, duration: F.duration, ease: "sine.inOut" }, 0);
    });
    for (var di = 0; di < 44; di++) {
      var dd = E("div", "dust", root), ds = rnd(2, 6);
      px(dd, rnd(0, W), rnd(160, H), ds, ds);
      dd.style.opacity = rnd(0.12, 0.6).toFixed(2);
      tl.fromTo(dd, { x: 0, y: 0 }, { x: rnd(-90, 90), y: -rnd(250, 700), duration: F.duration, ease: "none" }, 0);
    }
    var stage = E("div", "stage", root);
    api.stage = stage;

    api.scene = function (a, b, first) {
      var s = E("div", "scene", stage);
      if (first) {
        s.style.visibility = "visible";
        if (b != null) tl.fromTo(s, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001, immediateRender: false }, b);
      } else Kit.show(tl, s, a, b);
      return s;
    };
    api.sIn = function (s, at, from) {
      var fr = { filter: "blur(16px)" }, to = { filter: "blur(0px)", duration: 0.5, ease: "expo.out" };
      Object.keys(from).forEach(function (k) { fr[k] = from[k]; to[k] = k === "scale" ? 1 : 0; });
      tl.fromTo(s, fr, to, at);
    };
    api.sOut = function (s, at, to) {
      var fr = { filter: "blur(0px)" }, t2 = { filter: "blur(16px)", duration: 0.28, ease: "power3.in", immediateRender: false };
      Object.keys(to).forEach(function (k) { fr[k] = k === "scale" ? 1 : 0; t2[k] = to[k]; });
      tl.fromTo(s, fr, t2, at);
    };

    // ---------- HUD: live counter + progress steps ----------
    var hud = null, num = null, cnt = { v: 0 }, mirrors = [];
    if (F.counter) {
      hud = E("div", "hud", root);
      var lab = E("div", "lab", hud);
      var dot = E("b", "", lab);
      E("span", "", lab, F.counter.label);
      num = E("div", "num", hud, "0");
      var show = function () {
        var s = Kit.fmt(Math.floor(cnt.v + 1e-6));
        num.textContent = s;
        mirrors.forEach(function (m) { m.textContent = s; });
      };
      tl.fromTo(cnt, { v: 0 }, { v: F.counter.to, duration: F.counter.by, ease: "none", onUpdate: show }, 0);
      tl.fromTo(dot, { opacity: 1 }, { opacity: 0.2, duration: 0.45, ease: "sine.inOut", repeat: Math.floor(F.duration / 0.45), yoyo: true }, 0);
      tl.fromTo(lab, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.15);
    }
    api.hud = hud;
    api.counterMirror = function (node) { node.textContent = num ? num.textContent : "0"; mirrors.push(node); };
    if (F.steps && F.steps.length) {
      var prog = E("div", "prog", root);
      var bars = E("div", "bars", prog);
      var stepBox = E("div", "step", prog);
      var n = F.steps.length, pad = n < 10 ? "0" : "";
      F.steps.forEach(function (s, i) {
        var b = E("div", "bar", bars), fl = E("s", "", b);
        tl.fromTo(fl, { scaleX: 0 }, { scaleX: 1, duration: s[2] - s[1], ease: "none" }, s[1]);
        var sp = E("span", "", stepBox, "Step " + pad + (i + 1) + " / " + pad + n + "   " + s[0]);
        tl.fromTo(sp, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" }, s[1]);
        if (i < n - 1) tl.fromTo(sp, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -14, duration: 0.2, ease: "power2.in", immediateRender: false }, s[2] - 0.2);
      });
      var pr = F.progress || [F.steps[0][1] - 0.1, F.steps[n - 1][2]];
      tl.fromTo(prog, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, pr[0]);
      tl.fromTo(prog, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, pr[1]);
    }

    // ---------- overlays ----------
    var ff = E("div", "freeze-frame", root);
    for (var fi = 0; fi < 4; fi++) E("i", "", ff);
    E("div", "vignette", root).setAttribute("data-layout-allow-occlusion", "");
    var grain = E("div", "grain", root);
    grain.setAttribute("data-layout-allow-occlusion", "");
    var flash = E("div", "flash", root);
    flash.setAttribute("data-layout-allow-occlusion", "");
    api.flashAt = function (at, peak, d) { tl.fromTo(flash, { opacity: peak }, { opacity: 0, duration: d || 0.35, ease: "power2.out", immediateRender: false }, at); };
    var gp = { k: 0 };
    tl.fromTo(gp, { k: 0 }, { k: F.duration * 24, duration: F.duration, ease: "none", onUpdate: function () {
      var k = Math.floor(gp.k);
      grain.style.backgroundPosition = ((k * 137) % 260) + "px " + ((k * 91) % 260) + "px";
    } }, 0);
    // Camera shake: amplitude follows sin(pi p), so it starts and ends at rest from any seek.
    api.shake = function (at, d, amp) {
      var o = { p: 0 }, seed = at * 7.3;
      tl.fromTo(o, { p: 0 }, { p: 1, duration: d, ease: "none", onUpdate: function () {
        var a = amp * Math.sin(Math.PI * o.p);
        gsap.set(stage, { x: a * Math.sin(o.p * 71 + seed), y: a * Math.cos(o.p * 53 + seed * 1.7) });
      } }, at);
    };
    // Pattern interrupt: everything in `sceneEl` must stop moving at `at`; colour drains, brackets snap, a line lands.
    api.freeze = function (sceneEl, at, until, line) {
      tl.fromTo(sceneEl, { filter: "grayscale(0) brightness(1) contrast(1)" }, { filter: "grayscale(1) brightness(0.45) contrast(1.3)", duration: 0.06, ease: "none", immediateRender: false }, at);
      tl.fromTo(ff, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.14, ease: "power3.out" }, at);
      tl.fromTo(ff, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, immediateRender: false }, until);
      api.flashAt(at, 0.85, 0.22);
      if (line) {
        var s = api.scene(at, until);
        var t = api.txt(s, "serif", line, 1268, 120);
        api.rise(t, at + 0.04, { d: 0.4, st: 0.05, dy: 50 });
      }
    };

    // ---------- finale pieces ----------
    // A rotating dot globe centred at (cx, cy), radius r, spinning from `a` to `b`.
    api.globe = function (parent, cx, cy, r, a, b) {
      var gb = E("div", "globe", parent);
      px(gb, cx - r - 40, cy - r - 40, 2 * r + 80, 2 * r + 80);
      var gsv = Kit.svg("svg", { width: 2 * r + 80, height: 2 * r + 80, viewBox: [-(r + 40), -(r + 40), 2 * r + 80, 2 * r + 80].join(" ") }, gb);
      var gd = Kit.svg("defs", {}, gsv), gid = "gfill" + Math.round(a * 100);
      var gr = Kit.svg("radialGradient", { id: gid, cx: "45%", cy: "40%", r: "60%" }, gd);
      [["0", rgba(0.16)], ["1", rgba(0.02)]].forEach(function (s) { Kit.svg("stop", { offset: s[0], "stop-color": s[1] }, gr); });
      var TILT = 0.18;
      Kit.svg("circle", { cx: 0, cy: 0, r: r, fill: "url(#" + gid + ")", stroke: rgba(0.55), "stroke-width": 2.5 }, gsv);
      [-60, -30, 0, 30, 60].forEach(function (lat) {
        var la = lat * Math.PI / 180;
        Kit.svg("ellipse", { cx: 0, cy: -r * Math.sin(la), rx: r * Math.cos(la), ry: r * Math.cos(la) * TILT, fill: "none", stroke: rgba(0.2), "stroke-width": 2 }, gsv);
      });
      var mers = [];
      for (var mi = 0; mi < 6; mi++) mers.push(Kit.svg("ellipse", { cx: 0, cy: 0, rx: r, ry: r, fill: "none", stroke: rgba(0.2), "stroke-width": 2 }, gsv));
      var dots = [], N = 180, golden = Math.PI * (3 - Math.sqrt(5));
      for (var gi = 0; gi < N; gi++) dots.push({ lat: Math.asin(1 - 2 * (gi + 0.5) / N), lon: gi * golden, el: Kit.svg("circle", { r: 3, fill: T.accentSoft }, gsv) });
      function at(rot) {
        mers.forEach(function (m, i) { m.setAttribute("rx", (r * Math.abs(Math.sin(i * Math.PI / 6 + rot))).toFixed(1)); });
        dots.forEach(function (g) {
          var lon = g.lon + rot, cz = Math.cos(g.lat) * Math.cos(lon);
          g.el.setAttribute("cx", (r * Math.cos(g.lat) * Math.sin(lon)).toFixed(1));
          g.el.setAttribute("cy", (-r * Math.sin(g.lat) + r * TILT * cz).toFixed(1));
          g.el.setAttribute("r", (1.8 + 2.6 * Math.max(0, cz)).toFixed(2));
          g.el.setAttribute("opacity", (cz > 0 ? 0.35 + 0.65 * cz : 0.08).toFixed(2));
        });
      }
      at(0);
      var go = { r: 0 };
      tl.fromTo(go, { r: 0 }, { r: 1.1 * (b - a), duration: b - a, ease: "none", onUpdate: function () { at(go.r); } }, a);
      tl.fromTo(gb, { scale: 0.4, autoAlpha: 0, rotation: -20 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.8, ease: "expo.out" }, a + 0.05);
      return gb;
    };
    // The HUD counter flies into the frame and lands big, with "lead" lines above and a payoff word below.
    api.finale = function (parent, o) {
      var w1 = api.txt(parent, "serif", o.lead, 640, 76);
      var w2 = api.txt(parent, "h2", o.claim, 780, 80);
      api.rise(w1, o.at, { st: 0.06 });
      api.rise(w2, o.at + 0.45, { st: 0.07 });
      api.drift(w1, o.at, o.end, 18);
      api.drift(w2, o.at + 0.4, o.end, 14);
      var bw = E("div", "tw", parent);
      bw.style.top = "900px";
      var big = E("div", "bignum", bw);
      api.counterMirror(big);
      if (hud) tl.fromTo(hud, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.12, immediateRender: false }, o.at + 0.05);
      tl.fromTo(big, { y: -650, scale: 0.33, autoAlpha: 0, filter: "blur(8px)" }, { y: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.75, ease: "expo.out" }, o.at + 0.05);
      var mo = api.txt(parent, "h1", o.payoff, 1132, 150);
      api.slam(mo.inner, o.at + 1.3, 2.0);
      api.drift(mo, o.at + 1.3, o.end, 10);
      var p = o.punch;
      tl.fromTo(big, { scale: 1 }, { scale: 1.14, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, p);
      tl.fromTo(big, { color: T.ink }, { color: T.finalColor, duration: 0.2, immediateRender: false }, p);
      [0, 1].forEach(function (i) {
        var rr = E("div", "ring", parent);
        px(rr, 240, 700, 600, 600);
        tl.fromTo(rr, { scale: 0.2, autoAlpha: 0 }, { scale: 0.2, autoAlpha: 1, duration: 0.01 }, p + i * 0.12);
        tl.fromTo(rr, { scale: 0.2, autoAlpha: 1 }, { scale: 1.7, autoAlpha: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, p + 0.01 + i * 0.12);
      });
      api.flashAt(p, 0.32, 0.4);
      var bloom = E("div", "layer", parent);
      bloom.style.background = "radial-gradient(60% 40% at 50% 52%, rgba(" + T.glowRGB + ",0.38) 0%, rgba(" + T.glowRGB + ",0.1) 45%, transparent 75%)";
      tl.fromTo(bloom, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1.05, duration: 0.5, ease: "expo.out" }, p);
      return { big: big };
    };
    // End card: "Want reels like this? Comment KEYWORD". An arrow points at the comment button on the right rail.
    api.ctaCard = function (o) {
      var s = api.scene(o.at);
      api.sIn(s, o.at, { scale: 1.2 });
      var bk = E("div", "layer", s);
      bk.style.background = "radial-gradient(80% 60% at 50% 46%, " + T.ctaBg + " 0%, " + T.bg + " 75%)";
      api.glow(s, 540, 900, 1100, o.at, F.duration);
      var l1 = api.txt(s, "serif", o.line || "Want reels like this?", 470, 92);
      var l2 = api.txt(s, "kick", "Comment", 690, 40);
      api.rise(l1, o.at + 0.1);
      api.rise(l2, o.at + 0.5, { dy: 30 });
      var kw = E("div", "tw", s);
      kw.style.top = "760px";
      var key = E("div", "cta-key", kw);
      E("span", "", key, o.keyword);
      api.slam(key, o.at + 0.7, 2.4);
      api.flashAt(o.at + 0.72, 0.4, 0.35);
      tl.fromTo(key, { boxShadow: "0 0 30px " + rgba(0.3) }, { boxShadow: "0 0 90px " + rgba(0.75), duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.floor((F.duration - o.at - 1.3) / 0.6)), immediateRender: false }, o.at + 1.3);
      var l3 = api.txt(s, "h2", o.sub || "I'll DM you the full stack.", 1010, 62);
      var l4 = api.txt(s, "serif", o.sub2 || "Free.", 1090, 84);
      api.rise(l3, o.at + 1.15, { st: 0.05 });
      api.rise(l4, o.at + 1.6);
      // Arrow sweeping toward the comment icon (right rail, around y 1390 on a 1080x1920 reel).
      var ar = Kit.svg("svg", { width: 260, height: 260, viewBox: "0 0 260 260" }, s);
      ar.style.cssText = "position:absolute;left:690px;top:1170px;overflow:visible";
      var path = Kit.svg("path", { d: "M20 20 C 120 30, 200 90, 230 200", fill: "none", stroke: T.accent, "stroke-width": 10, "stroke-linecap": "round" }, ar);
      var head = Kit.svg("path", { d: "M196 186 L232 214 L246 170", fill: "none", stroke: T.accent, "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round" }, ar);
      api.drawOn(path, o.at + 1.9, 0.5, "power2.inOut");
      tl.fromTo(head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, o.at + 2.3);
      tl.fromTo(ar, { x: 0, y: 0 }, { x: 14, y: 14, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, o.at + 2.45);
      if (o.handle) {
        var hd = api.txt(s, "kick", o.handle, 1250, 30);
        api.rise(hd, o.at + 2.0, { dy: 20 });
      }
      return s;
    };

    // ---------- voice first: scene times come from the voiceover (FILM.timing, FILM.words from reel.py vo) ----------
    api.line = function (i) { return (F.timing || [])[i] || { start: 0, end: 0 }; };
    // Big captions synced word by word to the voice: short phrases, the spoken word lit in the accent colour.
    api.captions = function (words, o) {
      o = o || {};
      words = words || F.words || [];
      var top = o.top || 1250, maxW = o.maxWords || 4, maxC = o.maxChars || 20;
      var layer = E("div", "caps", root);
      var chunks = [], cur = null;
      words.forEach(function (w, i) {
        var prev = words[i - 1];
        var breakHere = !cur || cur.words.length >= maxW || (cur.chars + w.w.length) > maxC || (prev && (w.line !== prev.line || w.t - (prev.t + prev.d) > 0.35));
        if (breakHere) { cur = { words: [], chars: 0 }; chunks.push(cur); }
        cur.words.push(w);
        cur.chars += w.w.length + 1;
      });
      chunks.forEach(function (c, ci) {
        var a = c.words[0].t - 0.06, last = c.words[c.words.length - 1];
        var next = chunks[ci + 1];
        var b = next ? Math.min(next.words[0].t - 0.1, last.t + last.d + 0.7) : last.t + last.d + 0.8;
        var row = E("div", "cap", layer);
        row.style.top = top + "px";
        var spans = c.words.map(function (w) { var sp = E("span", "cw", row, w.w); row.appendChild(document.createTextNode(" ")); return sp; });
        tl.fromTo(row, { autoAlpha: 0, y: 26, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.16, ease: "back.out(2)" }, a);
        tl.fromTo(row, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.03, immediateRender: false }, b);
        c.words.forEach(function (w, wi) {
          var sp = spans[wi];
          tl.fromTo(sp, { color: T.ink, scale: 1 }, { color: T.accent, scale: 1.1, duration: 0.07, ease: "power2.out", immediateRender: false }, w.t);
          tl.fromTo(sp, { color: T.accent, scale: 1.1 }, { color: T.ink, scale: 1, duration: 0.12, ease: "power2.out", immediateRender: false }, Math.min(w.t + Math.max(w.d, 0.12), b - 0.02));
        });
      });
      return layer;
    };

    api.end = function () { tl.set({}, {}, F.duration); return tl; };
    return api;
  }
  window.Reel = { create: create, THEMES: THEMES };
})();
