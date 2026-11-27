// Captain Gale on screen (2026-11-27, redrawn from scratch: the Sky Whale's sky-pirate captain, her story,
// lines and role kept; world/skywhale.js her new fight). A young sky-pirate captain with no wind magic at
// all: her ship's sails hang limp up here above the clouds, so she makes her own gales with the Gale-Maker,
// a ship's bellows the size of a cannon. All bluster, all heart; her crew are kittens (the Blunderpuss
// gunners), and she is very proud of all of them. She moves on her own copy of the creature base (rig.js;
// body.js `captain`: a slim young build, a little more leg for her boots), dressed here; her head, face,
// hair, hat, coat, boots and bellows drawn here from scratch (never the shared face, nothing of the hero's).
//   look    a cranberry sea-captain's frock coat WORN (the base's own body and sleeves, so it moves with
//           her), cream lapels turned back over an ivory waistcoat with brass buttons, a soft white jabot,
//           a sky-blue sash striped like a windsock knotted at her near hip (its ends sprung), the coat's
//           skirts in three panels (two in front, open over her breeches, and two long swallow tails
//           behind, each swinging on its own), big turned-back cream cuffs with gold edges; cream breeches
//           and tall cocoa sea boots with folded cuffs. A navy tricorn with gold braid wraps her head (a
//           red-and-cream cockade on its far wing, a long sky ribbon off it streaming in the wind); her
//           storm-periwinkle hair: an even blunt fringe cut in sections just above her lashes, a side lock
//           each side outside her eyes, and a long low ponytail tied with a windsock-striped ribbon,
//           streaming out behind her (never over her). Her signature: the Gale-Maker, honey-oak boards on
//           pleated leather (a sailcloth patch stitched on), a fat brass nozzle and brass studs, held by
//           its handle in her near hand.
//   eyes    her own "sail eyes": a lash line nearly level along the top that lifts to a soft wing at the
//           outer corner, a round full bottom; a sky iris (deep cobalt at the top, through blue to pale sky
//           below) with a bright horizon band across its lower third, a round pupil, and a compass glint (a
//           soft four-point star) up at the back plus a small round one low at the front; a short neat
//           lash flick; round, full periwinkle brows. A wide confident mouth whose near corner lifts more
//           (her smirk), a little snaggle fang that peeks out when she grins.
//   faces   calm (a cocky half smile), grin, laugh, proud, smug (a wink), focus, fierce, shout, puff (cheeks
//           full, blowing), squint (one eye to the spyglass), startled, hurt, dizzy, sad, worried, cross,
//           sleepy, talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces: the spyglass (out of her coat, telescoped open, a long look one way,
//           then the other, a "!" at something, snapped shut); the wind check (a finger licked and held up:
//           nothing; a cross look, then a puff of her own bellows at her hat ribbon so it streams
//           heroically, and a pose); fill the sails (the bellows pumped up at the sky, puff after puff, a
//           little cloud drifting off each, her coat-tails flapping; a cheer); a sea shanty (the bellows
//           over her shoulder, heel and toe stamped in time, swaying, a hummed note or two).
//   walk    a swagger: the bellows carried up on her shoulder, her far arm swinging, her coat-tails and
//           ponytail trailing.
//   fight   between casts her swings at the tank in turn: Bellows Bop (up over her head and down, boards
//           first), Puff! (the nozzle jabbed forward and squeezed: a gust in your face), Boarding Kick (a
//           swashbuckler's side kick with her boot). Her casts (m.castPose, world/skywhale.js): blank (Point
//           Blank Puff: braced, both hands on the boards, a huge squeeze at the tank), volley (Cloudball
//           Volley: the bellows swung up like a sword, "FIRE!" to her crew in the rigging), haul (All Hands
//           Haul!: hauling a rope down hand over hand), down (Downdraft: up on her toes, the bellows aimed
//           straight down and pumped), blow (Blow Me Down!: one hand holding her hat on, the bellows heaved
//           back and squeezed with everything), gale (Full Gale: spun round on her heel, a clean mirror flip,
//           pumping to both sides), shift (Wind Shift: a licked finger up, a point at the end of the deck
//           the wind will come from, then a pump). Phase moments (m.phaseAt): Squall (a boot up on nothing,
//           "SAILS UP!"), Full Gale (her hat held on, a mad grin, "BLOW ME DOWN!").
//   scenes  her entrance (skywhale_gale): 'pump' (becalmed: pumping the bellows up at limp sails, puffing
//           harder than the bellows), 'swagger' (the bellows up on her shoulder), 'windup' (pumped full),
//           'gust' (one great squeeze of the bellows at you), 'sway'.
//   marks   all her own (`ownEmotes`): a "!" and a "?" in a little life ring, a "Ha!" after landing a hit, a
//           sweat drop when low, dizzy sparkles when beaten (sat on the deck, hat over one ear).
// Every effect is drawn live in her own style: soft white-blue wind swooshes with round ends, round cloud
// puffs, soft four-point sparkles (never specks).
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, sweat, cue, spring, hash, note } from './fx.js';

const BIG = 2.3;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#8a4656';
const SKIN = ['#fff0e6', '#ffd9c6', '#f4b8a2', '#d88e7e'];
const COAT = ['#f2808c', '#d24a5e', '#a8344c', '#7c2440'];
const COAT_INK = '#7a2a42';
const CREAM = ['#fffdf6', '#fbf1dc', '#ecd8b4', '#c8ae84'];
const GOLD = ['#fff6c4', '#f6d466', '#d4a440', '#a07628'];
const SKYB = ['#e6f6ff', '#9ed2f6', '#5e9ee0', '#3e74b8'];
const HAIR = ['#e4e6fe', '#b4b8f0', '#8c90d8', '#6266b0', '#454882'];
const HAIR_INK = '#5a5a9a';
const NAVY = ['#7a80c4', '#4a508e', '#363a70', '#262852'];
const BOOT = ['#d6a07a', '#a8704c', '#7e4e34', '#5a3424'];
const OAK = ['#f8d8a0', '#e0a866', '#b87c44', '#8a5630'];
const LEATH = ['#c48a6a', '#9a6248', '#744432', '#523020'];
const BRASS = ['#fff4c0', '#f2c858', '#c89434', '#8e6422'];
const SAILC = ['#fffdf4', '#f2ead6', '#d8ccb0'];
const IRIS = ['#d8f2ff', '#8ccaf6', '#4a8ee0', '#2a56aa', '#1c3a7a'];
const LASH = '#3a2c54';
const WIND = ['#ffffff', '#e2f0ff', '#a8c8f0', '#7ea2d8'];

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
function chaikin(pts, n = 2, open = false) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    const L = open ? q.length - 1 : q.length;
    if (open) o.push(q[0]);
    for (let i = 0; i < L; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    if (open) o.push(q[q.length - 1]);
    q = o;
  }
  return q;
}
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}
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
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);

// ---------- Her head ----------
const HO = [1.0, -17];
const HS = 1.62;
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

// ---------- Her face (every part eased) ----------
// lid (closed eyes only), shut (which closed shape), wink (her near eye alone), sq (one eye squinted to
// the spyglass, her near one), bt/by (brows' tilt and raise; bf her far brow's own extra lift), mw/ms/mo
// (mouth width, smile, openness), fg (the fang), bl (blush), sm (small irises), pf (cheeks puffed).
const F0 = { lid: 0, shut: 'happy', wink: 0, sq: 0, bt: 0, by: 0.2, bf: 0, mw: 1, ms: 0.4, mo: 0, fg: 0, bl: 0.45, sm: 0, pf: 0 };
const FACES = {
  calm: { ...F0, bt: 0.05, bf: 0.25, ms: 0.45 },
  grin: { ...F0, bt: -0.1, by: 0.6, mw: 1.2, ms: 1, mo: 0.45, fg: 1, bl: 0.7 },
  laugh: { ...F0, lid: 1, shut: 'happy', bt: -0.25, by: 0.8, mw: 1.15, ms: 0.9, mo: 0.9, fg: 1, bl: 0.85 },
  proud: { ...F0, lid: 1, shut: 'happy', bt: 0.15, by: 0.55, mw: 1.05, ms: 0.85, fg: 0.6, bl: 0.6 },
  smug: { ...F0, wink: 1, bt: 0.3, by: 0.35, bf: 0.5, mw: 1, ms: 0.75, mo: 0.05, fg: 0.8, bl: 0.55 },
  focus: { ...F0, bt: 0.5, by: -0.15, mw: 0.85, ms: 0.15, bl: 0.4, sm: 0.1 },
  squint: { ...F0, sq: 1, bt: 0.4, by: 0.1, bf: 0.6, mw: 0.85, ms: 0.3, mo: 0.05, bl: 0.4 },
  fierce: { ...F0, bt: 0.95, by: -0.45, mw: 1.1, ms: -0.1, mo: 0.35, fg: 1, bl: 0.5, sm: 0.15 },
  shout: { ...F0, bt: 0.85, by: 0.25, mw: 1.25, ms: 0.3, mo: 1.15, fg: 1, bl: 0.7, sm: 0.25 },
  puff: { ...F0, bt: 0.3, by: 0.3, mw: 0.35, ms: 0, mo: 0.22, bl: 0.9, pf: 1 },
  startled: { ...F0, bt: -0.3, by: 1.15, mw: 0.6, ms: 0, mo: 0.6, bl: 0.6, sm: 0.6 },
  hurt: { ...F0, lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, mw: 0.9, ms: -0.55, mo: 0.5, bl: 0.7 },
  dizzy: { ...F0, lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, mw: 0.8, ms: -0.2, mo: 0.4, bl: 0.5 },
  sad: { ...F0, bt: -0.95, by: 0.3, mw: 0.8, ms: -0.6, bl: 0.4, sm: 0.15 },
  worried: { ...F0, bt: -0.8, by: 0.5, mw: 0.8, ms: -0.3, mo: 0.15, bl: 0.5, sm: 0.1 },
  cross: { ...F0, bt: 0.95, by: -0.4, mw: 0.8, ms: -0.45, bl: 0.45, sm: 0.1, pf: 0.35 },
  sleepy: { ...F0, lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, mw: 0.6, ms: 0.15, mo: 0.1, bl: 0.5 },
  talk: { ...F0, bt: 0.1, by: 0.4, mw: 0.95, ms: 0.4, mo: 0.4, bl: 0.5 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.7, 0.1, 0.8], [1.15, 0.4, 0.55], [0.95, 0.3, 0.25], [0.75, 0.2, 0], [0.85, 0.2, 0.6]];
const EYE = { w: 3.7, h: 4.4 };

function closedLine(ctx, a, x, y, side, s, t) {
  const { w, h } = EYE;
  pen(ctx, tone(a, LASH), 0.95);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy') {
    ctx.moveTo(x - w, y + 1.2);
    ctx.quadraticCurveTo(x, y - h * 0.95, x + w, y + 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + side * w, y + 1.2);
    ctx.quadraticCurveTo(x + side * (w + 0.8), y + 0.6, x + side * (w + 1.1), y - 0.2);
    ctx.stroke();
    return;
  }
  if (s === 'sleep') {
    ctx.moveTo(x - w, y + 0.6);
    ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y + 0.4);
    ctx.quadraticCurveTo(x + side * (w + 0.8), y + 0.1, x + side * (w + 1.1), y - 0.7);
  } else if (s === 'squeeze') {
    ctx.moveTo(x + side * w, y - 1.8);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.1, x - side * w * 0.9, y + 0.6);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 1.1, x + side * w, y + 2.6);
  } else {
    for (let i = 0; i <= 26; i++) {
      const an = (i / 26) * TAU * 2 + t * 4 * side;
      const r = (i / 26) * w * 0.9;
      const p = [x + Math.cos(an) * r, y + 0.6 + Math.sin(an) * r];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
  }
  ctx.stroke();
}
// The eye's white: a top nearly level that lifts to the outer corner, a round full bottom.
function eyeShape(ctx, x, y, side) {
  const { w, h } = EYE;
  const inner = [x - side * w, y - 0.4];
  const outer = [x + side * w * 1.02, y - h * 0.55];
  ctx.beginPath();
  ctx.moveTo(...inner);
  ctx.bezierCurveTo(x - side * w * 0.7, y - h * 0.98, x + side * w * 0.55, y - h * 1.02, ...outer);
  ctx.bezierCurveTo(x + side * w * 1.18, y + h * 0.5, x + side * w * 0.5, y + h * 1.08, x - side * w * 0.05, y + h * 1.0);
  ctx.bezierCurveTo(x - side * w * 0.7, y + h * 0.95, x - side * w * 1.08, y + h * 0.4, ...inner);
  ctx.closePath();
}
// A soft four-point compass glint.
function compass(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.16, y - r * 0.16, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.16, y + r * 0.16, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.16, y + r * 0.16, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.16, y - r * 0.16, x, y - r);
  ctx.fillStyle = col;
  ctx.fill();
}
function eye(ctx, a, x, y, side, f, look, uid) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + uid * 0.83) % 5.3, 4.8, 4.88, 4.96, 5.1) : 0;
  const wink = side > 0 ? f.wink : 0;
  const L = Math.max(f.lid, blink, wink);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = wink > 0.5 && f.lid < 0.5 ? { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } : blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0 } : f.shut;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      if (shutW[s] <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= shutW[s];
      closedLine(ctx, a, x, y, side, s, t);
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // a soft rose wash on the lid above the eye
  glow(ctx, x + side * 0.6, y - h * 1.05, 3.4, '#f6a8b4', 0.28);
  eyeShape(ctx, x, y, side);
  ctx.fillStyle = tone(a, '#fffdfb');
  ctx.fill();
  ctx.save();
  eyeShape(ctx, x, y, side);
  ctx.clip();
  const small = 1 - 0.32 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.55 + (look?.[1] ?? 0) * 0.6;
  const ir = [2.75 * small, 3.15 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[4]));
  g.addColorStop(0.32, tone(a, IRIS[3]));
  g.addColorStop(0.62, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[1]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#1c2c66', 0.8), 0.38);
  ctx.stroke();
  // the horizon: a bright band across the lower third of the iris, soft at its ends
  ctx.save();
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.clip();
  const hz = ctx.createLinearGradient(ix - ir[0], 0, ix + ir[0], 0);
  hz.addColorStop(0, 'rgba(216,242,255,0)');
  hz.addColorStop(0.5, 'rgba(216,242,255,0.75)');
  hz.addColorStop(1, 'rgba(216,242,255,0)');
  ctx.fillStyle = hz;
  ctx.fillRect(ix - ir[0], iy + ir[1] * 0.28, ir[0] * 2, ir[1] * 0.2);
  ctx.restore();
  ell(ctx, ix, iy + 0.1, 1.2 * small, 1.4 * small);
  ctx.fillStyle = tone(a, '#14204a');
  ctx.fill();
  // the lid's soft shadow across the top of the eye
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.25);
  sg.addColorStop(0, 'rgba(70,50,110,0.32)');
  sg.addColorStop(1, 'rgba(70,50,110,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.4, y - h * 1.2, w * 2.8, h * 0.95);
  // the glints: a compass star up at the back, a small round one low at the front
  compass(ctx, ix - side * 0.95, iy - 1.3 * small, 1.25, '#ffffff');
  ell(ctx, ix + side * 0.75, iy + 1.0 * small, 0.45, 0.42);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  // a lid coming down (a blink, sleepy, the squint): skin from the top, its edge a lash line
  const LL = Math.max(L, side > 0 ? f.sq * 0.55 : f.sq * 0.12);
  if (LL > 0.01) {
    ctx.fillStyle = tone(a, SKIN[1]);
    ctx.fillRect(x - w * 1.4, y - h * 1.3, w * 2.8, h * 2.5 * Math.min(1, LL / 0.93));
  }
  ctx.restore();
  if (LL > 0.04) {
    const ly = y - h * 1.3 + h * 2.5 * Math.min(1, LL / 0.93);
    const half = Math.sqrt(Math.max(0, 1 - ((ly - y - 0.2) / (h * 1.02)) ** 2)) * w;
    if (half > 0.3) {
      ctx.beginPath();
      ctx.moveTo(x - half, ly);
      ctx.quadraticCurveTo(x, ly + 0.55, x + half, ly);
      ctx.lineCap = 'round';
      pen(ctx, tone(a, LASH), 0.9);
      ctx.stroke();
    }
  }
  // the lash line along the top: thin at the inner corner, fuller toward a soft lifted wing, one flick
  const inner = [x - side * w, y - 0.4];
  const outer = [x + side * w * 1.02, y - h * 0.55];
  const top = (u) => {
    // (the white's top edge: nearly level, lifting to the outer corner)
    const k = u;
    const bx = (1 - k) ** 3 * inner[0] + 3 * (1 - k) ** 2 * k * (x - side * w * 0.7) + 3 * (1 - k) * k * k * (x + side * w * 0.55) + k ** 3 * outer[0];
    const by = (1 - k) ** 3 * inner[1] + 3 * (1 - k) ** 2 * k * (y - h * 0.98) + 3 * (1 - k) * k * k * (y - h * 1.02) + k ** 3 * outer[1];
    return [bx, by];
  };
  const N = 14;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(top(i / N));
  const wing = [outer[0] + side * 1.25, outer[1] - 0.85];
  ctx.beginPath();
  pts.forEach((p, i) => {
    const th = 0.2 + 0.62 * (i / N) ** 1.3;
    if (!i) ctx.moveTo(p[0], p[1] - th);
    else ctx.lineTo(p[0], p[1] - th);
  });
  ctx.quadraticCurveTo(outer[0] + side * 0.9, outer[1] - 1.0, wing[0], wing[1]);
  ctx.arc(wing[0] - side * 0.2, wing[1] + 0.25, 0.32, -Math.PI / 2, Math.PI / 2, side < 0);
  ctx.quadraticCurveTo(outer[0] + side * 0.4, outer[1] + 0.1, pts[N][0], pts[N][1] + 0.35);
  for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 0.12 + 0.3 * (i / N) ** 1.3);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  // one short rounded flick, leaning out
  const p = top(0.78);
  const an = side > 0 ? -1.15 : Math.PI + 1.15;
  ctx.beginPath();
  ctx.moveTo(p[0], p[1] - 0.4);
  ctx.quadraticCurveTo(p[0] + Math.cos(an) * 0.8, p[1] - 0.4 + Math.sin(an) * 0.8, p[0] + Math.cos(an + side * 0.45) * 1.35, p[1] - 0.4 + Math.sin(an + side * 0.45) * 1.35);
  pen(ctx, tone(a, LASH), 0.62);
  ctx.lineCap = 'round';
  ctx.stroke();
  // the lid crease above it
  pen(ctx, tone(a, SKIN[3], 0.4), 0.38);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.5, y - h * 1.22);
  ctx.quadraticCurveTo(x + side * w * 0.3, y - h * 1.36, x + side * w * 0.95, y - h * 1.0);
  ctx.stroke();
  ctx.restore();
}
// Round, full brows: even thickness, round at both ends, gently curved.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - (f.by + (side < 0 ? f.bf : 0)) * 1.0);
  // (cross = the inner end low; worried = the inner end high)
  ctx.rotate(-side * f.bt * 0.5);
  ctx.beginPath();
  ctx.moveTo(-1.7, 0.3);
  ctx.quadraticCurveTo(0, -0.75, 1.7, 0.2);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, HAIR[4]), 1.2);
  ctx.stroke();
  ctx.restore();
}
// Her wide mouth: one smooth stroke, the near corner lifting more (her smirk); opens to a soft D, the
// snaggle fang peeking at the near side.
function mouth(ctx, a, x, y, f) {
  const w = 3.3 * f.mw;
  const sm = f.ms;
  const lift = (s) => (s > 0 ? 1.25 : 0.75);
  if (f.mo > 0.08) {
    const o = f.mo;
    const smp = Math.max(0, sm);
    const cy = y - smp * 0.45;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x - w, cy - smp * 0.55);
      ctx.quadraticCurveTo(x, cy + 0.35 + Math.min(0, sm) * 1.6, x + w, cy - smp * 0.9);
      ctx.quadraticCurveTo(x + w * 0.2, cy + 1.2 + o * 3.3 + smp * 0.6 + Math.min(0, sm) * 1.2, x - w, cy - smp * 0.55);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = tone(a, '#8a2e44');
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    ell(ctx, x + 0.4, cy + 1.2 + o * 2.9 + smp * 0.5, w * 0.55, o * 1.15 + 0.2);
    ctx.fillStyle = tone(a, '#ff8a98');
    ctx.fill();
    // the snaggle fang, near side, from the top lip
    if (f.fg > 0.05) {
      ctx.globalAlpha *= clamp(f.fg, 0, 1);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.38, cy - 0.3);
      ctx.quadraticCurveTo(x + w * 0.5, cy + 1.3, x + w * 0.62, cy - 0.4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
    path();
    pen(ctx, tone(a, '#6a2236'), 0.48);
    ctx.stroke();
    return;
  }
  pen(ctx, tone(a, '#7a3244'), 0.6);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y - sm * lift(-1) * 0.8);
  ctx.quadraticCurveTo(x - w * 0.1, y + 0.6 + Math.min(0, sm) * -0.2 + Math.max(0, sm) * 0.35, x + w, y - sm * lift(1) * 1.0);
  ctx.stroke();
  // (the fang, a little point of white under the near side of the line, when she smirks)
  if (f.fg > 0.3 && sm > 0.3) {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.42, y + 0.35);
    ctx.quadraticCurveTo(x + w * 0.52, y + 1.4, x + w * 0.64, y + 0.25);
    ctx.fillStyle = tone(a, '#ffffff', clamp((f.fg - 0.3) / 0.4, 0, 1));
    ctx.fill();
  }
}
// Her face's outline: full cheeks at eye level, a straighter jaw tapering to a small soft chin.
function facePts(tx) {
  const c = tx * 0.55;
  return chaikin([[-12.6, -9], [-13.4, -2], [-13.2, 3.4], [-11.2, 8.6], [-6.6 + c, 12.4], [-1.8 + c, 13.9], [1.4 + c, 13.9], [5.6 + c, 12.2], [10.4 + tx * 0.3, 8.2], [12.8 + tx * 0.2, 3], [13.2, -2.4], [12.6, -9], [7, -15.6], [0, -16.6], [-7, -15.6]], 3);
}

// ---------- Her hair ----------
// One shared top-to-bottom light for every lock (so the hair reads as one head of hair).
function hairGrad(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, HAIR[1]);
  g.addColorStop(0.45, HAIR[2]);
  g.addColorStop(1, HAIR[3]);
  return g;
}
// The fringe's cut line (head units): an even blunt cut that follows the forehead's curve, just above
// her lashes in the middle, rising gently toward her temples.
const cutY = (x) => -4.3 - 0.016 * x * x;
// The fringe's sections: [left edge, right edge, depth offset]; neighbours differ in width and length.
const CLUMPS = [[-12.6, -6.6, -0.4], [-6.6, -0.6, 0.25], [-0.6, 6.4, 0.4], [6.4, 12.8, -0.3]];
function fringePts(tx) {
  const o = tx * 0.45;
  const pts = [[13.6 + o * 0.3, -12], [10, -16.4], [0, -17.6], [-10, -16.4], [-13.6 + o * 0.3, -12]];
  for (let i = 0; i < CLUMPS.length; i++) {
    const [x0, x1, d] = CLUMPS[i];
    const a0 = x0 + o;
    const a1 = x1 + o;
    // (each section's end trimmed flat with soft corners; a narrow split rising between sections)
    pts.push([a0 + 0.45, cutY(a0) + d - 0.5], [a0 + 1.0, cutY(a0) + d], [a1 - 1.0, cutY(a1) + d], [a1 - 0.45, cutY(a1) + d - 0.5]);
    if (i < CLUMPS.length - 1) pts.push([a1, cutY(a1) - 1.5 - (i % 2) * 0.5]);
  }
  return chaikin(pts, 2);
}
function sideLock(tx, s, sway) {
  const o = tx * (s > 0 ? 0.3 : 0.15);
  const x = s * 12.4 + o;
  return tube(chain([x - s * 0.6, -7], [Math.PI / 2 - s * 0.06 + sway, Math.PI / 2 + s * 0.12 + sway * 1.4, Math.PI / 2 + s * 0.32 + sway * 1.8], [6.4, 6.2, 4.6]), [5.6, 5.2, 4.4, 2.8], 0.5);
}
// The tricorn: a navy felt hat with its brim cocked up into three soft corners, wrapping her head.
function hatPts(tx) {
  const o = tx * 0.6;
  return chaikin([[-22, -17.6], [-20.6, -14.6], [-10 + o, -11], [3 + o, -8.6], [13 + o, -10.6], [21, -13.4], [22.6, -17.4], [21, -19.6], [17, -20.2], [12, -23.4], [5, -26.2], [-4, -26], [-12, -23.2], [-17, -20.6], [-21, -20]], 2);
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.glQ ?? {};
  const f = a.glF;
  const turn = q.turn ?? 0.45;
  const tx = turn * 2.4;
  const sway = q.lockSway ?? 0;
  // (the outline pass: her face, side locks, hat as one silhouette)
  if (mode === 'line') {
    poly(ctx, facePts(tx));
    paint(ctx, a, mode, SKIN[1]);
    for (const s of [-1, 1]) {
      poly(ctx, sideLock(tx, s, s * sway));
      paint(ctx, a, mode, HAIR[2], HAIR_INK);
    }
    poly(ctx, hatPts(tx));
    paint(ctx, a, mode, NAVY[2], NAVY[3]);
    WK = 1;
    ctx.restore();
    return;
  }
  if (!f) {
    WK = 1;
    ctx.restore();
    return;
  }
  // the face
  const fp = facePts(tx);
  poly(ctx, fp);
  ctx.fillStyle = tone(a, SKIN[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, fp);
  ctx.clip();
  glow(ctx, tx * 0.6 + 2, 1, 12, SKIN[0], 0.75);
  // soft shade where the hair frames it, along the jaw
  glow(ctx, -12, 4, 6, SKIN[2], 0.45);
  glow(ctx, 2 + tx * 0.5, 15, 7, SKIN[2], 0.3);
  // the fringe's soft shadow on her forehead, its edge copied down a little
  ctx.save();
  ctx.translate(0.3, 1.4);
  poly(ctx, fringePts(tx));
  ctx.fillStyle = tone(a, '#e8a8a4', 0.5);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  const ex = { far: -5.6 + tx * 0.7, near: 5.7 + tx };
  const ey = 3.3;
  // blush: a wide peachy flush with a rosier core and two neat curved strokes
  for (const [cx, s] of [[ex.far - 0.8, 0.8], [ex.near + 0.6, 1]]) {
    glow(ctx, cx, 8.2, 3.4, '#ff9a9e', (0.22 + 0.4 * f.bl) * s);
    ctx.save();
    pen(ctx, tone(a, '#ff8a96', (0.25 + 0.5 * f.bl) * s), 0.32);
    ctx.lineCap = 'round';
    for (const d of [-0.7, 0.6]) {
      ctx.beginPath();
      ctx.moveTo(cx + d - 0.4, 8.7);
      ctx.quadraticCurveTo(cx + d, 7.9, cx + d + 0.5, 7.8);
      ctx.stroke();
    }
    ctx.restore();
  }
  // puffed cheeks
  if (f.pf > 0.02) {
    const mx = 0.6 + tx * 0.8;
    for (const s of [-1, 1]) {
      ell(ctx, mx + s * 4.6, 9.8, 2.8 * f.pf, 2.4 * f.pf);
      ctx.fillStyle = tone(a, SKIN[1]);
      ctx.fill();
      glow(ctx, mx + s * 4.6 - 0.5, 8.6, 2 * f.pf, SKIN[0], 0.8);
      ell(ctx, mx + s * 4.6, 9.6, 1.6 * f.pf, 1 * f.pf);
      ctx.fillStyle = tone(a, '#ff9aa0', 0.4 * f.pf);
      ctx.fill();
    }
  }
  const uid = a.glUid ?? 0;
  eye(ctx, a, ex.far, ey, -1, f, q.look, uid);
  eye(ctx, a, ex.near, ey, 1, f, q.look, uid);
  // her nose: a soft shade and a tip light
  const nx = 0.9 + tx * 0.9;
  glow(ctx, nx - 0.4, 7.4, 1.2, SKIN[3], 0.35);
  ell(ctx, nx + 0.3, 7.0, 0.5, 0.35);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  // her round brows, just under the fringe (raised, they tuck under it)
  brow(ctx, a, ex.far - 0.3, ey - EYE.h - 1.7, -1, f);
  brow(ctx, a, ex.near + 0.3, ey - EYE.h - 1.8, 1, f);
  mouth(ctx, a, 0.7 + tx * 0.85, 10.7, f);
  // the hair over the head: the back of it behind the fringe (seen in the splits), the fringe, the locks
  const hg = hairGrad(ctx, -17, 6);
  ctx.save();
  poly(ctx, chaikin([[-13.8, -12], [-10, -17], [0, -18.2], [10, -17], [13.8, -12], [13, -4.6], [-13, -4.6]], 2));
  ctx.fillStyle = tone(a, HAIR[3]);
  ctx.fill();
  ctx.restore();
  const frp = fringePts(tx);
  poly(ctx, frp);
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.save();
  poly(ctx, frp);
  ctx.clip();
  // the hat's soft shadow across the top of the fringe
  const hs = ctx.createLinearGradient(0, -13.5, 0, -8.5);
  hs.addColorStop(0, 'rgba(69,72,130,0.7)');
  hs.addColorStop(1, 'rgba(69,72,130,0)');
  ctx.fillStyle = hs;
  ctx.fillRect(-16, -18, 32, 10);
  // the darkest tone on the overhang just above the eyes
  for (const [x0, x1] of CLUMPS) {
    const cx = (x0 + x1) / 2 + tx * 0.45;
    glow(ctx, cx, cutY(cx) + 0.2, (x1 - x0) * 0.55, HAIR[3], 0.5);
  }
  // each split carried up toward the crown as a fading line
  for (let i = 0; i < CLUMPS.length - 1; i++) {
    const x1 = CLUMPS[i][1] + tx * 0.45;
    const g2 = ctx.createLinearGradient(0, cutY(x1) - 1, 0, cutY(x1) - 7.5);
    g2.addColorStop(0, HAIR[4]);
    g2.addColorStop(1, 'rgba(98,102,176,0)');
    ctx.strokeStyle = g2;
    ctx.lineWidth = 0.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, cutY(x1) - 1.2);
    ctx.quadraticCurveTo(x1 * 0.85, cutY(x1) - 5, x1 * 0.6, cutY(x1) - 8.6);
    ctx.stroke();
  }
  // the shine: one soft band across the fringe, broken into slivers on the lit side
  {
    // one soft shine band across the fringe, fading at its ends
    const o = tx * 0.45;
    const sb = ctx.createLinearGradient(-10 + o, 0, 10 + o, 0);
    sb.addColorStop(0, 'rgba(236,238,255,0)');
    sb.addColorStop(0.3, 'rgba(236,238,255,0.5)');
    sb.addColorStop(0.7, 'rgba(236,238,255,0.5)');
    sb.addColorStop(1, 'rgba(236,238,255,0)');
    ctx.beginPath();
    ctx.moveTo(-10 + o, -7.2);
    ctx.quadraticCurveTo(o, -9.4, 10 + o, -7.2);
    ctx.quadraticCurveTo(o, -8.0, -10 + o, -7.2);
    ctx.fillStyle = sb;
    ctx.fill();
  }
  // a warm skin bounce along the cut's edge
  ctx.restore();
  // the side locks, outside her eyes: rounded tops tucked under the fringe, soft ends
  for (const s of [-1, 1]) {
    const lp = sideLock(tx, s, s * sway);
    poly(ctx, lp);
    ctx.fillStyle = hairGrad(ctx, -8, 12);
    ctx.fill();
    ctx.save();
    poly(ctx, lp);
    ctx.clip();
    glow(ctx, s * 12 + tx * 0.2, 9, 3.4, HAIR[3], 0.6);
    ctx.beginPath();
    ctx.moveTo(s * 12.6 + tx * 0.2, -4);
    ctx.quadraticCurveTo(s * 12.9, 2, s * 12.2 + tx * 0.2, 8);
    pen(ctx, 'rgba(240,242,255,0.3)', 0.9);
    ctx.stroke();
    ctx.restore();
  }
  // the tricorn over it all
  hat(ctx, a, tx, q);
  if (q.sweat >= 0) sweat(ctx, -13.4, -4 + q.sweat * 3, 1.1);
  WK = 1;
  ctx.restore();
}
function hat(ctx, a, tx, q) {
  const hp = hatPts(tx);
  const o = tx * 0.6;
  // the back of the cocked brim and the crown behind it: the deepest navy
  poly(ctx, hp);
  ctx.fillStyle = tone(a, NAVY[3]);
  ctx.fill();
  ctx.save();
  poly(ctx, hp);
  ctx.clip();
  // the crown's dome rising behind the front corner, catching the light
  const dome = chaikin([[-12, -17], [-11, -23.4], [-4, -26.4], [5, -26.6], [12, -23.6], [13, -17]], 2);
  poly(ctx, dome);
  const dg = ctx.createLinearGradient(0, -27, 0, -17);
  dg.addColorStop(0, tone(a, NAVY[1]));
  dg.addColorStop(1, tone(a, NAVY[2]));
  ctx.fillStyle = dg;
  ctx.fill();
  glow(ctx, -1 + tx * 0.4, -24, 5.4, NAVY[0], 0.5);
  // the two front panels of the brim, cocked up from the front corner to the side corners
  for (const [s, P] of [[-1, [[-22, -17.6], [3 + o, -13.4], [3 + o, -8.6], [-10 + o, -11], [-20.6, -14.6]]], [1, [[3 + o, -13.4], [22.6, -17.4], [21, -13.4], [13 + o, -10.6], [3 + o, -8.6]]]]) {
    const pts = chaikin(P, 2);
    poly(ctx, pts);
    const g = ctx.createLinearGradient(0, -18, 0, -8.6);
    g.addColorStop(0, tone(a, s > 0 ? NAVY[1] : NAVY[2]));
    g.addColorStop(1, tone(a, s > 0 ? NAVY[2] : NAVY[3]));
    ctx.fillStyle = g;
    ctx.fill();
    // the gold braid along its top edge
    ctx.beginPath();
    ctx.moveTo(...(s < 0 ? [-20.4, -17.4] : [3 + o, -13.2]));
    ctx.quadraticCurveTo(s < 0 ? -9 + o : 13 + o, s < 0 ? -15.4 : -15.6, ...(s < 0 ? [3 + o, -13.2] : [21.2, -17.2]));
    pen(ctx, tone(a, GOLD[1]), 1.0);
    ctx.lineCap = 'round';
    ctx.stroke();
    pen(ctx, tone(a, GOLD[0], 0.8), 0.3);
    ctx.stroke();
  }
  // the fold down the front corner, soft
  ctx.beginPath();
  ctx.moveTo(3 + o, -13);
  ctx.quadraticCurveTo(3.4 + o, -11, 3 + o, -9.2);
  pen(ctx, tone(a, NAVY[3], 0.7), 0.5);
  ctx.stroke();
  ctx.restore();
  // the cockade on the far panel: a red and cream rosette
  const cx = -13.2 + o * 0.4;
  const cy = -14.2;
  for (const [r, col] of [[2.9, COAT[2]], [2.1, CREAM[1]], [1.3, COAT[1]]]) {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const an = (i / 24) * TAU;
      const rr = r * (1 + 0.08 * Math.cos(an * 8));
      if (i) ctx.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
      else ctx.moveTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
  ell(ctx, cx, cy, 0.65, 0.65);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, cx - 0.5, cy - 0.7, 0.7, 0.4, -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
}
// The sky ribbon off her cockade, streaming in the wind (rig space, its root on her hat).
function hatRibbon(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  const root = headAt(a, D, [-13.6, -14]);
  const angs = q.ribbon ?? [2.2, 2.0, 1.9];
  const pts = chain(root, angs, [2.6, 2.6, 2.4]);
  const shape = tube(pts, [1.6, 1.8, 1.6, 1.1], 0.6);
  poly(ctx, shape);
  paint(ctx, a, mode, SKYB[1], SKYB[3]);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, shape);
    ctx.clip();
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - 0.3) : ctx.moveTo(p[0], p[1] - 0.3)));
    pen(ctx, tone(a, SKYB[0], 0.9), 0.5);
    ctx.stroke();
    ctx.restore();
  }
}
// Her ponytail: tied low at the back of her head with a windsock-striped ribbon, one long mass streaming
// out behind her, tapering to a soft round tip that curls gently (rig space, behind her body).
function ponytail(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  const root = headAt(a, D, [-11.6, 3.4]);
  const angs = q.tail ?? [2.0, 1.85, 1.75, 1.68, 1.62];
  const pts = chain(root, angs, [3.4, 3.6, 3.5, 3.2, 2.6]);
  const W = [4.2, 4.9, 4.7, 4.1, 3.2, 1.9];
  const shape = tube(pts, W, 0.55);
  poly(ctx, shape);
  paint(ctx, a, mode, HAIR[2], HAIR_INK);
  if (mode !== 'fill') return;
  ctx.save();
  poly(ctx, shape);
  ctx.clip();
  const ys = pts.map((p) => p[1]);
  const g = ctx.createLinearGradient(0, Math.min(...ys) - 3, 0, Math.max(...ys) + 3);
  g.addColorStop(0, HAIR[2]);
  g.addColorStop(1, HAIR[3]);
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, 400, 400);
  // a light down its upper side, a deeper shade under it, two soft inner lock lines that fade
  ctx.beginPath();
  pts.forEach((p, i) => {
    const an = angs[Math.min(i, angs.length - 1)];
    const o = [p[0] + Math.sin(an) * W[i] * 0.22, p[1] - Math.cos(an) * W[i] * 0.22];
    if (i) ctx.lineTo(...o);
    else ctx.moveTo(...o);
  });
  pen(ctx, tone(a, HAIR[1], 0.75), 1.1);
  ctx.lineCap = 'round';
  ctx.stroke();
  for (const k of [-0.18, 0.16]) {
    ctx.beginPath();
    pts.slice(1, -1).forEach((p, i) => {
      const an = angs[Math.min(i + 1, angs.length - 1)];
      const o = [p[0] - Math.sin(an) * W[i + 1] * k, p[1] + Math.cos(an) * W[i + 1] * k];
      if (i) ctx.lineTo(...o);
      else ctx.moveTo(...o);
    });
    pen(ctx, tone(a, HAIR[4], 0.35), 0.35);
    ctx.stroke();
  }
  ctx.restore();
  // the tie: a windsock ribbon wound round, stripes red and cream, two little tails
  const tr = [root[0] + Math.cos(angs[0]) * 1.4, root[1] + Math.sin(angs[0]) * 1.4];
  ctx.save();
  ctx.translate(...tr);
  ctx.rotate(angs[0]);
  ctx.beginPath();
  ctx.roundRect(-1.2, -3.2, 2.4, 6.4, 1.1);
  ctx.fillStyle = tone(a, COAT[1]);
  ctx.fill();
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fillRect(-0.3, -3.1, 0.6, 6.2);
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
// The coat's front: cream lapels turned back over the ivory waistcoat (brass buttons), a soft white
// jabot at her throat, gold edging down the coat's fronts; cut from her own outline.
function coatFront(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  const st = D.J.stern;
  const hp = D.J.hip;
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  // the coat's own light and shade
  const lt = C([st[0] + 5, st[1] + 7]);
  glow(ctx, lt[0], lt[1], 8, COAT[0], 0.45);
  const sh = T([hp[0] - 11, hp[1] - 4]);
  glow(ctx, sh[0], sh[1], 8, COAT[3], 0.4);
  // the waistcoat in the coat's opening, down to the sash
  const vest = chaikin([C([st[0] - 4.4, st[1] - 0.6]), C([st[0] + 6.2, st[1] - 0.6]), C([st[0] + 4.6, st[1] + 12]), T([hp[0] + 3.6, hp[1] - 6]), T([hp[0] - 2.4, hp[1] - 6]), C([st[0] - 3, st[1] + 12])], 1);
  poly(ctx, vest);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, vest);
  ctx.clip();
  const vs = C([st[0] - 3, st[1] + 9]);
  glow(ctx, vs[0], vs[1], 5, CREAM[2], 0.7);
  ctx.restore();
  for (const k of [0, 1, 2]) {
    const b = C([st[0] + 1.6 - k * 0.15, st[1] + 6 + k * 3.6]);
    ell(ctx, b[0], b[1], 0.55, 0.55);
    ctx.fillStyle = tone(a, GOLD[2]);
    ctx.fill();
    ell(ctx, b[0] - 0.15, b[1] - 0.18, 0.25, 0.2);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
  }
  // the lapels: cream, turned back, each a soft rounded shape; the near one a little wider (3/4 view)
  for (const [s, k] of [[-1, 0.85], [1, 1.1]]) {
    const x0 = st[0] + (s < 0 ? -4.4 : 6.2);
    const lap = chaikin([C([x0, st[1] - 0.8]), C([x0 + s * 4.6 * k, st[1] + 1.6]), C([x0 + s * 3.6 * k, st[1] + 6.4]), C([x0 - s * 0.6, st[1] + 11.4])], 2);
    poly(ctx, lap);
    ctx.fillStyle = tone(a, s > 0 ? CREAM[0] : CREAM[2]);
    ctx.fill();
    ctx.beginPath();
    lap.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    pen(ctx, tone(a, GOLD[2], 0.8), 0.32);
    ctx.stroke();
  }
  // gold edging down the coat's fronts, from the lapels to the sash
  for (const [x0, x1] of [[st[0] - 3.2, hp[0] - 2.6], [st[0] + 4.8, hp[0] + 3.8]]) {
    ctx.beginPath();
    ctx.moveTo(...C([x0, st[1] + 11.6]));
    ctx.lineTo(...T([x1, hp[1] - 6]));
    pen(ctx, tone(a, GOLD[1]), 0.55);
    ctx.stroke();
  }
  // the sash: sky blue, a windsock stripe of cream round it
  const sa = chaikin([T([hp[0] - 16, hp[1] - 9.4]), T([hp[0] + 16, hp[1] - 9.8]), T([hp[0] + 16, hp[1] - 4.6]), T([hp[0] - 16, hp[1] - 4.2])], 1);
  poly(ctx, sa);
  ctx.fillStyle = tone(a, SKYB[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, sa);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(...T([hp[0] - 16, hp[1] - 6.8]));
  ctx.lineTo(...T([hp[0] + 16, hp[1] - 7.2]));
  pen(ctx, tone(a, SAILC[0], 0.9), 0.9);
  ctx.stroke();
  const sl = T([hp[0] + 3, hp[1] - 8.4]);
  glow(ctx, sl[0], sl[1], 4, SKYB[0], 0.5);
  ctx.restore();
  ctx.restore();
}
// The jabot at her throat: one soft white shape with two gentle folds.
function jabot(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const pts = chaikin([[st[0] - 1.6, st[1] - 1.6], [st[0] + 3.6, st[1] - 1.6], [st[0] + 4.4, st[1] + 2], [st[0] + 3.4, st[1] + 5], [st[0] + 1, st[1] + 6], [st[0] - 1.4, st[1] + 4.4], [st[0] - 2.4, st[1] + 1.4]], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, '#ffffff', CREAM[3]);
  if (mode === 'fill') {
    for (const [x0, y0, x1, y1] of [[st[0] + 0.4, st[1] + 0.4, st[0] - 0.2, st[1] + 4.6], [st[0] + 2.2, st[1] + 0.6, st[0] + 2.4, st[1] + 4.8]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 + 0.5, (y0 + y1) / 2, x1, y1);
      pen(ctx, tone(a, CREAM[2], 0.8), 0.35);
      ctx.stroke();
    }
    ell(ctx, st[0] + 1.2, st[1] - 0.6, 0.9, 0.9);
    ctx.fillStyle = tone(a, SKYB[2]);
    ctx.fill();
  }
  ctx.restore();
}
// The sash's knot at her near hip, its two ends sprung.
function sashKnot(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'torso');
  const hp = D.J.hip;
  const k = [hp[0] + 11, hp[1] - 7];
  const sw = q.sash ?? [0, 0];
  for (let i = 1; i >= 0; i--) {
    const b = Math.PI / 2 - 0.15 + i * 0.4 + sw[i];
    const pts = chain([k[0] + i * 1.2, k[1] + 1], [b, b + 0.15 + sw[i] * 0.5], [4.6, 4.2]);
    const sh = tube(pts, [2.6, 3, 2.4], 0.5);
    poly(ctx, sh);
    paint(ctx, a, mode, i ? SKYB[2] : SKYB[1], SKYB[3]);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, sh);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(...pts[1]);
      ctx.lineTo(pts[1][0] + 3, pts[1][1]);
      ctx.moveTo(pts[1][0] - 3, pts[1][1]);
      ctx.lineTo(pts[1][0] + 3, pts[1][1]);
      pen(ctx, tone(a, SAILC[0], 0.85), 0.8);
      ctx.stroke();
      ctx.restore();
    }
  }
  ell(ctx, k[0], k[1], 2.4, 2);
  paint(ctx, a, mode, SKYB[1], SKYB[3]);
  if (mode === 'fill') {
    ell(ctx, k[0] - 0.6, k[1] - 0.6, 1, 0.6, -0.3);
    ctx.fillStyle = tone(a, SKYB[0], 0.8);
    ctx.fill();
  }
  ctx.restore();
}
// The coat's skirts: two front panels hung from her waist (open over her breeches), each on its own swing.
function frontSkirts(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  const sk = q.skirt ?? [0, 0];
  ctx.save();
  enter(ctx, a, D, 'torso');
  const hp = D.J.hip;
  for (const [i, s] of [[0, -1], [1, 1]]) {
    ctx.save();
    const root = [hp[0] + s * 6.8 + 1, hp[1] - 5.4];
    ctx.translate(...root);
    ctx.rotate(sk[i]);
    const wd = s < 0 ? 6.8 : 7.6;
    const pts = chaikin([[-s * 0.8, 0], [s * wd, -0.4], [s * (wd + 1.6), 13.2], [s * (wd * 0.55), 14.4], [s * 0.6, 13.6], [-s * 1.2, 1.6]], 2);
    poly(ctx, pts);
    paint(ctx, a, mode, s > 0 ? COAT[1] : COAT[2], COAT_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, pts);
      ctx.clip();
      glow(ctx, s * wd * 0.4, 3, 7, s > 0 ? COAT[0] : COAT[1], 0.4);
      glow(ctx, s * wd * 0.8, 14, 6, COAT[3], 0.4);
      // the cream facing turned back along its front edge
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, 0.4);
      ctx.quadraticCurveTo(s * 0.2, 8, s * 0.9, 15.2);
      pen(ctx, tone(a, CREAM[1]), 2.2);
      ctx.stroke();
      // a soft fold
      ctx.beginPath();
      ctx.moveTo(s * wd * 0.55, 1);
      ctx.quadraticCurveTo(s * wd * 0.7, 8, s * wd * 0.62, 15.4);
      pen(ctx, tone(a, COAT[3], 0.45), 0.7);
      ctx.stroke();
      // the gold hem
      ctx.beginPath();
      ctx.moveTo(s * 0.8, 15);
      ctx.quadraticCurveTo(s * wd * 0.6, 16.4, s * (wd + 2), 14.4);
      pen(ctx, tone(a, GOLD[1]), 0.7);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}
// The swallow tails behind her legs (behind everything), longer, each on its own swing.
function backTails(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  const bt = q.tails ?? [0, 0];
  for (const [i, dx] of [[0, -5], [1, 1]]) {
    const root = ptOf(a, D, 'torso', [D.J.hip[0] + dx - 4, D.J.hip[1] - 4]);
    const ang = Math.PI / 2 + 0.28 + bt[i];
    const pts = chain(root, [ang, ang + 0.18 + bt[i] * 0.6], [5.2, 4.6]);
    const sh = tube(pts, [5.2, 5.6, 3.6], 0.55);
    poly(ctx, sh);
    paint(ctx, a, mode, i ? COAT[2] : COAT[3], COAT_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, sh);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(pts[2][0] - 3, pts[2][1] - 1.2);
      ctx.quadraticCurveTo(pts[2][0], pts[2][1] + 0.6, pts[2][0] + 3, pts[2][1] - 1);
      pen(ctx, tone(a, GOLD[2]), 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
}
// Big turned-back cuffs, cream with gold edges, at the end of each sleeve (rig space).
function cuff(ctx, a, mode, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const W = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const an = Math.atan2(W[1] - E[1], W[0] - E[0]);
  const len = Math.hypot(W[0] - E[0], W[1] - E[1]);
  ctx.save();
  ctx.translate(...E);
  ctx.rotate(an);
  const near = k === 'N';
  const pts = chaikin([[len * 0.42, -2.3], [len * 0.98, -2.9], [len * 1.02, 2.9], [len * 0.42, 2.3]], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, near ? CREAM[1] : CREAM[2], CREAM[3]);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(len * 0.44, -2.2);
    ctx.lineTo(len * 0.44, 2.2);
    pen(ctx, tone(a, GOLD[1]), 0.55);
    ctx.stroke();
    ell(ctx, len * 0.7, 0, 0.45, 0.45);
    ctx.fillStyle = tone(a, GOLD[2]);
    ctx.fill();
  }
  ctx.restore();
}
// Her hands: a soft mitt with a thumb; `grip` closes it round a handle.
function hand(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.15, 1.15);
  const q = a.glQ ?? {};
  const open = q[`open${k}`] ?? 0;
  const near = k === 'N';
  smooth(ctx, [[-3, -2.6], [-0.8, -3.6], [2.2, -3.2], [3.4, -0.8], [3 + open * 1.2, 2.2 + open], [1, 3.6 + open * 0.8], [-1.6, 3.4], [-3.4, 1]]);
  paint(ctx, a, mode, near ? SKIN[1] : SKIN[2], INK, LW / 1.15);
  if (mode === 'fill') {
    // the thumb
    ell(ctx, -2.4, 0.4, 1.2, 1.6, 0.3);
    ctx.fillStyle = tone(a, near ? SKIN[1] : SKIN[2]);
    ctx.fill();
    pen(ctx, tone(a, SKIN[3], 0.45), 0.3);
    ctx.stroke();
    glow(ctx, 0.4, -1, 2.4, SKIN[0], 0.6);
  }
  ctx.restore();
}
// Her sea boots: a tall cocoa shaft from just under the knee with a folded cuff, the foot with a low heel.
function bootShaft(ctx, a, mode, D, k) {
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const A = ptOf(a, D, `shin${k}`, D.J[`ank${k}`]);
  const an = Math.atan2(A[1] - K[1], A[0] - K[0]);
  const len = Math.hypot(A[0] - K[0], A[1] - K[1]);
  const near = k === 'N';
  ctx.save();
  ctx.translate(...K);
  ctx.rotate(an - Math.PI / 2);
  const pts = chaikin([[-2.3, 0.6], [2.3, 0.6], [2.2, len + 0.6], [-2.2, len + 0.6]], 1);
  poly(ctx, pts);
  paint(ctx, a, mode, near ? BOOT[1] : BOOT[2], BOOT[3]);
  if (mode === 'fill') {
    glow(ctx, 0.8, len * 0.5, 2.4, BOOT[0], 0.45);
  }
  // the folded cuff, wider, rounded
  const cf = chaikin([[-3, -0.6], [3, -0.6], [2.8, 2.2], [-2.8, 2.2]], 2);
  poly(ctx, cf);
  paint(ctx, a, mode, near ? BOOT[0] : BOOT[1], BOOT[3]);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-2.6, 1.9);
    ctx.lineTo(2.6, 1.9);
    pen(ctx, tone(a, BOOT[2], 0.6), 0.35);
    ctx.stroke();
  }
  ctx.restore();
}
function bootFoot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 3.6, p[1] - 3.2], [p[0] + 1.8, p[1] - 3.4], [p[0] + 5.4, p[1] - 0.6], [p[0] + 7.6, p[1] + 1.6], [p[0] + 7.2, p[1] + 3.6], [p[0] - 3.8, p[1] + 3.6], [p[0] - 4.4, p[1] + 0.2]]);
  paint(ctx, a, mode, near ? BOOT[1] : BOOT[2], BOOT[3]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, BOOT[3], near ? 0.8 : 0.5);
    ctx.fillRect(p[0] - 3.8, p[1] + 2.6, 11, 1);
    ell(ctx, p[0] + 3, p[1] - 1.2, 2.4, 0.7, 0.3);
    ctx.fillStyle = tone(a, BOOT[0], near ? 0.6 : 0.3);
    ctx.fill();
  }
  ctx.restore();
}
// The Gale-Maker: honey-oak boards hinged at a fat brass nozzle, pleated leather between them (a sailcloth
// patch stitched on), brass studs; held by its handle. (x, y) the handle in her hand, `ang` its heading,
// `open` how far the boards are apart (0 shut, 1 full of air).
const BK = 0.68;
export function bellowsAt(ctx, a, mode, x, y, ang, open = 0.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(BK, BK);
  const op = clamp(open, 0, 1);
  const tilt = 0.06 + op * 0.3;
  const col = (c) => (a ? tone(a, c) : c);
  const line = (ink, wd = (LW * 1.2) / BK) => {
    pen(ctx, ink, wd);
    ctx.stroke();
  };
  // the hinge at the nozzle end
  const H = [16, 0];
  const board = (s) => chaikin([[2.4, 0], [3.4, s * 4.6], [7.6, s * 5.8], [12.4, s * 4.2], [16.4, s * 1.6], [16.4, 0]], 2);
  const rot = (pts, r) => pts.map(([px, py]) => {
    const dx = px - H[0];
    const dy = py - H[1];
    return [H[0] + dx * Math.cos(r) - dy * Math.sin(r), H[1] + dx * Math.sin(r) + dy * Math.cos(r)];
  });
  const top = rot(board(-1), tilt * 0.5);
  const bot = rot(board(1), -tilt * 0.5);
  // the leather between them: a soft pleated band from board edge to board edge
  const lp = [...top.filter((p, i) => i % 2 === 0), ...[...bot].reverse().filter((p, i) => i % 2 === 0)];
  // the nozzle: brass, round-tipped
  const noz = chaikin([[15.4, -1.8], [21.6, -0.9], [22.6, 0], [21.6, 0.9], [15.4, 1.8]], 2);
  if (mode === 'line') {
    poly(ctx, lp);
    line(LEATH[3]);
    poly(ctx, noz);
    line(BRASS[3]);
    for (const b of [top, bot]) {
      poly(ctx, b);
      line(OAK[3]);
    }
    // the handles
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(-1.6, s * (2.8 + op * 1.4) - 1.1, 5, 2.2, 1.1);
      line(OAK[3]);
    }
    ctx.restore();
    return;
  }
  poly(ctx, lp);
  ctx.fillStyle = col(LEATH[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, lp);
  ctx.clip();
  // the pleats: soft folds across the leather
  for (let i = 0; i < 4; i++) {
    const u = 4 + i * 3;
    ctx.beginPath();
    ctx.moveTo(u, -6);
    ctx.quadraticCurveTo(u + 1.2, 0, u, 6);
    pen(ctx, col(LEATH[2]), 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(u + 0.9, -6);
    ctx.quadraticCurveTo(u + 2.1, 0, u + 0.9, 6);
    pen(ctx, col(LEATH[0]), 0.4);
    ctx.stroke();
  }
  // the sailcloth patch, stitched on
  ctx.beginPath();
  ctx.roundRect(6.2, -1.4, 3.6, 2.8, 0.7);
  ctx.fillStyle = col(SAILC[1]);
  ctx.fill();
  ctx.setLineDash([0.5, 0.5]);
  pen(ctx, col(SAILC[2]), 0.3);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  // the nozzle
  poly(ctx, noz);
  const ng = ctx.createLinearGradient(0, -1.8, 0, 1.8);
  ng.addColorStop(0, BRASS[0]);
  ng.addColorStop(0.4, BRASS[1]);
  ng.addColorStop(1, BRASS[2]);
  ctx.fillStyle = ng;
  ctx.fill();
  ell(ctx, 16, 0, 1.2, 2.2);
  ctx.fillStyle = col(BRASS[2]);
  ctx.fill();
  // the boards: honey oak, grain, a gold swirl of wind on the top one, brass studs
  for (const [b, s] of [[bot, 1], [top, -1]]) {
    poly(ctx, b);
    const g = ctx.createLinearGradient(0, s * 6, 0, 0);
    g.addColorStop(0, col(s < 0 ? OAK[0] : OAK[2]));
    g.addColorStop(1, col(s < 0 ? OAK[1] : OAK[1]));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, b);
    ctx.clip();
    for (const k of [0.35, 0.65]) {
      ctx.beginPath();
      ctx.moveTo(3, s * 5 * k);
      ctx.quadraticCurveTo(9, s * 5.8 * k + 0.6, 16, s * 1.5 * k);
      pen(ctx, col(OAK[2]), 0.3);
      ctx.stroke();
    }
    ctx.restore();
    if (s < 0) {
      // the painted swirl of wind
      const c = b[Math.floor(b.length * 0.35)];
      ctx.beginPath();
      ctx.arc(c[0] + 0.4, c[1] + 2.6, 1.3, Math.PI * 0.2, Math.PI * 1.7);
      ctx.quadraticCurveTo(c[0] + 3, c[1] + 0.6, c[0] + 5, c[1] + 2.8);
      pen(ctx, col(GOLD[2]), 0.55);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    for (const u of [0.25, 0.7]) {
      const p = b[Math.floor(b.length * u)];
      ell(ctx, p[0] + 0.2, p[1] - s * 0.9, 0.5, 0.5);
      ctx.fillStyle = col(BRASS[1]);
      ctx.fill();
    }
  }
  // the handles
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(-1.6, s * (2.8 + op * 1.4) - 1.1, 5, 2.2, 1.1);
    ctx.fillStyle = col(OAK[1]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1, s * (2.8 + op * 1.4) - 0.5);
    ctx.lineTo(3, s * (2.8 + op * 1.4) - 0.5);
    pen(ctx, col(OAK[0]), 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
// The bellows in her near hand: its handle in her fist at `bwA` from her forearm.
function bellowsHand(a, D, q) {
  const h = ptOf(a, D, 'handN', D.J.handN);
  const w = ptOf(a, D, 'handN', D.J.wrN);
  const fa = Math.atan2(h[1] - w[1], h[0] - w[0]);
  return { h, ang: fa + (q.bwA ?? 0) };
}
function bellows(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  if ((q.holdB ?? 1) < 0.5 || q.bellowsBack > 0.5) return;
  const { h, ang } = bellowsHand(a, D, q);
  bellowsAt(ctx, a, mode, h[0], h[1], ang, q.open ?? 0.4);
}
// (where the nozzle's tip is now, rig space)
function nozzle(a, D, q) {
  const { h, ang } = bellowsHand(a, D, q);
  return [h[0] + Math.cos(ang) * 22.6 * BK, h[1] + Math.sin(ang) * 22.6 * BK];
}
// The spyglass in her far hand: brass, telescoped open by `ext`, a leather grip.
function spyglass(ctx, a, mode, D) {
  const q = a.glQ ?? {};
  if (!(q.glass > 0.02)) return;
  const h = ptOf(a, D, 'handF', D.J.handF);
  const ang = q.glassA ?? -0.2;
  const ext = clamp(q.glassExt ?? 0, 0, 1);
  ctx.save();
  ctx.translate(...h);
  ctx.rotate(ang);
  ctx.globalAlpha *= clamp(q.glass * 3, 0, 1);
  const segs = [[-3.2, 1.35, LEATH[1]], [3.4 * ext, 1.1, BRASS[1]], [6.2 * ext, 0.85, BRASS[0]]];
  for (const [x0, r, c] of segs) {
    ctx.beginPath();
    ctx.roundRect(x0 - 1, -r, 4.6, r * 2, r * 0.6);
    if (mode === 'line') {
      pen(ctx, BRASS[3], LW * 1.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, c);
      ctx.fill();
    }
  }
  if (mode === 'fill') {
    ell(ctx, 6.2 * ext + 3.6, 0, 0.5, 0.85);
    ctx.fillStyle = 'rgba(200,236,255,0.9)';
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her act and her fight ----------
const SWINGS = ['bop', 'puff', 'kick'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.glN ?? 0) % SWINGS.length]);
// (ready: the bellows held up in front of her, both hands on it, nozzle forward)
const READY = { shN: -70, elN: -40, hwN: 0, shF: -60, elF: -70, hwF: 10 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'calm', look: [0.45, 0], turn: 0.45, sweat: -1, fx: null, bwA: 0.9, holdB: 1, open: 0.35, openN: 0, openF: 0, glass: 0, glassExt: 0, glassA: -0.2, mirror: 0, finger: 0 };
  a.glQ = q;
  a.glUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const bw = (v, k = 1) => {
    q.bwA = mix(q.bwA, v, clamp(k, 0, 1));
  };
  const opn = (v, k = 1) => {
    q.open = mix(q.open, v, clamp(k, 0, 1));
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.5);
  const cineMood = m.cine?.mood;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.25;
  // ----- her casts (world/skywhale.js) and her swings at the tank -----
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.glCastT0 !== cast.t0) {
    st.glCastT0 = cast.t0;
    st.glMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.45);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.glWindAt ?? -9) < 0.25)) {
    st.glN = (st.glN ?? m.uid ?? 0) + 1;
    st.glMove = pickSwing(m, st);
  }
  if (winding) st.glWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.glMove : winding || struck ? (st.glMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv);
  if (busy) st.glFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.glFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;

  // Standing: weight on her back leg, the bellows hanging from her near hand by its handle, nozzle
  // down by her boot; her far hand on her hip; chin up, the cocky half smile.
  go({ shN: -14 + breath * 1.2, elN: -22, hwN: 6, shF: 24, elF: -96, hwF: -20, tilt: -1.5, chest: -1.8 + breath * 0.5, head: -2.5 + Math.sin(t * 0.5) * 1.1, pelvis: 2 }, 1);
  bw(1.3);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    // (a swagger: the bellows carried up on her shoulder, her far arm swinging)
    go({ shN: -138, elN: -100, hwN: 10, shF: 10, elF: -40 }, walkW);
    add({ shN: Math.sin(u * TAU) * 4, shF: -Math.sin(u * TAU) * 16, tilt: 3, head: -1, chest: Math.sin(u * TAU * 2) * 1.2 }, walkW);
    bw(2.6, walkW);
    q.turn = mix(q.turn, 0.62, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 4, drop: 0.07, head: 2 }, 0.85 * freeK);
    bw(0.05, 0.85 * freeK);
    say('focus');
    q.turn = 0.62;
  }
  if (fighting && !st.glHunt) st.glBangAt = now;
  if (!fighting && st.glHunt && alive) st.glLostAt = now;
  st.glHunt = fighting;
  q.bang = now - (st.glBangAt ?? -9);
  q.huh = now - (st.glLostAt ?? -9);
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // the bellows swung up onto her shoulder, a laugh: "Ha!"
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shN: -140, elN: -100, hwN: 10, head: -6, tilt: -3, shF: 26, elF: -100 }, k);
    bw(2.6, k);
    say('laugh', k);
    q.fx = { kind: 'ha', u: gloat };
  }
  if (!alive) {
    st.glDeadAt ??= now;
    // sat down hard on the deck, the bellows dropped, her hat knocked over one ear
    go({ drop: 0.82, tilt: -8, head: 12, shN: 34, elN: -30, shF: 40, elF: -24, fxN: 0.5, fxF: 0.2 });
    bw(1.6);
    q.mood = 'dizzy';
    q.turn = 0.3;
    q.fx = { kind: 'beaten', u: now - st.glDeadAt };
  } else st.glDeadAt = undefined;

  if (alive && mv) {
    const snap = s >= 0 ? sstep(s / 0.12) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    const perf = cast ? sstep(ct / 0.35) : s >= 0 ? rel : 0;
    if (mv === 'bop') {
      // Bellows Bop: up over her head (boards behind), then brought down boards first
      go({ shN: -168, elN: -28, shF: -150, elF: -40, tilt: -8, head: -4, chest: -4 }, wu);
      bw(0.4, wu);
      go({ shN: -62, elN: -10, shF: -58, elF: -12, tilt: 14, head: 6, drop: 0.1, x: 0.03 }, hitK);
      bw(0.1, hitK);
      opn(0, hitK);
      say(hitK > 0.2 ? 'fierce' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'bop', u: s };
    } else if (mv === 'puff') {
      // Puff!: the nozzle drawn back by her hip, then jabbed forward and squeezed shut
      go({ shN: 10, elN: -80, shF: -20, elF: -90, tilt: -6, head: -2, turnC: -0.25 }, wu);
      bw(-0.2, wu);
      opn(1, wu);
      go({ shN: -82, elN: -4, shF: -78, elF: -20, tilt: 10, head: 2, x: 0.04, turnC: 0.25 }, hitK);
      bw(-0.05, hitK);
      opn(0, snap);
      say(hitK > 0.2 ? 'puff' : 'focus');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'puff', u: s };
    } else if (mv === 'kick') {
      // Boarding Kick: a hop back, the near knee up; then the boot shot out sideways, the bellows flung
      // out behind for balance
      go({ tilt: -8, head: -4, shN: 30, elN: -40, shF: -60, elF: -60, lift: 0.03, fxN: 0.15, fyN: -0.38 }, wu);
      go({ tilt: -16, head: -2, shN: 50, elN: -20, shF: -100, elF: -30, x: 0.05, fxN: 0.8, fyN: -0.42 }, hitK);
      bw(1.6, Math.max(wu, hitK));
      say(hitK > 0.2 ? 'grin' : 'fierce');
      if (s >= 0 && s < 0.45) q.fx = { kind: 'kick', u: s };
    } else if (mv === 'blank') {
      // Point Blank Puff: braced low, both hands on the boards, pumped full... then one huge squeeze
      const fill = sstep(cu / 0.8);
      const pump = Math.sin(now * 8) * (1 - wu) * perf;
      go({ ...READY, shN: -80 + pump * 6, elN: -30, shF: -74 - pump * 10, elF: -50 + pump * 12, tilt: 6, drop: 0.14, head: 3, pelvis: 4 }, Math.max(perf * (1 - hitK), wu));
      bw(0, Math.max(perf, wu));
      opn(0.25 + 0.75 * fill, perf);
      go({ shN: -86, elN: -6, shF: -84, elF: -10, tilt: 14, drop: 0.08, head: 4, x: 0.05 }, hitK);
      opn(0, hitK);
      say(hitK > 0.2 ? 'shout' : 'puff');
      q.charge = perf * (1 - hitK);
      if (s >= 0 && s < 0.7) q.fx = { kind: 'blast', u: s };
    } else if (mv === 'volley') {
      // Cloudball Volley: the bellows swung up like a sword, a look up at the rigging; "FIRE!"
      go({ shN: -160, elN: -14, hwN: 10, shF: 30, elF: -100, tilt: -8, head: -10, chest: -4 }, perf * (1 - hitK * 0.5));
      bw(0.2, perf);
      go({ shN: -110, elN: -10, shF: -40, elF: -30, tilt: 6, head: -2 }, hitK);
      q.look = [0.4, -1.1];
      say(hitK > 0.2 || cu > 0.6 ? 'shout' : 'grin');
      if (cast && perf > 0.3 && cu > 0.55) q.fx = { kind: 'fire', u: ct - cast.dur * 0.55 };
    } else if (mv === 'haul') {
      // All Hands Haul!: the bellows tucked under her arm, hauling a rope down hand over hand
      const pull = Math.sin(now * 6.5);
      q.holdB = 0;
      q.bellowsBack = 1;
      q.rope = 1;
      go({ shN: -150 + pull * 30, elN: -40 - pull * 20, shF: -150 - pull * 30, elF: -40 + pull * 20, tilt: -10, drop: 0.12, head: -8 }, Math.max(perf * (1 - hitK), wu));
      go({ shN: -60, elN: -60, shF: -70, elF: -60, tilt: 8, drop: 0.16, head: 4 }, hitK);
      q.openN = 0;
      say(hitK > 0.2 ? 'shout' : 'fierce');
      q.look = [0.2, -1];
    } else if (mv === 'down') {
      // Downdraft: up on her toes, the bellows aimed straight down at the deck, pumped hard
      const pump = Math.abs(Math.sin(now * 9));
      go({ shN: -40, elN: -70, shF: -50, elF: -80, tilt: 10, head: 10, lift: 0.04, toeN: 16, toeF: 14 }, Math.max(perf * (1 - hitK), wu));
      bw(1.9, Math.max(perf, wu));
      opn(0.3 + 0.6 * pump * (1 - wu), perf);
      go({ shN: -20, elN: -40, shF: -30, elF: -60, tilt: 16, drop: 0.12, head: 12 }, hitK);
      opn(0, hitK);
      say(hitK > 0.2 ? 'shout' : 'puff');
      if (perf > 0.2) q.fx = { kind: 'down', u: ct };
    } else if (mv === 'blow') {
      // Blow Me Down!: one hand holding her hat on, the bellows heaved back and squeezed with everything
      go({ shN: 30, elN: -90, hwN: -10, shF: -150, elF: -110, hwF: 20, tilt: -12, head: -8, chest: -6, drop: 0.06 }, Math.max(perf * (1 - hitK), wu));
      bw(-0.6, Math.max(perf, wu));
      opn(sstep(cu / 0.7), perf);
      go({ shN: -90, elN: -6, shF: -150, elF: -110, tilt: 12, head: 2, x: 0.04, drop: 0.1 }, hitK);
      bw(-0.05, hitK);
      opn(0, hitK);
      say(hitK > 0.2 ? 'shout' : 'fierce');
      q.charge = perf * (1 - hitK);
      if (s >= 0 && s < 0.9) q.fx = { kind: 'blow', u: s };
    } else if (mv === 'gale') {
      // Full Gale: pumping out to one side, spun on her heel (a clean mirror flip), then the other
      const half = cu > 0.5 ? 1 : 0;
      const pump = Math.abs(Math.sin(now * 8));
      go({ ...READY, shN: -88, elN: -8, shF: -80, elF: -24, tilt: 6, drop: 0.08, head: 2 }, perf);
      bw(0, perf);
      opn(0.3 + 0.6 * pump, perf * (1 - hitK));
      q.mirror = cast ? (cu > 0.48 && cu < 0.52 ? 0.5 : half) : 0;
      say(hitK > 0.2 ? 'shout' : 'puff');
      if (perf > 0.2) q.fx = { kind: 'gust', u: ct };
    } else if (mv === 'shift') {
      // Wind Shift: a licked finger up, a point down the deck where the wind will come from, a pump
      const lick = win(cu, 0.02, 0.1, 0.3, 0.38);
      const point = win(cu, 0.36, 0.45, 0.72, 0.8);
      go({ shF: -150, elF: -60, hwF: 10, head: -4 }, lick * perf);
      q.finger = Math.max(lick, point);
      go({ shF: -95, elF: -6, hwF: 0, head: 0, tilt: -2 }, point * perf);
      go({ ...READY, tilt: 6, drop: 0.08 }, Math.max(win(cu, 0.78, 0.86, 1, 1.1), wu));
      go({ shN: -86, elN: -6, shF: -84, elF: -10, tilt: 12, x: 0.03 }, hitK);
      bw(0, perf);
      opn(sstep((cu - 0.8) / 0.2), perf * (1 - hitK));
      say(lick > 0.3 ? 'squint' : point > 0.3 ? 'grin' : hitK > 0.2 ? 'shout' : 'focus');
      q.look = point > 0.3 ? [1.2, 0] : [0.2, -1];
      if (point > 0.3) q.fx = { kind: 'point', u: ct };
    }
  }
  if (alive) {
    if (hurt && !mv) {
      const k = win(hurtU, 0, 0.07, 0.18, 0.5);
      go({ tilt: -8, head: -12, x: -0.02, ...READY }, k);
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // a phase moment (m.phaseAt): Squall (a boot up, the bellows high: "SAILS UP!"), Full Gale (her hat
    // held on, a mad grin: "BLOW ME DOWN!")
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.8 && !mv) {
      const k = win(pu, 0, 0.25, 1.4, 1.8);
      if ((m.mech?.phase ?? 1) >= 3) {
        go({ tilt: -10, head: -10, chest: -6, shN: -150, elN: -20, shF: -150, elF: -110, hwF: 20, drop: 0.04 }, k);
        bw(0.3, k);
        say('grin', k);
        q.fx = { kind: 'roar', u: pu };
      } else {
        go({ shN: -165, elN: -10, shF: 20, elF: -90, tilt: -6, head: -8, fxN: 0.3, fyN: -0.2, lift: 0.02 }, k);
        bw(0.3, k);
        say('shout', k);
        q.fx = { kind: 'sails', u: pu };
      }
    }
    // ----- her entrance's acts -----
    if (act && actU >= 0) {
      const d = act.dur ?? 1;
      const ka = win(actU, 0, 0.2, d - 0.1, d + 0.3);
      if (act.move === 'pump' && actU < d + 0.3) {
        // becalmed: the bellows pumped up at the limp sails, puffing harder than the bellows
        const beat = (actU % 0.9) / 0.9;
        const sq = Math.sin(beat * TAU);
        go({ shN: -130 + sq * 10, elN: -40, shF: -110 - sq * 14, elF: -70 + sq * 20, tilt: -10, head: -12, drop: 0.05 + Math.max(0, sq) * 0.04 }, ka);
        bw(-0.4, ka);
        opn(0.5 + 0.45 * sq, ka);
        say(actU > d * 0.6 ? 'puff' : 'focus', ka);
        q.look = [0.3, -1.2];
        if (sq < -0.6) q.fx = { kind: 'puffs', u: beat };
      } else if (act.move === 'spin' && actU < d + 0.3) {
        const u = clamp(actU / d, 0, 1);
        q.mirror = u > 0.5 ? 1 : 0;
        go({ tilt: 4, lift: 0.03 * Math.sin(Math.PI * u), shN: -60, elN: -30 }, ka);
        say(u > 0.5 ? 'grin' : 'startled', ka);
      } else if (act.move === 'swagger' && actU < d + 0.3) {
        go({ shN: -140, elN: -100, hwN: 10, shF: 24, elF: -96, hwF: -20, tilt: -4, head: -5, pelvis: 4 }, ka);
        bw(2.6, ka);
        say('smug', ka);
      } else if (act.move === 'gust' && actU < d + 0.3) {
        // the entrance's parting shot: the bellows levelled, pumped full, then one great squeeze at you
        const u = actU;
        const fill = win(u, 0, 0.12, 0.38, 0.46);
        const sq = sstep((u - 0.4) / 0.1) * (1 - sstep((u - d + 0.1) / 0.3));
        go({ ...READY, shN: -80, elN: -30, shF: -74, elF: -50, tilt: 6, drop: 0.14, head: 3 }, fill);
        bw(0, Math.max(fill, sq));
        opn(1, fill);
        go({ shN: -86, elN: -6, shF: -84, elF: -10, tilt: 14, drop: 0.08, head: 4, x: 0.05 }, sq);
        opn(0, sq);
        say(sq > 0.3 ? 'shout' : 'puff', 1);
        if (u > 0.4) q.fx = { kind: 'blast', u: u - 0.4 };
      } else if (act.move === 'windup') {
        go({ drop: 0.16, tilt: 10, ...READY, shN: -150, elN: -40 }, ka);
        bw(0.3, ka);
        opn(1, ka);
        say('fierce', ka);
      } else if (act.move === 'sway') {
        go({ tilt: Math.sin(actU * (act.speed ?? 3.5)) * 6, shN: -120, elN: -60, head: -4 }, ka);
        say('grin', ka);
      }
    }
    // her idle act: only when calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.glCalm = mix(st.glCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.glCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, bw, opn, q, sstep(st.glCalm), t, now, st);
    if (cineMood && !mv) q.mood = { angry: 'fierce', happy: 'grin', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !mv) {
      if (!cineMood) q.mood = q.mood === 'calm' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'glTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.calm;
  const f = (st.glF ??= { ...FACES.calm, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'wink', 'sq', 'bt', 'by', 'bf', 'mw', 'ms', 'mo', 'fg', 'bl', 'sm', 'pf']) f[k] = mix(f[k], tgt[k], k === 'lid' || k === 'wink' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.glF = f;
  // the bellows' angle on a stiff, just-damped spring (a whole-turn gap unwound first, never spun back)
  {
    let x = st.glBwX ?? q.bwA;
    while (q.bwA - x > Math.PI) x += TAU;
    while (x - q.bwA > Math.PI) x -= TAU;
    st.glBwX = x;
    st.glBw = st.glBw ?? { x, v: 0 };
    st.glBw.x = x;
    q.bwA = spring(st, 'glBw', q.bwA, 300, 34, dt);
    st.glBwX = q.bwA;
  }
  q.open = clamp(spring(st, 'glOpen', q.open, 260, 26, dt), 0, 1);
  q.glassExt = spring(st, 'glExt', q.glassExt, 200, 24, dt);
  q.glass = spring(st, 'glGlass', q.glass, 200, 26, dt);
  // a spin's turn: the picture mirrored at its middle beat
  st.glMirror = q.mirror > 0.5;
  // springs: ponytail, hat ribbon, coat-tails, skirts, sash ends, side locks
  const kick = (st.glLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.glLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.glLast = out.head;
  st.glLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const tiltR = ((out.tilt ?? 0) * Math.PI) / 180;
  // (the breeze up here: always a little wind from the front, stronger when she blows or swaggers)
  const breeze = 0.12 + 0.05 * Math.sin(t * 0.9) + walkW * 0.18 + (q.charge ?? 0) * 0.2;
  q.tail = [0, 1, 2, 3, 4].map((i) => spring(st, `pt${i}`, [2.05, 1.92, 1.8, 1.72, 1.66][i] + breeze * (0.45 + i * 0.2) - tiltR * 0.4 + Math.sin(t * 1.3 - i * 0.6) * (0.05 + i * 0.02) + step * 0.05, 70 - i * 8, 7.5, dt, kick * 0.01));
  q.ribbon = [0, 1, 2].map((i) => spring(st, `rb${i}`, 2.15 + breeze * 1.2 - i * 0.12 + Math.sin(t * 2.2 - i * 0.9) * (0.1 + i * 0.05) - tiltR * 0.3, 80 - i * 10, 7, dt, kick * 0.012));
  q.tails = [0, 1].map((i) => clamp(spring(st, `ct${i}`, breeze * 0.9 + walkW * 0.25 + step * 0.12 - tiltR * 0.5 + Math.sin(t * 1.1 + i * 2) * 0.04, 90 - i * 10, 9, dt, kick * 0.01), -0.3, 0.9));
  q.skirt = [0, 1].map((i) => clamp(spring(st, `sk${i}`, (i ? 1 : -1) * 0.02 - tiltR * 0.45 + step * 0.06 * (i ? 1 : -1) + breeze * 0.15, 120, 13, dt, kick * 0.006), -0.3, 0.3));
  q.sash = [0, 1].map((i) => clamp(spring(st, `sh${i}`, breeze * 0.6 - tiltR * 0.5 + walkW * 0.2 + Math.sin(t * 1.6 + i * 2) * 0.06, 90 - i * 10, 8, dt, kick * 0.012), -0.4, 1.1));
  q.lockSway = clamp(spring(st, 'lock', -tiltR * 0.15 + Math.sin(t * 1.2) * 0.02, 160, 15, dt, kick * 0.004), -0.12, 0.12);
}
const PIECES = [
  { name: 'spyglass', t0: 0.4, len: 7.4 },
  { name: 'windcheck', t0: 8.2, len: 6.8 },
  { name: 'fill', t0: 15.4, len: 6.8 },
  { name: 'shanty', t0: 22.6, len: 7 },
];
function idleAct(m, a, out, go, add, bw, opn, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.glPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.glPiece = cur.name;
      else return;
    }
  } else {
    st.glPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'spyglass') {
    // the spyglass out of her coat, telescoped open; a long look one way, then the other; "!" at
    // something; snapped shut and tucked away
    const k = win(u, 0, 0.6, 6.8, 7.4);
    const out1 = win(u, 0.3, 0.8, 6.4, 6.9);
    const lookA = win(u, 1.1, 1.5, 3.0, 3.4);
    const lookB = win(u, 3.4, 3.8, 5.0, 5.3);
    const spot = win(u, 5.0, 5.2, 5.9, 6.2);
    go({ shF: -95, elF: -95, hwF: 10, head: -2 }, out1 * k * w);
    go({ shF: -120, elF: -80, head: -6, tilt: -2 }, lookA * k * w);
    go({ shF: -110, elF: -86, head: -2, neckR: -4, tilt: 1 }, lookB * k * w);
    go({ head: -8, tilt: -4, lift: 0.02 }, spot * k * w);
    q.glass = out1 * k * w;
    q.glassExt = win(u, 0.9, 1.2, 5.9, 6.3);
    q.glassA = -0.55 - 0.35 * lookB;
    if (at(k)) {
      q.mood = spot > 0.4 ? 'startled' : lookA + lookB > 0.4 ? 'squint' : 'calm';
      q.look = lookB > 0.4 ? [1.2, -0.6] : [0.9, -0.4];
      if (spot > 0.4) q.fx = { kind: 'spot', u: u - 5.0 };
    }
  } else if (cur.name === 'windcheck') {
    // a finger licked and held up: nothing; a cross look; then a puff of her own bellows at her hat
    // ribbon so it streams heroically, and a pose
    const k = win(u, 0, 0.5, 6.3, 6.8);
    const lick = win(u, 0.3, 0.6, 1.0, 1.2);
    const hold = win(u, 1.2, 1.5, 2.6, 2.9);
    const huff = win(u, 2.8, 3.0, 3.6, 3.9);
    const puff = win(u, 3.8, 4.1, 4.9, 5.2);
    const posek = win(u, 5.1, 5.4, 6.2, 6.6);
    go({ shF: -140, elF: -150, hwF: 10, head: 4 }, lick * k * w);
    go({ shF: -170, elF: -10, hwF: 0, head: -8, tilt: -2 }, hold * k * w);
    q.finger = Math.max(lick, hold);
    go({ shF: 24, elF: -96, hwF: -20, head: 4, tilt: 2 }, huff * k * w);
    go({ shN: -150, elN: -80, hwN: 30, head: -4, tilt: -3 }, puff * k * w);
    bw(-2.4, puff * k * w);
    opn(0.2 + 0.6 * Math.abs(Math.sin(u * 9)), puff * k * w);
    go({ shN: -120, elN: -100, hwN: 10, shF: -40, elF: -30, chest: -5, head: -6, tilt: -4, pelvis: 5 }, posek * k * w);
    bw(2.6, posek * k * w);
    if (at(k)) {
      q.mood = posek > 0.4 ? 'proud' : puff > 0.4 ? 'focus' : huff > 0.4 ? 'cross' : hold > 0.4 ? 'squint' : 'calm';
      q.look = hold > 0.4 ? [0.2, -1.2] : [0.5, 0];
      if (puff > 0.4) {
        q.fx = { kind: 'selfpuff', u: u - 3.9 };
        q.charge = 2.5;
      }
    }
  } else if (cur.name === 'fill') {
    // the bellows pumped up at the sky, puff after puff, a little cloud drifting off each; a cheer
    const k = win(u, 0, 0.5, 6.3, 6.8);
    const pump = win(u, 0.4, 0.8, 4.6, 5.0);
    const beat = ((u - 0.8) % 1.0) / 1.0;
    const sq = Math.sin(beat * TAU);
    go({ shN: -130 + sq * 8, elN: -40, shF: -110 - sq * 12, elF: -70 + sq * 18, tilt: -9, head: -10, drop: 0.03 + Math.max(0, sq) * 0.03 }, pump * k * w);
    bw(-0.4, pump * k * w);
    opn(0.5 + 0.45 * sq, pump * k * w);
    const cheer = win(u, 4.9, 5.2, 6.2, 6.6);
    go({ shN: -165, elN: -10, shF: -150, elF: -30, head: -8, tilt: -4, lift: 0.02 }, cheer * k * w);
    if (at(k)) {
      q.mood = cheer > 0.4 ? 'laugh' : 'puff';
      q.look = [0.3, -1.2];
      q.charge = pump;
      if (pump > 0.4 && sq < -0.5) q.fx = { kind: 'puffs', u: beat };
    }
  } else {
    // a sea shanty: the bellows over her shoulder, heel and toe stamped in time, swaying, a hummed note
    const k = win(u, 0, 0.5, 6.5, 7);
    const beat = (u * 1.6) % 2;
    const sway = Math.sin(u * Math.PI * 1.6);
    go({ shN: -140, elN: -100, hwN: 10, shF: 24, elF: -96, hwF: -20, tilt: sway * 3, head: sway * 4 - 2, pelvis: sway * 4 }, k * w);
    bw(2.6, k * w);
    const stamp = beat < 1 ? Math.sin(Math.PI * beat) : 0;
    add({ fxN: 0.12 * stamp, fyN: -0.1 * stamp }, k * w);
    if (at(k)) {
      q.mood = Math.floor(u / 1.25) % 3 === 2 ? 'laugh' : 'proud';
      if (Math.floor(u * 1.6) % 2 === 0 && beat < 0.4) q.fx = { kind: 'note', u: beat, i: Math.floor(u * 1.6) };
    }
  }
}

// ---------- Effects ----------
// A soft cloud puff: overlapping round lobes, white with a blue-grey underside.
function cloud(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const lobes = [[-0.55, 0.15, 0.55], [0, -0.2, 0.7], [0.55, 0.1, 0.55], [0.2, 0.3, 0.5], [-0.25, 0.3, 0.5]];
  ctx.beginPath();
  for (const [dx, dy, rr] of lobes) {
    ctx.moveTo(x + dx * r + rr * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
  }
  pen(ctx, WIND[3], Math.max(0.5, r * 0.14));
  ctx.stroke();
  ctx.fillStyle = WIND[1];
  ctx.fill();
  ell(ctx, x - r * 0.15, y - r * 0.25, r * 0.55, r * 0.35);
  ctx.fillStyle = WIND[0];
  ctx.fill();
  ctx.restore();
}
// A wind swoosh: a soft tapering curve with round ends, white with a blue rim.
function swoosh(ctx, x, y, len, curl, w, al, dir = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + dir * len * 0.6, y - curl, x + dir * len, y + curl * 0.3);
  pen(ctx, WIND[2], w + 0.9);
  ctx.stroke();
  pen(ctx, WIND[0], w);
  ctx.stroke();
  ctx.restore();
}
// Her life-ring marks: a "!" or "?" in a little red-and-white life ring, popping in with a bounce.
function ringMark(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  ell(ctx, 0, 0, 5.4, 5.4);
  pen(ctx, COAT_INK, 1.4);
  ctx.stroke();
  ctx.fillStyle = '#fffdf6';
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 4.4, i * (TAU / 4) + 0.3, i * (TAU / 4) + 0.3 + 0.7);
    pen(ctx, COAT[1], 1.8);
    ctx.stroke();
  }
  ell(ctx, 0, 0, 3, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? COAT[3] : NAVY[2];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.2);
    ctx.lineTo(0, 0.5);
    ctx.stroke();
    ell(ctx, 0, 1.8, 0.6, 0.6);
    ctx.fill();
  } else {
    ctx.moveTo(-1.1, -1.2);
    ctx.quadraticCurveTo(-0.9, -2.5, 0.3, -2.4);
    ctx.quadraticCurveTo(1.5, -2.2, 1, -1);
    ctx.quadraticCurveTo(0.2, -0.4, 0.15, 0.5);
    ctx.stroke();
    ell(ctx, 0.15, 1.8, 0.6, 0.6);
    ctx.fill();
  }
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) {
    backTails(ctx, a, mode, D);
    ponytail(ctx, a, mode, D);
    // (the bellows tucked behind her, under her arm, while both hands haul)
    const q = a.glQ ?? {};
    if (q.bellowsBack > 0.5) {
      const p = ptOf(a, D, 'chest', [D.J.stern[0] - 9, D.J.stern[1] + 10]);
      bellowsAt(ctx, a, mode, p[0], p[1], -0.4, 0.1);
    }
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.glQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -28]);
  const hd = headAt(a, D, [0.5, 0]);
  const mo = headAt(a, D, [1.6, 10]);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  const nz = nozzle(a, D, q);
  const { ang } = bellowsHand(a, D, q);
  // the licked finger held up (a little glint of wet on its tip)
  if (q.finger > 0.4) sparkle(ctx, hF[0] + 1, hF[1] - 3.4, 1.2 * q.finger, 0.8, '#e2f4ff');
  // the haul's rope, down from the rigging through both hands
  if (q.rope > 0.5) {
    const hN = ptOf(a, D, 'handN', D.J.handN);
    ctx.beginPath();
    ctx.moveTo(hN[0] + 1, -140);
    ctx.quadraticCurveTo((hN[0] + hF[0]) / 2 + 2, Math.min(hN[1], hF[1]) - 20, hN[0], hN[1]);
    ctx.quadraticCurveTo((hN[0] + hF[0]) / 2, Math.max(hN[1], hF[1]) + 6, hF[0], hF[1]);
    ctx.quadraticCurveTo(hF[0] - 4, hF[1] + 12, hF[0] - 2, 0);
    pen(ctx, '#a07a52', 1.6);
    ctx.stroke();
    pen(ctx, '#e8c89a', 0.8);
    ctx.stroke();
  }
  if (q.charge > 0.05 && q.charge <= 1.5) glow(ctx, nz[0], nz[1], 6 + 2 * Math.sin(t * 10), '#e2f0ff', 0.4 * q.charge);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) ringMark(ctx, crown[0] + 6, crown[1] - 5, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) ringMark(ctx, crown[0] + 6, crown[1] - 5, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  const fwd = [Math.cos(ang), Math.sin(ang)];
  if (X.kind === 'bop') {
    const v = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI / 2 + (i - 2) * 0.55;
      sparkle(ctx, nz[0] - fwd[0] * 6 + Math.cos(an) * (2 + v * 10), nz[1] - fwd[1] * 6 + Math.sin(an) * (2 + v * 8), 1.5 * (1 - v * 0.6), 1 - v, '#fff6d0');
    }
    cloud(ctx, nz[0] - fwd[0] * 6, Math.min(-1, nz[1] + 2), 2 + v * 4, 0.7 * (1 - v));
  } else if (X.kind === 'puff' || X.kind === 'blast' || X.kind === 'selfpuff') {
    const big = X.kind === 'blast' ? 1.7 : X.kind === 'selfpuff' ? 0.6 : 1;
    const v = clamp(u / (0.6 * big), 0, 1);
    for (let i = 0; i < 3; i++) {
      const d = (3 + v * 16 * big) * (0.6 + i * 0.25);
      cloud(ctx, nz[0] + fwd[0] * d, nz[1] + fwd[1] * d + (i - 1) * 2.4 * v, (1.6 + v * 3.4) * big * (1 - i * 0.15), 0.9 * (1 - v));
    }
    for (let i = 0; i < 3; i++) swoosh(ctx, nz[0] + fwd[0] * 2, nz[1] + fwd[1] * 2 + (i - 1) * 3, (8 + v * 14) * big, (i - 1) * 2, 0.7, 0.8 * (1 - v), Math.sign(fwd[0]) || 1);
    if (X.kind === 'blast' && u < 1) cue(ctx, 'FWOOMP!', nz[0] + 14, nz[1] - 14, 7, fl, -0.1, NAVY[3]);
  } else if (X.kind === 'kick') {
    const v = clamp(u / 0.4, 0, 1);
    const foot = ptOf(a, D, 'footN', D.J.toeN);
    for (let i = 0; i < 3; i++) swoosh(ctx, foot[0] - 8 + v * 4, foot[1] - 3 + i * 3, 10, -2 + i * 2, 0.6, 0.8 * (1 - v));
    sparkle(ctx, foot[0] + 3, foot[1] - 2, 2.2 * (1 - v), 1 - v, '#fff6d0');
  } else if (X.kind === 'fire') {
    if (u < 1.1) cue(ctx, 'FIRE!', hd[0] + 18, hd[1] - 30, 8, fl, -0.12, COAT[3]);
  } else if (X.kind === 'down') {
    const ph = (u * 2.2) % 1;
    for (let i = 0; i < 4; i++) {
      const sd = i % 2 ? 1 : -1;
      swoosh(ctx, nz[0] + sd * (2 + ph * 10 + i * 2), -1.5, 6 + ph * 6, -1, 0.6, 0.7 * Math.sin(Math.PI * ph), sd);
    }
    cloud(ctx, nz[0], -2, 2 + ph * 3, 0.6 * (1 - ph));
  } else if (X.kind === 'blow') {
    const v = clamp(u / 0.9, 0, 1);
    for (let i = 0; i < 6; i++) swoosh(ctx, nz[0] + fwd[0] * 4 + v * 20 * fwd[0], nz[1] - 10 + i * 4, 14 + v * 18, (i % 2 ? 2 : -2), 0.8, 0.85 * (1 - v), Math.sign(fwd[0]) || 1);
    cloud(ctx, nz[0] + fwd[0] * (6 + v * 20), nz[1], 3 + v * 6, 0.85 * (1 - v));
    if (u < 1) cue(ctx, 'BLOW ME DOWN!', hd[0] + 24, hd[1] - 30, 7, fl, -0.1, NAVY[3]);
  } else if (X.kind === 'gust') {
    const ph = (u * 2) % 1;
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) swoosh(ctx, sd * (6 + ph * 22), -16 - i * 8 + Math.sin(ph * 6 + i) * 2, 12, -2, 0.7, 0.6 * Math.sin(Math.PI * ph), sd);
  } else if (X.kind === 'point') {
    if (u < 3) cue(ctx, 'THAT way!', hd[0] + 22, hd[1] - 28, 6, fl, -0.08, NAVY[3]);
  } else if (X.kind === 'spot') {
    if (u < 1.1) cue(ctx, 'Land ho!', hd[0] + 20, hd[1] - 30, 6, fl, -0.1, NAVY[3]);
  } else if (X.kind === 'puffs') {
    // a little cloud drifting up off the nozzle each pump
    cloud(ctx, nz[0] + fwd[0] * (3 + u * 10), nz[1] + fwd[1] * (3 + u * 10) - u * 6, 1.5 + u * 2.4, 0.85 * (1 - u));
  } else if (X.kind === 'note') {
    note(ctx, hd[0] + 14 + X.u * 6, hd[1] - 20 - X.u * 10, 1.4, (X.i % 2 ? 0.2 : -0.2), 0.9 * (1 - X.u * 1.6), '#9ed2f6');
  } else if (X.kind === 'ha') {
    const v = clamp(u / 1.3, 0, 1);
    if (u < 1.3) cue(ctx, 'Ha!', hd[0] + 18, hd[1] - 28 - v * 4, 8, fl, -0.1, COAT[3]);
  } else if (X.kind === 'sails') {
    if (u < 1.5) cue(ctx, 'SAILS UP!', hd[0] + 24, hd[1] - 30, 7, fl, -0.1, COAT[3]);
    for (let i = 0; i < 3; i++) swoosh(ctx, -10 + i * 4, -50 - i * 6, 18, -3, 0.7, 0.6 * Math.sin(Math.PI * clamp(u / 1.5, 0, 1)));
  } else if (X.kind === 'roar') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 6; i++) swoosh(ctx, nz[0] + Math.cos(i) * (4 + v * 10), nz[1] - 6 + Math.sin(i * 2) * (3 + v * 6), 10, -2, 0.7, 1 - v, i % 2 ? 1 : -1);
    if (u < 1.4) cue(ctx, 'FULL GALE!', hd[0] + 24, hd[1] - 32, 7, fl, -0.1, COAT[3]);
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 8 - v * 6 + i * 4, hd[1] - 12 - v * 5 - i * 2.4, 1.5 * (1 - v), 1 - v, '#fff6d0');
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 8, 9, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), '#f4f8ff', '#b8c8e8');
  }
}

const DRESS = {
  id: 'gale',
  // (the skin is her coat, sleeves and all; her breeches the legs' own skin; her own hands and neck; her
  // boots drawn over her feet)
  skin: {
    lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: COAT_INK, guides: false, out: LW,
    parts: {
      leg: { lt: CREAM[0], base: CREAM[1], sh: CREAM[2], deep: CREAM[3] },
      hand: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      foot: { lt: BOOT[0], base: BOOT[1], sh: BOOT[2], deep: BOOT[3] },
      neck: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      coatFront(ctx, a, mode, D);
      frontSkirts(ctx, a, mode, D);
      sashKnot(ctx, a, mode, D);
    },
    neckSkin: (ctx, a, mode, S, D) => jabot(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => {
      cuff(ctx, a, mode, D, 'F');
      spyglass(ctx, a, mode, D);
    },
    handFskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => bootShaft(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => bootShaft(ctx, a, mode, D, 'N'),
    footFskin: (ctx, a, mode, S, D) => bootFoot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => bootFoot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => {
      cuff(ctx, a, mode, D, 'N');
      bellows(ctx, a, mode, D);
    },
    handNskin: (ctx, a, mode, S, D) => hand(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('captain', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (a spin: the picture mirrored at its middle beat, never squashed)
  if (a.mo?.rig?.glMirror) ctx.scale(-1, 1);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own).
export const GALE_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 320, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GALE_SIZE = { w: 44, h: Math.round(R.H * BIG * 1.18), speed: Math.round(R.speed * BIG) };
