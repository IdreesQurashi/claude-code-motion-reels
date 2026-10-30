/* <OBJECT>: scene code. The engine (lib.js) gives the HUD counter, steps bar, atmosphere, text helpers,
   freeze, globe, finale and CTA card; this file only draws what is specific to the object.
   Timings must match film.json (vo lines, steps, freeze, finale, cta). */
window.buildScene = function () {
  var F = window.FILM, r = Reel.create(F), tl = r.tl, E = r.E, px = r.px;

  // 1. HOOK + QUESTION (0 to ~4.5): number slam, then the question the payoff answers.
  var s1 = r.scene(0, F.beats.hook_end, true);
  var n = r.txt(s1, "h1", "*" + F.hook.number + "*", 640, 236);
  r.slam(n.inner, 0.04, 2.8);
  r.flashAt(0.06, 0.35, 0.5);

  // 2..n. PROCESS SCENES: one per step in F.steps, drawn for this object.

  // PAYOFF: freeze, the reveal (r.freeze, r.slam, r.shake).

  // FINALE + CTA
  var s8 = r.scene(F.finale.at - 1.8, F.cta.at);
  r.finale(s8, { at: F.finale.at, end: F.cta.at, lead: F.finale.lead, claim: F.finale.claim, payoff: F.finale.payoff, punch: F.counter.by });
  r.ctaCard(F.cta);
  return r.end();
};
