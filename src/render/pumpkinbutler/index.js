// The Pumpkin Butler on screen (2026-11-26, remade from scratch as Humphrey, the Basset Butler; the id
// stays `pumpkinbutler`). Lady Marigold's butler on the Moonlit Rooftop: a little red-and-white basset
// hound who has served the hostess for a hundred years and never once been thanked by a guest, because
// there never were any. Impeccable, solemn, a touch sleepy; secretly devoted to the pumpkin tart he
// carries under his silver cloche. She rings and he brings her the next course (world/manor.js: if he
// reaches her, she eats it and feels better). He moves on his own copy of the creature base (rig.js;
// body.js `hound`: a long low barrel, short sturdy legs on big round paws, stubby arms), dressed here;
// his big head, ears and tail drawn here from scratch over the mannequin's (the shared face never used).
//   look    caramel-chestnut fur with a white blaze down his face, a white muzzle, chest and paws;
//           long velvet ears hanging past his chin (each a chain of three sprung pieces, rooted inside
//           his skull); a white-tipped tail held up like a flag (sprung); a plum waistcoat with gold
//           buttons, a white shirt front and a puffed white cravat with a gold pin; white cotton
//           gloves; a cream tea towel draped over his near forearm (its hem on springs); on that
//           hand a silver tray, kept level as he walks (a waiter's carry), with a domed silver cloche,
//           and under it a pumpkin tart. His own soft cocoa outline on the outer edge only, face bare.
//   eyes    a hound's: round eyes that droop at the outer corners under a heavy caramel lid always
//           half down (kind, solemn), a warm amber-brown iris, a big round glint and a small one, a
//           soft pink lower lid; two darker brow pips above them that do his acting. Faces: solemn
//           (rest), pleased (^ ^), bliss (eyes shut soft, a little smile, a blush), startled (lids
//           up, small irises), cross (pips knit), worried (pips up in the middle, a sweat drop), proud,
//           hurt (> <), sleepy, dizzy (beaten), talk (vowel mouths). Mouths: his "w" of a muzzle,
//           a small o, open, a smile, a frown, a tight line with teeth, a tongue.
//   idle    a 30 s act, only while calm (data `rest` and m.restUntil, as Topsy's): polishing the
//           cloche (a breath fogs it, a rub, a glint, his own reflection admired); a peek under it
//           (the lid lifted a crack, a sniff, scent curls, bliss; "ahem", lid down); dozing on duty
//           (his head nods, ears droop, a "z"; a snap awake, ears flying up; the cravat straightened);
//           standing to attention and a tiny formal bow to nobody.
//   walk    a short-legged butler's shuffle, the tray held level, the ears and the towel swinging.
//   fight   his swings in turn: Cloche Clang (the lid lifted high in his far paw, then clapped down
//           over you, CLANG), Ear Swat (his head turned away, then a shake that flings both ears round
//           at you, FWAP), Deep Bow (a formal bow so deep his head bonks you, the tray kept level).
//   serving (m.serving: on his way to her; m.servedAt: arrived) the tray held high; arriving, a bow,
//           the cloche lifted, the tart sparkling and floating off to her ladyship (m.serveDx away).
//   moods   hurt: a flinch, the ears flying up; low on health: worried, a sweat drop; after landing a
//           hit: a small satisfied nod; beaten: sat down hard, the tray in his lap, the cloche
//           rolled off, ears flopped, dizzy.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, sline, pen, glow, sparkle, star, dizzy, dust, steam, sweat, cue, spring } from './fx.js';

const INK = '#8a5a46';
const FUR = ['#f6d2a6', '#e0a46c', '#c47f4a', '#9a5c34'];
const CREAM = ['#ffffff', '#fdf3e4', '#ead6bc'];
// His tailcoat and trousers (the body's own skin, so they fit and fold with every pose), the
// waistcoat, the shoes.
const COAT = ['#8a74ae', '#5f4c86', '#47396c', '#33284f'];
const COAT_INK = '#3e3060';
const VEST = ['#fbf6ff', '#e6def2', '#c9bddf', '#a89cc4'];
const SHOE = ['#8c82a8', '#4a4062', '#2e2842'];
const GOLD = ['#fff2b0', '#f2c450', '#c48f2c'];
const SILVER = ['#ffffff', '#e8edf6', '#c3cbdc', '#98a2bc'];
const TART = ['#ffd99a', '#f09a3e', '#c8692a'];
const CRUST = ['#ffe8b8', '#e8b46a', '#b9834a'];
const NOSE = '#4e3430';
const LID = '#5e3826';
const IRIS = ['#e9a95e', '#a8642e', '#6a3a1c', '#2e180e'];
// (his drawn size over the base's)
const BIG = 1.32;
const LW = 1.6 / BIG;

const paint = (ctx, a, mode, col, w = LW, ink = INK) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
// Corner cutting: a closed run of points rounded, the shape kept close.
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
// A tapering lock (an ear, a tail, a coat tail): a chain of points and its widths, a rounded end.
function tube(pts, W, capK = 0.6) {
  const Lp = [];
  const Rp = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const hw = W[i] / 2;
    Lp.push([pts[i][0] - Math.sin(an) * hw, pts[i][1] + Math.cos(an) * hw]);
    Rp.push([pts[i][0] + Math.sin(an) * hw, pts[i][1] - Math.cos(an) * hw]);
  }
  const n = pts.length - 1;
  const tan = Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]);
  const tip = [pts[n][0] + Math.cos(tan) * W[n] * capK, pts[n][1] + Math.sin(tan) * W[n] * capK];
  return chaikin([...Lp, tip, ...[...Rp].reverse()], 2);
}
const chain = (root, angs, Ls) => {
  const pts = [root];
  for (let i = 0; i < angs.length; i++) {
    const p = pts[i];
    pts.push([p[0] + Math.cos(angs[i]) * Ls[i], p[1] + Math.sin(angs[i]) * Ls[i]]);
  }
  return pts;
};
// A bone's frame in the base's kid-box units.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- His head (kid units about his neck joint: a chibi head a little under half his height) ----------
const HS = 1.03;
const HO = [1.2, -15];
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};

// ---------- His face (every part eased: an expression always passes through an in-between) ----------
// lid: only for closed eyes (0 open .. 1 shut); shut: which closed shape; pip: the brow pips' tilt
// (+ knit, - worried) and raise; mw/ms/mo: the mouth's width, smile, openness; te: teeth; tg: the
// tongue; bl: blush; sm: irises small (startled); dr: how much the lid line droops at its outer end
// (his sleepy hound look, never over the eye).
const FACES = {
  solemn: { lid: 0, shut: 'happy', pt: -0.15, pu: 0, mw: 0.8, ms: 0.1, mo: 0, te: 0, tg: 0, bl: 0.4, sm: 0, dr: 0.8 },
  pleased: { lid: 1, shut: 'happy', pt: -0.1, pu: 0.4, mw: 1, ms: 0.9, mo: 0, te: 0, tg: 0, bl: 0.7, sm: 0, dr: 0.6 },
  bliss: { lid: 1, shut: 'sleep', pt: -0.25, pu: 0.5, mw: 1.1, ms: 1, mo: 0.35, te: 0, tg: 0.6, bl: 1, sm: 0, dr: 0.6 },
  startled: { lid: 0, shut: 'happy', pt: -0.2, pu: 1.3, mw: 0.6, ms: 0, mo: 0.7, te: 0, tg: 0, bl: 0.5, sm: 0.8, dr: 0.1 },
  cross: { lid: 0, shut: 'happy', pt: 0.95, pu: -0.5, mw: 0.9, ms: -0.4, mo: 0.15, te: 1, tg: 0, bl: 0.4, sm: 0.1, dr: 0.3 },
  set: { lid: 0, shut: 'happy', pt: 0.6, pu: -0.3, mw: 0.8, ms: -0.2, mo: 0, te: 0, tg: 0, bl: 0.4, sm: 0.05, dr: 0.5 },
  shout: { lid: 0, shut: 'happy', pt: 0.7, pu: 0.1, mw: 1.1, ms: 0.1, mo: 1, te: 0, tg: 0, bl: 0.6, sm: 0.3, dr: 0.2 },
  worried: { lid: 0, shut: 'happy', pt: -0.9, pu: 0.5, mw: 0.7, ms: -0.4, mo: 0.15, te: 0, tg: 0, bl: 0.5, sm: 0.1, dr: 1 },
  proud: { lid: 0, shut: 'happy', pt: 0.1, pu: 0.7, mw: 0.9, ms: 0.55, mo: 0, te: 0, tg: 0, bl: 0.5, sm: 0, dr: 0.7 },
  sniff: { lid: 0.85, shut: 'sleep', pt: -0.1, pu: 0.3, mw: 0.5, ms: 0.2, mo: 0.2, te: 0, tg: 0, bl: 0.6, sm: 0, dr: 0.8 },
  hurt: { lid: 1, shut: 'squeeze', pt: -0.6, pu: 0.2, mw: 0.9, ms: -0.6, mo: 0.6, te: 0, tg: 0, bl: 0.7, sm: 0, dr: 0.5 },
  sleepy: { lid: 1, shut: 'sleep', pt: -0.2, pu: -0.2, mw: 0.6, ms: 0, mo: 0.1, te: 0, tg: 0, bl: 0.4, sm: 0, dr: 1 },
  dizzy: { lid: 1, shut: 'dizzy', pt: -0.4, pu: 0.3, mw: 0.8, ms: -0.3, mo: 0.4, te: 0, tg: 0.8, bl: 0.4, sm: 0, dr: 0.5 },
  sad: { lid: 0, shut: 'happy', pt: -0.95, pu: 0.2, mw: 0.7, ms: -0.6, mo: 0, te: 0, tg: 0, bl: 0.4, sm: 0.1, dr: 1.2 },
  talk: { lid: 0, shut: 'happy', pt: -0.05, pu: 0.3, mw: 0.8, ms: 0.2, mo: 0.4, te: 0, tg: 0, bl: 0.45, sm: 0, dr: 0.7 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.1, 0.8], [1.1, 0.3, 0.6], [1.0, 0.4, 0.3], [0.8, 0.2, 0], [0.7, 0.15, 0.55]];
const EYE = { y: -1.4, dx: 6.6, w: 3.9, h: 4.3 };

// One eye: a big glossy warm-brown hound eye (both the same size). side +1: the one toward his nose,
// its outer corner on the right.
function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.hbUid ?? 0) * 0.9) % 5.3, 4.78, 4.9, 4.98, 5.12) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const inner = [x - side * w, y - 0.3];
  const outer = [x + side * w, y + 0.5];
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      const sw = f.shut[s];
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LID), 0.95);
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(inner[0], inner[1] + 0.8);
        ctx.quadraticCurveTo(x, y - h * 0.85, outer[0], outer[1] + 0.4);
      } else if (s === 'sleep') {
        // a soft closed curve drooping at its outer end
        ctx.moveTo(inner[0], inner[1] + 0.2);
        ctx.quadraticCurveTo(x, y + h * 0.5, outer[0], outer[1] + 0.2);
        ctx.quadraticCurveTo(outer[0] + side * 0.8, outer[1] + 0.6, outer[0] + side * 1, outer[1] + 1.3);
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * w, y - 2.4);
        ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.4, x - side * w * 0.9, y + 0.2);
        ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.8, x + side * w, y + 2.6);
      } else {
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.95;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.05];
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
  // a soft shade under the eye (the hound's gentle heaviness, never over the eye)
  glow(ctx, x + side * 0.6, y + h * 0.95, 3.4, FUR[2], 0.45);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.bezierCurveTo(x - side * w * 0.75, y - h * 1.18, x + side * w * 0.8, y - h * 1.12, ...outer);
    ctx.bezierCurveTo(x + side * w * 0.75, y + h * 1.0, x - side * w * 0.8, y + h * 0.95, ...inner);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdf8');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.32 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 1;
  const iy = y + 0.4 + (look?.[1] ?? 0) * 0.7;
  // the layered iris: a deep rim, a warm brown gradient (dark at the top, amber below), fine light
  // lines, a big soft pupil
  const g = ctx.createLinearGradient(0, iy - 3.6, 0, iy + 3.6);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.45, tone(a, IRIS[2]));
  g.addColorStop(0.8, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, 3.05 * small, 3.45 * small);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#24120a', 0.85), 0.42);
  ctx.stroke();
  pen(ctx, tone(a, '#ffd8a0', 0.5), 0.3);
  for (const [a0, a1, rr] of [[0.4, 1.2, 2.2], [1.9, 2.6, 2.0]]) {
    ctx.beginPath();
    ctx.ellipse(ix, iy + 0.2, rr * small, rr * 1.15 * small, 0, a0, a1);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.1, 1.6 * small, 1.85 * small);
  ctx.fillStyle = tone(a, '#24120a');
  ctx.fill();
  // the upper lid's soft shadow across the top of the white (thin: never over the iris)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.5);
  sg.addColorStop(0, 'rgba(90,50,30,0.3)');
  sg.addColorStop(1, 'rgba(90,50,30,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.7);
  // the catchlights: a big glossy round one up at the back, a small one low at the front, a twinkle
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - side * 1.1, iy - 1.5 * small, 1.3 * small, 1.2 * small);
  ctx.fill();
  ell(ctx, ix + side * 1.15, iy + 1.45 * small, 0.6, 0.55);
  ctx.fill();
  ell(ctx, ix - side * 0.2, iy - 2.4 * small, 0.35, 0.35);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  if (L > 0.01) {
    // (a blink: the lid sweeping down, his own fur)
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h * 2.2 * L);
  }
  ctx.restore();
  // the upper lid line: soft and rounded, thin at the inner corner, fuller toward the outer one, then
  // drooping gently past it (his sleepy hound charm)
  const dr = f.dr;
  const top = (u) => {
    const bx = inner[0] + (outer[0] - inner[0]) * u;
    // (knit, the inner end comes down toward his nose; worried, it lifts)
    const by = y - h * 0.86 * Math.sin(Math.PI * (0.12 + u * 0.76)) + (inner[1] + (outer[1] - inner[1]) * u) - y + 0.2 + f.pt * 0.9 * (1 - u) ** 2;
    return [bx, by + y - y];
  };
  const pts = [];
  const N = 12;
  for (let i = 0; i <= N; i++) pts.push(top(i / N));
  const droop = [outer[0] + side * (0.6 + 0.5 * dr), outer[1] + 0.5 + 1.1 * dr];
  ctx.beginPath();
  pts.forEach((p, i) => {
    const th = 0.25 + 0.55 * (i / N) ** 1.4;
    if (!i) ctx.moveTo(p[0], p[1] - th);
    else ctx.lineTo(p[0], p[1] - th);
  });
  ctx.quadraticCurveTo(outer[0] + side * 0.7, outer[1] - 0.3, droop[0], droop[1]);
  ctx.quadraticCurveTo(outer[0] + side * 0.3, outer[1] + 0.3, pts[N][0], pts[N][1] + 0.35);
  for (let i = N; i >= 0; i--) {
    const th = 0.25 + 0.45 * (i / N) ** 1.4;
    ctx.lineTo(pts[i][0], pts[i][1] + th);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, LID);
  ctx.fill();
  // the lid's soft fold above it
  pen(ctx, tone(a, FUR[2], 0.7), 0.45);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.6, y - h * 1.12);
  ctx.quadraticCurveTo(x + side * 0.6, y - h * 1.35, x + side * w * 1.05, y - h * 0.85 + dr * 0.6);
  ctx.stroke();
  ctx.restore();
}
// A brow pip: a soft rounded darker spot over the eye, tilted and raised by the mood (they do his
// acting).
function pip(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - f.pu * 1.3);
  ctx.rotate(side * f.pt * 0.5);
  ell(ctx, 0, 0, 2.5, 1.25);
  ctx.fillStyle = tone(a, FUR[3], 0.9);
  ctx.fill();
  ell(ctx, -0.5, -0.4, 1.2, 0.45);
  ctx.fillStyle = tone(a, FUR[2], 0.75);
  ctx.fill();
  ctx.restore();
}
// The muzzle's mouth: his "w" at rest; opens, smiles and frowns by its numbers.
function mouth(ctx, a, x, y, f) {
  const w = 2.3 * f.mw;
  const cy = y - f.ms * 0.6;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.4 - o * 0.4, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.8 + o * 3, x - w, cy);
    ctx.fillStyle = tone(a, '#9a4a48');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x + 0.2, y + o * 2.4, w * 0.7, o * 1.1);
    ctx.fillStyle = tone(a, '#f38c98');
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = tone(a, '#ffffff', f.te);
      ctx.fillRect(x - w, cy - 0.5, w * 2, 0.9);
    }
    ctx.restore();
    pen(ctx, tone(a, LID), 0.65);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, LID), 0.7);
    ctx.beginPath();
    ctx.moveTo(x - w, cy - 0.2);
    ctx.quadraticCurveTo(x - w * 0.5, y + 1.1 + f.ms * 0.4, x, y - 0.2);
    ctx.quadraticCurveTo(x + w * 0.5, y + 1.1 + f.ms * 0.4, x + w, cy - 0.2);
    ctx.stroke();
  }
  if (f.tg > 0.05) {
    ctx.save();
    ctx.globalAlpha *= f.tg;
    ctx.beginPath();
    ctx.moveTo(x - 1.1, y + 0.6);
    ctx.quadraticCurveTo(x - 1.3, y + 3.4, x + 0.2, y + 3.6);
    ctx.quadraticCurveTo(x + 1.5, y + 3.4, x + 1.2, y + 0.6);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#f68a9a');
    ctx.fill();
    pen(ctx, tone(a, '#d5677a'), 0.4);
    ctx.stroke();
    ctx.restore();
  }
}

// His ears: long soft velvet ears, rounded like bells, a little curl outward at the end, each a chain
// of three sprung pieces from a root up inside his skull.
const EAR_L = [8, 8.2, 7];
const EAR_W = [7, 10.6, 12, 11, 8];
function ear(ctx, a, mode, side) {
  const q = a.hbQ ?? {};
  const angs = (a.hbEar ?? [[1.75, 1.7, 1.65], [1.4, 1.45, 1.5]])[side < 0 ? 0 : 1];
  const tx = (q.turn ?? 0.35) * 5;
  const root = side < 0 ? [tx * 0.2 - 13.6, -11.6] : [tx * 0.7 + 11.6, -11];
  // (the last bend curls a touch outward)
  const pts = chain(root, [angs[0], angs[1], angs[2] - side * 0.35], EAR_L);
  pts.push([pts[3][0] - side * 1.2, pts[3][1] + 1.6]);
  const shape = tube(pts, EAR_W, 0.35);
  poly(ctx, shape);
  paint(ctx, a, mode, side < 0 ? FUR[2] : FUR[3], LW / HS);
  if (mode !== 'fill') return;
  ctx.save();
  poly(ctx, shape);
  ctx.clip();
  // velvet: lit softly from the top, a deeper fold down its inner side, the inner ear peeping out
  const g = ctx.createLinearGradient(0, root[1], 0, root[1] + 26);
  g.addColorStop(0, tone(a, FUR[1], 0.9));
  g.addColorStop(0.6, tone(a, FUR[2], 0.2));
  g.addColorStop(1, tone(a, FUR[3], 0.5));
  ctx.fillStyle = g;
  ctx.fillRect(root[0] - 16, root[1] - 2, 32, 32);
  const inner = chain([root[0] - side * 2.2, root[1] + 2], [angs[0] - side * 0.06, angs[1] - side * 0.06], [7, 6]);
  poly(ctx, tube(inner, [2.4, 3.4, 2], 0.4));
  ctx.fillStyle = tone(a, '#f3b8a4', 0.7);
  ctx.fill();
  pen(ctx, tone(a, side < 0 ? FUR[1] : FUR[2], 0.55), 0.9);
  ctx.beginPath();
  ctx.moveTo(pts[1][0] + side * 1.6, pts[1][1]);
  ctx.quadraticCurveTo(pts[2][0] + side * 2, pts[2][1], pts[3][0] + side * 1.2, pts[3][1] + 1);
  ctx.stroke();
  ctx.restore();
  // (a soft rim in the ear's own deeper brown, so it reads over his head)
  poly(ctx, shape);
  pen(ctx, tone(a, FUR[3], 0.85), 0.7);
  ctx.stroke();
}
// His skull: a round dome, full soft cheeks.
function skullPts() {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const an = (i / 28) * TAU - Math.PI / 2;
    const s = Math.sin(an);
    const c = Math.cos(an);
    const low = Math.max(0, s);
    const rx = 19.6 + low * 1.2 - Math.max(0, s - 0.75) * 8;
    const ry = s < 0 ? 17.6 : 15.2;
    pts.push([c * rx, s * ry]);
  }
  return pts;
}
function head(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
  const q = a.hbQ ?? {};
  const f = a.hbF;
  const turn = q.turn ?? 0.35;
  const tx = turn * 5;
  if (part === 'back') {
    ear(ctx, a, mode, 1);
    ctx.restore();
    return;
  }
  smooth(ctx, skullPts());
  paint(ctx, a, mode, FUR[1], LW / HS);
  if (mode === 'fill' && f) {
    ctx.save();
    smooth(ctx, skullPts());
    ctx.clip();
    // one light from above: a lit crown, a soft shade at the back of his head and under his jaw
    glow(ctx, tx - 3, -12, 17, FUR[0], 0.9);
    glow(ctx, -17, 8, 10, FUR[2], 0.5);
    glow(ctx, tx, 16, 10, FUR[2], 0.35);
    // the white blaze: up from the muzzle between his eyes to a rounded point on his brow
    poly(ctx, chaikin([[tx + 0.8, -16], [tx + 2.4, -9], [tx + 2.2, -3], [tx + 5.4, 3], [tx + 0.6, 9], [tx - 3.6, 3], [tx - 1.2, -3], [tx - 1, -9]], 3));
    ctx.fillStyle = tone(a, '#fbead2');
    ctx.fill();
    ctx.restore();
    // cheeks
    for (const s of [-1, 1]) {
      ell(ctx, tx + s * 11.6, 5.6, 2.8, 1.7);
      ctx.fillStyle = tone(a, '#ff9a8e', (0.3 + 0.5 * f.bl) * (s > 0 ? 1 : 0.85));
      ctx.fill();
    }
    // (both eyes the same size, set level on the face, the pair turning with it)
    const ex = (s) => tx * 0.9 + s * EYE.dx * (s < 0 ? 1 - turn * 0.12 : 1);
    for (const s of [-1, 1]) eye(ctx, a, ex(s), EYE.y, s, f, q.look);
    for (const s of [-1, 1]) pip(ctx, a, ex(s) - s * 0.4, EYE.y - 6.2, s, f);
    // the muzzle: a broad soft round, white, under the eyes and a little toward his nose
    const mx = tx + 2 + turn * 1.6;
    smooth(ctx, [[mx - 8, 6.4], [mx - 6.2, 2.8], [mx, 1.8], [mx + 6.4, 2.9], [mx + 8.4, 6.6], [mx + 6.6, 10.6], [mx, 12], [mx - 6.6, 10.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    pen(ctx, tone(a, CREAM[2]), 0.6);
    ctx.stroke();
    glow(ctx, mx - 2, 4.6, 4.6, CREAM[0], 0.9);
    for (const [dx, dy] of [[-4.4, 6.8], [-3, 8.3], [-5.2, 8.5], [4.6, 7], [5.8, 8.5], [3.6, 8.7]]) {
      ell(ctx, mx + dx, dy, 0.33, 0.33);
      ctx.fillStyle = tone(a, FUR[2], 0.65);
      ctx.fill();
    }
    // the nose: a big soft cocoa round with a glint
    const nx = mx + 1.8 + turn * 1.4;
    smooth(ctx, [[nx - 3, 3], [nx - 2.2, 0.9], [nx, 0.3], [nx + 2.4, 0.9], [nx + 3.2, 2.8], [nx + 1.5, 4.9], [nx, 5.3], [nx - 1.7, 4.9]]);
    ctx.fillStyle = tone(a, NOSE);
    ctx.fill();
    ell(ctx, nx - 0.8, 1.7, 1.1, 0.65, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    if (q.sniff) {
      ell(ctx, nx + 1.6, 2 + Math.sin((a.t ?? 0) * 26) * 0.3, 0.5, 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    }
    mouth(ctx, a, nx, 7.9, f);
    if (q.sweat) sweat(ctx, tx - 14, -9 + (q.sweat % 1) * 3, 1.3);
  }
  // the near ear over the skull's back edge, hanging down past his cheek
  ear(ctx, a, mode, -1);
  ctx.restore();
}

// ---------- His clothes ----------
// (His tailcoat's body and sleeves and his trousers are the base's own skin in the coat's colours, so
// they fit and fold with every pose; over them, cut from the same outline, the waistcoat, the lapels,
// the shirt front, collar and cravat; behind, the coat tails; gloves and shoes at the ends.)
// The body's outline this frame (the skin keeps it), to cut the waistcoat from.
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function waistcoat(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const J = D.J;
  const st = J.stern;
  const w = J.waist;
  const h = J.hip;
  const C = (p) => ptOf(a, D, 'chest', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  // the waistcoat: the open front of the coat, from the collar down to a point below the waist
  const vest = chaikin([C([st[0] - 2.4, st[1] - 1]), C([st[0] + 20, st[1] - 2]), T([h[0] + 20, h[1] - 3]), T([h[0] + 9, h[1] + 3]), T([h[0] + 3, h[1] + 1.2]), T([w[0] - 2.6, w[1] - 1])], 2);
  poly(ctx, vest);
  const vg = ctx.createLinearGradient(...C([st[0], st[1]]), ...T([h[0], h[1]]));
  vg.addColorStop(0, tone(a, VEST[1]));
  vg.addColorStop(1, tone(a, VEST[2]));
  ctx.fillStyle = vg;
  ctx.fill();
  ctx.save();
  poly(ctx, vest);
  ctx.clip();
  // fine satin stripes running down it, following the body
  pen(ctx, tone(a, VEST[2], 0.6), 0.35);
  for (let k = 0; k < 6; k++) {
    const x0 = st[0] + k * 3.2;
    ctx.beginPath();
    ctx.moveTo(...C([x0, st[1]]));
    ctx.quadraticCurveTo(...C([x0 + 0.6, (st[1] + w[1]) / 2]), ...T([x0 + 1.4 - 80 + h[0], h[1]]));
    ctx.stroke();
  }
  // its soft shading: lit on the chest, shaded toward the sides and the hem
  const c0 = C([st[0] + 8, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 5, VEST[0], 0.8);
  const hm = T([h[0] + 4, h[1]]);
  glow(ctx, hm[0], hm[1], 5, VEST[3], 0.45);
  ctx.restore();
  // the shirt front: a white V from the collar down into the waistcoat
  poly(ctx, chaikin([C([st[0] + 1, st[1] - 1.5]), C([st[0] + 9, st[1] - 1.5]), C([st[0] + 6.4, st[1] + 7]), C([st[0] + 3.6, st[1] + 7])], 2));
  ctx.fillStyle = tone(a, CREAM[0]);
  ctx.fill();
  // the gold buttons, following the waistcoat's curve
  for (const u of [0.25, 0.5, 0.75]) {
    const p = u < 0.55 ? C([st[0] + 5 + u * 3, st[1] + 6 + u * 14]) : T([h[0] + 5 + u * 2, w[1] - 4 + (u - 0.5) * 18]);
    button(ctx, a, p[0], p[1], 0.62);
  }
  // the coat's lapels: soft satin bands down each side of the opening
  for (const [x0, x1] of [[-2.6, -1.2], [20, 18]]) {
    const L = chaikin([C([st[0] + x0 - 1.6, st[1] - 1.6]), C([st[0] + x0 + 1.6, st[1] - 1.6]), C([st[0] + x1 + 1.2, st[1] + 9]), T([w[0] + x1 - 0.6, w[1] + 1]), C([st[0] + x1 - 1, st[1] + 9])], 2);
    poly(ctx, L);
    ctx.fillStyle = tone(a, COAT[0], 0.9);
    ctx.fill();
    pen(ctx, tone(a, COAT[2], 0.7), 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
function button(ctx, a, x, y, r = 0.62) {
  ell(ctx, x, y, r, r);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  pen(ctx, tone(a, GOLD[2]), 0.2);
  ctx.stroke();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.3);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
}
// The collar and the cravat: a white wing collar standing up round his neck, a puffed white cravat
// with a gold pin, its ends tucked into the waistcoat; it sways a little on its spring.
function cravat(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const cx = st[0] + 4.6;
  const cy = st[1] - 2.2;
  const sw = a.hbCrav ?? 0;
  // (the collar's wings either side of his neck)
  for (const s of [-1, 1]) {
    poly(ctx, chaikin([[cx + s * 1, cy - 3.6], [cx + s * 5.6, cy - 2.8], [cx + s * 5, cy + 0.6], [cx + s * 1.4, cy + 0.8]], 2));
    paint(ctx, a, mode, s > 0 ? CREAM[0] : CREAM[1], LW, COAT_INK);
  }
  ctx.translate(cx, cy);
  ctx.rotate(sw * 0.3);
  smooth(ctx, [[-4.6, -1.6], [-1.8, -3], [2, -3], [4.8, -1.2], [4, 1.6], [1.8, 2.6], [1.1, 7 + sw * 2], [-0.8, 7.8 + sw * 2], [-1.7, 2.6], [-4.2, 1.6]]);
  paint(ctx, a, mode, CREAM[1], LW, COAT_INK);
  if (mode === 'fill') {
    glow(ctx, -0.8, -1, 4, CREAM[0], 0.95);
    pen(ctx, tone(a, CREAM[2]), 0.5);
    ctx.beginPath();
    ctx.moveTo(-2.8, -0.4);
    ctx.quadraticCurveTo(0, 1.3, 3, -0.3);
    ctx.stroke();
    ell(ctx, 0.3, 0.3, 1, 1);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ell(ctx, 0, 0, 0.4, 0.35);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
    if ((a.hbQ ?? {}).pin) sparkle(ctx, 1.4, -1, 2.2, a.hbQ.pin);
  }
  ctx.restore();
}
// A white cotton glove over a paw, a crisp shirt cuff peeping from the coat sleeve above it.
function glove(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  const near = k === 'N';
  // the cuff, a white band round the wrist
  poly(ctx, chaikin([[-4.4, -6.4], [4.4, -6.4], [4.6, -3.6], [-4.6, -3.6]], 2));
  paint(ctx, a, mode, near ? CREAM[0] : CREAM[2], LW, COAT_INK);
  smooth(ctx, [[-3.8, -3], [-1.6, -4.2], [2.2, -4], [4.2, -1], [4, 2.4], [1.6, 4.4], [-1.8, 4.2], [-4.2, 1.3]]);
  paint(ctx, a, mode, near ? CREAM[1] : CREAM[2], LW, COAT_INK);
  if (mode === 'fill') {
    glow(ctx, -0.6, -1.4, 3.4, CREAM[0], near ? 0.9 : 0.4);
    pen(ctx, tone(a, CREAM[2]), 0.45);
    ctx.beginPath();
    ctx.moveTo(-0.6, 0.6);
    ctx.lineTo(-0.4, 3.4);
    ctx.moveTo(1.5, 0.4);
    ctx.lineTo(1.7, 3.2);
    ctx.stroke();
  }
  ctx.restore();
}
// The tea towel over his near forearm: a cream cloth folded over the sleeve, two ends hanging, the
// hems on springs.
function towel(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'armNf');
  const el = D.J.elN;
  const wr = D.J.wrN;
  const mx = el[0] + (wr[0] - el[0]) * 0.45;
  const my = el[1] + (wr[1] - el[1]) * 0.45;
  ctx.translate(mx, my);
  // (the cloth hangs straight down in the room whatever the arm does: undo the arm's turn)
  const M = a.blMat('armNf');
  ctx.rotate(-Math.atan2(M[1], M[0]));
  const sw = a.hbTowel ?? [0, 0];
  const L1 = 9 + sw[0] * 1.2;
  const L2 = 11.5 + sw[1] * 1.4;
  poly(ctx, chaikin([[-4.4, -1.8], [0, -3], [4.4, -1.6], [4.8 + sw[0] * 3, L1 * 0.6], [4 + sw[0] * 4, L1], [1 + sw[0] * 3, L1 + 1], [0.6 + sw[1] * 3, L2], [-2.6 + sw[1] * 4, L2 + 0.6], [-4.8 + sw[1] * 3, L2 * 0.55]], 2));
  paint(ctx, a, mode, '#fbf2dc', LW, COAT_INK);
  if (mode === 'fill') {
    glow(ctx, -1, 0, 5, '#ffffff', 0.85);
    pen(ctx, tone(a, '#e5d6b8'), 0.55);
    ctx.beginPath();
    ctx.moveTo(-3.4, 1.4);
    ctx.quadraticCurveTo(0, 0.4, 3.8, 1.4);
    ctx.stroke();
    pen(ctx, tone(a, '#c8b0dc', 0.8), 0.65);
    ctx.beginPath();
    ctx.moveTo(-4 + sw[1] * 3, L2 * 0.62);
    ctx.lineTo(0.8 + sw[1] * 3, L2 * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}
// His shoes: neat black patent shoes, round-toed, a shine on the toe.
function shoe(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  poly(ctx, chaikin([[p[0] - 4.6, p[1] - 3.2], [p[0] - 0.6, p[1] - 3.8], [p[0] + 3.4, p[1] - 2.6], [p[0] + 7, p[1] - 0.6], [p[0] + 7.2, p[1] + 2.4], [p[0] - 4.8, p[1] + 2.4], [p[0] - 5.4, p[1]]], 2));
  paint(ctx, a, mode, near ? SHOE[1] : SHOE[2], LW, COAT_INK);
  if (mode === 'fill') {
    ell(ctx, p[0] + 3.6, p[1] - 0.8, 2, 0.8, -0.2);
    ctx.fillStyle = tone(a, SHOE[0], near ? 0.85 : 0.4);
    ctx.fill();
    ell(ctx, p[0] + 4.2, p[1] - 1.1, 0.7, 0.35, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
    pen(ctx, tone(a, SHOE[0], 0.5), 0.35);
    ctx.beginPath();
    ctx.moveTo(p[0] - 4.6, p[1] + 1.6);
    ctx.lineTo(p[0] + 6.6, p[1] + 1.6);
    ctx.stroke();
  }
  ctx.restore();
}
// His tail: a soft curved sabre carried up from inside his rump, peeking from under the coat tails, the
// tip white (a chain of four sprung pieces).
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const angs = a.hbTail ?? [-2.6, -2.2, -1.85, -1.5];
  const pts = chain([h[0] - 12.5, h[1] - 4], angs, [6.2, 5.8, 5.2, 4.4]);
  const shape = tube(pts, [5.8, 5.2, 4.6, 3.8, 2.8], 0.6);
  poly(ctx, shape);
  paint(ctx, a, mode, FUR[2], LW);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, shape);
    ctx.clip();
    ell(ctx, pts[4][0], pts[4][1], 4.4, 4.4);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, pts[1][0] + 1, pts[1][1] - 1, 4.4, FUR[1], 0.7);
    ctx.restore();
  }
  ctx.restore();
}
// His coat tails: two long rounded swallow tails from the back of his waist, each on its own spring,
// swinging as he walks and bows.
function coatTails(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const w = D.J.waist;
  const sw = a.hbTails ?? [0, 0];
  for (const k of [1, 0]) {
    const root = [h[0] - 11 + k * 2.4, w[1] + 1 + k * 0.6];
    const base = Math.PI / 2 + 0.5 + k * 0.12 + sw[k];
    const pts = chain(root, [base, base + 0.08 + sw[k] * 0.6, base + 0.14 + sw[k] * 1.1], [6.4, 6, 5.4]);
    const shape = tube(pts, [7.6, 7, 6, 4.6], 0.55);
    poly(ctx, shape);
    paint(ctx, a, mode, k ? COAT[2] : COAT[1], LW, COAT_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, shape);
      ctx.clip();
      glow(ctx, pts[1][0] - 1.4, pts[1][1], 4.6, COAT[0], 0.45);
      glow(ctx, pts[3][0] + 1, pts[3][1], 4, COAT[3], 0.5);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- The tray, the cloche and the tart ----------
// (in the rig's space: the tray rests on his near paw, kept level with a little lag; the cloche on it,
// or up in his far paw when he lifts it)
function trayAt(a, D) {
  const hd = ptOf(a, D, 'handN', D.J.handN);
  const tilt = a.hbTrayTilt ?? 0;
  return { x: hd[0] + 0.6, y: hd[1] - 1.5, tilt };
}
function clocheAt(a, D, tr) {
  const q = a.hbQ ?? {};
  const lift = q.lift ?? 0;
  // the far paw's place (it takes the lid by its knob)
  const hf = ptOf(a, D, 'handF', D.J.handF);
  const onTray = [tr.x + Math.sin(tr.tilt) * 4, tr.y - 0.8];
  const x = mix(onTray[0], hf[0], lift);
  const y = mix(onTray[1], hf[1] + 6.2, lift);
  return { x, y, ang: mix(tr.tilt, q.lidAng ?? 0, lift) };
}
function trayDraw(ctx, a, mode, D) {
  const q = a.hbQ ?? {};
  if (q.noTray) return;
  const tr = trayAt(a, D);
  ctx.save();
  ctx.translate(tr.x, tr.y);
  ctx.rotate(tr.tilt);
  // the tray: a flat silver oval with a raised rim, seen a little from above
  ell(ctx, 0, 0, 8.6, 2.2);
  paint(ctx, a, mode, SILVER[1], LW);
  if (mode === 'fill') {
    ell(ctx, 0, -0.3, 7.4, 1.4);
    ctx.fillStyle = tone(a, SILVER[2]);
    ctx.fill();
    ell(ctx, -3, -0.6, 3, 0.6);
    ctx.fillStyle = tone(a, '#ffffff', 0.85);
    ctx.fill();
  }
  // the tart, when the lid is up (or no lid at all)
  if (!q.served && (q.lift ?? 0) > 0.05) tartDraw(ctx, a, mode, 0, -1.2, 1, q.tartGlow ?? 0);
  ctx.restore();
}
function tartDraw(ctx, a, mode, x, y, s, gl) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // a little pumpkin tart: a fluted crust, the orange filling, a swirl of cream
  smooth(ctx, [[-4.4, -0.4], [-3.6, -2.4], [0, -3], [3.6, -2.4], [4.4, -0.4], [3.4, 0.6], [-3.4, 0.6]]);
  paint(ctx, a, mode, CRUST[1], LW);
  if (mode === 'fill') {
    ell(ctx, 0, -2.2, 3.4, 0.9);
    ctx.fillStyle = tone(a, TART[1]);
    ctx.fill();
    ell(ctx, -0.8, -2.5, 1.4, 0.35);
    ctx.fillStyle = tone(a, TART[0]);
    ctx.fill();
    for (let i = -3; i <= 3; i += 1.5) {
      pen(ctx, tone(a, CRUST[2]), 0.35);
      ctx.beginPath();
      ctx.moveTo(i, -1.4);
      ctx.lineTo(i * 0.9, 0.4);
      ctx.stroke();
    }
    ell(ctx, 0.4, -3.2, 1.3, 0.8);
    ctx.fillStyle = tone(a, '#fffaf0');
    ctx.fill();
    if (gl > 0.01) {
      glow(ctx, 0, -2.5, 7, '#ffe6a0', 0.6 * gl);
      sparkle(ctx, 2.6, -4.6, 2.2 * gl, gl);
    }
  }
  ctx.restore();
}
function clocheDraw(ctx, a, mode, D) {
  const q = a.hbQ ?? {};
  const tr = trayAt(a, D);
  let c = clocheAt(a, D, tr);
  if (q.lidRoll != null) {
    // (knocked off as he sits down hard: it hops off the tray and rolls away along the floor)
    const k = sstep(q.lidRoll / 0.7);
    c = { x: mix(c.x, 26, k), y: mix(c.y, -0.6, k) - Math.sin(Math.PI * k) * 7, ang: mix(c.ang, 3.1, k) };
  }
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.ang);
  // the dome, a rim at its foot, a round knob on top
  ctx.beginPath();
  ctx.moveTo(-6.8, 0);
  ctx.bezierCurveTo(-6.8, -6.4, 6.8, -6.4, 6.8, 0);
  ctx.quadraticCurveTo(0, 1.2, -6.8, 0);
  ctx.closePath();
  ctx.moveTo(1.4, -5.6);
  ctx.arc(0, -5.6, 1.4, 0, TAU);
  paint(ctx, a, mode, SILVER[1], LW);
  if (mode === 'fill') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-6.8, 0);
    ctx.bezierCurveTo(-6.8, -6.4, 6.8, -6.4, 6.8, 0);
    ctx.closePath();
    ctx.clip();
    glow(ctx, 3, -1, 7, SILVER[3], 0.45);
    ell(ctx, -2.6, -3, 1.6, 2.4, 0.4);
    ctx.fillStyle = tone(a, '#ffffff', 0.95);
    ctx.fill();
    // (his reflection: a soft caramel smudge in the shine)
    ell(ctx, 2.4, -2, 1.6, 1.4);
    ctx.fillStyle = tone(a, FUR[1], 0.35);
    ctx.fill();
    if (q.fog) {
      glow(ctx, 1, -2.6, 5, '#ffffff', 0.7 * q.fog);
    }
    ctx.restore();
    ell(ctx, 0, -0.1, 6.8, 0.8);
    ctx.fillStyle = tone(a, SILVER[2]);
    ctx.fill();
    ell(ctx, -0.4, -5.9, 0.6, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    if (q.shine) sparkle(ctx, -3, -4, 3.2, q.shine);
  }
  ctx.restore();
}

// ---------- His act and his fight (on the base's channels) ----------
const SWINGS = ['clang', 'earswat', 'bow'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.hbN ?? 0) % SWINGS.length]);
// The tray carry: the near upper arm a little forward, the forearm level, the paw under the tray.
const CARRY = { shN: -30, elN: -60, hwN: 0 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'solemn', look: [0.3, 0], turn: 0.35, lift: 0, lidAng: 0, earOut: 0, earDrop: 0, earFling: 0, sweat: 0, fx: null, shine: 0, fog: 0, pin: 0, sniff: false, served: Boolean(m.served), tartGlow: 0, tailUp: 0, wag: 0 };
  a.hbQ = q;
  a.hbUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.5);
  const mood = m.cine?.mood;
  const frac = m.hp / m.def.hp;
  const low = m.hp > 0 && frac < 0.3;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = anticK > 0 || (since >= 0 && since < 0.85);
  if (swinging && !st.hbAtk) {
    st.hbN = (st.hbN ?? (m.uid ?? 0)) + 1;
    st.hbPick = pickSwing(m, st);
  }
  // (how far the wind-up got before the blow: a blow with none, a touch, never snaps to it)
  st.hbAntic = swinging ? Math.max(anticK, st.hbAntic ?? 0) : 0;
  // (struck: the blow let go just now, its wind-up over)
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.hbAtk = swinging;
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const serveU = m.servedAt != null ? now - m.servedAt : -1;
  const serving = serveU >= 0 && serveU < 2.6;
  const busy = m.hp <= 0 || swinging || serving;

  // Standing at his post: very upright, chin level, the tray carried, the far paw at his side.
  go({ tilt: -1.5, chest: -2 + breath * 0.6, head: -1 + Math.sin(t * 0.7) * 0.8, ...CARRY, shF: 8, elF: 14, fxN: 0.08, fxF: -0.06 }, 1);
  // Walking: a short-legged shuffle, a little lean, the tray steady, the far paw swinging.
  if (walkW > 0.01) {
    out.shF = (out.shF ?? 0) + Math.sin(t * 7) * 10 * walkW;
    out.tilt = (out.tilt ?? 0) + 2.5 * walkW;
    q.turn = mix(q.turn, 0.55, walkW);
    q.tailUp = walkW;
  }
  // On his way to her ladyship: the tray raised proudly before him, chin up.
  if (m.serving && m.hp > 0 && !swinging) {
    go({ shN: -40, elN: -60, tilt: -3, head: -5 }, 0.8);
    say('proud');
    q.turn = 0.6;
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !m.serving) say('set');
  if (gloat >= 0 && gloat < 1.2 && m.hp > 0 && !busy) {
    // a small satisfied nod
    const k = win(gloat, 0, 0.2, 0.8, 1.2);
    go({ head: 8 * Math.sin(Math.min(1, gloat / 0.6) * Math.PI), tilt: -2 }, k);
    say('proud', k);
  }
  if (m.hp <= 0) {
    // beaten: sat down hard, the tray in his lap, the lid rolled off, ears flopped, dizzy
    const u = now - (st.hbDeadAt ??= now);
    go({ drop: 1, tilt: -16, head: 18, shN: -30, elN: -40, shF: 20, elF: -30, fxN: 0.6, fxF: 0.5, x: -0.02, pelvis: 0, waist: 0 });
    q.mood = 'dizzy';
    q.turn = 0.2;
    q.earDrop = 1;
    q.lidRoll = u;
    q.fx = { kind: 'beaten', u };
  } else st.hbDeadAt = undefined;

  if (m.hp > 0) {
    if (serving) {
      // arriving: a bow, the cloche lifted high, the tart sparkling and floating off to her
      const bow = win(serveU, 0, 0.35, 0.9, 1.3);
      const lid = win(serveU, 0.5, 0.85, 2.0, 2.5);
      go({ tilt: 18, head: 14, chest: 4 }, bow);
      go({ shF: -150, elF: -40, hwF: 20 }, lid);
      q.lift = lid;
      q.lidAng = -0.3;
      q.tartGlow = win(serveU, 0.8, 1.0, 1.4, 1.6);
      q.served = serveU > 1.4;
      say(serveU < 0.9 ? 'proud' : 'pleased');
      q.fx = { kind: 'serve', u: serveU, dx: m.serveDx ?? 60 };
    } else if (swinging) {
      const kind = st.hbPick ?? 'clang';
      const hitK = struck ? (since < 0.07 ? sstep(since / 0.07) : 1 - sstep((since - 0.28) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.hbAntic) * (since < 0.07 ? 1 : 0) : sstep(anticK);
      if (kind === 'clang') {
        // Cloche Clang: the lid lifted high in his far paw, then clapped down in front of him
        go({ shF: -165, elF: -20, hwF: 10, tilt: -6, head: -10, chest: -4 }, wK);
        go({ shF: -70, elF: -10, hwF: 0, tilt: 14, head: 8, x: 0.04 }, hitK);
        q.lift = Math.max(wK, hitK);
        q.lidAng = mix(-0.6, 0.15, hitK);
        say(hitK > 0.3 ? 'shout' : 'set');
        q.fx = { kind: struck ? 'clang' : 'ready', u: struck ? since : now };
      } else if (kind === 'earswat') {
        // Ear Swat: his head turned away, then a shake that flings both ears round at you
        go({ head: -14, turnC: -0.4, tilt: -4 }, wK);
        go({ head: 16, turnC: 0.5, tilt: 8, x: 0.03 }, hitK);
        q.earFling = hitK - wK * 0.6;
        q.earStiff = true;
        q.turn = mix(0.35, wK > 0.5 ? 0.05 : 0.9, Math.max(wK, hitK));
        say(hitK > 0.3 ? 'cross' : 'set');
        q.fx = { kind: struck ? 'earswat' : 'ready', u: struck ? since : now };
      } else {
        // Deep Bow: drawn up very straight, then a bow so deep his head bonks you (the tray level)
        go({ tilt: -10, head: -8, chest: -6, shF: 30, elF: 60 }, wK);
        go({ tilt: 42, head: 26, chest: 10, x: 0.06, shF: 40, elF: 70, fxN: 0.2, fxF: -0.25 }, hitK);
        q.earDrop = -hitK * 0.6;
        say(hitK > 0.3 ? 'pleased' : 'proud');
        q.fx = { kind: struck ? 'bow' : 'ready', u: struck ? since : now };
      }
    } else if (hurt) {
      // a flinch, the ears flying up
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -12, x: -0.02, shF: -40 }, k);
      say('hurt', k * 2);
      q.earOut = k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a nap (m.habit nap, or a set sleep pose): still on his feet, the tray level, chin sunk to his
    // cravat, ears drooping, a slow breath (he's a butler: he sleeps standing up)
    const nap = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
    st.hbNap = mix(st.hbNap ?? 0, nap && !busy ? 1 : 0, 1 - Math.exp(-dt * 3));
    if (st.hbNap > 0.01) {
      const k = sstep(st.hbNap);
      go({ head: 18 + Math.sin(t * 1.1) * 2, tilt: 4, chest: 2 + Math.sin(t * 1.1) * 1.2 }, k);
      if (k > 0.5) {
        q.mood = 'sleepy';
        q.earDrop = k;
        q.fx = { kind: 'nap', u: t };
      }
    }
    // a scene's acts: 'bow' (a formal bow), 'present' (the cloche lifted)
    if (act?.move === 'bow' && actU >= 0 && actU < (act.dur ?? 1.4) + 0.3) {
      const k = win(actU, 0, 0.3, (act.dur ?? 1.4) - 0.2, (act.dur ?? 1.4) + 0.3);
      go({ tilt: 24, head: 16, chest: 4, shF: 30, elF: 70 }, k);
      say('proud', k);
    }
    // his idle act: only when he's calm, and only a piece he has time to finish
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || m.serving || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.hbCalm = mix(st.hbCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.hbCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.hbCalm), t, now, st);
    if (mood && !busy) {
      q.mood = { angry: 'cross', happy: 'pleased', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[mood] ?? q.mood;
    }
    if (low && !busy) {
      q.mood = 'worried';
      q.sweat = (t * 0.6) % 1;
    } else if (low) q.sweat = (t * 0.6) % 1;
    if (m.talking) q.mood = 'talk';
  }
  // (where his face is turned, eased: never a snap round)
  q.turn = spring(st, 'hbTurn', q.turn, 220, 28, dt);
  // The face, eased toward its mood (talking runs through vowel shapes).
  const F = FACES[q.mood] ?? FACES.solemn;
  const f = (st.hbF ??= { ...FACES.solemn, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of ['lid', 'pt', 'pu', 'mw', 'ms', 'mo', 'te', 'tg', 'bl', 'sm', 'dr']) f[key] = mix(f[key], tgt[key], key === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.hbF = f;
  // springs: the ears (each piece trailing the one above it), the tail, the towel's hems, the cravat,
  // the tray's level
  const kick = (st.hbLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.hbLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.hbLast = out.head;
  st.hbLastT = out.tilt;
  const headAng = ((out.head ?? 0) + (out.tilt ?? 0)) * (Math.PI / 180);
  const step = walkW * Math.sin(t * 7);
  a.hbEar = [-1, 1].map((side, e) => {
    const hang = Math.PI / 2 - headAng * 0.6;
    const out0 = q.earOut * side * -0.9 - q.earDrop * side * 0.12 - q.earFling * 1.6;
    const goals = [hang - side * 0.1 + out0, hang - side * 0.01 + out0 * 1.2, hang + side * 0.06 + out0 * 1.35];
    const stiff = q.earStiff ? 2.4 : 1;
    return goals.map((g0, i) => spring(st, `ear${e}${i}`, g0 + Math.sin(t * 1.1 + i * 0.7 + e) * 0.04 + step * 0.12 * (i + 1) * 0.5, (70 - i * 12) * stiff, (7 - i * 0.8) * Math.sqrt(stiff), dt, kick * 0.012 * (i + 1)));
  });
  const wag = q.wag || (q.mood === 'pleased' || q.mood === 'bliss' ? 1 : 0);
  const up = -2.6 - 0.2 * q.tailUp + (m.hp <= 0 ? 1.2 : 0) + (q.mood === 'worried' || q.mood === 'sad' ? 0.7 : 0);
  a.hbTail = [0, 1, 2, 3].map((i) => spring(st, `tl${i}`, up + 0.37 * i + Math.sin(t * (wag ? 11 : 1.6) + i * 0.6) * (wag ? 0.22 : 0.06), 80 - i * 10, 7, dt, kick * 0.01));
  // the coat tails: hanging from his waist (down in the room as he leans and bows), swinging as he walks
  const leanR = ((out.tilt ?? 0) + (out.pelvis ?? 0)) * (Math.PI / 180);
  a.hbTails = [0, 1].map((k) => spring(st, `ct${k}`, -leanR * 0.75 + walkW * Math.sin(t * 7 + k * 0.9) * 0.14 + Math.sin(t * 1.2 + k) * 0.03, 70 + k * 12, 6.5, dt, kick * 0.012))
  a.hbTowel = [0, 1].map((i) => spring(st, `tw${i}`, Math.sin(t * 1.3 + i) * 0.15 - (out.tilt ?? 0) * 0.02 + walkW * Math.sin(t * 7 + i) * 0.4, 60 + i * 10, 5, dt, kick * 0.02));
  a.hbCrav = spring(st, 'crav', Math.sin(t * 1.4) * 0.05 - (out.tilt ?? 0) * 0.01, 70, 6, dt, kick * 0.01);
  // (the lid lifts and comes down on a quick spring of its own, never in a frame)
  q.lift = clamp(spring(st, 'hbLid', q.lift, 260, 30, dt), 0, 1.05);
  q.lidAng = spring(st, 'hbLidAng', q.lidAng, 260, 30, dt);
  a.hbTrayTilt = spring(st, 'tray', -(out.tilt ?? 0) * 0.002 + walkW * Math.sin(t * 7) * 0.03, 160, 14, dt, kick * 0.004);
}
// The 30 s act (only a piece he has time to finish before he moves on, m.restUntil): polishing the
// cloche; a peek under it; dozing on duty; to attention and a tiny bow.
const PIECES = [
  { name: 'polish', t0: 0.4, len: 6.6 },
  { name: 'peek', t0: 7.6, len: 6.8 },
  { name: 'doze', t0: 15.2, len: 7.8 },
  { name: 'attend', t0: 23.8, len: 5.4 },
];
function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
  // (a piece is only begun if he'll still be standing here when it ends)
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    const begun = st.hbPiece === cur.name;
    if (!begun) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.hbPiece = cur.name;
      else return;
    }
  } else {
    st.hbPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'polish') {
    // a breath on the cloche (fog), a rub with his far paw in little circles, a glint, admired
    const k = win(u, 0, 0.5, 6, 6.6);
    const rub = sstep((u - 1.6) / 0.3) * (1 - sstep((u - 4.4) / 0.3));
    go({ shF: -80 + Math.sin(t * 9) * 8 * rub, elF: -70 + Math.cos(t * 9) * 10 * rub, head: 10 - 6 * win(u, 0.4, 0.7, 1.4, 1.6), tilt: 3 }, k * w);
    if (at(k)) {
      q.mood = u < 1.6 ? 'talk' : u < 4.6 ? 'set' : 'proud';
      q.fog = win(u, 0.5, 0.8, 1.6, 2.6);
      q.shine = win(u, 4.6, 4.8, 5.4, 5.8);
      q.look = [0.6, 0.6];
      q.turn = 0.6;
      if (u > 4.8 && u < 6) q.fx = { kind: 'admire', u: u - 4.8 };
    }
  } else if (cur.name === 'peek') {
    // the lid lifted a crack, a sniff, scent curls, bliss; "ahem", lid down, back straight
    const k = win(u, 0, 0.5, 6.2, 6.8);
    const crack = win(u, 0.6, 1.1, 4.6, 5.1);
    go({ shF: -110, elF: -50, head: 6 + 4 * crack, tilt: 4 * crack }, k * w);
    q.lift = 0.22 * crack;
    q.lidAng = -0.35;
    if (at(k)) {
      q.sniff = u > 1.2 && u < 2.8;
      q.mood = u < 1.2 ? 'set' : u < 2.8 ? 'sniff' : u < 4.6 ? 'bliss' : 'startled';
      if (u > 5.2) q.mood = 'proud';
      q.wag = u > 2.8 && u < 4.6 ? 1 : 0;
      q.fx = { kind: 'peek', u };
    }
  } else if (cur.name === 'doze') {
    // his head nods, slower and lower, ears drooping; a snap awake; the cravat straightened
    const k = win(u, 0, 0.6, 7.2, 7.8);
    const nod = sstep((u - 0.4) / 3.6) * (1 - sstep((u - 4.6) / 0.15));
    const snap = win(u, 4.6, 4.7, 5.2, 5.7);
    const fix = win(u, 5.6, 5.9, 7, 7.4);
    go({ head: 20 * nod + Math.sin(u * 2.2) * 3 * nod - 12 * snap, tilt: 5 * nod - 4 * snap, shF: -100 * fix, elF: -110 * fix }, k * w);
    if (at(k)) {
      q.mood = u < 4.6 ? (u < 1.2 ? 'solemn' : 'sleepy') : u < 5.6 ? 'startled' : 'set';
      q.earDrop = nod;
      q.earOut = snap;
      q.pin = win(u, 6.2, 6.4, 6.9, 7.2);
      q.fx = { kind: 'doze', u };
    }
  } else {
    // to attention, chin up, tail stiff; then a tiny formal bow to nobody
    const k = win(u, 0, 0.4, 4.8, 5.4);
    const bow = win(u, 2.4, 2.9, 3.6, 4.2);
    go({ tilt: -4 + 20 * bow, head: -6 + 14 * bow, chest: -4, shF: 20 * bow, elF: 60 * bow }, k * w);
    if (at(k)) {
      q.mood = bow > 0.3 ? 'pleased' : 'proud';
      q.tailUp = 1;
    }
  }
}

// ---------- Effects (the rig's space, facing right) ----------
function fx(ctx, m, a, S, matOf, D) {
  const q = a.hbQ;
  if (!q?.fx) return;
  ctx.save();
  ctx.scale(1 / BIG, 1 / BIG);
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
// A soft swish: a crescent of silver-white, outlined in its own lilac-grey, tapering at both ends.
function swish(ctx, cx, cy, r, a0, a1, w, al, col = '#ffffff', rim = '#c9c3dc') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const n = 18;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const an = a0 + (a1 - a0) * u;
    const ww = w * Math.sin(Math.PI * u) ** 0.8;
    pts.push([[cx + Math.cos(an) * (r + ww / 2), cy + Math.sin(an) * (r + ww / 2)], [cx + Math.cos(an) * (r - ww / 2), cy + Math.sin(an) * (r - ww / 2)]]);
  }
  ctx.beginPath();
  pts.forEach(([p], i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  for (let i = n; i >= 0; i--) ctx.lineTo(...pts[i][1]);
  ctx.closePath();
  pen(ctx, rim, 1.2);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A curl of scent (the tart's): a soft rose-gold ribbon rising and waving.
function scent(ctx, x, y, u, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  pen(ctx, '#f6b878', 1.3);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const v = i / 12;
    const px = x + Math.sin(v * 5 + u * 3) * 2.2 * v;
    const py = y - v * 12;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  pen(ctx, '#fff2d8', 0.5);
  ctx.stroke();
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const X = q.fx;
  const t = a.t ?? 0;
  const u = X.u;
  const f = a.flip ? -1 : 1;
  const B = (p) => [p[0] * BIG, p[1] * BIG];
  const hd = B(headAt(a, D, [6, 0]));
  const crown = B(headAt(a, D, [0, -20]));
  const nose = B(headAt(a, D, [(q.turn ?? 0.35) * 5 + 8, 3]));
  const tr = trayAt(a, D);
  const lid = clocheAt(a, D, tr);
  const L = B([lid.x, lid.y]);
  const T = B([tr.x, tr.y]);
  if (X.kind === 'admire') {
    sparkle(ctx, L[0] - 4, L[1] - 7, 3.4 * Math.sin(Math.PI * clamp(u / 1.2, 0, 1)), 1);
  } else if (X.kind === 'peek') {
    if (u > 1 && u < 4.8) for (let i = 0; i < 3; i++) scent(ctx, T[0] - 3 + i * 3.4, T[1] - 3, u + i, win(u, 1 + i * 0.3, 1.5 + i * 0.3, 4.2, 4.8) * 0.8);
    if (u > 1.4 && u < 2.8) cue(ctx, 'sniff', nose[0] + 12, nose[1] - 10, 6, f, -0.1, '#8a5a46');
    if (u > 4.9 && u < 6) cue(ctx, 'ahem', hd[0] + 16, hd[1] - 22, 7, f, -0.1, '#8a5a46');
  } else if (X.kind === 'doze') {
    for (let i = 0; i < 3; i++) {
      const v = ((u * 0.6 + i / 3) % 1);
      if (u > 1.2 && u < 4.6) {
        ctx.save();
        ctx.globalAlpha *= Math.sin(Math.PI * v) * win(u, 1.2, 1.6, 4.3, 4.6);
        cue(ctx, 'z', crown[0] + 6 + v * 10, crown[1] - 4 - v * 14, 5 + v * 3, f, -0.2, '#9a86c8', '#f4eeff');
        ctx.restore();
      }
    }
    if (u > 4.6 && u < 5.4) cue(ctx, '!', crown[0] + 4, crown[1] - 10, 10, f, 0, '#8a5a46');
  } else if (X.kind === 'ready') {
    // a twinkle off the silver as he gathers himself
    sparkle(ctx, L[0] + 2, L[1] - 8, 2 + Math.sin(t * 9), 0.7);
  } else if (X.kind === 'clang') {
    // CLANG: rings of sound off the lid as it lands, silver sparkles
    const k = clamp(u / 0.45, 0, 1);
    if (u > -0.02 && u < 0.5) {
      for (let i = 0; i < 2; i++) {
        const kk = clamp(k - i * 0.25, 0, 1);
        if (kk <= 0) continue;
        ctx.save();
        ctx.globalAlpha = (1 - kk) * 0.9;
        pen(ctx, '#c9c3dc', 2.2);
        ctx.beginPath();
        ctx.ellipse(L[0] + 4, L[1] + 2, 6 + kk * 18, 3 + kk * 9, 0, 0, TAU);
        ctx.stroke();
        pen(ctx, '#ffffff', 1);
        ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < 4; i++) sparkle(ctx, L[0] + 4 + Math.cos(i * 1.6) * (6 + k * 12), L[1] + Math.sin(i * 1.6) * (4 + k * 8), 2.6 * (1 - k * 0.6), 1 - k * 0.5);
      cue(ctx, 'CLANG!', hd[0] + 26, hd[1] - 24, 9, f, -0.1, '#6c4280');
    }
  } else if (X.kind === 'earswat') {
    // FWAP: two soft caramel swishes where the ears flew round
    const k = clamp(u / 0.35, 0, 1);
    if (u > -0.02 && u < 0.4) {
      swish(ctx, hd[0] - 4, hd[1] + 4, 20, -1.2 + k * 0.4, 0.9 + k * 0.4, 5, 1 - k, '#fbe6cc', '#d9a070');
      swish(ctx, hd[0] - 4, hd[1] + 6, 14, -0.8 + k * 0.4, 1.1 + k * 0.4, 3.4, (1 - k) * 0.8, '#fbe6cc', '#d9a070');
      cue(ctx, 'FWAP!', hd[0] + 24, hd[1] - 22, 9, f, -0.1, '#9a5c34');
    }
  } else if (X.kind === 'bow') {
    // BONK: a little burst of stars off his crown where it lands, a puff at his paws
    const k = clamp(u / 0.4, 0, 1);
    if (u > 0.02 && u < 0.5) {
      for (let i = 0; i < 3; i++) {
        const an = -1.4 + i * 0.9;
        star(ctx, crown[0] + 8 + Math.cos(an) * (6 + k * 10), crown[1] + 6 + Math.sin(an) * (5 + k * 8), 2.4 * (1 - k * 0.5), an, 1 - k * 0.6);
      }
      cue(ctx, 'BONK', crown[0] + 22, crown[1] - 10, 8, f, -0.1, '#6c4280');
    }
    dust(ctx, 8, -1.5, 3.4, 0.6 * (1 - clamp(u / 0.6, 0, 1)), '#efe6f6', '#c8bcd8');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 8 - v * 8 + i * 5, hd[1] - 10 - v * 6 - i * 3, 2 * (1 - v), 1 - v, '#ffe0c0');
  } else if (X.kind === 'serve') {
    // the tart: glowing on the tray, then floating off to her ladyship, a trail of sparkles
    if (u > 1.3 && u < 2.6) {
      const v = sstep((u - 1.3) / 1.1);
      const x = T[0] + v * X.dx * BIG * 0.0 + v * X.dx;
      const y = T[1] - 6 - Math.sin(Math.PI * v) * 26;
      ctx.save();
      ctx.globalAlpha = 1 - sstep((u - 2.3) / 0.3);
      tartDraw(ctx, a, 'line', x, y, 1.6, 0);
      tartDraw(ctx, a, 'fill', x, y, 1.6, 1);
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const w = clamp(v - i * 0.06, 0, 1);
        sparkle(ctx, T[0] + w * X.dx, T[1] - 6 - Math.sin(Math.PI * w) * 26, 2 * (1 - i * 0.2), (1 - i * 0.22) * (1 - sstep((u - 2.3) / 0.3)), '#ffe6a0');
      }
    }
    if (u > 0.2 && u < 1.3) cue(ctx, 'Madam.', hd[0] + 18, hd[1] - 24, 7, f, -0.1, '#6c4280');
  } else if (X.kind === 'nap') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.5 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * v);
      cue(ctx, 'z', crown[0] + 6 + v * 10, crown[1] - 4 - v * 14, 5 + v * 3, f, -0.2, '#9a86c8', '#f4eeff');
      ctx.restore();
    }
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] - 2, 10, t, 3);
  }
}

const DRESS = {
  id: 'humphrey',
  // (the skin is his tailcoat and trousers: deep plum, its own soft ink)
  skin: { lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: COAT_INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  under: {
    // (his far ear hangs behind his whole body: drawn first, under the far arm, so it never lies over a shoulder;
    // tests/boss-layers.test.js)
    armF: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'back'),
  },
  under2: (ctx, m, a, S, matOf, D) => {
    for (const mode of ['line', 'fill']) {
      tail(ctx, a, mode, D);
      coatTails(ctx, a, mode, D);
    }
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => waistcoat(ctx, a, mode, D),
    // (the collar and cravat over his neck, under his chin)
    neckSkin: (ctx, a, mode, S, D) => cravat(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => glove(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
    armN: (ctx, a, mode, S, D) => towel(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => {
      glove(ctx, a, mode, D, 'N');
      trayDraw(ctx, a, mode, D);
      clocheDraw(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('hound', DRESS);
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
// His art entry, his size as drawn and his walking pace (the base's own walk at his size).
export const BUTLER_ART = { pad: 10, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [90, 300, 200, 220], draw: R.still, rig, noHop: true };
export const BUTLER_SIZE = { w: 34, h: 44, speed: Math.round(R.speed * BIG) };
