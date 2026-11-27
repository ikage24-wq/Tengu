// The Axolotl Librarian on screen (2026-11-26, the Octo Scholar remade from scratch; the id stays
// `octoscholar`). Queen Coralie's palace librarian, down in the Kelp Gardens and the Pearl Vault: prim,
// shushes everyone and everything, and secretly adores loud adventure stories. The palace library has
// been underwater for a hundred years, so every book is soggy; it carries its favourite everywhere.
// A chubby upright pink axolotl on its own copy of the creature base (rig.js; body.js `axolotl`: a
// round body, short legs, stubby arms), dressed here; its wide head, gill fronds, tail, mitten hands
// and feet drawn here from scratch (the shared face never used).
//   look    soft blush-pink skin with a lilac shade; a wide round head with a big friendly smile line
//           across it; three soft feathery gill fronds each side (each one rounded lobed shape,
//           rooted inside the head, swaying on its own two springs, drawn behind the head); a long
//           tail with a soft fin ridge, trailing and swaying behind; stubby arms with round
//           four-finger mittens that really hold the book; short legs under the cardigan's hem,
//           round feet peeking. Queen Coralie's livery: a coral-pink cardigan with PEARL buttons,
//           cream ribbing and a patch pocket (its stamp lives in it). Half-moon reading glasses on a
//           gold chain, sitting low on its snout so its eyes show above them. The book: teal, damp,
//           a gold band, the pages a little wavy, a drop always about to fall. Its own soft
//           outline in each part's deeper shade, on the outer edge only; the face bare.
//   eyes    its own: small round shiny dark-plum bead eyes set wide on the wide head, a big glint
//           and a small one, a neat lash line on top (the whole eye shows whenever it's awake), soft
//           round brows that do the prim acting, rosy cheeks. Its wide smile changes with its mood:
//           a prim tight line, a pursed "shh", a gasp "O", a wide open shout.
//   idle    its act, in four pieces, each whole in itself, the next one that fits the time it has
//           (data `rest`; world/mobs.js tells it how long, `m.restUntil`):
//           - reading: the book opened, its eyes running along the lines, leaning in... a gasp at
//             the plot twist; the book shut and hugged to its chest, blissful;
//           - "Shhh!": a finger to its lips, shushing nobody (soft shush ripples), then a stern look
//             round, over its shoulder and back; a prim nod;
//           - overdue: the little stamp out of its cardigan pocket, a huff on it, raised... STAMP on
//             the book, "OVERDUE"; a satisfied nod, the stamp tucked away;
//           - soggy pages: it squeezes the book and water streams out, a long sigh, its fronds
//             drooping; a little shake of the book.
//   walk    a slow little waddle, the book held before it in both hands, the tail swinging.
//   moves   (def.moves; from afar always the boat, close up the slam and the shush in turn)
//           Paper Boat: a page torn out, folded into a boat with a twirl, tossed in an arc (the
//           ranged shot, `fight.shot: 'paperboat'`, drawn in flight by paperBoatShot below). Book
//           Slam: the book raised high in both hands and opened... slammed shut on you, a soft puff
//           of pages (the heaviest wind-up and the slowest recovery). Shush: a breath, a finger to
//           its lips, a stern "SHHH" pushing out in soft rings.
//   marks   all its own (`ownEmotes`): a "!" bubble as it starts hunting you, a "?" when it loses
//           you, a prim little nod and a note after landing a hit, a squeezed wince when hit (its
//           fronds flinching), a sweat drop when low, z's in bubbles asleep (dozing sat down, the
//           book open in its lap), dizzy when beaten (sat down hard, glasses askew, never over its
//           eyes, the book fallen open on the floor).
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, sline, pen, glow, sparkle, cue, spring, dust } from './fx.js';

// ---------- Its colours ----------
const INK = '#c27a9c';
const SKIN = ['#fff1f5', '#fcd4df', '#f0b4cb', '#d99bc0'];
const GILL = ['#ffe2e8', '#ff9fb4', '#f47c98', '#d8607f'];
const CARD = ['#ffd3c6', '#f7a38e', '#e48676', '#c4686a'];
const CREAM = ['#fffdf6', '#fbf0de', '#e6d4ba'];
const PEARL = ['#ffffff', '#f7f1f9', '#ddd0e8', '#b7a5cb'];
const BOOK = ['#a6e3da', '#62b9b1', '#459891', '#2f7675'];
const PAGE = ['#fffaf0', '#f3e7cf', '#d9c6a6'];
const GOLD = ['#fff2b0', '#f2c450', '#c48f2c'];
const WOOD = ['#f3d2a4', '#d6a36c', '#a8764a'];
const IRIS = ['#c294c4', '#7a4880', '#512a58', '#30163a'];
const LASH = '#5b2c5e';
const BROW = '#c97aa4';
const LIP = '#b25f80';
const WATER = ['#ffffff', '#d4f2f6', '#9fd8e4', '#6fb4c8'];
const BLUSH = '#ff8daa';
// (its drawn size over the base's)
const BIG = 1.2;
const LW = 1.5 / BIG;
const ID = 'axolotl';
const GAIT_U = `tk${ID}U`;

const paint = (ctx, a, mode, col, ink = INK, w = LW) => {
  if (mode === 'line') {
    pen(ctx, tone(a, ink), w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
// A bone's frame in the base's kid-box units.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);

// ---------- Its head (kid units about the neck joint, drawn 1.2x: a big wide chibi head) ----------
const HS = 1.2;
const HO = [1.5, -10];
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}
// The skull: wide and soft-cornered, flatter on top, the cheeks full.
const HEAD = (() => {
  const pts = [];
  for (let i = 0; i < 36; i++) {
    const an = (i / 36) * TAU - Math.PI / 2;
    const c = Math.cos(an);
    const s = Math.sin(an);
    const rx = 22.6 + Math.max(0, s) * 0.9 - Math.max(0, s - 0.8) * 4;
    const ry = s < 0 ? 15.6 : 13.6;
    pts.push([Math.sign(c) * Math.abs(c) ** 0.8 * rx, Math.sign(s) * Math.abs(s) ** 0.82 * ry]);
  }
  return pts;
})();
const EYE_Y = -4.2;
const EYE_X = 10.6;
const LENS_Y = -0.3;
const MOUTH_Y = 6.4;

// ---------- Its face (every part eased: an expression always passes through an in-between) ----------
// sh: how shut the eyes are (only the shut moods: a blink, asleep, bliss, a wince, dizzy), kind: which
// shut shape; bt: the brows' tilt (+ stern, - worried), bu: their raise, ba: the near brow raised on
// its own (puzzled); mw/ms/mo/ro: the mouth's width, smile, openness, roundness; bl: blush.
const FACES = {
  calm: { sh: 0, kind: 'blink', bt: 0.15, bu: 0, ba: 0, mw: 1, ms: 0.5, mo: 0, ro: 0, bl: 0.5 },
  prim: { sh: 0, kind: 'blink', bt: 0.4, bu: 0.15, ba: 0, mw: 0.5, ms: 0.12, mo: 0, ro: 0, bl: 0.45 },
  read: { sh: 0, kind: 'blink', bt: -0.1, bu: 0.25, ba: 0, mw: 0.7, ms: 0.35, mo: 0, ro: 0, bl: 0.55 },
  rapt: { sh: 0, kind: 'blink', bt: -0.4, bu: 0.6, ba: 0, mw: 0.45, ms: 0.1, mo: 0.22, ro: 0.9, bl: 0.75 },
  gasp: { sh: 0, kind: 'blink', bt: -0.55, bu: 1.25, ba: 0, mw: 0.42, ms: 0, mo: 0.8, ro: 1, bl: 0.95 },
  bliss: { sh: 1, kind: 'happy', bt: -0.3, bu: 0.4, ba: 0, mw: 1, ms: 1, mo: 0.2, ro: 0, bl: 1 },
  shush: { sh: 0, kind: 'blink', bt: 0.75, bu: -0.15, ba: 0, mw: 0.26, ms: 0, mo: 0.32, ro: 1, bl: 0.5 },
  stern: { sh: 0, kind: 'blink', bt: 0.9, bu: -0.25, ba: 0, mw: 0.55, ms: -0.22, mo: 0, ro: 0, bl: 0.45 },
  focus: { sh: 0, kind: 'blink', bt: 0.5, bu: 0, ba: 0, mw: 0.45, ms: 0.05, mo: 0, ro: 0, bl: 0.5 },
  huff: { sh: 0, kind: 'blink', bt: 0.3, bu: 0.2, ba: 0, mw: 0.3, ms: 0, mo: 0.35, ro: 1, bl: 0.6 },
  satisfied: { sh: 1, kind: 'happy', bt: 0.15, bu: 0.3, ba: 0, mw: 0.7, ms: 0.75, mo: 0, ro: 0, bl: 0.75 },
  sigh: { sh: 1, kind: 'sleep', bt: -0.75, bu: 0.3, ba: 0, mw: 0.32, ms: -0.1, mo: 0.3, ro: 1, bl: 0.5 },
  worried: { sh: 0, kind: 'blink', bt: -0.85, bu: 0.35, ba: 0, mw: 0.6, ms: -0.35, mo: 0.08, ro: 0.3, bl: 0.55 },
  fierce: { sh: 0, kind: 'blink', bt: 1, bu: -0.35, ba: 0, mw: 0.8, ms: -0.1, mo: 0.35, ro: 0.1, bl: 0.65 },
  shout: { sh: 0, kind: 'blink', bt: 0.8, bu: 0.1, ba: 0, mw: 1, ms: 0.1, mo: 0.85, ro: 0.4, bl: 0.75 },
  playful: { sh: 0, kind: 'blink', bt: 0.05, bu: 0.5, ba: 0.35, mw: 0.85, ms: 0.85, mo: 0.25, ro: 0, bl: 0.7 },
  spot: { sh: 0, kind: 'blink', bt: -0.2, bu: 1.1, ba: 0, mw: 0.4, ms: 0, mo: 0.45, ro: 1, bl: 0.6 },
  huh: { sh: 0, kind: 'blink', bt: -0.25, bu: 0.15, ba: 0.95, mw: 0.42, ms: -0.15, mo: 0.15, ro: 0.6, bl: 0.5 },
  hurt: { sh: 1, kind: 'squeeze', bt: -0.7, bu: 0.3, ba: 0, mw: 0.7, ms: -0.5, mo: 0.45, ro: 0.2, bl: 0.75 },
  sleep: { sh: 1, kind: 'sleep', bt: -0.1, bu: 0, ba: 0, mw: 0.32, ms: 0.1, mo: 0.16, ro: 0.9, bl: 0.55 },
  dizzy: { sh: 1, kind: 'dizzy', bt: -0.4, bu: 0.3, ba: 0, mw: 0.6, ms: -0.2, mo: 0.4, ro: 0.6, bl: 0.5 },
  proud: { sh: 0, kind: 'blink', bt: 0.3, bu: 0.45, ba: 0, mw: 0.7, ms: 0.7, mo: 0, ro: 0, bl: 0.65 },
  happy: { sh: 1, kind: 'happy', bt: -0.2, bu: 0.5, ba: 0, mw: 1.05, ms: 1, mo: 0.35, ro: 0, bl: 0.85 },
  sad: { sh: 0, kind: 'blink', bt: -0.9, bu: 0.1, ba: 0, mw: 0.6, ms: -0.6, mo: 0, ro: 0, bl: 0.45 },
  cross: { sh: 0, kind: 'blink', bt: 1, bu: -0.3, ba: 0, mw: 0.6, ms: -0.45, mo: 0.1, ro: 0.2, bl: 0.55 },
  talk: { sh: 0, kind: 'blink', bt: 0.15, bu: 0.25, ba: 0, mw: 0.7, ms: 0.3, mo: 0.35, ro: 0.3, bl: 0.55 },
};
const FACE_KEYS = ['bt', 'bu', 'ba', 'mw', 'ms', 'mo', 'ro', 'bl'];
const KINDS = ['blink', 'happy', 'sleep', 'squeeze', 'dizzy'];
// (talking: vowel mouths, [width, open, round, smile])
const VOWELS = [[0.6, 0.5, 0.6, 0.2], [0.9, 0.42, 0.1, 0.4], [0.38, 0.42, 1, 0], [0.75, 0.2, 0.2, 0.3], [0.55, 0.55, 0.5, 0.1]];

// One eye: a small round shiny bead, dark plum, the light catching it in a big glint and a small one,
// a neat lash line hugging its top (never a lid over it). Shut, one of its shut shapes instead.
function eye(ctx, a, x, y, side, f, look) {
  const R = 2.75;
  const closedW = sstep((f.sh - 0.5) / 0.35);
  // (closing: the bead narrows quickly as the lashes come down: a blink, never a lid sliding over)
  const vy = 3.0 * (1 - 0.7 * sstep(f.sh / 0.75));
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    pen(ctx, tone(a, LASH), 0.85);
    for (const k of KINDS) {
      const w = f.kinds[k];
      if (w <= 0.02) continue;
      ctx.save();
      ctx.globalAlpha *= w;
      ctx.beginPath();
      if (k === 'happy') {
        ctx.moveTo(x - R, y + 0.8);
        ctx.quadraticCurveTo(x, y - 3.2, x + R, y + 0.8);
      } else if (k === 'squeeze') {
        ctx.moveTo(x + side * R * 0.9, y - 2);
        ctx.quadraticCurveTo(x - side * 0.2, y - 0.3, x - side * R, y + 0.1);
        ctx.quadraticCurveTo(x - side * 0.2, y + 0.6, x + side * R * 0.9, y + 2.1);
      } else if (k === 'dizzy') {
        const t = a.t ?? 0;
        for (let i = 0; i <= 22; i++) {
          const an = (i / 22) * TAU * 1.8 + t * 4 * side;
          const r = (i / 22) * R;
          const px = x + Math.cos(an) * r;
          const py = y + Math.sin(an) * r;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
      } else {
        // (a blink, asleep, a sigh: the lash line come down into a soft smile of a curve, a tiny
        // flick at its outer end)
        ctx.moveTo(x - R, y - 0.2);
        ctx.quadraticCurveTo(x, y + 2.2, x + R, y - 0.2);
        ctx.moveTo(x + side * R, y - 0.2);
        ctx.quadraticCurveTo(x + side * (R + 0.7), y - 0.4, x + side * (R + 1.1), y - 1.1);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // the bead: deep plum, lighter toward its lower edge
  ell(ctx, x, y, R, vy);
  const g = ctx.createLinearGradient(0, y - vy, 0, y + vy);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.55, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[1]));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, R, vy);
  ctx.clip();
  // (where it looks: the soft lower light and the dark heart move with its gaze)
  const lx = (look?.[0] ?? 0) * 0.75;
  const ly = (look?.[1] ?? 0) * 0.55;
  ell(ctx, x + lx * 0.6, y + vy * 0.62 + ly * 0.3, R * 0.72, vy * 0.36);
  ctx.fillStyle = tone(a, IRIS[0], 0.75);
  ctx.fill();
  ell(ctx, x + lx, y - 0.15 + ly, R * 0.5, vy * 0.55);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ctx.restore();
  // the glints, steady: a big round one up toward the light, a small one low on the other side
  ctx.fillStyle = '#ffffff';
  ell(ctx, x + 0.85, y - vy * 0.42, 1.0, 1.0 * (vy / 3));
  ctx.fill();
  ell(ctx, x - 1.0, y + vy * 0.4, 0.45, 0.45 * (vy / 3));
  ctx.fill();
  // the lash line: hugging the top of the eye, thicker toward the outer corner, a soft round flick
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const an = Math.PI + (i / 12) * Math.PI;
    const px = x + Math.cos(an) * (R + 0.15);
    const py = y + Math.sin(an) * (vy + 0.15);
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  pen(ctx, tone(a, LASH), 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + side * R * 0.75, y - vy * 0.75);
  ctx.quadraticCurveTo(x + side * (R + 0.6), y - vy * 0.55, x + side * (R + 1.2), y - vy * 1.0);
  pen(ctx, tone(a, LASH), 0.75);
  ctx.stroke();
  ctx.restore();
}
// A brow: a short soft round bar, gently arched, tilted and raised by the mood.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x + side * 0.4, y - f.bu * 1.4 - (side > 0 ? f.ba * 1.6 : 0));
  ctx.rotate(-side * f.bt * 0.4 - (side > 0 ? f.ba * 0.25 : 0));
  ctx.beginPath();
  ctx.moveTo(-1.7, 0.3);
  ctx.quadraticCurveTo(0, -0.7, 1.7, 0.3);
  pen(ctx, tone(a, BROW), 1.35);
  ctx.stroke();
  ctx.restore();
}
// The mouth: the wide axolotl smile line across its face; opened, it rounds from a lens of a smile
// to an "O" by its roundness.
function mouth(ctx, a, x, y, f) {
  const w0 = 8.6 * f.mw;
  const w = mix(w0, Math.min(w0, 1.9 + f.mo * 1.6), clamp(f.ro, 0, 1) * Math.min(1, f.mo * 4));
  const lift = f.ms * 2.6;
  if (f.mo > 0.06) {
    const o = f.mo;
    const up = 0.6 + o * 1.2 * f.ro - lift * 0.35;
    const down = o * (3.6 - f.ro * 1.2) + lift * 0.5;
    const kx = 0.2 + 0.36 * f.ro;
    const ky = 0.2 + 0.36 * f.ro;
    const yc = y - lift * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - w, yc);
    ctx.bezierCurveTo(x - w, yc - up * ky * 1.6, x - w * kx * 1.6, yc - up, x, yc - up);
    ctx.bezierCurveTo(x + w * kx * 1.6, yc - up, x + w, yc - up * ky * 1.6, x + w, yc);
    ctx.bezierCurveTo(x + w, yc + down * ky * 1.6 + lift * 0.3, x + w * kx * 1.6, yc + down, x, yc + down);
    ctx.bezierCurveTo(x - w * kx * 1.6, yc + down, x - w, yc + down * ky * 1.6 + lift * 0.3, x - w, yc);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#a9496b');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.3, yc + down * 0.9, w * 0.6, down * 0.45);
    ctx.fillStyle = tone(a, '#f48ca4');
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP), 0.7);
    ctx.stroke();
  } else {
    // the smile line: one smooth stroke, its ends curling up as part of it
    pen(ctx, tone(a, LIP), 0.8);
    ctx.beginPath();
    ctx.moveTo(x - w - 0.5, y - lift * 0.55 - 0.5 * Math.max(0, f.ms));
    ctx.quadraticCurveTo(x - w * 0.95, y - lift * 0.35, x - w * 0.7, y - lift * 0.15);
    ctx.quadraticCurveTo(x, y + lift * 0.75, x + w * 0.7, y - lift * 0.15);
    ctx.quadraticCurveTo(x + w * 0.95, y - lift * 0.35, x + w + 0.5, y - lift * 0.55 - 0.5 * Math.max(0, f.ms));
    ctx.stroke();
  }
}
// Its half-moon reading glasses, low on its snout under its eyes: thin gold rims, a bridge, the arms
// back to its fronds, the chain draped under its chin. `askew`: knocked crooked (beaten), lower,
// never up over its eyes.
// The glasses' chain: from each arm's end back behind its head, draped under its chin (only its loop
// below the chin shows; drawn behind the head).
function chainDraw(ctx, a, q, tx) {
  const sw = q.chain ?? 0;
  const sk = q.askew ?? 0;
  ctx.save();
  ctx.translate(0, sk * 2.6);
  pen(ctx, tone(a, GOLD[2]), 0.5);
  ctx.beginPath();
  ctx.moveTo(-18.6, LENS_Y - 0.6);
  ctx.bezierCurveTo(-19.2, 9, -10 + sw * 2, 17.6, tx + sw * 2.6, 17.9);
  ctx.bezierCurveTo(tx + 10 + sw * 2, 17.6, 19.2, 9, 18.6, LENS_Y - 0.6);
  ctx.stroke();
  ctx.fillStyle = tone(a, GOLD[1]);
  for (const [px, py] of [[-8.6 + sw * 1.6, 16.2], [tx + sw * 2.6, 17.9], [9.4 + sw * 1.6, 16.2]]) {
    ell(ctx, px, py, 0.6, 0.6);
    ctx.fill();
  }
  ctx.restore();
}
function glasses(ctx, a, q, tx, ex) {
  const sk = q.askew ?? 0;
  ctx.save();
  ctx.translate(tx, LENS_Y + sk * 2.6);
  ctx.rotate(sk * 0.13);
  ctx.translate(-tx, -LENS_Y);
  const rx = 3.9;
  const ry = 2.9;
  const lens = (cx) => {
    ctx.beginPath();
    ctx.moveTo(cx - rx, LENS_Y);
    ctx.lineTo(cx + rx, LENS_Y);
    ctx.ellipse(cx, LENS_Y, rx, ry, 0, 0, Math.PI);
    ctx.closePath();
  };
  for (const s of [-1, 1]) {
    const cx = ex[s < 0 ? 0 : 1];
    lens(cx);
    ctx.fillStyle = tone(a, '#e9fbff', 0.32);
    ctx.fill();
    ctx.save();
    ctx.clip();
    pen(ctx, 'rgba(255,255,255,0.85)', 0.55);
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.2 + (q.glint ?? 0) * 2, LENS_Y + 0.2);
    ctx.lineTo(cx - rx * 0.75 + (q.glint ?? 0) * 2, LENS_Y + ry * 0.9);
    ctx.stroke();
    ctx.restore();
    lens(cx);
    pen(ctx, tone(a, GOLD[2]), 0.62);
    ctx.stroke();
    pen(ctx, tone(a, GOLD[1]), 0.28);
    ctx.stroke();
    // the arm, back along the head to the fronds
    pen(ctx, tone(a, GOLD[2]), 0.5);
    ctx.beginPath();
    ctx.moveTo(cx + s * rx, LENS_Y);
    ctx.quadraticCurveTo(cx + s * (rx + 3), LENS_Y - 1.4, s * 18.6, LENS_Y - 0.6);
    ctx.stroke();
  }
  // the bridge, over the snout
  pen(ctx, tone(a, GOLD[2]), 0.42);
  ctx.beginPath();
  ctx.moveTo(ex[0] + rx, LENS_Y);
  ctx.quadraticCurveTo((ex[0] + ex[1]) / 2, LENS_Y - 4.4, ex[1] - rx, LENS_Y);
  ctx.stroke();
  if ((q.glint ?? 0) > 0.05) sparkle(ctx, ex[1] + 1.6, LENS_Y + 0.6, 2.2 * q.glint, q.glint);
  ctx.restore();
}

// ---------- Its gill fronds: three each side, each one rounded lobed plume ----------
// (in the head's units, the near side's: root, resting angle (out along +x, + down), length, width;
// the far side's mirrored)
const FRONDS = [
  { root: [16.8, -10.6], ang: -0.78, len: 11.6, w: 5.6 },
  { root: [19.2, -5.2], ang: -0.24, len: 12.8, w: 6.0 },
  { root: [19.4, 0.8], ang: 0.3, len: 10.8, w: 5.2 },
];
const FR_N = 28;
const FR_CAP = 7;
const frL = Array.from({ length: FR_N + 1 }, () => [0, 0]);
const frR = Array.from({ length: FR_N + 1 }, () => [0, 0]);
const frPts = Array.from({ length: (FR_N + 1) * 2 + FR_CAP }, () => [0, 0]);
// A frond's outline: along a gentle curve from its root (base angle a0, its tip's a1), widest past its
// middle, four soft round scallops down each side (a gentle wave in its width, never a notch or a
// point), and a round tip (a half circle as wide as the frond's end).
function frondPath(ctx, s, fr, a0, a1) {
  const [rx0, ry] = fr.root;
  const bx = s * rx0;
  const L = fr.len;
  const w0 = s > 0 ? a0 : Math.PI - a0;
  const w1 = s > 0 ? a1 : Math.PI - a1;
  const mx = bx + Math.cos(w0) * L * 0.5;
  const my = ry + Math.sin(w0) * L * 0.5;
  const tx = mx + Math.cos(w1) * L * 0.5;
  const ty = my + Math.sin(w1) * L * 0.5;
  let nxE = 0;
  let nyE = 0;
  let hwE = 0;
  for (let i = 0; i <= FR_N; i++) {
    const u = i / FR_N;
    // (a quadratic through the root, the middle as its control, the tip)
    const cx = (1 - u) * (1 - u) * bx + 2 * (1 - u) * u * mx + u * u * tx;
    const cy = (1 - u) * (1 - u) * ry + 2 * (1 - u) * u * my + u * u * ty;
    const dx = 2 * (1 - u) * (mx - bx) + 2 * u * (tx - mx);
    const dy = 2 * (1 - u) * (my - ry) + 2 * u * (ty - my);
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    const body = 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 0.62 + 0.2)) ** 0.8;
    // (the scallops: a soft wave, fading in past the root)
    const lobe = 1 + 0.09 * Math.cos(u * TAU * 4) * sstep((u - 0.08) / 0.12);
    const hw = (fr.w / 2) * body * lobe * (1 - sstep((u - 0.78) / 0.22) * 0.3);
    frL[i][0] = cx + nx * hw;
    frL[i][1] = cy + ny * hw;
    frR[i][0] = cx - nx * hw;
    frR[i][1] = cy - ny * hw;
    nxE = nx;
    nyE = ny;
    hwE = hw;
  }
  let k = 0;
  for (let i = 0; i <= FR_N; i++) {
    frPts[k][0] = frL[i][0];
    frPts[k++][1] = frL[i][1];
  }
  // the round tip: a half circle from one side round to the other
  // (out along the frond, past its end)
  const ex = nyE;
  const ey = -nxE;
  for (let j = 1; j <= FR_CAP; j++) {
    const th = (j / (FR_CAP + 1)) * Math.PI;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    frPts[k][0] = tx + (nxE * c + ex * sn) * hwE;
    frPts[k++][1] = ty + (nyE * c + ey * sn) * hwE;
  }
  for (let i = FR_N; i >= 0; i--) {
    frPts[k][0] = frR[i][0];
    frPts[k++][1] = frR[i][1];
  }
  smooth(ctx, frPts);
  return [bx, ry, tx, ty];
}
function fronds(ctx, a, mode, D) {
  const angs = a.axFr;
  if (!angs) return;
  ctx.save();
  headFrame(ctx, a, D);
  for (const s of [-1, 1]) {
    const e = s < 0 ? 0 : 1;
    for (let i = 0; i < 3; i++) {
      const fr = FRONDS[i];
      const [a0, a1] = angs[e][i];
      const [bx, by, tx, ty] = frondPath(ctx, s, fr, a0, a1);
      if (mode === 'line') {
        pen(ctx, tone(a, GILL[3]), LW / HS);
        ctx.stroke();
        continue;
      }
      const g = ctx.createLinearGradient(bx, by, tx, ty);
      g.addColorStop(0, tone(a, s < 0 ? GILL[3] : GILL[2]));
      g.addColorStop(0.45, tone(a, s < 0 ? GILL[2] : GILL[1]));
      g.addColorStop(1, tone(a, s < 0 ? GILL[1] : GILL[0]));
      ctx.fillStyle = g;
      ctx.fill();
      // (feathery: a soft light down its middle, its own deeper rim so it reads over its neighbour)
      ctx.save();
      ctx.clip();
      pen(ctx, tone(a, GILL[0], s < 0 ? 0.35 : 0.6), 1.3);
      ctx.beginPath();
      ctx.moveTo(bx + (tx - bx) * 0.2, by + (ty - by) * 0.2);
      ctx.lineTo(bx + (tx - bx) * 0.88, by + (ty - by) * 0.88);
      ctx.stroke();
      ctx.restore();
      frondPath(ctx, s, fr, a0, a1);
      pen(ctx, tone(a, GILL[3], 0.7), 0.5);
      ctx.stroke();
    }
  }
  if (mode === 'fill') chainDraw(ctx, a, a.axQ ?? {}, (a.axQ?.turn ?? 0.3) * 5);
  ctx.restore();
}

function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  const q = a.axQ ?? {};
  const f = a.axF;
  const turn = q.turn ?? 0.3;
  const tx = turn * 5;
  smooth(ctx, HEAD);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    smooth(ctx, HEAD);
    ctx.clip();
    // soft volume: lit from the upper front, a lilac shade under the jaw and round the back
    glow(ctx, tx + 2, -6, 20, SKIN[0], 0.95);
    glow(ctx, -18, 8, 13, SKIN[3], 0.5);
    glow(ctx, tx, 15, 14, SKIN[2], 0.55);
    ctx.restore();
    const ex = [tx - EYE_X - turn * 1.2, tx + EYE_X];
    // cheeks
    for (const s of [-1, 1]) {
      const cx = ex[s < 0 ? 0 : 1] + s * 3.4;
      ell(ctx, cx, 2.8, 3.3, 1.8);
      ctx.fillStyle = tone(a, BLUSH, (0.22 + 0.4 * f.bl) * (s > 0 ? 1 : 0.85));
      ctx.fill();
      ell(ctx, cx - 0.4, 2.5, 1.5, 0.8);
      ctx.fillStyle = tone(a, '#ffffff', 0.35 * f.bl);
      ctx.fill();
    }
    for (const s of [-1, 1]) eye(ctx, a, ex[s < 0 ? 0 : 1], EYE_Y, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex[s < 0 ? 0 : 1], EYE_Y - 6.3, s, f);
    mouth(ctx, a, tx + 1 + turn * 1.4, MOUTH_Y, f);
    glasses(ctx, a, q, tx, ex);
    if (q.sweat >= 0) sweatDrop(ctx, a, -17.5, -9 + q.sweat * 4.5, 1.5, win(q.sweat, 0, 0.15, 0.75, 1));
  }
  ctx.restore();
}

// ---------- Its tail: from inside its rump, back and down to the floor, a soft fin ridge ----------
const TAIL_L = [7.2, 7, 6.6, 6, 5.4];
const TAIL_W = [10, 8.6, 7, 5.4, 3.6, 1.8];
const FIN_UP = [0, 2.2, 3.2, 3.4, 3, 1.9];
const FIN_DN = [0, 0.8, 1.5, 1.8, 1.7, 1.1];
const tP = Array.from({ length: 6 }, () => [0, 0]);
const tL = Array.from({ length: 6 }, () => [0, 0]);
const tR = Array.from({ length: 6 }, () => [0, 0]);
const tOut = Array.from({ length: 13 }, () => [0, 0]);
function tailOutline(ctx, up, dn) {
  for (let i = 0; i < 6; i++) {
    const p0 = tP[Math.max(0, i - 1)];
    const p1 = tP[Math.min(5, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const nx = -Math.sin(an);
    const ny = Math.cos(an);
    // (the tail runs back, so its top edge is the side its normal points away from)
    const hu = TAIL_W[i] / 2 + up[i];
    const hd = TAIL_W[i] / 2 + dn[i];
    tL[i][0] = tP[i][0] - nx * hu;
    tL[i][1] = tP[i][1] - ny * hu;
    tR[i][0] = tP[i][0] + nx * hd;
    tR[i][1] = tP[i][1] + ny * hd;
  }
  let k = 0;
  for (let i = 0; i < 6; i++) {
    tOut[k][0] = tL[i][0];
    tOut[k++][1] = tL[i][1];
  }
  const an = Math.atan2(tP[5][1] - tP[4][1], tP[5][0] - tP[4][0]);
  tOut[k][0] = tP[5][0] + Math.cos(an) * 1.6;
  tOut[k++][1] = tP[5][1] + Math.sin(an) * 1.6;
  for (let i = 5; i >= 0; i--) {
    tOut[k][0] = tR[i][0];
    tOut[k++][1] = tR[i][1];
  }
  smooth(ctx, tOut);
}
const ZERO6 = [0, 0, 0, 0, 0, 0];
function tail(ctx, a, D) {
  const angs = a.axTail;
  if (!angs) return;
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  tP[0][0] = h[0] - 9;
  tP[0][1] = h[1] + 5;
  for (let i = 0; i < 5; i++) {
    tP[i + 1][0] = tP[i][0] + Math.cos(angs[i]) * TAIL_L[i];
    tP[i + 1][1] = tP[i][1] + Math.sin(angs[i]) * TAIL_L[i];
  }
  const w = LW / D.SC;
  // the outlines: the fin's, then the tail's; then the fin, then the tail over it
  tailOutline(ctx, FIN_UP, FIN_DN);
  pen(ctx, tone(a, '#d99abd'), w);
  ctx.stroke();
  tailOutline(ctx, ZERO6, ZERO6);
  pen(ctx, tone(a, INK), w);
  ctx.stroke();
  tailOutline(ctx, FIN_UP, FIN_DN);
  ctx.fillStyle = tone(a, '#fde6ef');
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, tP[3][0], tP[3][1] - 2, 9, '#ffffff', 0.7);
  ctx.restore();
  tailOutline(ctx, ZERO6, ZERO6);
  ctx.fillStyle = tone(a, SKIN[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, tP[1][0], tP[1][1] - 2, 8, SKIN[0], 0.9);
  glow(ctx, tP[2][0], tP[2][1] + 5, 7, SKIN[3], 0.45);
  ctx.restore();
  // (the fin's soft edge against the tail, in its own lilac)
  tailOutline(ctx, ZERO6, ZERO6);
  pen(ctx, tone(a, '#e8b3cf', 0.8), 0.7);
  ctx.stroke();
  ctx.restore();
}

// ---------- Its livery: the coral cardigan ----------
// The cardigan's outline (kid units), each point on the bone it follows: the shoulders on the chest,
// the waist on the belly, the hips and hem on the hips (the hem's corners pushed by the knees).
const CARD_PTS = [
  ['chest', 72.4, 91.2], ['chest', 64.2, 95.6], ['chest', 61.4, 103.2], ['waistB', 59.8, 112.2], ['torso', 60.2, 121.4],
  ['hemF', 61.6, 132.4], ['hem', 70.6, 135.2], ['hem', 81, 136], ['hem', 91.2, 135.2], ['hemN', 99.6, 132.4],
  ['torso', 100.8, 121.4], ['waistB', 100.8, 112.2], ['chest', 98.8, 103.2], ['chest', 96.2, 95.6], ['chest', 89.2, 91.2],
];
const cardRig = Array.from({ length: CARD_PTS.length }, () => [0, 0]);
function cardOutline(a, D) {
  // (the knees' swing, so the hem's corners go with the legs)
  const kN = ptOf(a, D, 'shinN', D.J.kneeN);
  const kF = ptOf(a, D, 'shinF', D.J.kneeF);
  const rN = ptOf(a, D, 'torso', D.J.kneeN);
  const rF = ptOf(a, D, 'torso', D.J.kneeF);
  const dN = [(kN[0] - rN[0]) * 0.7, Math.min(0, kN[1] - rN[1]) * 0.5];
  const dF = [(kF[0] - rF[0]) * 0.7, Math.min(0, kF[1] - rF[1]) * 0.5];
  CARD_PTS.forEach(([bone, x, y], i) => {
    const b = bone.startsWith('hem') ? 'torso' : bone;
    const p = ptOf(a, D, b, [x, y]);
    let ox = 0;
    let oy = 0;
    if (bone === 'hemN') [ox, oy] = dN;
    else if (bone === 'hemF') [ox, oy] = dF;
    else if (bone === 'hem') {
      const k = (x - 61) / 40;
      ox = mix(dF[0], dN[0], k) * 0.6;
      oy = mix(dF[1], dN[1], k) * 0.6;
    }
    cardRig[i][0] = p[0] + ox;
    cardRig[i][1] = p[1] + oy;
  });
  return cardRig;
}
function pearlButton(ctx, a, x, y, r) {
  ell(ctx, x, y, r, r);
  ctx.fillStyle = tone(a, PEARL[1]);
  ctx.fill();
  pen(ctx, tone(a, PEARL[3]), r * 0.3);
  ctx.stroke();
  ell(ctx, x + r * 0.2, y + r * 0.25, r * 0.55, r * 0.4);
  ctx.fillStyle = tone(a, PEARL[2], 0.8);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.32, r * 0.36, r * 0.3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
function cardigan(ctx, a, mode, D) {
  const q = a.axQ ?? {};
  const pts = cardOutline(a, D);
  smooth(ctx, pts);
  if (mode === 'line') {
    pen(ctx, tone(a, CARD[3]), LW);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = tone(a, CARD[1]);
  ctx.fill();
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  const lit = ptOf(a, D, 'chest', [90, 100]);
  const sh = ptOf(a, D, 'torso', [64, 126]);
  glow(ctx, lit[0], lit[1], 9, CARD[0], 0.75);
  glow(ctx, sh[0], sh[1], 9, CARD[2], 0.7);
  // the V at the neck (a little of its pink chest), its cream ribbing
  ctx.save();
  enter(ctx, a, D, 'chest');
  ctx.beginPath();
  ctx.moveTo(73.6, 90);
  ctx.quadraticCurveTo(80, 98, 84.2, 104.6);
  ctx.quadraticCurveTo(86.4, 97, 88.6, 90);
  ctx.closePath();
  ctx.fillStyle = tone(a, SKIN[1]);
  ctx.fill();
  pen(ctx, tone(a, CREAM[1]), 2.4);
  ctx.beginPath();
  ctx.moveTo(72.6, 90.6);
  ctx.quadraticCurveTo(80, 98, 84.2, 104.8);
  ctx.quadraticCurveTo(86.4, 97, 89.6, 90.6);
  ctx.stroke();
  pen(ctx, tone(a, CREAM[2]), 0.5);
  ctx.stroke();
  ctx.restore();
  // the placket down the front, the pearl buttons, the ribbed hem, the pocket (and the stamp in it)
  ctx.save();
  enter(ctx, a, D, 'torso');
  pen(ctx, tone(a, CREAM[1]), 2.6);
  ctx.beginPath();
  ctx.moveTo(84.2, 104);
  ctx.quadraticCurveTo(84.8, 120, 84.4, 137);
  ctx.stroke();
  pen(ctx, tone(a, CREAM[2]), 0.45);
  ctx.beginPath();
  ctx.moveTo(85.6, 104.6);
  ctx.quadraticCurveTo(86.2, 120, 85.8, 137);
  ctx.stroke();
  for (const y of [109, 117.4, 125.8]) pearlButton(ctx, a, 84.6, y, 1.55);
  ctx.restore();
  // (the hem's ribbing, along the cardigan's own lower edge)
  pen(ctx, tone(a, CREAM[1]), 2.4 * D.SC);
  sline(ctx, [pts[5], pts[6], pts[7], pts[8], pts[9]].map(([x, y]) => [x, y + 0.2]));
  ctx.stroke();
  pen(ctx, tone(a, CREAM[2]), 0.35 * D.SC * 2);
  for (let i = 0; i < 9; i++) {
    const u = 0.08 + i * 0.105;
    const j = Math.min(3, Math.floor(u * 4));
    const v = u * 4 - j;
    const P0 = pts[5 + j];
    const P1 = pts[6 + j];
    const x = mix(P0[0], P1[0], v);
    const y = mix(P0[1], P1[1], v);
    ctx.beginPath();
    ctx.moveTo(x, y - 0.5);
    ctx.lineTo(x, y + 0.6);
    ctx.stroke();
  }
  ctx.save();
  enter(ctx, a, D, 'torso');
  smooth(ctx, [[89.6, 118], [98.4, 117.6], [98.8, 125.4], [94.2, 126.6], [89.4, 125.2]]);
  ctx.fillStyle = tone(a, CARD[2], 0.55);
  ctx.fill();
  pen(ctx, tone(a, CARD[3], 0.5), 0.5);
  ctx.stroke();
  if ((q.stampOut ?? 0) < 0.5) {
    // the stamp's round wooden knob peeking out of the pocket
    ell(ctx, 94.6, 116.4, 1.6, 1.5);
    ctx.fillStyle = tone(a, WOOD[1]);
    ctx.fill();
    pen(ctx, tone(a, WOOD[2]), 0.45);
    ctx.stroke();
    ell(ctx, 94.1, 115.9, 0.6, 0.5);
    ctx.fillStyle = tone(a, WOOD[0]);
    ctx.fill();
  }
  pen(ctx, tone(a, CREAM[1]), 1.7);
  ctx.beginPath();
  ctx.moveTo(89.4, 118.2);
  ctx.quadraticCurveTo(94, 117.4, 98.6, 117.8);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
// A sleeve over an arm: a soft coral tube from the shoulder to a cream cuff at the wrist.
function sleeve(ctx, a, mode, D, k) {
  const sh = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const el = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const wr = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const w = 3.3;
  const end = [el[0] + (wr[0] - el[0]) * 0.96, el[1] + (wr[1] - el[1]) * 0.96];
  const cuff = [el[0] + (wr[0] - el[0]) * 0.55, el[1] + (wr[1] - el[1]) * 0.55];
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(sh[0], sh[1]);
    ctx.lineTo(el[0], el[1]);
    ctx.lineTo(end[0], end[1]);
  };
  path();
  if (mode === 'line') {
    pen(ctx, tone(a, CARD[3]), w + LW);
    ctx.stroke();
    return;
  }
  const near = k === 'N';
  pen(ctx, tone(a, CARD[3], 0.7), w + 0.55);
  ctx.stroke();
  pen(ctx, tone(a, near ? CARD[1] : CARD[2]), w);
  ctx.stroke();
  // (a soft light along its top)
  pen(ctx, tone(a, CARD[0], near ? 0.6 : 0.25), w * 0.32);
  ctx.beginPath();
  ctx.moveTo(sh[0] - 0.4, sh[1] - 0.6);
  ctx.lineTo(el[0] - 0.5, el[1] - 0.5);
  ctx.stroke();
  // the cuff
  pen(ctx, tone(a, CREAM[2]), w + 0.5);
  ctx.beginPath();
  ctx.moveTo(cuff[0], cuff[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();
  pen(ctx, tone(a, near ? CREAM[1] : CREAM[2]), w);
  ctx.stroke();
}

// ---------- Its hands: round mittens, four soft fingers ----------
// Shapes: [the four fingers' reach 0 curled .. 1 out, their spread]: a grip (curled over an edge), a
// point (one finger up, the others curled), open (all out, fanned), a pinch (bunched, holding a page
// or the stamp).
const HANDS = {
  grip: [0.15, 0.15, 0.15, 0.15, 0.7],
  point: [1, 0, 0, 0, 0.6],
  open: [0.8, 0.85, 0.85, 0.8, 1.3],
  pinch: [0.35, 0.3, 0.25, 0.2, 0.35],
};
function mitten(ctx, a, mode, D, k) {
  const hs = (a.axHands ?? {})[k] ?? HANDS.grip;
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1] - 0.6);
  ctx.rotate(an - Math.PI / 2);
  const near = k === 'N';
  const shape = () => {
    ell(ctx, 0, 0, 3.9, 3.6);
    // the thumb, a soft round at its side
    ctx.moveTo(-2.4 + 2.2, -0.6);
    ctx.ellipse(-3.2, -0.6, 2.1, 1.7, 0.5, 0, TAU);
    for (let i = 0; i < 4; i++) {
      const th = Math.PI / 2 + (i - 1.5) * 0.36 * hs[4];
      const r0 = 2.2;
      const r1 = 3.4 + hs[i] * 3.4;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const ex = c * r1;
      const ey = s * r1;
      ctx.moveTo(ex + 1.2, ey);
      ctx.ellipse(ex, ey, 1.25, 1.25, 0, 0, TAU);
      if (hs[i] > 0.05) {
        // (a finger: a soft capsule from the palm out to its round tip)
        const px = -s * 1.2;
        const py = c * 1.2;
        ctx.moveTo(c * r0 + px, s * r0 + py);
        ctx.lineTo(ex + px, ey + py);
        ctx.lineTo(ex - px, ey - py);
        ctx.lineTo(c * r0 - px, s * r0 - py);
        ctx.closePath();
      }
    }
  };
  shape();
  if (mode === 'line') {
    pen(ctx, tone(a, INK), LW / D.SC);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, near ? SKIN[1] : SKIN[2]);
  ctx.fill('nonzero');
  glow(ctx, -0.6, -1.2, 4, SKIN[0], near ? 0.85 : 0.3);
  // (a soft rim in its own pink, so it reads over the cardigan and the book)
  shape();
  pen(ctx, tone(a, INK, 0.45), 0.55);
  ctx.stroke();
  ell(ctx, 0, 0, 3.9, 3.6);
  ctx.fillStyle = tone(a, near ? SKIN[1] : SKIN[2]);
  ctx.fill();
  glow(ctx, -0.6, -1.2, 3.4, SKIN[0], near ? 0.8 : 0.3);
  ctx.restore();
}
// Its feet: round soft pads with four round toes, peeking from under the hem.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  const shape = () => {
    smooth(ctx, [[p[0] - 4.4, p[1] + 1.8], [p[0] - 2, p[1] - 1.4], [p[0] + 3, p[1] - 0.6], [p[0] + 6.4, p[1] + 2.6], [p[0] + 7, p[1] + 5.2], [p[0] + 3, p[1] + 6.4], [p[0] - 3.6, p[1] + 6.3], [p[0] - 5.2, p[1] + 4.4]]);
    for (const [dx, dy] of [[6.6, 4.4], [5.4, 5.6], [3.6, 6.1]]) {
      ctx.moveTo(p[0] + dx + 1.4, p[1] + dy);
      ctx.ellipse(p[0] + dx, p[1] + dy, 1.4, 1.2, 0, 0, TAU);
    }
  };
  shape();
  paint(ctx, a, mode, near ? SKIN[1] : SKIN[2]);
  if (mode === 'fill') {
    glow(ctx, p[0] + 1, p[1] + 1.5, 5, SKIN[0], near ? 0.8 : 0.3);
  }
  ctx.restore();
}

// ---------- The book (and the stamp, the page, the boat) ----------
// Its frame: the spine's middle at the origin, the fore-edge out along +x, rig px.
const BW = 5.3;
const BH = 6.8;
// Where the book is: in its near hand (gripped at the fore-edge's lower half), held to its chest by
// its far hand, open in its lap, or fallen on the floor; blended by the weights in a.axBk.
function bookAt(a, D) {
  const w = a.axBk ?? { hold: 1, chest: 0, lap: 0, floor: 0 };
  const ang0 = a.axBkAng ?? 0;
  const hd = ptOf(a, D, 'handN', D.J.handN);
  // (in hand: turned with its tilt, the grip at the fore-edge)
  const ca = Math.cos(ang0);
  const sa = Math.sin(ang0);
  const gx = BW - 0.7;
  // (raised high, it's held by its lower edge, so it stands up over its hands)
  const lift = a.axBkLift ?? 0;
  const gy = 0.9 + lift * 4.6;
  const hold = [hd[0] - (ca * gx - sa * gy) - lift * 1.2, hd[1] - (sa * gx + ca * gy)];
  const chestP = ptOf(a, D, 'chest', [79.6, 108]);
  const M = a.blMat('chest');
  const chestAng = Math.atan2(M[1], M[0]);
  const lapP = ptOf(a, D, 'torso', [84, 122]);
  const floorP = [9, -2.2];
  const sum = w.hold + w.chest + w.lap + w.floor || 1;
  const x = (hold[0] * w.hold + chestP[0] * w.chest + lapP[0] * w.lap + floorP[0] * w.floor) / sum;
  const y = (hold[1] * w.hold + chestP[1] * w.chest + lapP[1] * w.lap + floorP[1] * w.floor) / sum;
  const ang = (ang0 * w.hold + (chestAng - 0.06 + ang0 * 0.3) * w.chest + -0.5 * w.lap + 0.18 * w.floor) / sum;
  return { x, y, ang };
}
// A page of the open book: x from x0 to x1 (the gutter at 0), its top bowing down to the gutter.
function pagePath(ctx, x0, x1, top, bot) {
  const g = Math.abs(x0) < Math.abs(x1) ? x0 : x1;
  const o = g === x0 ? x1 : x0;
  ctx.beginPath();
  ctx.moveTo(g, top + 0.5);
  ctx.quadraticCurveTo((g + o) / 2, top - 0.5, o, top - 0.1);
  ctx.lineTo(o, bot);
  ctx.quadraticCurveTo((g + o) / 2, bot + 0.3, g, bot + 0.4);
  ctx.closePath();
}
function roundRect(ctx, x0, y0, x1, y1, r) {
  ctx.beginPath();
  ctx.roundRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0), Math.min(r, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2));
}
function textLines(ctx, a, x0, x1, top, n, al) {
  pen(ctx, tone(a, '#b9a7c4', al), 0.32);
  for (let i = 0; i < n; i++) {
    const y = top + 1.2 + i * 1.05;
    const l = i === n - 1 ? 0.55 : i % 2 ? 0.9 : 1;
    const a0 = Math.min(x0, x1) + 0.6;
    const a1 = a0 + (Math.abs(x1 - x0) - 1.2) * l;
    ctx.beginPath();
    ctx.moveTo(a0, y);
    ctx.lineTo(a1, y);
    ctx.stroke();
  }
}
function bookDraw(ctx, a, mode, D) {
  const q = a.axQ ?? {};
  const B = bookAt(a, D);
  const op = clamp(a.axOpen ?? 0, 0, 1);
  const th = op * Math.PI;
  const xc = BW * Math.cos(th);
  const top = -BH / 2;
  const bot = BH / 2;
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.rotate(B.ang);
  if (mode === 'line') {
    // the covers' outer edges
    roundRect(ctx, -0.5, top - 0.35, BW + 0.45, bot + 0.35, 0.9);
    pen(ctx, tone(a, BOOK[3]), LW);
    ctx.stroke();
    if (op > 0.02) {
      roundRect(ctx, Math.min(-0.3, xc - 0.45), top - 0.35, 0.3, bot + 0.35, 0.9);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  // the back cover (behind the pages)
  roundRect(ctx, -0.5, top - 0.35, BW + 0.45, bot + 0.35, 0.9);
  ctx.fillStyle = tone(a, BOOK[2]);
  ctx.fill();
  // the right-hand page / the page block
  pagePath(ctx, 0, BW, top + 0.2, bot - 0.1);
  ctx.fillStyle = tone(a, PAGE[0]);
  ctx.fill();
  pen(ctx, tone(a, PAGE[2], 0.8), 0.3);
  ctx.stroke();
  if (op > 0.3) textLines(ctx, a, 0.2, BW, top + 0.3, 5, sstep((op - 0.3) / 0.4));
  // (its pages a little wavy with the damp, down the fore-edge)
  pen(ctx, tone(a, PAGE[2], 0.7), 0.28);
  ctx.beginPath();
  ctx.moveTo(BW - 0.35, top + 0.6);
  ctx.quadraticCurveTo(BW + 0.05, top + 2.2, BW - 0.35, 0);
  ctx.quadraticCurveTo(BW - 0.75, 1.8, BW - 0.35, bot - 0.6);
  ctx.stroke();
  // the front cover, swinging open about the spine
  if (th < Math.PI / 2) {
    roundRect(ctx, -0.5, top - 0.35, Math.max(0.3, xc + 0.1), bot + 0.35, 0.9);
    ctx.fillStyle = tone(a, BOOK[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, xc * 0.35, top + 1.5, 4.5, BOOK[0], 0.7);
    // the damp: a deeper patch soaking up from the bottom corner
    glow(ctx, -0.2, bot - 0.4, 3.6, BOOK[3], 0.45);
    // a gold band and a little coral shell on the cover (the palace library's)
    const kx = Math.max(0.05, Math.cos(th));
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fillRect(0.4 * kx, top + 1.0, (BW - 1.1) * kx, 0.75);
    ctx.fillRect(0.4 * kx, bot - 1.6, (BW - 1.1) * kx, 0.45);
    ell(ctx, (BW / 2) * kx, 0.4, 1.1 * kx, 1.0);
    ctx.fillStyle = tone(a, CARD[1]);
    ctx.fill();
    // OVERDUE: the stamp's mark on the cover, drying into the damp
    if ((q.mark ?? 0) > 0.02) {
      ctx.save();
      ctx.globalAlpha *= q.mark;
      ctx.translate((BW / 2) * kx, 1.2);
      ctx.rotate(-0.22);
      roundRect(ctx, -1.9 * kx, -0.9, 1.9 * kx, 0.9, 0.4);
      pen(ctx, tone(a, '#e0566e'), 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-1.3 * kx, 0);
      ctx.lineTo(1.3 * kx, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  } else {
    // (open: the cover's inside and the left-hand page on it)
    roundRect(ctx, Math.min(-0.3, xc - 0.45), top - 0.35, 0.3, bot + 0.35, 0.9);
    ctx.fillStyle = tone(a, BOOK[2]);
    ctx.fill();
    pagePath(ctx, Math.min(-0.1, xc + 0.1), 0, top + 0.2, bot - 0.1);
    ctx.fillStyle = tone(a, PAGE[1]);
    ctx.fill();
    pen(ctx, tone(a, PAGE[2], 0.8), 0.3);
    ctx.stroke();
    if (op > 0.6) textLines(ctx, a, xc + 0.1, -0.1, top + 0.3, 5, sstep((op - 0.6) / 0.3));
    // the gutter's soft shade
    glow(ctx, 0, 0, 1.6, PAGE[2], 0.6);
  }
  // the spine
  roundRect(ctx, -0.65, top - 0.35, 0.55, bot + 0.35, 0.6);
  ctx.fillStyle = tone(a, BOOK[3]);
  ctx.fill();
  // (a rim in its own deep teal, so it reads in front of the cardigan)
  roundRect(ctx, Math.min(-0.5, xc - 0.45), top - 0.35, BW + 0.45, bot + 0.35, 0.9);
  pen(ctx, tone(a, BOOK[3], 0.75), 0.4);
  ctx.stroke();
  // a drop beading at the bottom corner (it's always damp)
  const dp = q.bead ?? 0;
  if (dp > 0.02) waterDrop(ctx, a, BW * 0.15, bot + 0.6 + dp * 0.8, 0.45 + dp * 0.35, 1);
  // its far hand's fingers over the spine's edge (the hand itself is behind it)
  const tips = q.tips ?? 0;
  if (tips > 0.05) {
    ctx.save();
    ctx.globalAlpha *= sstep(tips);
    for (let i = 0; i < 3; i++) {
      ell(ctx, -0.55, -0.6 + i * 1.05, 0.75, 0.6);
      ctx.fillStyle = tone(a, SKIN[2]);
      ctx.fill();
      pen(ctx, tone(a, INK, 0.6), 0.28);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
// The little stamp: a round wooden knob on a short handle, a coral rubber block.
function stampDraw(ctx, a, mode, x, y, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const shape = () => {
    ell(ctx, 0, -2.2, 1.15, 1.1);
    ctx.moveTo(0.5, -1.3);
    ctx.rect(-0.5, -1.4, 1, 1.2);
    ctx.moveTo(1.4, -0.3);
    ctx.roundRect(-1.4, -0.4, 2.8, 1.3, 0.35);
  };
  shape();
  if (mode === 'line') {
    pen(ctx, tone(a, WOOD[2]), LW * 0.8);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, WOOD[1]);
    ctx.fill();
    ell(ctx, -0.35, -2.5, 0.45, 0.4);
    ctx.fillStyle = tone(a, WOOD[0]);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-1.4, 0.4, 2.8, 0.55, 0.25);
    ctx.fillStyle = tone(a, '#e0566e');
    ctx.fill();
  }
  ctx.restore();
}
// A torn-out page folding into a paper boat: `fold` 0 a flat page .. 1 a boat; `flip` the mirror of
// its twirl (a clean flip at each half turn, never squashed).
function boatShape(ctx, fold, s) {
  const k = sstep(fold);
  // (corner by corner, the page's rectangle becomes a boat's hull and its sail)
  const P = [
    [mix(-2.2, -3.2, k), mix(-2.8, -0.2, k)],
    [mix(0, -0.8, k), mix(-2.8, -0.2, k)],
    [mix(0.4, 0, k), mix(-2.8, -3.4, k)],
    [mix(2.2, 0.8, k), mix(-2.8, -0.2, k)],
    [mix(2.2, 3.2, k), mix(-2.8, -0.2, k)],
    [mix(2.2, 2.0, k), mix(2.8, 1.5, k)],
    [mix(-2.2, -2.0, k), mix(2.8, 1.5, k)],
  ];
  ctx.beginPath();
  P.forEach(([x, y], i) => (i ? ctx.lineTo(x * s * 0.62, y * 0.62) : ctx.moveTo(x * s * 0.62, y * 0.62)));
  ctx.closePath();
}
function paperDraw(ctx, a, mode, x, y, ang, fold, flip, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  boatShape(ctx, fold, flip);
  if (mode === 'line') {
    pen(ctx, tone(a, '#b6a6c8'), LW * 0.9);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, PAGE[0]);
    ctx.fill();
    pen(ctx, tone(a, '#cdbfdb'), 0.3);
    ctx.stroke();
    if (fold < 0.5) textLines(ctx, a, -1.2, 1.2, -1.8, 3, 1 - fold * 2);
    else {
      // the hull's fold line and the sail's crease
      ctx.beginPath();
      ctx.moveTo(-1.9 * flip, -0.12);
      ctx.lineTo(1.9 * flip, -0.12);
      ctx.moveTo(0, -0.15);
      ctx.lineTo(0, -1.9);
      pen(ctx, tone(a, '#cdbfdb', (fold - 0.5) * 2), 0.28);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// What its near hand holds besides the book: the page or the boat, or the stamp.
function heldDraw(ctx, a, mode, D) {
  const q = a.axQ ?? {};
  if (!q.held) return;
  const hd = ptOf(a, D, 'handN', D.J.handN);
  const wr = ptOf(a, D, 'handN', D.J.wrN);
  const dx = hd[0] - wr[0];
  const dy = hd[1] - wr[1];
  const d = Math.hypot(dx, dy) || 1;
  const tip = [hd[0] + (dx / d) * 1.6, hd[1] + (dy / d) * 1.6];
  if (q.held === 'stamp') stampDraw(ctx, a, mode, tip[0], tip[1] + 0.6, q.stampAng ?? 0);
  else paperDraw(ctx, a, mode, tip[0], tip[1] - 1, q.paperAng ?? 0, q.fold ?? 0, q.flip ?? 1);
}

// ---------- Its act and its fight (on the base's channels) ----------
const SWINGS = ['paperBoat', 'bookSlam', 'shush'];
function pickSwing(m, st) {
  if (typeof m.move === 'string' && SWINGS.includes(m.move)) return m.move;
  if (m.swingFar === true) return 'paperBoat';
  if (m.swingFar === false) return (st.axN ?? 0) % 2 ? 'bookSlam' : 'shush';
  return SWINGS[(st.axN ?? 0) % SWINGS.length];
}
// The book carried before it in both hands: the near arm forward, the forearm up, the mitten at the
// fore-edge; the far arm the same behind the book.
const HOLD = { shN: -8, elN: -60, hwN: -6, shF: -14, elF: -58, hwF: 0 };
// The book held to its chest by the far hand alone.
const CLAMP = { shF: -34, elF: -82 };
// Its idle act: four pieces, each whole in itself.
const PIECES = { read: 7.8, shhh: 6.0, overdue: 7.2, soggy: 6.6 };
const ORDER = ['read', 'shhh', 'overdue', 'soggy'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const kr = (rate) => 1 - Math.exp(-dt * rate);
  const q = { mood: 'calm', look: [0.25, 0.15], turn: 0.3, hand: { N: 'grip', F: 'grip' }, bk: 'hold', open: 0, openNow: null, bookAng: 0, lift: 0, front: false, held: null, fold: 0, flip: 1, paperAng: 0, stampAng: 0, stampOut: 0, mark: 0, tips: 1, bead: 0, droop: 0, flare: 0, flinch: 0, askew: 0, glint: 0, sweat: -1, fx: null, mk: null };
  a.axQ = q;
  a.axUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * Math.min(1, k);
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.4);
  const alive = m.hp > 0;
  const cineMood = m.cine?.mood;
  const low = alive && m.hp < (m.def.hp ?? 1) * 0.3;
  const since = now - (m.attackAt ?? -9);
  const W0 = m.def.fight?.windup ?? 0.5;
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, W0), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 1.15));
  if (swinging && !st.axAtk) {
    st.axN = (st.axN ?? (m.uid ?? 0)) + 1;
    st.axPick = pickSwing(m, st);
  }
  st.axAntic = swinging ? Math.max(anticK, st.axAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 1.15;
  st.axAtk = swinging;
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.55;
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const busy = !alive || swinging;

  // Standing: prim and upright, the book held before it, a slow breath.
  go({ tilt: -1, chest: -1.5 + breath * 0.6, head: -1 + Math.sin(t * 0.6) * 1.2, ...HOLD }, 1);
  out.shN += breath * 1.5;
  out.shF += breath * 1.2;
  q.bead = (t * 0.25 + (m.uid ?? 0) * 0.37) % 1;
  // Walking: a slow little waddle, the book carried, a rock with each step.
  if (walkW > 0.01) {
    const p = (a[GAIT_U] ?? 0) * TAU;
    out.tilt += (2 + Math.sin(2 * p) * 1.2) * walkW;
    out.head += -Math.sin(2 * p - 0.5) * 1.6 * walkW;
    out.shN += Math.sin(2 * p) * 3 * walkW;
    out.shF += Math.sin(2 * p + 0.4) * 3 * walkW;
    q.turn = mix(q.turn, 0.45, walkW);
    q.look = [0.6, 0];
  }

  // Its own marks: a "!" as it starts hunting you, a "?" when it loses you.
  if (fighting && !st.axHunt) st.axBangAt = now;
  if (!fighting && st.axHunt && alive) st.axLostAt = now;
  st.axHunt = fighting;
  const bang = now - (st.axBangAt ?? -9);
  const huh = now - (st.axLostAt ?? -9);
  const banging = alive && !swinging && bang >= 0 && bang < 1.2;
  const huhing = alive && !swinging && !fighting && huh >= 0 && huh < 1.5;

  if (!alive) {
    // beaten: sat down hard, the book fallen open on the floor, glasses askew, dizzy
    const u = now - (st.axDeadAt ??= now);
    go({ drop: 1, tilt: -12, head: 14, chest: -2, shN: -10, elN: -40, shF: 10, elF: -30, x: -0.02 });
    q.mood = 'dizzy';
    q.turn = 0.15;
    q.bk = 'floor';
    q.open = 1;
    q.tips = 0;
    q.droop = 1;
    q.askew = sstep(u / 0.4);
    q.hand.N = 'open';
    q.hand.F = 'open';
    q.mk = { kind: 'dizzy', u };
  } else st.axDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.axPick ?? 'bookSlam';
      const Wd = sstep(st.axAntic);
      if (kind === 'paperBoat') {
        // Paper Boat: a page torn out at the top of the book, folded into a boat with a twirl up by
        // its head, drawn back... and tossed in an arc
        const hitK = struck ? (since < 0.07 ? sstep(since / 0.07) : 1 - sstep((since - 0.3) / 0.45)) : 0;
        const A = struck ? 1 : anticK;
        const grab = win(A, 0, 0.16, 0.26, 0.4);
        const up = struck ? 1 - hitK : sstep((A - 0.24) / 0.3);
        const back = struck ? 1 - hitK : sstep((A - 0.72) / 0.26);
        q.bk = 'chest';
        go(CLAMP, Math.max(Wd, struck ? 1 - sstep((since - 0.6) / 0.4) : 0));
        go({ shN: -78, elN: -96, hwN: 10 }, grab);
        go({ shN: -128, elN: -62, hwN: -10, head: -4, tilt: -2 }, up);
        go({ shN: -165, elN: -48, tilt: -7, head: -7, chest: -3, x: -0.02 }, back);
        go({ shN: -62, elN: -14, hwN: 8, tilt: 9, head: 5, chest: 3, x: 0.04 }, hitK);
        if (!struck || since < 0.02) {
          q.held = A > 0.14 ? 'page' : null;
          q.fold = sstep((A - 0.3) / 0.42);
          // (the twirl: two half turns, each a clean mirror flip)
          q.flip = A > 0.42 && A < 0.66 ? -1 : 1;
          q.paperAng = mix(0, -0.4, back);
        }
        q.hand.N = struck ? (hitK > 0.2 ? 'open' : 'grip') : A > 0.1 ? 'pinch' : 'grip';
        q.mood = struck ? 'playful' : A < 0.4 ? 'focus' : 'prim';
        q.look = struck ? [1, -0.1] : A < 0.35 ? [0.5, 0.6] : [0.7, -0.5];
        q.fx = { kind: struck ? 'toss' : 'fold', u: struck ? since : A };
      } else if (kind === 'bookSlam') {
        // Book Slam: the book raised high in both hands and opened (a long, deep lean back), then
        // slammed down shut on you, a puff of pages; held there, and a slow heave back up
        const hitK = struck ? (since < 0.08 ? sstep(since / 0.08) : 1 - sstep((since - 0.48) / 0.6)) : 0;
        const wK = struck ? 0 : Wd;
        go({ shN: -172, elN: -22, hwN: -10, shF: -168, elF: -22, tilt: -11, head: -10, chest: -6, x: -0.03 }, wK);
        go({ shN: -58, elN: -6, hwN: 12, shF: -52, elF: -6, tilt: 17, head: 11, chest: 6, x: 0.07 }, hitK);
        q.open = struck ? 0 : sstep((anticK - 0.25) / 0.55);
        if (struck && since < 0.12) q.openNow = 1 - sstep(since / 0.08);
        q.bookAng = mix(0, -0.6, wK) + mix(0, 0.35, hitK);
        q.flare = wK;
        q.front = true;
        q.lift = struck ? 1 - hitK : wK;
        q.mood = struck ? (since < 0.5 ? 'shout' : 'cross') : 'fierce';
        q.look = struck ? [0.9, 0.5] : [0.4, -1];
        q.fx = { kind: struck ? 'slam' : 'raise', u: struck ? since : anticK };
      } else {
        // Shush: a breath in, a finger to its lips, then a stern "SHHH" pushing out at you
        const hitK = struck ? (since < 0.06 ? sstep(since / 0.06) : 1 - sstep((since - 0.42) / 0.4)) : 0;
        const finger = struck ? 1 - sstep((since - 0.55) / 0.4) : sstep((anticK - 0.1) / 0.6);
        q.bk = 'chest';
        go(CLAMP, Math.max(Wd, struck ? 1 - sstep((since - 0.8) / 0.3) : 0));
        go(LIPS, finger);
        go({ tilt: -5, chest: -3, head: -5 }, struck ? 0 : Wd);
        go({ tilt: 9, head: 6, chest: 4, x: 0.035 }, hitK);
        q.hand.N = finger > 0.4 ? 'point' : 'grip';
        q.mood = struck ? (since < 0.6 ? 'shush' : 'stern') : anticK > 0.5 ? 'shush' : 'stern';
        q.flare = struck ? hitK * 0.6 : Wd * 0.4;
        q.look = [1, 0];
        q.fx = { kind: struck ? 'shush' : 'inhale', u: struck ? since : anticK };
      }
    } else if (hurt) {
      // a squeezed wince, the book hugged, the fronds flinching
      const k = 1 - sstep(hurtU / 0.55);
      go({ tilt: -8, head: -10, chest: -3, x: -0.02 }, k);
      go(CLAMP, k);
      if (k > 0.3) q.bk = 'chest';
      q.mood = 'hurt';
      q.flinch = k;
      q.fx = { kind: 'hurt', u: hurtU };
    }
    // asleep: sat down, the book open in its lap, its head nodding, z's in bubbles
    st.axNap = mix(st.axNap ?? 0, napping && !busy ? 1 : 0, kr(3));
    if (st.axNap > 0.01) {
      const k = sstep(st.axNap);
      go({ drop: 0.8, tilt: 4, head: 13 + Math.sin(t * 1.1) * 2.5, chest: 2 + Math.sin(t * 1.1) * 1.2, shN: -4, elN: -52, shF: -4, elF: -52 }, k);
      if (k > 0.5) {
        q.mood = 'sleep';
        q.bk = 'lap';
        q.open = 1;
        q.tips = 0;
        q.droop = 0.6 * k;
        q.mk = { kind: 'z', u: t };
      }
    }
    // a prim little nod after landing a hit, and a note
    if (gloat >= 0 && gloat < 1.3 && !busy && !hurt) {
      const k = win(gloat, 0, 0.15, 1.0, 1.3);
      go({ head: 9 * Math.sin(Math.min(1, gloat / 0.7) * Math.PI), tilt: -2, chest: -2 }, k);
      if (k > 0.4) q.mood = 'proud';
      q.mk = { kind: 'gloat', u: gloat };
    }
    // the marks: "!" (it spots you: brows up, fronds up, a glint off its glasses), "?" (lost you)
    if (banging && !hurt) {
      const k = win(bang, 0, 0.12, 0.8, 1.2);
      go({ head: -6, tilt: -3 }, k);
      q.mood = bang < 0.55 ? 'spot' : 'stern';
      q.flare = Math.max(q.flare, k);
      q.glint = win(bang, 0.2, 0.35, 0.6, 0.8);
      q.look = [1, -0.2];
      q.mk = { kind: 'bang', u: bang };
    } else if (huhing && !hurt) {
      const k = win(huh, 0, 0.2, 1.1, 1.5);
      go({ head: -4 }, k);
      q.mood = 'huh';
      q.turn = mix(q.turn, -0.1, k);
      q.look = [-0.6, -0.5];
      q.mk = { kind: 'huh', u: huh };
    }
    // its idle act: only when it's calm, and only a piece it has time to finish
    const calmGoal = !busy && !hurt && !napping && !fighting && !m.pose && !m.cine && !m.talking && walkW < 0.05 && !banging && !huhing && gloat > 1.3 ? 1 : 0;
    st.axCalm = mix(st.axCalm ?? 0, calmGoal, kr(calmGoal ? 1.8 : 8));
    const cw = sstep(st.axCalm);
    let PC = st.axPiece ?? null;
    if (PC && (now < PC.t0 - 0.3 || (cw < 0.03 && !calmGoal))) PC = null;
    if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
    if (PC && !PC.name && now >= PC.until) PC = null;
    if (!PC && calmGoal) {
      const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
      st.axOrd ??= (m.uid ?? 0) % ORDER.length;
      for (let i = 0; i < ORDER.length; i++) {
        const nm = ORDER[(st.axOrd + i) % ORDER.length];
        if (PIECES[nm] + 0.5 <= left) {
          PC = { name: nm, t0: now + 0.3 };
          st.axOrd = (st.axOrd + i + 1) % ORDER.length;
          break;
        }
      }
      if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
    }
    st.axPiece = PC;
    if (PC?.name && cw > 0.01) idleAct(PC.name, now - PC.t0, out, go, q, cw, t);
    // hunting you: stern, the book held tight
    if (fighting && !busy && !hurt && !banging) {
      q.mood = 'stern';
      q.look = [1, 0];
    }
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'happy', sad: 'sad', talk: 'talk', sleep: 'sleep', blink: 'sleep', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy && !hurt) {
      if (!fighting && !(PC?.name && cw > 0.5)) q.mood = 'worried';
      q.droop = Math.max(q.droop, 0.35);
    }
    if (low) q.sweat = (t * 0.55) % 1;
    if (m.talking) q.mood = 'talk';
  }
  // (a dev page may hold a mood to look at it close up: tools/zz-octoscholarcheck.html)
  if (typeof m.faceTest === 'string' && FACES[m.faceTest]) q.mood = m.faceTest;
  // (where its face is turned, eased: never a snap round)
  q.turn = spring(st, 'axTurn', q.turn, 220, 28, dt);
  // The face, eased toward its mood (talking runs through vowel shapes); a blink now and then.
  const F = FACES[q.mood] ?? FACES.calm;
  const f = (st.axF ??= { ...FACES.calm, sh: 0, kinds: { blink: 1, happy: 0, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], mo: v[1], ro: v[2], ms: v[3] };
  }
  for (const key of FACE_KEYS) f[key] = mix(f[key], tgt[key], kr(14));
  const bt = (a.t ?? 0) + (m.uid ?? 0) * 0.83;
  const blink = F.sh < 0.5 ? win(bt % 4.7, 4.25, 4.31, 4.37, 4.47) : 0;
  const shutGoal = Math.max(F.sh, blink);
  f.sh = mix(f.sh, shutGoal, kr(F.sh > 0.5 || blink > 0 ? 26 : 18));
  const kindNow = F.sh > 0.5 ? F.kind : 'blink';
  for (const kd of KINDS) f.kinds[kd] = mix(f.kinds[kd], kd === kindNow ? 1 : 0, kr(16));
  a.axF = f;
  // (its gaze darts: eased quickly to each new place)
  st.axLook ??= [0, 0];
  st.axLook[0] = mix(st.axLook[0], q.look[0], kr(22));
  st.axLook[1] = mix(st.axLook[1], q.look[1], kr(22));
  q.look = st.axLook;
  // The book: where it is (weights eased so it glides between them), how open, its tilt.
  const bw = (st.axBk ??= { hold: 1, chest: 0, lap: 0, floor: 0 });
  for (const kd of ['hold', 'chest', 'lap', 'floor']) bw[kd] = mix(bw[kd], q.bk === kd ? 1 : 0, kr(q.bk === 'floor' ? 7 : 11));
  a.axBk = bw;
  st.axOpen = q.openNow != null ? q.openNow : mix(st.axOpen ?? 0, q.open, kr(9));
  a.axOpen = st.axOpen;
  st.axLift = mix(st.axLift ?? 0, q.lift, kr(14));
  a.axBkLift = st.axLift;
  a.axBkAng = spring(st, 'axBkA', q.bookAng - (out.tilt ?? 0) * 0.004, 150, 15, dt);
  st.axTips = mix(st.axTips ?? 1, q.tips * (bw.hold + bw.chest), kr(10));
  q.tips = st.axTips;
  st.axMark = q.mark > (st.axMark ?? 0) ? q.mark : mix(st.axMark ?? 0, q.mark, kr(2));
  q.mark = st.axMark;
  st.axAskew = mix(st.axAskew ?? 0, q.askew, kr(10));
  q.askew = st.axAskew;
  // its hands' shapes, eased
  const hands = (st.axHands ??= { N: [...HANDS.grip], F: [...HANDS.grip] });
  for (const k of ['N', 'F']) {
    const goal = HANDS[q.hand[k]] ?? HANDS.grip;
    for (let i = 0; i < 5; i++) hands[k][i] = mix(hands[k][i], goal[i], kr(20));
  }
  a.axHands = hands;
  // springs: the fronds (each piece trailing the one before it), the tail, the glasses' chain
  const kick = (st.axLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.axLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.axLast = out.head;
  st.axLastT = out.tilt;
  st.axDroop = mix(st.axDroop ?? 0, q.droop, kr(3));
  st.axFlare = mix(st.axFlare ?? 0, q.flare, kr(9));
  const droop = st.axDroop;
  const flare = st.axFlare;
  const step = walkW * Math.sin((a[GAIT_U] ?? 0) * TAU * 2);
  const fr = (a.axFr ??= [[[0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0, 0]]]);
  for (let e = 0; e < 2; e++) {
    for (let i = 0; i < 3; i++) {
      const base = FRONDS[i].ang;
      const sway = Math.sin(t * 1.25 + i * 0.9 + e * 1.7) * 0.07 + step * 0.06;
      const g0 = base + droop * (0.42 + i * 0.12) - flare * (0.22 + (2 - i) * 0.05) - q.flinch * 0.55 + sway;
      const a0 = spring(st, `fr${e}${i}a`, g0, 95, 9, dt, kick * 0.012 - (q.flinch > 0.9 ? 0.02 : 0));
      const g1 = a0 + droop * 0.35 - flare * 0.12 + Math.sin(t * 1.25 + i * 0.9 + e * 1.7 - 0.8) * 0.06;
      fr[e][i][0] = a0;
      fr[e][i][1] = spring(st, `fr${e}${i}b`, g1, 60, 6.5, dt, kick * 0.018);
    }
  }
  const p = (a[GAIT_U] ?? 0) * TAU;
  const tailRest = [Math.PI - 1.05, Math.PI - 0.62, Math.PI - 0.22, Math.PI + 0.12, Math.PI + 0.42];
  const tl = (a.axTail ??= [0, 0, 0, 0, 0]);
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(t * 1.3 - i * 0.7) * (0.05 + i * 0.015) + walkW * Math.sin(p * 2 - i * 0.9) * (0.08 + i * 0.03) + (m.hp <= 0 ? 0.25 : 0);
    tl[i] = spring(st, `tl${i}`, tailRest[i] + sway - (out.tilt ?? 0) * 0.006, 70 - i * 8, 7, dt, kick * 0.004 * (i + 1));
  }
  q.chain = spring(st, 'axChain', -(out.head ?? 0) * 0.02 + walkW * Math.sin(p * 2) * 0.25, 60, 5, dt, kick * 0.01);
}
// The finger to its lips: the near arm folded up, the forearm upright, the hand at its mouth.
const LIPS = { shN: -96, elN: -128, hwN: -14 };
// A piece of the act at `u` seconds into it, at weight `w` (how calm it is).
function idleAct(name, u, out, go, q, w, t) {
  const at = (k) => k * w > 0.5;
  if (name === 'read') {
    // opened, read (its eyes running along the lines), leaning in... a gasp; shut and hugged
    const k = win(u, 0, 0.5, 7.2, 7.8);
    const lean = win(u, 3.2, 3.9, 4.25, 4.45);
    const gasp = win(u, 4.3, 4.45, 4.9, 5.3);
    const hug = win(u, 5.3, 5.8, 6.9, 7.4);
    go({ shN: -24, elN: -86, shF: -26, elF: -80, head: 8 + 3 * lean, tilt: 2 + 3 * lean }, k * w * (1 - hug));
    go({ head: -8, tilt: -6, chest: -3 }, gasp * w);
    go({ shN: -14, elN: -118, hwN: -20, shF: -20, elF: -110, head: 4 + Math.sin(u * 3.2) * 3, tilt: Math.sin(u * 3.2) * 2.5 }, hug * w);
    if (at(k)) {
      q.open = win(u, 0.4, 1.1, 4.9, 5.35);
      q.bk = hug > 0.15 ? 'chest' : 'hold';
      q.tips = hug > 0.15 ? 0.6 : 1;
      if (u > 1.1 && u < 3.3) {
        const line = Math.floor((u - 1.1) / 0.72);
        const v = ((u - 1.1) % 0.72) / 0.72;
        const x = v < 0.84 ? mix(-0.7, 0.7, sstep(v / 0.84)) : mix(0.7, -0.7, sstep((v - 0.84) / 0.16));
        q.look = [x, 0.55 + line * 0.12];
      } else q.look = u < 4.3 ? [0, 0.8] : [0.2, -0.3];
      q.mood = u < 1.1 ? 'prim' : u < 3.3 ? 'read' : u < 4.3 ? 'rapt' : u < 5.3 ? 'gasp' : u < 7.2 ? 'bliss' : 'calm';
      q.flare = Math.max(q.flare, gasp);
      q.hand.N = gasp > 0.3 ? 'open' : 'grip';
      q.fx = { kind: 'read', u };
    }
  } else if (name === 'shhh') {
    // a finger to its lips, shushing nobody; a stern look round; a prim nod
    const k = win(u, 0, 0.4, 5.5, 6.0);
    const finger = win(u, 0.6, 1.1, 4.5, 5.0);
    const round = win(u, 3.1, 3.5, 3.9, 4.3);
    const nod = win(u, 5.0, 5.25, 5.45, 5.8);
    go(CLAMP, finger * w);
    go(LIPS, finger * w);
    go({ head: -2 + 8 * nod, tilt: -2 }, k * w);
    if (at(k)) {
      q.bk = finger > 0.1 ? 'chest' : 'hold';
      q.hand.N = finger > 0.5 ? 'point' : 'grip';
      q.mood = u < 0.9 ? 'prim' : u < 3.1 ? 'shush' : u < 4.6 ? 'stern' : 'proud';
      q.turn = mix(q.turn, -0.35, round);
      q.look = u < 3.1 ? [Math.sin(u * 1.3) * 0.6, 0] : round > 0.4 ? [-1, 0.1] : [1, 0];
      q.fx = { kind: 'shhh', u };
    }
  } else if (name === 'overdue') {
    // the stamp out of the pocket, a huff on it, raised... STAMP; a satisfied nod; tucked away
    const k = win(u, 0, 0.5, 6.7, 7.2);
    const pocket = win(u, 0.5, 0.9, 1.2, 1.5) + win(u, 5.2, 5.6, 5.9, 6.3);
    const show = win(u, 1.3, 1.7, 2.1, 2.4);
    const raise = win(u, 2.2, 2.7, 2.82, 2.9);
    const press = win(u, 2.82, 2.92, 3.4, 3.8);
    const nod = win(u, 3.9, 4.2, 4.6, 5.0);
    go(CLAMP, k * w);
    go({ shN: 14, elN: -46, hwN: 10 }, pocket * w);
    go({ shN: -104, elN: -70, hwN: -10, head: -3 }, show * w);
    go({ shN: -150, elN: -58, tilt: -4, head: -5 }, raise * w);
    go({ shN: -44, elN: -86, hwN: 18, tilt: 6, head: 7 }, press * w);
    go({ head: 10 * Math.sin(Math.PI * clamp((u - 3.9) / 1.1, 0, 1)), tilt: 2 }, nod * w);
    if (at(k)) {
      q.bk = 'chest';
      q.tips = 1;
      const out2 = u > 1.15 && u < 5.75;
      q.held = out2 ? 'stamp' : null;
      q.stampOut = out2 ? 1 : 0;
      q.stampAng = press > 0.3 ? 0 : show > 0.3 ? -0.5 : 0.2;
      q.hand.N = pocket > 0.3 || out2 ? 'pinch' : 'grip';
      q.mark = u > 2.92 ? 1 - sstep((u - 5.2) / 1.8) : 0;
      q.mood = u < 1.5 ? 'focus' : u < 2.2 ? 'huff' : u < 3.8 ? 'focus' : u < 5.1 ? 'satisfied' : 'prim';
      q.look = u < 1.5 ? [0.3, 0.9] : u < 2.5 ? [0.8, -0.4] : [0.3, 0.9];
      q.fx = { kind: 'overdue', u };
    }
  } else {
    // squeezed: water streams out of the book; a long sigh, the fronds drooping; a little shake
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const squeeze = win(u, 0.6, 1.0, 2.4, 2.8);
    const sigh = win(u, 2.6, 3.1, 4.1, 4.6);
    const shake = win(u, 4.5, 4.7, 5.3, 5.6);
    go({ shN: -2, elN: -96, shF: -6, elF: -92, tilt: 5, chest: 4, head: 6 }, squeeze * w);
    go({ head: 10, tilt: 3, chest: 2, shrugN: -3, shrugF: -3 }, sigh * w);
    go({ shN: -22 + Math.sin(u * 22) * 6, elN: -60 }, shake * w);
    if (at(k)) {
      q.bookAng = 0.5 * squeeze + Math.sin(u * 22) * 0.22 * shake;
      q.mood = u < 0.6 ? 'worried' : u < 2.7 ? 'focus' : u < 4.5 ? 'sigh' : 'prim';
      q.droop = Math.max(q.droop, sigh, squeeze * 0.4);
      q.look = [0.4, 0.9];
      q.fx = { kind: 'soggy', u };
    }
  }
}

// ---------- Little drawn things for its effects (soft, its own colours) ----------
function waterDrop(ctx, a, x, y, s, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.5);
  ctx.quadraticCurveTo(x + s * 1.05, y + s * 0.1, x, y + s);
  ctx.quadraticCurveTo(x - s * 1.05, y + s * 0.1, x, y - s * 1.5);
  ctx.fillStyle = WATER[1];
  ctx.fill();
  pen(ctx, WATER[3], s * 0.28);
  ctx.stroke();
  ell(ctx, x - s * 0.3, y - s * 0.05, s * 0.28, s * 0.36);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function sweatDrop(ctx, a, x, y, s, al) {
  waterDrop(ctx, a, x, y, s, al);
}
function splash(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.3);
  pen(ctx, WATER[3], 0.9);
  ctx.stroke();
  pen(ctx, '#ffffff', 0.4);
  ctx.stroke();
  ctx.restore();
}
function heart(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.7, -s * 1.2, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.7, -s * 1.2, s * 1.4, -s * 0.1, 0, s * 0.9);
  ctx.fillStyle = '#ff9cb4';
  ctx.fill();
  pen(ctx, '#e0688a', s * 0.22);
  ctx.stroke();
  ell(ctx, -s * 0.4, -s * 0.35, s * 0.22, s * 0.16, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A round bubble with a glint (its z's float in them).
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(230,248,252,0.45)';
  ctx.fill();
  pen(ctx, WATER[3], Math.max(0.5, r * 0.16));
  ctx.stroke();
  ell(ctx, x - r * 0.38, y - r * 0.4, r * 0.24, r * 0.17, -0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// Its speech-bubble marks: a soft cream round with a little tail toward its head, a "!" or "?" drawn
// in rounded strokes (never text).
function markBubble(ctx, kind, x, y, s, al, f) {
  if (al <= 0.01 || s <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  const col = kind === '!' ? '#e0566e' : '#9b7cc8';
  ctx.beginPath();
  ctx.arc(0, 0, 5.4, 0, TAU);
  ctx.moveTo(-1.8 * f, 4.6);
  ctx.quadraticCurveTo(-3.6 * f, 7.4, -5 * f, 7.8);
  ctx.quadraticCurveTo(-2.4 * f, 6.6, 0.6 * f, 5.2);
  ctx.fillStyle = '#fffaf2';
  ctx.fill();
  pen(ctx, kind === '!' ? '#d07a86' : '#b9a2dc', 0.9);
  ctx.stroke();
  pen(ctx, col, 1.6);
  ctx.beginPath();
  if (kind === '!') {
    ctx.moveTo(0, -2.9);
    ctx.lineTo(0, 0.6);
  } else {
    ctx.moveTo(-1.6 * f, -1.6);
    ctx.quadraticCurveTo(-1.4 * f, -3.4, 0.2 * f, -3.3);
    ctx.quadraticCurveTo(1.9 * f, -3.1, 1.6 * f, -1.5);
    ctx.quadraticCurveTo(1.3 * f, -0.4, 0, 0.1);
    ctx.lineTo(0, 0.6);
  }
  ctx.stroke();
  ell(ctx, 0, 2.5, 0.95, 0.95);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A music note of its own: coral, its head a little pearl.
function myNote(ctx, x, y, s, ang, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  pen(ctx, '#d0687c', s * 0.38);
  ctx.beginPath();
  ctx.moveTo(s * 0.65, 0);
  ctx.lineTo(s * 0.65, -s * 2.2);
  ctx.quadraticCurveTo(s * 1.4, -s * 1.9, s * 1.5, -s * 1.15);
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.82, s * 0.62, -0.4);
  ctx.fillStyle = '#f6eef8';
  ctx.fill();
  pen(ctx, '#d0687c', s * 0.3);
  ctx.stroke();
  ell(ctx, -s * 0.25, -s * 0.2, s * 0.25, s * 0.17, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A "z" drawn in a soft rounded stroke.
function zee(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  pen(ctx, '#9c86c8', s * 0.34);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y - s * 0.7);
  ctx.lineTo(x + s * 0.7, y - s * 0.7);
  ctx.lineTo(x - s * 0.7, y + s * 0.7);
  ctx.lineTo(x + s * 0.7, y + s * 0.7);
  ctx.stroke();
  ctx.restore();
}
// A soft swish: a crescent of paper-white, outlined in its own soft aqua, tapering at both ends.
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#ffffff', rim = '#9fd0d8') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const n = 16;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const an = a0 + (a1 - a0) * u;
    const ww = w * Math.sin(Math.PI * u) ** 0.8;
    const x = cx + Math.cos(an) * (r + ww / 2);
    const y = cy + Math.sin(an) * (r + ww / 2);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    const an = a0 + (a1 - a0) * u;
    const ww = w * Math.sin(Math.PI * u) ** 0.8;
    ctx.lineTo(cx + Math.cos(an) * (r - ww / 2), cy + Math.sin(an) * (r - ww / 2));
  }
  ctx.closePath();
  pen(ctx, rim, 1.1);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A shush ring: a soft arc pushing out ahead of its mouth, lilac with a white core.
function shushArc(ctx, x, y, r, al, f) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r, 0, -1.05, 1.05);
  pen(ctx, '#c2a8ea', 1.9);
  ctx.stroke();
  pen(ctx, '#ffffff', 0.8);
  ctx.stroke();
  ctx.restore();
}
// A loose page fluttering out.
function loosePage(ctx, x, y, s, ang, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.roundRect(-s, -s * 1.25, s * 2, s * 2.5, s * 0.35);
  ctx.fillStyle = PAGE[0];
  ctx.fill();
  pen(ctx, '#cdbfdb', 0.5);
  ctx.stroke();
  pen(ctx, '#d6c8e0', 0.35);
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.5);
  ctx.lineTo(s * 0.55, -s * 0.5);
  ctx.moveTo(-s * 0.55, s * 0.1);
  ctx.lineTo(s * 0.4, s * 0.1);
  ctx.stroke();
  ctx.restore();
}
// A little pearl (its dizzy circle).
function pearl(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = PEARL[1];
  ctx.fill();
  pen(ctx, PEARL[3], r * 0.3);
  ctx.stroke();
  ell(ctx, x - r * 0.3, y - r * 0.32, r * 0.34, r * 0.28);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// ---------- Effects (the rig's space, facing right; game px sizes) ----------
function fx(ctx, m, a, S, matOf, D) {
  const q = a.axQ;
  if (!q || (!q.fx && !q.mk)) return;
  ctx.save();
  ctx.scale(1 / BIG, 1 / BIG);
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const B = (p) => [p[0] * BIG, p[1] * BIG];
  const turn = q.turn ?? 0.3;
  const tx = turn * 5;
  const mouthP = B(headAt(a, D, [tx + 1 + turn * 1.4, MOUTH_Y]));
  const crown = B(headAt(a, D, [tx, -16]));
  const hd = B(headAt(a, D, [tx, 0]));
  const bk = bookAt(a, D);
  const bookP = B([bk.x, bk.y]);
  const X = q.fx;
  if (X) {
    const u = X.u;
    if (X.kind === 'read') {
      // the gasp: three sparkles off its head; the hug: little hearts rising
      if (u > 4.3 && u < 5.3) {
        const v = clamp((u - 4.3) / 0.8, 0, 1);
        for (let i = 0; i < 3; i++) sparkle(ctx, crown[0] - 6 + i * 6 + Math.cos(i * 2.1) * v * 4, crown[1] - 2 - v * 6 - (i % 2) * 3, 2.2 * Math.sin(Math.PI * v), 1);
      }
      for (let i = 0; i < 2; i++) {
        const v = clamp((u - 5.7 - i * 0.45) / 1.2, 0, 1);
        if (v > 0 && v < 1) heart(ctx, bookP[0] + 4 + i * 5 + Math.sin(v * 5 + i) * 1.5, bookP[1] - 6 - v * 12, 1.8, Math.sin(Math.PI * v));
      }
    } else if (X.kind === 'shhh') {
      // small shush ripples from its lips, then a tiny "shh"
      if (u > 1.2 && u < 3.2) {
        for (let i = 0; i < 2; i++) {
          const v = ((u - 1.2) * 0.9 + i * 0.5) % 1;
          shushArc(ctx, mouthP[0] + 4 + v * 9, mouthP[1], 2 + v * 5, Math.sin(Math.PI * v) * 0.75 * win(u, 1.2, 1.4, 3.0, 3.2), f);
        }
        cue(ctx, 'shh...', mouthP[0] + 14, mouthP[1] - 9, 5, f, -0.1, '#8a6ab8', '#fbf6ff');
      }
    } else if (X.kind === 'overdue') {
      // a huff of breath on the stamp; STAMP: a soft coral puff, OVERDUE
      if (u > 1.75 && u < 2.3) dust(ctx, mouthP[0] + 4, mouthP[1], 1.6 + (u - 1.75) * 3, 0.7 * win(u, 1.75, 1.85, 2.1, 2.3), '#ffffff', '#e4e8f4');
      if (u > 2.9 && u < 3.9) {
        const v = clamp((u - 2.9) / 0.6, 0, 1);
        for (let i = 0; i < 4; i++) {
          const an = -0.3 + i * 1.6;
          sparkle(ctx, bookP[0] + 3 + Math.cos(an) * (3 + v * 6), bookP[1] + Math.sin(an) * (2 + v * 4), 1.8 * (1 - v), 1 - v * 0.6, '#ffd7de');
        }
        cue(ctx, 'OVERDUE', bookP[0] + 12, bookP[1] - 12 - v * 3, 6.5, f, -0.12, '#d0506a', '#fff7f2');
      }
    } else if (X.kind === 'soggy') {
      // the water streaming out of the book's corner, drops to the floor, little splashes; a sigh
      const cx = bookP[0] + Math.cos(bk.ang) * 0.6 * BIG;
      const cy = bookP[1] + 4.2 * BIG;
      if (u > 0.8 && u < 3.6) {
        const rate = u < 2.6 ? 1 : 1 - (u - 2.6);
        for (let i = 0; i < 5; i++) {
          const v = ((u - 0.8) * 1.6 + i / 5) % 1;
          const y = cy + v * (-cy - 1);
          if (y < -1 && (i < 5 * rate)) waterDrop(ctx, a, cx + Math.sin(i * 2.3) * 0.6, y, 0.9, 0.95);
        }
        for (let i = 0; i < 2; i++) {
          const v = ((u - 0.9) * 1.1 + i * 0.5) % 1;
          splash(ctx, cx, -0.6, 1.5 + v * 4, (1 - v) * 0.8 * win(u, 0.9, 1.2, 3.2, 3.6));
        }
      }
      if (u > 2.8 && u < 4.4) {
        const v = clamp((u - 2.8) / 1.6, 0, 1);
        bubble(ctx, mouthP[0] + 4 + v * 5, mouthP[1] - 2 - v * 8, 1.4 + v * 1.4, Math.sin(Math.PI * v) * 0.9);
        cue(ctx, 'sigh', mouthP[0] + 12, mouthP[1] - 12 - v * 2, 4.6, f, -0.1, '#8a6ab8', '#fbf6ff');
      }
      if (u > 4.6 && u < 5.6) {
        for (let i = 0; i < 3; i++) {
          const v = clamp((u - 4.6 - i * 0.18) / 0.5, 0, 1);
          if (v > 0 && v < 1) waterDrop(ctx, a, bookP[0] + 6 + i * 2 + v * 5, bookP[1] - 2 - Math.sin(Math.PI * v) * 5 + v * 4, 0.8, 1 - v * 0.5);
        }
      }
    } else if (X.kind === 'fold') {
      // the rip (two scraps of paper and a puff), the fold's sparkle
      if (u > 0.12 && u < 0.45) {
        const v = clamp((u - 0.12) / 0.33, 0, 1);
        loosePage(ctx, bookP[0] + 2 + v * 3, bookP[1] - 5 - v * 4, 0.7, v * 2, 1 - v);
        cue(ctx, 'rip!', bookP[0] + 8, bookP[1] - 11, 4.8, f, -0.1, '#7a6a9a', '#fffaf2');
      }
      if (u > 0.45) {
        const hand = B(ptOf(a, D, 'handN', D.J.handN));
        sparkle(ctx, hand[0] + 2, hand[1] - 5, 2.4 * Math.sin(Math.PI * clamp((u - 0.45) / 0.4, 0, 1)), 1);
      }
    } else if (X.kind === 'toss') {
      // the throw's soft swish, a sparkle off its fingers
      if (u < 0.35) {
        const v = clamp(u / 0.3, 0, 1);
        swish(ctx, hd[0] + 2, hd[1] + 4, 13, -1.9 + v * 0.6, -0.4 + v * 0.7, 3.4, 1 - v);
        sparkle(ctx, hd[0] + 14 + v * 4, hd[1] - 2, 2 * (1 - v), 1 - v);
      }
    } else if (X.kind === 'raise') {
      // the wind-up: a glint on the book held high, drops shaken off it
      if (u > 0.3) sparkle(ctx, bookP[0] + 4, bookP[1] - 4, 1.6 + Math.sin(t * 10), 0.8);
      for (let i = 0; i < 2; i++) {
        const v = clamp((u - 0.35 - i * 0.2) / 0.4, 0, 1);
        if (v > 0 && v < 1) waterDrop(ctx, a, bookP[0] - 2 + i * 6, bookP[1] + 2 + v * 8, 0.8, 1 - v);
      }
    } else if (X.kind === 'slam') {
      // SLAM: a soft puff of pages, damp drops flying, the word
      if (u < 0.75) {
        const v = clamp(u / 0.6, 0, 1);
        dust(ctx, bookP[0] + 4, bookP[1] + 2, 3 + v * 4, (1 - v) * 0.9, '#fffaf0', '#f0d8cc');
        for (let i = 0; i < 3; i++) {
          const an = -2.2 + i * 0.9;
          loosePage(ctx, bookP[0] + 4 + Math.cos(an) * (3 + v * 9), bookP[1] + Math.sin(an) * (3 + v * 7) + v * v * 6, 1.3, an + v * (2 + i), 1 - v);
        }
        for (let i = 0; i < 3; i++) {
          const an = -0.4 + i * 0.5;
          waterDrop(ctx, a, bookP[0] + 6 + Math.cos(an) * v * 10, bookP[1] + Math.sin(an) * v * 6 + v * v * 8, 0.8, 1 - v);
        }
        if (u < 0.6) cue(ctx, 'SLAM!', bookP[0] + 12, bookP[1] - 14, 8, f, -0.12, '#c4486a', '#fff7f2');
      }
    } else if (X.kind === 'inhale') {
      if (u > 0.3) sparkle(ctx, mouthP[0] + 5, mouthP[1] - 6, 1.4 * Math.sin(Math.PI * clamp((u - 0.3) / 0.7, 0, 1)), 0.9);
    } else if (X.kind === 'shush') {
      // SHHH: soft rings pushing out at you
      if (u < 0.8) {
        for (let i = 0; i < 3; i++) {
          const v = clamp((u - i * 0.1) / 0.5, 0, 1);
          if (v > 0 && v < 1) shushArc(ctx, mouthP[0] + 5 + v * 16, mouthP[1], 3 + v * 9, (1 - v) * 0.95, f);
        }
        if (u < 0.6) cue(ctx, 'SHHH!', mouthP[0] + 14, mouthP[1] - 13, 7.5, f, -0.1, '#7a56b0', '#fbf6ff');
      }
    } else if (X.kind === 'hurt') {
      const v = clamp(u / 0.45, 0, 1);
      for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 9 - v * 6 + i * 5, hd[1] - 9 - v * 5 - i * 2.5, 2 * (1 - v), 1 - v, '#ffe0ea');
    }
  }
  const M = q.mk;
  if (M) {
    const u = M.u;
    if (M.kind === 'bang') {
      const s = u < 0.18 ? sstep(u / 0.18) * 1.12 : 1 + 0.12 * Math.max(0, 1 - (u - 0.18) / 0.15);
      markBubble(ctx, '!', crown[0] + 9, crown[1] - 9, 0.95 * Math.min(1.12, s), 1 - sstep((u - 0.95) / 0.25), f);
    } else if (M.kind === 'huh') {
      const s = u < 0.2 ? sstep(u / 0.2) * 1.1 : 1 + 0.1 * Math.max(0, 1 - (u - 0.2) / 0.15);
      markBubble(ctx, '?', crown[0] + 8, crown[1] - 9 + Math.sin(u * 4) * 0.8, 0.9 * Math.min(1.1, s), 1 - sstep((u - 1.2) / 0.3), f);
    } else if (M.kind === 'gloat') {
      myNote(ctx, crown[0] + 8 + u * 5, crown[1] - 3 - u * 9 - Math.abs(Math.sin(u * 7)) * 1.5, 1.8, Math.sin(u * 5) * 0.25, win(u, 0.1, 0.25, 0.9, 1.3));
    } else if (M.kind === 'z') {
      for (let i = 0; i < 3; i++) {
        const v = (u * 0.42 + i / 3) % 1;
        const x = crown[0] + 6 + v * 9 + Math.sin(v * 6 + i) * 1.5;
        const y = crown[1] - 1 - v * 13;
        const al = Math.sin(Math.PI * v);
        bubble(ctx, x, y, 2.3 + v * 1.6, al * 0.9);
        zee(ctx, x, y, 1.1 + v * 0.7, al);
      }
    } else if (M.kind === 'dizzy') {
      for (let i = 0; i < 4; i++) {
        const an = t * 3 + (i * TAU) / 4;
        const px = crown[0] + Math.cos(an) * 10;
        const py = crown[1] + 1 + Math.sin(an) * 3;
        const front = Math.sin(an) > 0 ? 1 : 0.6;
        if (i % 2) sparkle(ctx, px, py, 2.2, front);
        else pearl(ctx, px, py, 1.3, front);
      }
    }
  }
  ctx.restore();
}

// ---------- Its Paper Boat in flight (the dungeon's 'spit' vfx: render/dreamfx.js dreamShot) ----------
// `p` 0..1 along its flight, `d` the way it flies. Returns true if it drew.
const plainTone = (a, c, al = 1) => tone(null, c, al);
export function paperBoatShot(ctx, shot, x, y, p, d) {
  if (shot !== 'paperboat') return false;
  ctx.save();
  // a trail of little drops behind it (everything from the library is wet)
  for (let i = 1; i <= 3; i++) waterDrop(ctx, null, x - d * i * 3.2, y + 1 + i * 0.4 + Math.sin(p * 18 + i) * 0.5, 0.75 - i * 0.12, 0.8 * (1 - i / 4));
  // (rocking a little as it sails: nose up as it rises, down as it falls)
  const ang = d * (p - 0.5) * 0.7 + Math.sin(p * 14) * 0.12;
  const big = 1.9;
  paperDraw(ctx, { flash: 0 }, 'line', x, y, ang, 1, d, big);
  paperDraw(ctx, { flash: 0 }, 'fill', x, y, ang, 1, d, big);
  // a coral pennant on the sail's tip (the palace's colours)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -3.4 * 0.62 * big);
  ctx.quadraticCurveTo(d * 1.4, -3.9 * 0.62 * big, d * 2.2, -3.2 * 0.62 * big);
  ctx.lineTo(0, -2.7 * 0.62 * big);
  ctx.closePath();
  ctx.fillStyle = plainTone(null, CARD[1]);
  ctx.fill();
  ctx.restore();
  sparkle(ctx, x + d * 3, y - 4, 1.2 + Math.sin(p * 26) * 0.4, 1);
  ctx.restore();
  return true;
}

const DRESS = {
  id: ID,
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: LW },
  liveHead: true,
  noMoves: true,
  hide: ['tail', 'handFskin', 'handNskin', 'footFskin', 'footNskin'],
  under: {
    neckSkin: (ctx, a, mode, S, D) => fronds(ctx, a, mode, D),
  },
  under2: (ctx, m, a, S, matOf, D) => tail(ctx, a, D),
  over: {
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => mitten(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    torsoSkin: (ctx, a, mode, S, D) => {
      cardigan(ctx, a, mode, D);
      if (!a.axQ?.front) bookDraw(ctx, a, mode, D);
    },
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      // (raised high for the Book Slam, the book is up in front of its head, behind its hands)
      if (a.axQ?.front) bookDraw(ctx, a, mode, D);
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => {
      heldDraw(ctx, a, mode, D);
      mitten(ctx, a, mode, D, 'N');
    },
  },
  pose,
  fx,
};
const R = dressRig('axolotl', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
// Its art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over
// its head left to it, drawn in its own style on its drawn head).
export const AXOLOTL_LIBRARIAN = {
  art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 300, 220, 240], draw: R.still, rig, noHop: true, ownEmotes: true },
  size: { w: 34, h: 40 },
};
// (its dress, for the dev tools that watch its parts frame by frame)
export const AXOLOTL_LIBRARIAN_DRESS = DRESS;
