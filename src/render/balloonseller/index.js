// The Koala Balloonist (2026-11-26, the Balloon Seller remade from scratch as a new creature; the id stays
// `balloonseller`). Mabel, the Midway's balloon seller: a soft silver-grey wind-up koala in mint
// dungarees and a straw boater, a bunch of carnival balloons always bobbing over her head. Queen
// Gearheart's toys have to keep performing while anyone is watching, and Mabel would very much rather be
// asleep: she nods off between customers, and the balloons try to carry her off whenever she does. She
// moves on her own copy of the creature base (rig.js; body.js `koala`: a soft pear of a body, short
// sturdy legs, plump arms), dressed here; her head, ears, hat and balloons drawn here from scratch over
// the mannequin's (the shared face never used, nothing of the hero's).
//   look    warm silver-grey plush fur, a cream chest; big round ears with soft cream fluff in them
//           (round lobes, never points); a big glossy charcoal nose; a straw boater with a cherry
//           band and bow, tipped at a jaunty angle; mint dungarees (the base's own skin, so they fit
//           and fold with every pose: trouser legs and all) over a cream shirt with rolled cuffs, a
//           cherry bow tie, a pocket of spare balloons; bare round koala feet; a brass wind-up key in
//           her back, turning (slower as she dozes, still when she's beaten). In her far paw, five
//           balloons on strings (cherry, sun, mint, rose, sky), each bobbing on its own spring.
//   eyes    her own "button" eyes: round and glossy, almost all iris (deep plum-brown, a darker rim,
//           a soft ring of light), two big glints like a button's shine; a neat soft lash line with
//           one round flick at the outer end. Round fluffy brows. Faces: content (rest), beaming
//           (^ ^), drowsy (only in her dozes), startled, focus, cross, puffed (blowing), yawning,
//           hurt, sleepy, dizzy (beaten), sad, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces, only a piece she has time to finish (data `rest`, m.restUntil):
//           - a new balloon (7.6 s): one from her pocket, blown up with puffed cheeks (it grows, in
//             solid), its neck tied, added to the bunch, beaming;
//           - forty winks (8 s): her head nods, a "z"; a gust and the balloons lift her right off her
//             feet; she wakes kicking, floats back down, relieved;
//           - counting (6.4 s): she counts the balloons with her near paw, "1, 2, 3, 4, 5!";
//           - a yawn (6 s): a huge yawn and a stretch; she catches you looking, and holds out a
//             balloon to you with a smile (customer service).
//   walk    a short-legged plod, the balloons bobbing and trailing behind her.
//   fight   her moves: from afar, Balloon Pop (a balloon picked from the bunch, drawn back and let
//           go: it bobs over to you and pops, `balloonShot`); up close, in turn, Bunch Bonk (the
//           whole bunch swung up and brought down on you, BOING) and Dozy Headbutt (she nods off
//           mid-fight, sinks... and her head snaps forward into you, her hat flying up).
//   marks   all her own (`ownEmotes`): a "!" bubble as she starts hunting you, a "?" when she loses
//           you, a wave and a note after landing a hit, z's when she naps (lots of them), a sweat
//           drop when low, dizzy stars when beaten.
// Every effect is drawn here, live, in her own style: confetti in the balloons' colours, soft puffs of
// breath, z's, the game's curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, cue, note, spring } from './fx.js';

const BIG = 1.28;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#6e6880';
const FUR = ['#f6f4fa', '#cfcbd8', '#aca8bc', '#8a859e'];
const CREAM = ['#ffffff', '#fbf6ee', '#e8dfd2'];
const EARIN = '#efc9cf';
const NOSE = ['#7a7088', '#4a4256', '#2e2838'];
const MINT = ['#e4f8ef', '#aee2cc', '#86c6ad', '#62a68c'];
const MINT_INK = '#4e8a76';
const SHIRT = ['#ffffff', '#fbf4ea', '#e6dccd', '#c9bdab'];
const CHERRY = ['#ff8a96', '#e8485e', '#b83048'];
const STRAW = ['#fff0c4', '#f2d488', '#d6ae5a', '#a88038'];
const GOLD = ['#fff4c0', '#f4c860', '#c49234'];
const IRIS = ['#9a6a8a', '#5e3a58', '#3a2236', '#1e1220'];
const LASH = '#3a3044';
// The balloons: cherry, sun, mint, rose, sky (each a light, a body and a shade).
const BALLOON = [['#ffb0b8', '#f0566c', '#c23a52'], ['#fff2a8', '#f6c840', '#cc9620'], ['#d8fbe8', '#7ad8b0', '#48a886'], ['#ffd6ea', '#f492bc', '#c8628e'], ['#d6efff', '#78bff0', '#4a8fc6']];

// (inside her head, drawn bigger, the line kept the same weight as everywhere else)
let WK = 1;
const paint = (ctx, a, mode, col, ink = INK, w = LW * WK) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
function chaikin(pts, n = 2) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- Her head (head units about its middle, a little over her neck joint) ----------
const HO = [1.5, -14];
const HS = 1.08;
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + HO[0] + u * HS, n[1] + HO[1] + v * HS]);
};
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0] + HO[0], n[1] + HO[1]);
  ctx.scale(HS, HS);
}

// ---------- Her face (every part eased: an expression always passes through an in-between) ----------
// lid: only for closed eyes; shut: which closed shape; bt/by: the brows' tilt (+ knit, - worried) and
// raise; mw/ms/mo: the mouth's width, smile, openness; tg: the tongue (a yawn); bl: blush; sm: irises
// small (startled); pf: cheeks puffed (blowing up a balloon).
const FACES = {
  content: { lid: 0, shut: 'happy', bt: -0.1, by: 0.1, mw: 0.8, ms: 0.45, mo: 0, tg: 0, bl: 0.55, sm: 0, pf: 0 },
  beam: { lid: 1, shut: 'happy', bt: -0.2, by: 0.6, mw: 1, ms: 1, mo: 0.4, tg: 0.5, bl: 0.9, sm: 0, pf: 0 },
  drowsy: { lid: 0.55, shut: 'sleep', bt: -0.25, by: -0.2, mw: 0.6, ms: 0.15, mo: 0.1, tg: 0, bl: 0.6, sm: 0, pf: 0 },
  startled: { lid: 0, shut: 'happy', bt: -0.3, by: 1.3, mw: 0.6, ms: 0, mo: 0.7, tg: 0, bl: 0.6, sm: 0.7, pf: 0 },
  focus: { lid: 0, shut: 'happy', bt: 0.5, by: -0.2, mw: 0.6, ms: 0, mo: 0, tg: 0, bl: 0.5, sm: 0, pf: 0 },
  cross: { lid: 0, shut: 'happy', bt: 0.9, by: -0.4, mw: 0.8, ms: -0.45, mo: 0.1, tg: 0, bl: 0.5, sm: 0.1, pf: 0 },
  shout: { lid: 0, shut: 'happy', bt: 0.7, by: 0.2, mw: 1, ms: 0.2, mo: 0.9, tg: 0.3, bl: 0.7, sm: 0.2, pf: 0 },
  puff: { lid: 0, shut: 'happy', bt: 0.2, by: 0.4, mw: 0.35, ms: 0, mo: 0.15, tg: 0, bl: 1, sm: 0, pf: 1 },
  yawn: { lid: 1, shut: 'squeeze', bt: -0.4, by: 0.6, mw: 1, ms: 0, mo: 1.2, tg: 0.8, bl: 0.6, sm: 0, pf: 0 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.9, ms: -0.7, mo: 0.6, tg: 0, bl: 0.7, sm: 0, pf: 0 },
  sleepy: { lid: 1, shut: 'sleep', bt: -0.2, by: -0.2, mw: 0.6, ms: 0.1, mo: 0.15, tg: 0, bl: 0.6, sm: 0, pf: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.45, tg: 0.4, bl: 0.5, sm: 0, pf: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.95, by: 0.3, mw: 0.7, ms: -0.6, mo: 0, tg: 0, bl: 0.4, sm: 0.15, pf: 0 },
  worried: { lid: 0, shut: 'happy', bt: -0.8, by: 0.5, mw: 0.7, ms: -0.4, mo: 0.15, tg: 0, bl: 0.5, sm: 0.1, pf: 0 },
  talk: { lid: 0, shut: 'happy', bt: 0, by: 0.3, mw: 0.8, ms: 0.3, mo: 0.4, tg: 0, bl: 0.55, sm: 0, pf: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.4, 0.55], [0.9, 0.3, 0.25], [0.7, 0.2, 0], [0.8, 0.2, 0.6]];
const EYE = { w: 3.7, h: 4.1 };

// One button eye (both the same size). side +1: the near one, on the right of her nose.
function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.kbUid ?? 0) * 0.77) % 5.6, 5.1, 5.2, 5.28, 5.42) : 0;
  const L = Math.max(f.lid, blink);
  // (a half-closed lid stays a lid over the open eye; only nearly shut does it become a closed line)
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      const sw = shutW[s];
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LASH), 0.95);
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(x - w, y + 1);
        ctx.quadraticCurveTo(x, y - h * 0.9, x + w, y + 1);
      } else if (s === 'sleep') {
        ctx.moveTo(x - w, y - 0.2);
        ctx.quadraticCurveTo(x, y + h * 0.6, x + w, y - 0.2);
        ctx.moveTo(x + side * w, y - 0.2);
        ctx.quadraticCurveTo(x + side * (w + 0.9), y - 0.1, x + side * (w + 1.2), y - 0.9);
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * w, y - 2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y - 0.3, x - side * w * 0.9, y + 0.2);
        ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.8, x + side * w, y + 2.2);
      } else {
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.92;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
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
  // (round: a soft circle, a touch taller than wide)
  ell(ctx, x, y, w, h);
  ctx.fillStyle = tone(a, '#fffdfc');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, w, h);
  ctx.clip();
  const small = 1 - 0.32 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.6;
  const iy = y + 0.35 + (look?.[1] ?? 0) * 0.5;
  const ir = [3.05 * small, 3.4 * small];
  const g = ctx.createRadialGradient(ix - 0.4, iy + 1.2, 0.3, ix, iy, ir[1]);
  g.addColorStop(0, tone(a, IRIS[0]));
  g.addColorStop(0.55, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[3]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  // a soft ring of light inside the rim
  pen(ctx, tone(a, '#e8c8e0', 0.45), 0.3);
  ctx.beginPath();
  ctx.ellipse(ix, iy, ir[0] * 0.72, ir[1] * 0.72, 0, 0.5, 2.6);
  ctx.stroke();
  ell(ctx, ix, iy, 1.2 * small, 1.35 * small);
  ctx.fillStyle = tone(a, '#160c16');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.3);
  sg.addColorStop(0, 'rgba(80,70,110,0.3)');
  sg.addColorStop(1, 'rgba(80,70,110,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.2, y - h * 1.2, w * 2.4, h);
  // two big glints like a button's shine, and a tiny one
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 0.85, iy - 1.05 * small, 1.05, 0.9, -0.4);
  ctx.fill();
  ell(ctx, ix + side * 0.95, iy + 1.1 * small, 0.62, 0.55, -0.4);
  ctx.fill();
  ell(ctx, ix + side * 0.25, iy - 1.7 * small, 0.3, 0.3);
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h * 2.6 * Math.min(1, L / 0.93));
  }
  ctx.restore();
  if (L > 0.04) {
    // (the lid's edge: a soft lash line lowered with it)
    const ly = y - h * 1.3 + h * 2.6 * Math.min(1, L / 0.93);
    const half = Math.sqrt(Math.max(0, 1 - ((ly - y) / h) ** 2)) * w;
    if (half > 0.3) {
      ctx.beginPath();
      ctx.moveTo(x - half, ly - 0.1);
      ctx.quadraticCurveTo(x, ly + 0.5, x + half, ly - 0.1);
      ctx.lineCap = 'round';
      pen(ctx, tone(a, LASH), 0.8);
      ctx.stroke();
    }
  }
  // the lash line: soft, thin at the inner end, one round flick at the outer end
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.92, y - h * 0.45);
  ctx.quadraticCurveTo(x - side * 0.2, y - h * 1.32, x + side * w * 0.98, y - h * 0.5);
  ctx.quadraticCurveTo(x + side * (w + 0.8), y - h * 0.62, x + side * (w + 1.15), y - h * 1.0);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LASH), 0.85);
  ctx.stroke();
  ctx.restore();
}
// A round fluffy brow, lifted and tilted by the mood.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.by * 1.1);
  ctx.rotate(side * f.bt * 0.4);
  ell(ctx, 0, 0, 1.9, 0.9);
  ctx.fillStyle = tone(a, FUR[3]);
  ctx.fill();
  ell(ctx, -0.4, -0.25, 0.9, 0.35);
  ctx.fillStyle = tone(a, FUR[2], 0.9);
  ctx.fill();
  ctx.restore();
}
function mouth(ctx, a, x, y, f) {
  const w = 1.8 * f.mw;
  const cy = y - f.ms * 0.5;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.3 - o * 0.3, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.6 + o * 2.8, x - w, cy);
    ctx.fillStyle = tone(a, '#8a3a52');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.2, w * 0.7, o * (0.8 + f.tg * 0.6));
    ctx.fillStyle = tone(a, '#f28aa0');
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, '#5e4050'), 0.45);
    ctx.stroke();
  } else {
    // a small "w": a koala's mouth under her big nose, the corners lifting with a smile
    pen(ctx, tone(a, '#5e4050'), 0.6);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.3);
    ctx.quadraticCurveTo(x - w * 0.5, y + 0.9 + f.ms * 0.4, x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y + 0.9 + f.ms * 0.4, x + w, cy - 0.3);
    ctx.stroke();
  }
}
// A big round ear: a soft disc of fur, its rim in round fluffy lobes, cream fluff and pink inside.
function earPts(cx, cy, r, ph) {
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const an = (i / 30) * TAU;
    // (fluff in round lobes all round, a little more at the outside)
    const lob = 1 + 0.06 * Math.abs(Math.sin(an * 4.5 + ph));
    pts.push([cx + Math.cos(an) * r * lob, cy + Math.sin(an) * r * lob * 0.94]);
  }
  return pts;
}
function ear(ctx, a, mode, cx, cy, r, far, wig) {
  ctx.save();
  // (rooted inside her skull: it swings a little about a point toward her head)
  const rx = cx * 0.55;
  const ry = cy * 0.4 + 4;
  ctx.translate(rx, ry);
  ctx.rotate(wig);
  ctx.translate(-rx, -ry);
  const pts = earPts(cx, cy, r, far ? 1 : 0);
  smooth(ctx, pts);
  paint(ctx, a, mode, far ? FUR[2] : FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    glow(ctx, cx - r * 0.3, cy - r * 0.4, r * 0.9, FUR[0], far ? 0.4 : 0.8);
    ell(ctx, cx + (far ? -1.2 : 1.2), cy + 0.8, r * 0.62, r * 0.58);
    ctx.fillStyle = tone(a, EARIN, far ? 0.6 : 0.85);
    ctx.fill();
    // the cream fluff inside: one soft shape, its edge in gentle round lobes, lit at the top
    const fx0 = cx + (far ? -0.8 : 0.8);
    const fluff = [];
    for (let i = 0; i < 20; i++) {
      const an = (i / 20) * TAU;
      const rr = r * 0.5 * (1 + 0.08 * Math.cos(an * 4));
      fluff.push([fx0 + Math.cos(an) * rr, cy + 0.6 + Math.sin(an) * rr * 0.92]);
    }
    smooth(ctx, fluff);
    ctx.fillStyle = tone(a, CREAM[1], far ? 0.7 : 0.95);
    ctx.fill();
    glow(ctx, fx0 - r * 0.15, cy - r * 0.1, r * 0.35, CREAM[0], 0.9);
    ctx.restore();
  }
  ctx.restore();
}
// Her boater: a flat straw crown and a wide brim, a cherry band with a bow; tipped at a jaunty angle,
// riding on its own little spring.
function hat(ctx, a, mode) {
  const q = a.kbQ ?? {};
  ctx.save();
  ctx.translate(1.2, -12.8 - (q.hatUp ?? 0) * 6);
  ctx.rotate(-0.16 + (q.hatTip ?? 0));
  // the brim, seen a little from above
  ell(ctx, 0, 0, 13.2, 2.8);
  paint(ctx, a, mode, STRAW[2], STRAW[3]);
  // the crown
  smooth(ctx, [[-7.4, 0.2], [-7.2, -5], [-5, -6.2], [5, -6.2], [7.2, -5], [7.4, 0.2], [0, 1.2]]);
  paint(ctx, a, mode, STRAW[1], STRAW[3]);
  if (mode === 'fill') {
    ell(ctx, 0, -0.4, 12.6, 2.2);
    ctx.fillStyle = tone(a, STRAW[1]);
    ctx.fill();
    // (the brim's front edge, lit)
    ctx.beginPath();
    ctx.ellipse(0, 0.3, 12.4, 2.2, 0, 0.2, Math.PI - 0.2);
    pen(ctx, tone(a, STRAW[0], 0.9), 0.6);
    ctx.stroke();
    // the woven straw, fine lines round the crown
    pen(ctx, tone(a, STRAW[2], 0.6), 0.3);
    for (const y of [-4.6, -3.4]) {
      ctx.beginPath();
      ctx.moveTo(-7.2, y);
      ctx.quadraticCurveTo(0, y + 0.8, 7.2, y);
      ctx.stroke();
    }
    ell(ctx, 0, -6, 6.4, 1.1);
    ctx.fillStyle = tone(a, STRAW[0]);
    ctx.fill();
    // the cherry band, and its bow at the side
    ctx.beginPath();
    ctx.moveTo(-7.3, -2.4);
    ctx.quadraticCurveTo(0, -1.2, 7.3, -2.4);
    ctx.lineTo(7.35, -0.4);
    ctx.quadraticCurveTo(0, 0.8, -7.35, -0.4);
    ctx.closePath();
    ctx.fillStyle = tone(a, CHERRY[1]);
    ctx.fill();
    for (const s of [-1, 1]) {
      smooth(ctx, [[-4.8, -1.4], [-4.8 + s * 1.8, -2.8], [-4.8 + s * 2.9, -2], [-4.8 + s * 2.7, -0.3], [-4.8 + s * 1.5, -0.4]]);
      ctx.fillStyle = tone(a, s < 0 ? CHERRY[2] : CHERRY[0]);
      ctx.fill();
    }
    ell(ctx, -4.8, -1.4, 0.8, 0.8);
    ctx.fillStyle = tone(a, CHERRY[1]);
    ctx.fill();
  }
  ctx.restore();
}
const SKULL = () => {
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const an = (i / 30) * TAU;
    const s = Math.sin(an);
    pts.push([Math.cos(an) * (15.4 + Math.max(0, s) * 0.8), s * (s < 0 ? 13.6 : 12.6)]);
  }
  return pts;
};
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.kbQ ?? {};
  const f = a.kbF;
  const turn = q.turn ?? 0.35;
  const tx = turn * 3;
  const ew = q.earW ?? [0, 0];
  ear(ctx, a, mode, 13.4, -8.4, 7.4, true, ew[1]);
  smooth(ctx, SKULL());
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    smooth(ctx, SKULL());
    ctx.clip();
    glow(ctx, tx - 2, -9, 14, FUR[0], 0.9);
    glow(ctx, -15, 6, 9, FUR[2], 0.55);
    glow(ctx, tx + 2, 13, 11, FUR[2], 0.45);
    // a soft pale muzzle round her nose and mouth
    ell(ctx, tx + 3.4, 6.2, 6.6, 4.8);
    ctx.fillStyle = tone(a, FUR[0], 0.6);
    ctx.fill();
    ctx.restore();
    // cheeks (puffed when she's blowing up a balloon)
    const pf = f.pf;
    for (const [cx, s] of [[tx - 7.2, 0.85], [tx + 12.2, 1]]) {
      if (pf > 0.02) {
        ell(ctx, cx + (cx > tx ? 0.4 : -0.4) * pf, 5.2, 3.4 * pf + 0.01, 3 * pf + 0.01);
        ctx.fillStyle = tone(a, FUR[0], 0.8 * pf);
        ctx.fill();
      }
      ell(ctx, cx, 5.4, 2.6 + pf * 0.8, 1.5 + pf * 0.6);
      ctx.fillStyle = tone(a, '#ff9aaa', (0.25 + 0.45 * f.bl) * s);
      ctx.fill();
    }
    const ex = (s) => (s < 0 ? -4.4 + tx * 0.7 : 10.6 + tx * 0.95);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), -1.4, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, ex(s) + s * 0.3, -6.8, s, f);
    // the big glossy nose between her eyes
    const nx = tx + 3.4;
    smooth(ctx, [[nx - 3.2, 0], [nx - 2.9, -2.6], [nx - 1.4, -3.9], [nx + 1.4, -3.9], [nx + 2.9, -2.6], [nx + 3.2, 0], [nx + 2.6, 3.3], [nx, 4.6], [nx - 2.6, 3.3]]);
    ctx.fillStyle = tone(a, NOSE[1]);
    ctx.fill();
    const ng = ctx.createLinearGradient(0, -4, 0, 4.6);
    ng.addColorStop(0, tone(a, NOSE[0], 0.9));
    ng.addColorStop(0.5, tone(a, NOSE[1], 0));
    ng.addColorStop(1, tone(a, NOSE[2], 0.8));
    ctx.fillStyle = ng;
    ctx.fill();
    ell(ctx, nx - 1.1, -2, 1.1, 1.5, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
    ell(ctx, nx + 1.2, 2.6, 0.5, 0.35);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
    mouth(ctx, a, nx + 0.2, 7.6, f);
    if (q.sweat >= 0) sweat(ctx, tx - 13, -4 + q.sweat * 3, 1.1);
  }
  ear(ctx, a, mode, -14.2, -7.4, 7.8, false, ew[0]);
  hat(ctx, a, mode);
  WK = 1;
  ctx.restore();
}

// ---------- Her clothes ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// The cream shirt above the dungarees' bib, the bib itself with its straps and buttons, the pocket of
// spare balloons: all cut from her body's own outline.
function dungarees(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const st = D.J.stern;
  const nv = D.J.navel;
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  // the shirt: everything above the bib's top
  poly(ctx, [C([st[0] - 30, st[1] - 10]), C([st[0] + 30, st[1] - 10]), C([st[0] + 30, st[1] + 9]), C([st[0] - 30, st[1] + 9])]);
  ctx.fillStyle = tone(a, SHIRT[1]);
  ctx.fill();
  const sh = C([st[0] + 2, st[1] + 2]);
  glow(ctx, sh[0], sh[1], 5, SHIRT[0], 0.8);
  // the bib: a rounded panel up the front from the waistband
  const bib = chaikin([C([st[0] - 4.6, st[1] + 7.8]), C([st[0] + 10, st[1] + 7.4]), W([nv[0] + 10.4, nv[1] - 1]), W([nv[0] - 5.4, nv[1] - 1])], 2);
  poly(ctx, bib);
  ctx.fillStyle = tone(a, MINT[1]);
  ctx.fill();
  pen(ctx, tone(a, MINT[3], 0.7), 0.4);
  ctx.stroke();
  // the straps, over her shoulders from the bib's corners
  for (const [x0, x1] of [[-3.4, -9], [8.8, 12]]) {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] + x0, st[1] + 8.4]));
    ctx.quadraticCurveTo(...C([st[0] + (x0 + x1) / 2, st[1] + 2]), ...C([st[0] + x1, st[1] - 3]));
    pen(ctx, tone(a, MINT[2]), 2);
    ctx.stroke();
    ell(ctx, ...C([st[0] + x0 * 0.94, st[1] + 8.4]), 0.85, 0.85);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
  }
  // the pocket, three rolled spare balloons peeping from it
  const pk = W([nv[0] + 2.4, nv[1] - 7]);
  for (let i = 0; i < 3; i++) {
    ell(ctx, pk[0] - 1.6 + i * 1.6, pk[1] - 1.8 - (i % 2) * 0.6, 0.75, 1.3, -0.2 + i * 0.2);
    ctx.fillStyle = tone(a, BALLOON[[0, 2, 4][i]][1]);
    ctx.fill();
  }
  smooth(ctx, [[pk[0] - 3.4, pk[1] - 1.4], [pk[0] + 3.4, pk[1] - 1.4], [pk[0] + 3.2, pk[1] + 2.4], [pk[0], pk[1] + 3.2], [pk[0] - 3.2, pk[1] + 2.4]]);
  ctx.fillStyle = tone(a, MINT[2]);
  ctx.fill();
  const tm = W([nv[0] - 2, nv[1] - 4]);
  glow(ctx, tm[0], tm[1], 5, MINT[0], 0.45);
  ctx.restore();
}
// Her cherry bow tie at the collar, on its own little spring.
function bowTie(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] + 3.4, st[1] + 0.4);
  ctx.rotate((a.kbQ?.tie ?? 0) * 0.3);
  // the shirt collar's two points either side
  for (const s of [-1, 1]) {
    smooth(ctx, [[s * 0.6, -2.4], [s * 4.6, -1.8], [s * 3.8, 1.2], [s * 0.8, 0.6]]);
    paint(ctx, a, mode, s > 0 ? SHIRT[0] : SHIRT[1], SHIRT[3]);
  }
  for (const s of [-1, 1]) {
    smooth(ctx, [[0, 0.4], [s * 2.6, -1.4], [s * 3.6, -0.8], [s * 3.6, 1.8], [s * 2.6, 2.4], [0, 1.2]]);
    paint(ctx, a, mode, CHERRY[s > 0 ? 1 : 2], CHERRY[2]);
  }
  ell(ctx, 0, 0.8, 1.1, 1.1);
  paint(ctx, a, mode, CHERRY[0], CHERRY[2]);
  ctx.restore();
}
// A shirt sleeve over an arm, rolled up to just above the wrist (rig space, round the arm's bones:
// outlined round the arm and the sleeve together).
function sleeve(ctx, a, mode, D, k) {
  const S = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const M = [mix(E[0], Wr[0], 0.72), mix(E[1], Wr[1], 0.72)];
  const w = 2.3;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...S);
    ctx.lineTo(...E);
    ctx.lineTo(...M);
  };
  if (mode === 'line') {
    path();
    pen(ctx, '#b0a290', w * 2 + LW * 2);
    ctx.stroke();
  } else {
    path();
    pen(ctx, tone(a, k === 'N' ? SHIRT[1] : SHIRT[2]), w * 2);
    ctx.stroke();
    // a soft light along its top; the rolled cuff
    ctx.beginPath();
    ctx.moveTo(mix(S[0], E[0], 0.2), mix(S[1], E[1], 0.2) - 1.2);
    ctx.lineTo(mix(S[0], E[0], 0.8), mix(S[1], E[1], 0.8) - 1.2);
    pen(ctx, tone(a, SHIRT[0], k === 'N' ? 0.8 : 0.3), 1.3);
    ctx.stroke();
    const an = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
    ell(ctx, M[0], M[1], 1.6, w * 1.08, an);
    ctx.fillStyle = tone(a, k === 'N' ? SHIRT[0] : SHIRT[2]);
    ctx.fill();
    pen(ctx, tone(a, SHIRT[3], 0.7), 0.35);
    ctx.stroke();
  }
  ctx.restore();
}
// A soft grey paw with a dark palm pad (her fur, past the rolled cuff).
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  const near = k === 'N';
  ctx.scale(1.3, 1.3);
  smooth(ctx, [[-4.4, -3], [-1.6, -4.6], [2.4, -4.4], [4.6, -1.2], [4.4, 2.6], [1.6, 4.8], [-2, 4.6], [-4.6, 1.4]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2], INK, LW / 1.3);
  if (mode === 'fill') {
    glow(ctx, -0.8, -1.4, 3.4, FUR[0], near ? 0.8 : 0.3);
    ell(ctx, 0.6, 1.8, 2, 1.5);
    ctx.fillStyle = tone(a, NOSE[0], near ? 0.55 : 0.35);
    ctx.fill();
  }
  ctx.restore();
}
// Bare round koala feet out of her trouser legs, dark soles, two little toe beans.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 4.6, p[1] - 3], [p[0], p[1] - 4], [p[0] + 4.4, p[1] - 2.6], [p[0] + 7.6, p[1] + 0.6], [p[0] + 7.4, p[1] + 3.4], [p[0] - 4.8, p[1] + 3.4], [p[0] - 5.4, p[1] + 0.4]]);
  paint(ctx, a, mode, near ? FUR[1] : FUR[2]);
  if (mode === 'fill') {
    glow(ctx, p[0] + 1, p[1] - 1.6, 4, FUR[0], near ? 0.7 : 0.3);
    ctx.beginPath();
    ctx.moveTo(p[0] - 4.4, p[1] + 2.6);
    ctx.lineTo(p[0] + 7, p[1] + 2.6);
    pen(ctx, tone(a, NOSE[0], 0.6), 0.9);
    ctx.stroke();
    // (the trouser cuff over the top of her foot)
    smooth(ctx, [[p[0] - 4.8, p[1] - 4.6], [p[0] + 4.6, p[1] - 4.6], [p[0] + 4.8, p[1] - 2], [p[0] - 5, p[1] - 2]]);
    ctx.fillStyle = tone(a, near ? MINT[2] : MINT[3]);
    ctx.fill();
  }
  ctx.restore();
}
// Her wind-up key: a brass stem into her back, its bow turning (seen edge-on as it turns).
function key(ctx, a, mode, D) {
  const q = a.kbQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 13.4, st[1] + 8.4);
  const c = Math.cos(q.keyA ?? 0);
  ctx.beginPath();
  ctx.moveTo(1.6, 0);
  ctx.lineTo(-4.6, 0);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? INK : tone(a, GOLD[2]), mode === 'line' ? 1.9 + LW * 2 : 1.9);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ell(ctx, -7, s * 2.3 * Math.abs(c), 1.8, 2 * Math.max(0.35, Math.abs(c)));
    paint(ctx, a, mode, s * c > 0 ? GOLD[1] : GOLD[2], GOLD[2]);
    if (mode === 'fill') {
      ell(ctx, -7, s * 2.3 * Math.abs(c), 0.65, 0.75 * Math.max(0.35, Math.abs(c)));
      ctx.fillStyle = tone(a, GOLD[2], 0.8);
      ctx.fill();
    }
  }
  ell(ctx, -5, 0, 1.05, 1.45);
  paint(ctx, a, mode, GOLD[1], GOLD[2]);
  ctx.restore();
}

// ---------- The balloons (rig space, game px at her drawn scale 1) ----------
const STR = [17.6, 20.4, 22.8, 19.2, 24.4];
// One balloon: a round body a touch taller than wide, a little knot under it, a soft shine.
function balloon(ctx, a, x, y, r, col, al = 1, ang = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(0, r * 1.12);
    ctx.bezierCurveTo(-r * 1.28, r * 0.9, -r * 1.12, -r * 1.12, 0, -r * 1.12);
    ctx.bezierCurveTo(r * 1.12, -r * 1.12, r * 1.28, r * 0.9, 0, r * 1.12);
    ctx.closePath();
  };
  body();
  pen(ctx, tone(a, col[2]), LW * 1.05);
  ctx.stroke();
  ctx.fillStyle = tone(a, col[1]);
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  glow(ctx, -r * 0.3, -r * 0.35, r * 1.1, col[0], 0.9);
  glow(ctx, r * 0.6, r * 0.7, r * 0.9, col[2], 0.55);
  ctx.restore();
  ell(ctx, -r * 0.38, -r * 0.5, r * 0.22, r * 0.36, 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  // the knot
  smooth(ctx, [[-r * 0.2, r * 1.08], [r * 0.2, r * 1.08], [r * 0.28, r * 1.36], [-r * 0.28, r * 1.36]]);
  ctx.fillStyle = tone(a, col[2]);
  ctx.fill();
  ctx.restore();
}
// Where each balloon floats: up from her far paw on its string, each on its own spring.
function bunchAt(a, D) {
  const q = a.kbQ ?? {};
  const hd = ptOf(a, D, 'handF', D.J.handF);
  const hold = [hd[0] + 0.2, hd[1] - 1.4];
  const angs = q.bal ?? [];
  return STR.map((L, i) => {
    const an = angs[i] ?? -Math.PI / 2;
    const s = q.grow?.[i] ?? 1;
    const len = L * (0.55 + 0.45 * s);
    return { hold, an, end: [hold[0] + Math.cos(an) * len, hold[1] + Math.sin(an) * len], r: 4.4 * s, i };
  });
}
function bunch(ctx, a, D) {
  const q = a.kbQ ?? {};
  const B = bunchAt(a, D);
  // the strings, each with a gentle sag, behind the balloons
  for (const b of B) {
    if (q.gone?.[b.i]) continue;
    const mid = [mix(b.hold[0], b.end[0], 0.5) + Math.cos(b.an + Math.PI / 2) * 1.2, mix(b.hold[1], b.end[1], 0.5)];
    ctx.beginPath();
    ctx.moveTo(...b.hold);
    ctx.quadraticCurveTo(...mid, b.end[0], b.end[1] + b.r * 1.3);
    pen(ctx, tone(a, '#9a92b0', 0.9), 0.45);
    ctx.stroke();
  }
  for (const b of B) {
    if (q.gone?.[b.i]) continue;
    balloon(ctx, a, b.end[0], b.end[1], b.r, BALLOON[b.i], 1, (b.an + Math.PI / 2) * 0.6);
  }
}
// The thrown balloon, bobbing over to you (render/dreamfx.js, `balloonShot`), a little confetti trail.
export function balloonShot(ctx, shot, x, y, p, d) {
  if (shot !== 'balloon') return false;
  const bob = Math.sin(p * 14) * 2.2;
  const a = { flash: 0 };
  ctx.save();
  // its string trailing behind and below
  ctx.beginPath();
  ctx.moveTo(x, y + bob + 6);
  ctx.quadraticCurveTo(x - d * 3, y + bob + 10, x - d * 1.5 + Math.sin(p * 20) * 1.5, y + bob + 14);
  pen(ctx, '#9a92b0', 0.6);
  ctx.stroke();
  balloon(ctx, a, x, y + bob, 5.2, BALLOON[0], 1, Math.sin(p * 9) * 0.2);
  for (let i = 0; i < 3; i++) {
    const v = (p * 3 + i / 3) % 1;
    ell(ctx, x - d * (6 + v * 10), y + bob + 2 + Math.sin(v * 7 + i) * 3, 0.9, 0.6, v * 4);
    ctx.fillStyle = BALLOON[(i + 1) % 5][1];
    ctx.fill();
  }
  ctx.restore();
  return true;
}

// ---------- Her act and her fight (on the base's channels) ----------
const MELEE = ['bonk', 'nod'];
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'content', look: [0.4, 0], turn: 0.35, sweat: -1, fx: null, keyRate: 1.2, hatUp: 0, hatTip: 0, gone: [0, 0, 0, 0, 0], grow: [1, 1, 1, 1, 1], lift: 0, held: -1, heldK: 0, gust: 0 };
  a.kbQ = q;
  a.kbUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.4);
  const cineMood = m.cine?.mood;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.3;
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.45), 0, 1) : 0;
  const swinging = alive && (anticK > 0 || (since >= 0 && since < 0.95));
  if (swinging && !st.kbAtk) {
    st.kbN = (st.kbN ?? (m.uid ?? 0)) + 1;
    st.kbPick = typeof m.move === 'string' && ['pop', ...MELEE].includes(m.move) ? m.move : m.swingFar ? 'pop' : MELEE[st.kbN % MELEE.length];
  }
  st.kbAntic = swinging ? Math.max(anticK, st.kbAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.95;
  st.kbAtk = swinging;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;
  const busy = !alive || swinging;
  if (busy) st.kbFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.kbFreeAt ?? -9)) / 0.35);
  // (a balloon let go: gone a while, then a fresh one from her pocket, grown in solid)
  const goneU = now - (st.kbGoneAt ?? -99);
  if (goneU >= 0 && goneU < 4.6) {
    q.gone[4] = goneU < 4 ? 1 : 0;
    q.grow[4] = goneU < 4 ? 1 : sstep((goneU - 4) / 0.6);
  }

  // Standing: a soft slouch, the balloons held up in her far paw, the near paw at her tummy.
  go({ shF: -112, elF: -24, hwF: -6, shN: 8, elN: -46, hwN: 8, tilt: -1, chest: -1 + breath * 0.5, head: 1 + Math.sin(t * 0.55) * 1.4 }, 1);
  out.shF += breath * 1.2;
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    add({ shN: Math.sin(u * TAU) * 10, shF: -Math.sin(u * TAU) * 4, tilt: 2 }, walkW);
    q.turn = mix(q.turn, 0.55, walkW);
  }
  if (fighting && !busy) {
    go({ tilt: 2, shN: -40, elN: -80, hwN: -10 }, 0.8 * freeK);
    say('focus');
    q.turn = 0.55;
    q.keyRate = 2.2;
  }
  if (fighting && !st.kbHunt) st.kbBangAt = now;
  if (!fighting && st.kbHunt && alive) st.kbLostAt = now;
  st.kbHunt = fighting;
  q.bang = now - (st.kbBangAt ?? -9);
  q.huh = now - (st.kbLostAt ?? -9);
  if (alive && !busy && q.bang >= 0 && q.bang < 0.9) {
    const k = win(q.bang, 0, 0.12, 0.5, 0.9) * freeK;
    go({ head: -10, tilt: -4 }, k);
    q.hatUp = 0.4 * k;
    say('startled', k);
  }
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // a cheery little wave
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -150, elN: -30 + Math.sin(gloat * 16) * 18, head: -4 }, k);
    say('beam', k);
    q.fx = { kind: 'gloat', u: gloat };
  }
  if (!alive) {
    // beaten: sat down hard, dizzy, the hat askew; the balloons drift up and away
    st.kbDeadAt ??= now;
    const u = now - st.kbDeadAt;
    go({ drop: 0.85, tilt: -12, head: 14, shN: 30, elN: -40, shF: 40, elF: -20, fxN: 0.45, fxF: 0.15 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.keyRate = 0;
    q.hatTip = 0.35;
    q.fx = { kind: 'beaten', u };
    q.freed = u;
  } else st.kbDeadAt = undefined;

  if (alive) {
    if (swinging) {
      const kind = st.kbPick ?? 'bonk';
      const hitK = struck ? (since < 0.11 ? sstep(since / 0.11) : 1 - sstep((since - 0.34) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.kbAntic) * (since < 0.11 ? 1 : 0) : sstep(anticK);
      q.keyRate = 3.4;
      if (kind === 'pop') {
        // Balloon Pop: the near paw takes a balloon from the bunch and draws it back; then lets it go
        go({ shN: -150, elN: -40, tilt: -6, head: -6 }, wK);
        go({ shN: -70, elN: -10, tilt: 6, head: 2, x: 0.02 }, hitK);
        q.held = 4;
        q.heldK = struck ? 0 : wK;
        if (struck && since < 0.05) st.kbGoneAt = now;
        say(hitK > 0.2 ? 'beam' : 'focus');
        q.fx = { kind: struck ? 'pop' : 'ready', u: struck ? since : now };
      } else if (kind === 'bonk') {
        // Bunch Bonk: the whole bunch swung up and back, then brought down on you
        go({ shF: -170, elF: -10, tilt: -8, head: -6, shN: 20, elN: -40 }, wK);
        go({ shF: -40, elF: -10, tilt: 12, head: 6, x: 0.04 }, hitK);
        q.swing = hitK - wK * 0.5;
        say(hitK > 0.2 ? 'shout' : 'focus');
        q.fx = { kind: struck ? 'bonk' : 'ready', u: struck ? since : now };
      } else {
        // Dozy Headbutt: she nods off, sinking... and her head snaps forward into you, her hat up
        go({ head: 18, tilt: 4, drop: 0.1, shN: 10, elN: -30 }, wK);
        go({ head: 24, tilt: 22, x: 0.07, drop: 0.05, shN: 30, elN: -20 }, hitK);
        q.hatUp = hitK;
        q.hatTip = -0.3 * hitK;
        say(wK > 0.3 ? 'drowsy' : hitK > 0.2 ? 'startled' : 'focus');
        q.fx = { kind: struck ? 'nod' : 'doze', u: struck ? since : now };
      }
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, shN: -60, elN: -100 }, k);
      say('hurt', k * 2);
      q.hatUp = 0.5 * k;
      q.earKick = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a nap: soundly asleep on her feet, head sunk, the balloons keeping her upright
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.kbNap = mix(st.kbNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.kbNap > 0.01) {
      const k = sstep(st.kbNap);
      go({ head: 16 + Math.sin(t * 1.1) * 2.5, tilt: 4, chest: 2 + Math.sin(t * 1.1) * 1.2, shN: -10, elN: -50 }, k);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.fx = { kind: 'nap', u: t };
        q.keyRate = 0.2;
      }
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.kbCalm = mix(st.kbCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.kbCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, q, sstep(st.kbCalm), t, now, st);
    if (cineMood && !busy) q.mood = { angry: 'cross', happy: 'beam', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'drowsy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !busy) {
      if (!cineMood) q.mood = q.mood === 'content' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
      q.keyRate *= 0.5;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'kbTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.content;
  const f = (st.kbF ??= { ...FACES.content, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'tg', 'bl', 'sm', 'pf']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.kbF = f;
  // springs: the ears, the hat, the bow tie, and each balloon (buoyant: it floats up, leans back
  // against her motion, sways on its own)
  const kick = (st.kbLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.kbLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.kbLast = out.head;
  st.kbLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const dirV = clamp((out.x ?? 0) * 40, -1, 1);
  q.earW = [0, 1].map((i) => spring(st, `ear${i}`, (q.earKick ?? 0) * (i ? -0.25 : 0.25) + Math.sin(t * 1.2 + i * 2) * 0.03 + (q.mood === 'sad' || q.mood === 'sleepy' ? (i ? 0.12 : -0.12) : 0), 90, 8, dt, kick * 0.006));
  q.hatUp = clamp(spring(st, 'hatUp', q.hatUp, 160, 13, dt), -0.2, 1.2);
  q.hatTip = spring(st, 'hatTip', q.hatTip - ((out.head ?? 0) * Math.PI) / 180 * 0.08, 120, 10, dt, kick * 0.004);
  q.tie = spring(st, 'tie', Math.sin(t * 1.3) * 0.12, 90, 8, dt, kick * 0.015);
  const BASE = [-0.42, -0.2, 0.02, -0.1, -0.3];
  const swingB = q.swing ?? 0;
  const freedU = q.freed ?? -1;
  q.bal = BASE.map((b, i) => {
    let goal = -Math.PI / 2 + b - 0.25 * walkW - 0.15 * Math.abs(step) + Math.sin(t * (0.9 + i * 0.13) + i * 1.7) * 0.07 - swingB * 0.5 - dirV * 0.3;
    if (freedU >= 0) goal += sstep(freedU / 1.6) * 0.4 * (i % 2 ? 1 : -1);
    return spring(st, `bal${i}`, goal, 36 + i * 4, 3.4, dt, kick * 0.01);
  });
  // a balloon held out in her near paw for the throw
  q.heldAt = q.held >= 0 ? q.heldK : 0;
  st.kbKeyRate = mix(st.kbKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 3));
  st.kbKeyA = ((st.kbKeyA ?? (m.uid ?? 0) * 0.7) + st.kbKeyRate * dt) % (TAU * 100);
  q.keyA = st.kbKeyA;
  // (lifted off her feet by the balloons in her doze: kept for the draw)
  out.hop = (out.hop ?? 0) + q.lift;
}
// The 30 s act (only a piece she has time to finish before she moves on, m.restUntil).
const PIECES = [
  { name: 'inflate', t0: 0.4, len: 7.6 },
  { name: 'doze', t0: 8.6, len: 8 },
  { name: 'count', t0: 17.2, len: 6.4 },
  { name: 'yawn', t0: 24.2, len: 5.6 },
];
function idleAct(m, a, out, go, add, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.kbPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.kbPiece = cur.name;
      else return;
    }
  } else {
    st.kbPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'inflate') {
    // a balloon from her pocket, blown up with puffed cheeks (growing, in solid), tied, added
    const k = win(u, 0, 0.5, 7, 7.6);
    const fetch = win(u, 0.4, 0.9, 1.2, 1.5);
    const blow = win(u, 1.4, 1.8, 4.6, 5.0);
    const tie = win(u, 4.8, 5.1, 5.8, 6.2);
    go({ shN: 30, elN: -90, hwN: 10, head: 6, tilt: 3 }, fetch * k * w);
    go({ shN: -78, elN: -64, head: -4 + Math.sin(u * 5) * 2, chest: -2 - Math.sin(u * 5) * 1.5 }, blow * k * w);
    go({ shN: -60, elN: -96, shF: -96, elF: -50, head: 4 }, tie * k * w);
    if (at(k)) {
      q.mood = u < 1.4 ? 'content' : u < 5 ? 'puff' : u < 6.2 ? 'focus' : 'beam';
      q.inflate = { u, size: sstep((u - 1.6) / 3.2) };
      q.gone[3] = 1;
      q.look = u < 1.4 ? [0.3, 1] : [0.8, 0.3];
      if (u > 6.2) q.fx = { kind: 'proud', u: u - 6.2 };
    }
  } else if (cur.name === 'doze') {
    // her head nods; a "z"; a gust, and the balloons lift her off her feet; she wakes kicking,
    // floats back down, and pats her hat, relieved
    const k = win(u, 0, 0.5, 7.4, 8);
    const nod = sstep((u - 0.3) / 2.2) * (1 - sstep((u - 3.6) / 0.25));
    const up = win(u, 2.6, 3.6, 4.6, 6.2);
    const kickL = win(u, 3.6, 3.8, 5.2, 5.6);
    const pat = win(u, 6.2, 6.5, 7, 7.4);
    go({ head: 18 * nod + Math.sin(u * 2) * 2 * nod, tilt: 3 * nod }, k * w);
    go({ shF: -150, elF: -10, fxN: Math.sin(u * 11) * 0.25 * kickL, fxF: -Math.sin(u * 11) * 0.25 * kickL, fyN: -0.15 * kickL, fyF: -0.1 * kickL, shN: -100 * kickL, elN: -40 }, up * k * w);
    go({ shN: -150, elN: -120, head: -4 }, pat * k * w);
    q.lift = 0.16 * up * k * w;
    if (at(k)) {
      q.mood = u < 3.6 ? (u < 0.8 ? 'content' : 'drowsy') : u < 5.2 ? 'startled' : u < 6.2 ? 'worried' : 'content';
      q.gust = up;
      q.hatUp = win(u, 3.6, 3.8, 4.2, 4.8) * 0.6;
      if (u > 0.9 && u < 3.6) q.fx = { kind: 'doze', u };
      if (u > 3.6 && u < 4.4) q.fx = { kind: 'woke', u: u - 3.6 };
    }
  } else if (cur.name === 'count') {
    // her near paw pointing at each balloon in turn: "1, 2, 3, 4, 5!"
    const k = win(u, 0, 0.4, 5.8, 6.4);
    const n = clamp(Math.floor((u - 0.6) / 0.9), 0, 4);
    const ph = ((u - 0.6) / 0.9) % 1;
    const point = u > 0.6 && u < 5.1 ? 1 : 0;
    go({ shN: -150 - n * 6 + Math.sin(ph * Math.PI) * 6, elN: -20, hwN: -20, head: -12 - n * 1.5, tilt: -4 }, (point ? 1 : 0.0001) * k * w);
    if (at(k)) {
      q.mood = u > 5.1 ? 'beam' : 'focus';
      q.look = [-0.3, -1];
      q.turn = 0.25;
      if (u > 0.6 && u < 5.4) q.fx = { kind: 'count', n, ph };
    }
  } else {
    // a huge yawn and a stretch; she catches you looking and holds out a balloon, smiling
    const k = win(u, 0, 0.4, 5, 5.6);
    const yawn = win(u, 0.3, 0.9, 2.2, 2.7);
    const offer = win(u, 3.0, 3.4, 4.6, 5.2);
    go({ shN: -160, elN: -30, shF: -170, elF: -20, tilt: -8, head: -14, chest: -4 }, yawn * k * w);
    go({ shN: -80, elN: -30, hwN: -10, tilt: 4, head: 4 }, offer * k * w);
    if (at(k)) {
      q.mood = u < 0.3 ? 'content' : u < 2.6 ? 'yawn' : u < 3.0 ? 'startled' : 'beam';
      q.held = offer > 0.05 ? 1 : -1;
      q.heldK = offer;
      if (u > 2.6 && u < 3.2) q.fx = { kind: 'woke', u: u - 2.6 };
      if (u > 3.4 && u < 4.8) q.fx = { kind: 'offer', u: u - 3.4 };
    }
  }
}

// ---------- Effects (the rig's space, facing right) ----------
function bubble(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  // her marks sit in a little balloon, its string trailing
  ctx.beginPath();
  ctx.moveTo(0.2, 5.4);
  ctx.quadraticCurveTo(-1.2, 7.4, 0.4, 9.2);
  pen(ctx, '#9a92b0', 0.5);
  ctx.stroke();
  ell(ctx, 0, 0, 4.4, 5);
  ctx.fillStyle = '#fffdfa';
  ctx.fill();
  pen(ctx, mark === '!' ? '#e8485e' : '#62a68c', 0.9);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e8485e' : '#62a68c';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.8);
    ctx.lineTo(0, 0.5);
  } else {
    ctx.moveTo(-1.4, -1.6);
    ctx.quadraticCurveTo(-1.1, -3.3, 0.4, -3.1);
    ctx.quadraticCurveTo(1.9, -2.8, 1.3, -1.2);
    ctx.quadraticCurveTo(0.3, -0.5, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.3, 0.8, 0.8);
  ctx.fill();
  ctx.restore();
}
function zee(ctx, x, y, s, al, fl) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl * s, s);
  ctx.beginPath();
  ctx.moveTo(-1.5, -1.5);
  ctx.quadraticCurveTo(0, -1.8, 1.5, -1.5);
  ctx.quadraticCurveTo(0, 0, -1.5, 1.5);
  ctx.quadraticCurveTo(0, 1.2, 1.6, 1.5);
  ctx.lineCap = 'round';
  pen(ctx, '#7a9ec6', 1.3);
  ctx.stroke();
  pen(ctx, '#f2f8ff', 0.55);
  ctx.stroke();
  ctx.restore();
}
// Confetti in the balloons' colours, scattered from a point.
function confetti(ctx, x, y, u, n, spread) {
  for (let i = 0; i < n; i++) {
    const an = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.6;
    const v = clamp(u, 0, 1);
    const px = x + Math.cos(an) * spread * v;
    const py = y + Math.sin(an) * spread * v + v * v * 6;
    ctx.save();
    ctx.globalAlpha *= 1 - v;
    ctx.translate(px, py);
    ctx.rotate(i * 1.3 + u * 8);
    ell(ctx, 0, 0, 1.1, 0.6);
    ctx.fillStyle = BALLOON[i % 5][1];
    ctx.fill();
    ctx.restore();
  }
}
// A soft puff of breath.
function breathPuff(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (const [dx, dy, s] of [[0, 0, 1], [-0.8, 0.3, 0.7], [0.8, 0.3, 0.7]]) {
    ctx.moveTo(x + dx * r + s * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, s * r, 0, TAU);
  }
  pen(ctx, '#d4d0e4', 0.9);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) key(ctx, a, mode, D);
  // the balloons behind her, held up in her far paw
  if (!(a.kbQ?.freed >= 0)) bunch(ctx, a, D);
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.kbQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -20]);
  const hd = headAt(a, D, [4, 0]);
  const mouthP = headAt(a, D, [(q.turn ?? 0.35) * 3 + 4, 9]);
  const handN = ptOf(a, D, 'handN', D.J.handN);
  // a balloon in her near paw (taken for a throw, held out to you, or being blown up)
  if (q.heldAt > 0.02 || q.inflate) {
    const r = q.inflate ? 0.6 + 3.8 * q.inflate.size : 4.4;
    const col = BALLOON[q.inflate ? 3 : q.held === 1 ? 1 : 0];
    const by = handN[1] - 1 - r * 1.25;
    if (q.inflate && q.inflate.u < 1.4) {
      // (still rolled up in her paw)
      ell(ctx, handN[0] + 0.6, handN[1] - 1.4, 0.8, 1.5, 0.3);
      ctx.fillStyle = tone(a, col[1]);
      ctx.fill();
    } else if (q.inflate) {
      // blown up from her mouth: the balloon at her lips, growing; then tied and let float up to take
      // its place in the bunch (the bunch's own rose one is this one)
      const ang = 0.9;
      const bx = mouthP[0] + Math.cos(ang) * (r + 1.2);
      const byy = mouthP[1] + Math.sin(ang) * (r + 1.2) - r * 0.2;
      const up = sstep((q.inflate.u - 5.4) / 1.1);
      const tgt = bunchAt(a, D)[3];
      const x = mix(bx, tgt.end[0], up);
      const y = mix(byy, tgt.end[1], up) - Math.sin(Math.PI * up) * 4;
      if (up > 0.02) {
        ctx.beginPath();
        ctx.moveTo(...tgt.hold);
        ctx.quadraticCurveTo(mix(tgt.hold[0], x, 0.5) + 2, mix(tgt.hold[1], y, 0.5), x, y + r * 1.3);
        pen(ctx, tone(a, '#9a92b0'), 0.45);
        ctx.stroke();
      }
      balloon(ctx, a, x, y, r, col, 1, mix(ang - Math.PI / 2 + Math.PI, (tgt.an + Math.PI / 2) * 0.6, up));
    } else {
      ctx.beginPath();
      ctx.moveTo(handN[0], handN[1] - 1);
      ctx.lineTo(handN[0], by + r * 1.3);
      pen(ctx, tone(a, '#9a92b0'), 0.45);
      ctx.stroke();
      balloon(ctx, a, handN[0], by, r, col, q.heldAt);
    }
  }
  // her marks
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 7, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0) bubble(ctx, crown[0] + 4, crown[1] - 7, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'ready') {
    sparkle(ctx, handN[0] + 2, handN[1] - 3, 1.4 + Math.sin(t * 9) * 0.5, 0.7, '#fff6c8');
  } else if (X.kind === 'pop') {
    // a puff where it left her paw
    if (u < 0.4) breathPuff(ctx, handN[0] + 3 + u * 10, handN[1] - 5, 1.4 + u * 3, 1 - u / 0.4);
  } else if (X.kind === 'bonk') {
    const k = clamp(u / 0.4, 0, 1);
    if (u > 0.05 && u < 0.6) {
      confetti(ctx, hd[0] + 18, hd[1] + 6, k, 9, 14);
      cue(ctx, 'BOING!', hd[0] + 22, hd[1] - 16, 6.5, fl, -0.1, '#c23a52');
    }
  } else if (X.kind === 'doze' || X.kind === 'nap') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.45 + i / 3) % 1;
      zee(ctx, crown[0] + 5 + v * 7, crown[1] + 2 - v * 11, 0.75 + v * 0.5, Math.sin(Math.PI * v) * (X.kind === 'doze' ? win(u, 0.9, 1.3, 3.2, 3.6) : 1), fl);
    }
  } else if (X.kind === 'nod') {
    const k = clamp(u / 0.4, 0, 1);
    if (u > 0.02 && u < 0.5) {
      for (let i = 0; i < 3; i++) {
        const an = -1.1 + i * 0.8;
        star(ctx, hd[0] + 12 + Math.cos(an) * (4 + k * 8), hd[1] - 4 + Math.sin(an) * (4 + k * 6), 2 * (1 - k * 0.5), an, 1 - k * 0.6);
      }
      cue(ctx, 'BONK!', hd[0] + 20, hd[1] - 18, 6.5, fl, -0.1, '#5e3a58');
    }
  } else if (X.kind === 'woke') {
    if (u < 0.8) bubble(ctx, crown[0] + 4, crown[1] - 7, '!', u, 0.8, fl);
  } else if (X.kind === 'count') {
    if (X.ph < 0.7) cue(ctx, X.n < 4 ? `${X.n + 1}` : '5!', crown[0] - 6 - X.n * 1.2, crown[1] - 4 - X.ph * 3, 6, fl, -0.1, BALLOON[X.n][2]);
  } else if (X.kind === 'proud' || X.kind === 'gloat') {
    const v = clamp(u / 1.2, 0, 1);
    note(ctx, crown[0] + 6 + v * 4, crown[1] + 2 - v * 8, 1.6, -0.2, Math.sin(Math.PI * v), '#62a68c');
    sparkle(ctx, crown[0] - 6, crown[1] + 4 - v * 4, 1.6 * Math.sin(Math.PI * v), 1, '#fff6c8');
  } else if (X.kind === 'offer') {
    sparkle(ctx, handN[0] + 3, handN[1] - 12, 1.8 * Math.sin(Math.PI * clamp(u / 1.4, 0, 1)), 1, '#fff6c8');
    if (u < 1.2) cue(ctx, 'balloon?', hd[0] + 16, hd[1] - 16, 5.5, fl, -0.1, '#4e8a76');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 6 - v * 6 + i * 4, hd[1] - 8 - v * 5 - i * 2.4, 1.6 * (1 - v), 1 - v, '#fff6c8');
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 2, 8, t, 3);
    // her balloons drifting up and away, one by one
    const B = bunchAt(a, D);
    for (const b of B) {
      const v = clamp((u - b.i * 0.15) / 2.4, 0, 1);
      if (v >= 1) continue;
      balloon(ctx, a, b.end[0] + Math.sin(v * 5 + b.i) * 3 + v * (b.i - 2) * 4, b.end[1] - v * 30, b.r, BALLOON[b.i], 1 - sstep((v - 0.6) / 0.4));
    }
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.2, 0.6 * (1 - u / 0.6), '#f4f2fa', '#cfcbd8');
  }
}

const DRESS = {
  id: 'koalaballoonist',
  // (the skin is her mint dungarees, trouser legs and all; her shirt, paws and feet over it)
  skin: { lt: MINT[0], base: MINT[1], sh: MINT[2], deep: MINT[3], ink: MINT_INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => dungarees(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => bowTie(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('koala', DRESS);
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
rig.h = Math.round(rig.h * BIG * 1.8);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own), her size as drawn and her walking pace (the base's own walk at her size).
export const KOALA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 300, 220, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const KOALA_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.15), speed: Math.round(R.speed * BIG) };
