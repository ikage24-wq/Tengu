// The Barnacle Matriarch on screen (2026-11-27, redrawn from scratch: the Sky Whale's barnacle matriarch, her
// story, lines and role kept; world/skywhale.js her new fight). A grand old walrus dowager who has lived on
// the whale's back so long the barnacles took her for their mother, and she agreed: every barnacle on the
// whale is one of her children, and the young sea turtles who serve her (the Turtle Squires) wear her
// colours. Stout, slow, very proper, rather deaf to anything she doesn't care to hear. She moves on her own
// copy of the creature base (rig.js; body.js `walrus`: almost no neck, a deep barrel of a body, short thick
// legs on wide flipper feet, short thick arms), dressed here; her head, face, crown, gown, shawl, barnacles
// and fan drawn here from scratch (never the shared face, nothing of the hero's).
//   look    warm rosy-cocoa walrus hide, a cream muzzle of two plump whisker pads under a soft pink nose, a
//           few soft silver whiskers, two short rounded ivory tusks; a sea-teal velvet gown WORN (the base's
//           own body and sleeves, so it moves with her) with a cream lace stomacher and coral buttons, lace
//           cuffs at her wrists, a coral sash with a pearl brooch, two short ruffled tiers at her hips (each
//           swinging on its own) and a three-tier bustle behind (sprung); a cream lace capelet over her
//           shoulders, its hem in soft scallops; a pearl choker with one big pearl; a coral circlet with a
//           little conch and three pearls wrapping her head. Her signature: her children, five little pastel
//           barnacles living on her capelet, whose lids pop open so they can wave their tiny feathery fans
//           (proud, alarmed, or cheering her on). A scallop-shell fan in her far flipper.
//   eyes    her own "pearl eyes": round, a deep plum iris with a nacre sheen (a soft pink-to-aqua crescent)
//           across its top, a round pupil, a big round glint and a small one; a thick, neat lash line that
//           ends in one round curl at the outer corner (a dowager's lashes); fluffy round silver brows.
//   faces   calm (prim), pleased, proud, coo (doting on her children), haughty, focus, cross, scold (one brow
//           up), shout, startled, hurt, dizzy, sad, worried, drowsy, sleepy, sniff (nose up, eyes shut),
//           talking (vowel mouths); every change eased.
//   idle    a 30 s act in pieces: the fan (fanning herself grandly, a slow look round, "Hmph."); her
//           children (their lids pop open one by one and they wave; she counts them with a tap each, and
//           beams); the pearl (her choker's pearl polished with her flipper, a huff of breath, a sparkle);
//           the doze (her chin sinks, a little snore, she snorts awake, straightens her crown and looks
//           round as if nothing happened).
//   walk    a slow stately waddle, rocking side to side, the fan held up, her bustle swaying behind.
//   fight   between casts her swings at the tank in turn: Flipper Slap (her flipper drawn back high, then a
//           grand backhand), Fan Rap (the fan snapped shut and rapped down on your head), Belly Bump (a lean
//           back and a dignified bump). Her casts (m.castPose, world/skywhale.js): scold (A Proper Scolding:
//           a wagging flipper, then a slap on the tank), babies (Barnacle Babies: a shimmy that shakes her
//           children loose), cluster (Cluster, Children!: the fan pointed at one of you), undertow (both
//           flippers raised, then drawn down: the water rushes in), coral (Coral Bloom: a clap, coral
//           growing out round her), pearl (Find the Pearl: her pearl held up, then her flippers conducting
//           the shells round like a band, then a grand "voila"). Phase moments (m.phaseAt): Rising Tide
//           (flippers up, all her children open, "THE TIDE, CHILDREN!"), Spring Tide (the fan snapped
//           overhead, "SPRING TIDE!").
//   scenes  her entrance (skywhale_matriarch): 'fan' (fanning herself, her back to you), 'children' (her
//           barnacles pop open and point), 'windup' (the fan snapped shut and raised), 'splash' (a flipper
//           slapped down on the deck: a wave rolls out), 'sway'.
//   marks   all her own (`ownEmotes`): a "!" and a "?" in a little scallop shell, a "Hmph!" after landing a
//           hit, a sweat drop when low, dizzy sparkles when beaten (sat down, her crown askew).
// Every effect is drawn live in her own style: soft curling sea-green water and spray, round bubbles,
// little pastel shells, soft four-point sparkles (never specks).
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, sweat, cue, spring } from './fx.js';
import { zee } from './act.js';

const BIG = 2.4;
const LW = 1.6 / BIG;
// ---------- Her colours ----------
const INK = '#8a5660';
const HIDE = ['#fbe0d4', '#e8b0a0', '#c88a7c', '#9a6460'];
const MUZ = ['#fffaf2', '#fbeadc', '#ecd0bc'];
const SILVER = ['#ffffff', '#f2eef2', '#cfc6d2', '#9e94a8'];
const TUSK = ['#fffdf4', '#f6ecd6', '#dccaa6'];
const GOWN = ['#9ee4dc', '#58b8b0', '#3a9090', '#276a72'];
const GOWN_INK = '#2c6670';
const LACE = ['#fffdf8', '#f6efe4', '#e2d6c4', '#bcae98'];
const CORAL = ['#ffc4b4', '#ff8e86', '#e8646a', '#b44852'];
const PEARL = ['#ffffff', '#f4f0fa', '#dcd4ea', '#b4aac8'];
const GOLD = ['#fff4c4', '#f2cc66', '#c89a3c'];
const IRIS = ['#c8a0d8', '#8a5aa8', '#5a3678', '#3a2054'];
const LASH = '#3e2a3a';
const BARN = [['#fff6ea', '#f0dcc4', '#c8ae90'], ['#f4eaff', '#dccaf2', '#a890c8'], ['#ffeef0', '#f6d2d8', '#cc9aa6']];
const WATER = ['#f2fffc', '#c4f0e8', '#86d4cc', '#4aa6a4'];

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
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);

// ---------- Her head ----------
const HO = [1.4, -14.4];
const HS = 1.45;
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
// lid (closed eyes only), shut (which closed shape), bt/by (brows' tilt and raise; bq her near brow's own
// lift, for a scolding), mw/ms/mo (mouth width, smile, openness), bl (blush), sm (small irises), np (her
// nose and muzzle tipped up: a sniff).
const F0 = { lid: 0, lo: 0, shut: 'happy', bt: 0, by: 0.2, bq: 0, mw: 1, ms: 0.15, mo: 0, bl: 0.45, sm: 0, np: 0 };
const FACES = {
  calm: { ...F0 },
  pleased: { ...F0, by: 0.45, ms: 0.75, bl: 0.6 },
  proud: { ...F0, lid: 1, shut: 'happy', by: 0.55, ms: 0.85, bl: 0.7, np: 0.5 },
  coo: { ...F0, lid: 1, shut: 'happy', bt: -0.3, by: 0.7, ms: 0.9, mo: 0.25, bl: 0.95 },
  haughty: { ...F0, lo: 0.32, bt: 0.25, by: 0.6, ms: -0.05, bl: 0.4, np: 0.8 },
  focus: { ...F0, lo: 0.18, bt: 0.5, by: -0.1, ms: -0.1, bl: 0.4, sm: 0.1 },
  cross: { ...F0, lo: 0.28, bt: 0.95, by: -0.35, ms: -0.5, bl: 0.5, sm: 0.1 },
  scold: { ...F0, lo: 0.22, bt: 0.7, by: -0.2, bq: 1.2, ms: -0.35, mo: 0.35, bl: 0.5 },
  shout: { ...F0, bt: 0.85, by: 0.2, mw: 1.2, ms: 0.1, mo: 1.1, bl: 0.7, sm: 0.25 },
  startled: { ...F0, bt: -0.3, by: 1.1, mw: 0.7, ms: 0, mo: 0.6, bl: 0.6, sm: 0.6 },
  hurt: { ...F0, lid: 1, shut: 'squeeze', bt: -0.8, by: 0.2, ms: -0.5, mo: 0.45, bl: 0.7 },
  dizzy: { ...F0, lid: 1, shut: 'dizzy', bt: -0.5, by: 0.3, ms: -0.2, mo: 0.35, bl: 0.5 },
  sad: { ...F0, bt: -0.95, by: 0.3, ms: -0.55, bl: 0.4, sm: 0.15 },
  worried: { ...F0, bt: -0.8, by: 0.5, ms: -0.3, mo: 0.15, bl: 0.5, sm: 0.1 },
  drowsy: { ...F0, lid: 1, shut: 'sleep', bt: -0.2, by: -0.15, ms: 0, mo: 0.15, bl: 0.5 },
  sleepy: { ...F0, lid: 1, shut: 'sleep', bt: -0.2, by: -0.1, ms: 0.1, mo: 0.4, bl: 0.5 },
  sniff: { ...F0, lid: 1, shut: 'sniff', bt: 0.2, by: 0.7, ms: -0.1, bl: 0.4, np: 1 },
  talk: { ...F0, bt: 0.1, by: 0.4, ms: 0.3, mo: 0.4, bl: 0.5 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy', 'sniff'];
const VOWELS = [[0.7, 0.1, 0.8], [1.15, 0.3, 0.5], [0.95, 0.2, 0.25], [0.75, 0.1, 0], [0.85, 0.15, 0.6]];
const EYE = { w: 3.3, h: 3.5 };

function closedLine(ctx, a, x, y, side, s, t) {
  const { w, h } = EYE;
  pen(ctx, tone(a, LASH), 0.95);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (s === 'happy' || s === 'sniff') {
    // (a sniff: the lids lowered in a long proud line, the curl still on the end)
    const arc = s === 'sniff' ? -0.15 : 0.9;
    ctx.moveTo(x - w, y + 0.8);
    ctx.quadraticCurveTo(x, y - h * arc, x + w, y + 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + side * (w + 0.5), y + 0.2, 0.55, side > 0 ? Math.PI * 0.9 : Math.PI * 0.1, side > 0 ? Math.PI * 2.4 : -Math.PI * 1.4, side < 0);
    ctx.stroke();
    return;
  }
  if (s === 'sleep') {
    ctx.moveTo(x - w, y + 0.4);
    ctx.quadraticCurveTo(x, y + h * 0.55, x + w, y + 0.3);
    ctx.quadraticCurveTo(x + side * (w + 0.7), y, x + side * (w + 0.9), y - 0.7);
  } else if (s === 'squeeze') {
    ctx.moveTo(x + side * w, y - 1.6);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 0.1, x - side * w * 0.9, y + 0.5);
    ctx.quadraticCurveTo(x - side * w * 0.2, y + 1, x + side * w, y + 2.4);
  } else {
    for (let i = 0; i <= 26; i++) {
      const an = (i / 26) * TAU * 2 + t * 4 * side;
      const r = (i / 26) * w * 0.9;
      const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
  }
  ctx.stroke();
}
// Her round pearl eye.
function eye(ctx, a, x, y, side, f, look, uid) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + uid * 0.71) % 6.3, 5.8, 5.9, 5.98, 6.14) : 0;
  const L = Math.max(f.lid, blink, f.lo ?? 0);
  const closedW = sstep((L - 0.93) / 0.07);
  const shutW = blink > f.lid + 0.05 ? { happy: 0, sleep: 1, squeeze: 0, dizzy: 0, sniff: 0 } : f.shut;
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
  glow(ctx, x + side * 0.4, y - h * 1.1, 3.2, '#d8a8d8', 0.28);
  const shape = () => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, TAU);
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdfb');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.3 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.7;
  const iy = y + 0.3 + (look?.[1] ?? 0) * 0.5;
  const ir = [2.55 * small, 2.8 * small];
  const g = ctx.createLinearGradient(0, iy - ir[1], 0, iy + ir[1]);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.5, tone(a, IRIS[2]));
  g.addColorStop(1, tone(a, IRIS[1]));
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.fillStyle = g;
  ctx.fill();
  // the nacre sheen: a soft pink-to-aqua crescent across the iris's top
  ctx.save();
  ell(ctx, ix, iy, ir[0], ir[1]);
  ctx.clip();
  const ng = ctx.createLinearGradient(ix - ir[0], 0, ix + ir[0], 0);
  ng.addColorStop(0, 'rgba(255,190,220,0.75)');
  ng.addColorStop(1, 'rgba(170,240,236,0.75)');
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.4, ir[0] * 0.78, ir[1] * 0.7, 0, Math.PI * 1.1, Math.PI * 1.9);
  pen(ctx, ng, 0.75);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  ell(ctx, ix, iy + 0.2, 1.15 * small, 1.25 * small);
  ctx.fillStyle = tone(a, '#24122e');
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.3);
  sg.addColorStop(0, 'rgba(90,50,80,0.3)');
  sg.addColorStop(1, 'rgba(90,50,80,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.9);
  ell(ctx, ix - side * 0.85, iy - 1.05 * small, 0.95, 0.9);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + side * 0.7, iy + 1.0 * small, 0.4, 0.38);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  if (L > 0.01) {
    ctx.fillStyle = tone(a, HIDE[1]);
    ctx.fillRect(x - w * 1.3, y - h * 1.3, w * 2.6, h * 2.6 * Math.min(1, L / 0.93));
  }
  ctx.restore();
  if (L > 0.04) {
    const ly = y - h * 1.3 + h * 2.6 * Math.min(1, L / 0.93);
    const half = Math.sqrt(Math.max(0, 1 - ((ly - y) / h) ** 2)) * w;
    if (half > 0.3) {
      ctx.beginPath();
      ctx.moveTo(x - half, ly);
      ctx.quadraticCurveTo(x, ly + 0.5, x + half, ly);
      ctx.lineCap = 'round';
      pen(ctx, tone(a, LASH), 0.9);
      ctx.stroke();
    }
  }
  // the lash line: thick along the top, thin at the inner corner, ending in one round curl
  ctx.beginPath();
  ctx.ellipse(x, y, w + 0.15, h + 0.15, 0, side > 0 ? Math.PI * 1.1 : Math.PI * 1.9, side > 0 ? Math.PI * 1.98 : Math.PI * 1.02, side < 0);
  pen(ctx, tone(a, LASH), 0.95);
  ctx.lineCap = 'round';
  ctx.stroke();
  const ox = x + side * (w + 0.1);
  const oy = y - 0.6;
  ctx.beginPath();
  ctx.moveTo(ox - side * 0.2, oy + 0.1);
  ctx.quadraticCurveTo(ox + side * 1.2, oy - 0.6, ox + side * 1.4, oy - 1.6);
  ctx.arc(ox + side * 0.85, oy - 1.7, 0.55, 0, TAU * 0.75 * side, side < 0);
  pen(ctx, tone(a, LASH), 0.6);
  ctx.stroke();
  ctx.restore();
}
// Fluffy round silver brows: three soft overlapping puffs, a little raised.
function brow(ctx, a, x, y, side, f) {
  ctx.save();
  ctx.translate(x, y - (f.by + (side > 0 ? f.bq : 0)) * 1.0);
  ctx.rotate(-side * f.bt * 0.85);
  for (const pass of [0, 1]) {
    for (const [dx, dy, r] of [[-1.3, 0.3, 0.9], [0, -0.2, 1.05], [1.3, 0.2, 0.9]]) {
      ell(ctx, dx, dy, r * 1.15 + (pass ? 0 : 0.35), r * 0.8 + (pass ? 0 : 0.35));
      ctx.fillStyle = tone(a, pass ? SILVER[1] : SILVER[3]);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(-2, 0.9);
  ctx.quadraticCurveTo(0, 0.4, 2, 0.8);
  pen(ctx, tone(a, SILVER[3], 0.6), 0.35);
  ctx.stroke();
  ctx.restore();
}
// Her mouth, under her whisker pads between her tusks: a small prim line, or a soft round opening.
function mouth(ctx, a, x, y, f) {
  const w = 2.9 * f.mw;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.ellipse(x, y + o * 0.9, w * 0.9, 0.6 + o * 1.5, 0, 0, TAU);
    ctx.fillStyle = tone(a, '#8a3a4a');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + o * 1.9, w * 0.6, o * 0.8);
    ctx.fillStyle = tone(a, '#ff9aa6');
    ctx.fill();
    ctx.restore();
    return;
  }
  pen(ctx, tone(a, '#7a3a48'), 0.7);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y - f.ms * 0.6);
  ctx.quadraticCurveTo(x, y + 0.5 + f.ms * 1.1, x + w, y - f.ms * 0.75);
  ctx.stroke();
}
const SKULL = (tx) => chaikin([[-15, -3], [-13.4, -10], [-7, -14.4], [1, -15], [8, -13.8], [14, -9.4], [15.6, -2], [15.2, 6], [12 + tx * 0.3, 11.4], [4 + tx * 0.6, 14.2], [-3 + tx * 0.5, 14.2], [-11, 11.4], [-14.8, 6]], 3);
// Her coral circlet: a band round her head with little rounded coral branches, a conch at the front and
// three pearls (it wraps her head: its back half behind, drawn first).
function crown(ctx, a, mode, tx) {
  const o = tx * 0.6;
  const band = chaikin([[-13.6, -8.2], [-6 + o, -11.6], [2 + o, -12.2], [10 + o, -10.8], [14.2, -7.6], [14, -5.8], [9 + o, -8.8], [2 + o, -10], [-6 + o, -9.6], [-13.4, -6.4]], 2);
  const branches = [[-9 + o, -10.6, -0.45, 2.6], [-4 + o, -11.6, -0.15, 3], [7 + o, -11.4, 0.2, 3], [11.4, -9.6, 0.5, 2.4]];
  const shapes = branches.map(([x, y, an, L]) => {
    const tip = [x + Math.sin(an) * L, y - Math.cos(an) * L];
    const mid = [x + Math.sin(an) * L * 0.55, y - Math.cos(an) * L * 0.55];
    const twig = [mid[0] + Math.sin(an + 0.9) * L * 0.45, mid[1] - Math.cos(an + 0.9) * L * 0.45];
    return [tube([[x, y], mid, tip], [2.4, 2.2, 1.9], 0.7), tube([mid, twig], [1.7, 1.4], 0.7)];
  });
  for (const [s1, s2] of shapes) {
    poly(ctx, s1);
    paint(ctx, a, mode, CORAL[2], CORAL[3]);
    poly(ctx, s2);
    paint(ctx, a, mode, CORAL[2], CORAL[3]);
  }
  poly(ctx, band);
  paint(ctx, a, mode, CORAL[1], CORAL[3]);
  // the conch at the front: a soft spiral cone
  const cx = 2 + o;
  const cy = -13.6;
  const conch = chaikin([[cx - 3.2, cy + 2.4], [cx - 2.4, cy - 1.6], [cx, cy - 4], [cx + 2.6, cy - 1.4], [cx + 3.4, cy + 2.2], [cx, cy + 3.2]], 2);
  poly(ctx, conch);
  paint(ctx, a, mode, LACE[1], LACE[3]);
  if (mode !== 'fill') return;
  ctx.save();
  poly(ctx, band);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-13, -7.6);
  ctx.quadraticCurveTo(2 + o, -12.2, 14, -7);
  pen(ctx, tone(a, CORAL[0], 0.8), 0.5);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  poly(ctx, conch);
  ctx.clip();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 3 + i * 0.6, cy + 1.6 - i * 1.6);
    ctx.quadraticCurveTo(cx + 0.4, cy + 0.6 - i * 1.6, cx + 3 - i * 0.5, cy + 1.4 - i * 1.5);
    pen(ctx, tone(a, CORAL[1], 0.7), 0.45);
    ctx.stroke();
  }
  glow(ctx, cx - 0.8, cy - 0.6, 1.6, '#ffffff', 0.6);
  ctx.restore();
  for (const [px, py] of [[-7 + o, -9.4], [9.4 + o, -8.8], [12.6, -7]]) {
    ell(ctx, px, py, 0.95, 0.95);
    ctx.fillStyle = tone(a, PEARL[1]);
    ctx.fill();
    ell(ctx, px - 0.3, py - 0.35, 0.35, 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}
function head(ctx, a, mode, D) {
  ctx.save();
  headFrame(ctx, a, D);
  WK = 1 / HS;
  const q = a.maQ ?? {};
  const f = a.maF;
  const turn = q.turn ?? 0.4;
  const tx = turn * 2.2;
  const np = f?.np ?? 0;
  if (mode === 'line') {
    poly(ctx, SKULL(tx));
    paint(ctx, a, mode, HIDE[1]);
    crown(ctx, a, mode, tx);
    WK = 1;
    ctx.restore();
    return;
  }
  if (!f) {
    WK = 1;
    ctx.restore();
    return;
  }
  const sk = SKULL(tx);
  poly(ctx, sk);
  ctx.fillStyle = tone(a, HIDE[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, sk);
  ctx.clip();
  glow(ctx, tx * 0.6 + 1, -6, 12, HIDE[0], 0.8);
  glow(ctx, -13, 6, 8, HIDE[2], 0.5);
  glow(ctx, 2, 15, 8, HIDE[2], 0.35);
  // a few soft wrinkles of a grand old walrus over her brow
  for (const [y, w] of [[-6.6, 4], [-5.2, 3]]) {
    ctx.beginPath();
    ctx.moveTo(tx - w, y);
    ctx.quadraticCurveTo(tx, y - 0.6, tx + w, y);
    pen(ctx, tone(a, HIDE[2], 0.35), 0.35);
    ctx.stroke();
  }
  ctx.restore();
  crown(ctx, a, mode, tx);
  const ex = { far: -5.4 + tx * 0.7, near: 5.6 + tx };
  const ey = -1.4 - np * 0.6;
  // blush high on each cheek, outside her whisker pads
  for (const [cx, s] of [[ex.far - 1.8, 0.8], [ex.near + 1.8, 1]]) glow(ctx, cx, 3.6, 3, '#ff9aa6', (0.2 + 0.4 * f.bl) * s);
  const uid = a.maUid ?? 0;
  eye(ctx, a, ex.far, ey, -1, f, q.look, uid);
  eye(ctx, a, ex.near, ey, 1, f, q.look, uid);
  brow(ctx, a, ex.far - 0.2, ey - EYE.h - 1.6, -1, f);
  brow(ctx, a, ex.near + 0.2, ey - EYE.h - 1.7, 1, f);
  // the muzzle: two plump whisker pads under a soft pink nose (tipped up for a sniff)
  const mx = 0.8 + tx * 0.9;
  const my = 7.4 - np * 0.9;
  mouth(ctx, a, mx, my + 4.4, f);
  for (const s of [-1, 1]) {
    ell(ctx, mx + s * 3.5, my, 4.4, 3.7);
    ctx.fillStyle = tone(a, s > 0 ? MUZ[0] : MUZ[1]);
    ctx.fill();
  }
  for (const s of [-1, 1]) {
    glow(ctx, mx + s * 3.5, my + 1.8, 3.2, MUZ[2], 0.55);
    // three soft silver whiskers on each pad, sweeping out and down
    for (let i = 0; i < 3; i++) {
      const y0 = my - 0.8 + i * 1.3;
      ctx.beginPath();
      ctx.moveTo(mx + s * (5.4 + i * 0.3), y0);
      ctx.quadraticCurveTo(mx + s * (8 + i * 0.4), y0 + 0.2, mx + s * (9.6 + i * 0.2), y0 + 1 + i * 0.4);
      pen(ctx, tone(a, SILVER[2], 0.9), 0.35);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  // the seam between the pads, soft
  ctx.beginPath();
  ctx.moveTo(mx, my - 1.4);
  ctx.quadraticCurveTo(mx + 0.2, my + 1.2, mx, my + 3);
  pen(ctx, tone(a, MUZ[2], 0.8), 0.4);
  ctx.stroke();
  // the nose
  ctx.beginPath();
  ctx.moveTo(mx - 1.8, my - 3.2);
  ctx.quadraticCurveTo(mx, my - 4.2, mx + 1.8, my - 3.2);
  ctx.quadraticCurveTo(mx + 1.2, my - 1.4, mx, my - 1.2);
  ctx.quadraticCurveTo(mx - 1.2, my - 1.4, mx - 1.8, my - 3.2);
  ctx.fillStyle = tone(a, '#e88a96');
  ctx.fill();
  ell(ctx, mx - 0.5, my - 3, 0.6, 0.35, -0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill();
  // the tusks: short, rounded, ivory, curving gently in
  for (const s of [-1, 1]) {
    const t0 = [mx + s * 2.2, my + 2.6];
    const sh = tube([t0, [mx + s * 2.4, my + 5.6], [mx + s * 1.8, my + 8.4]], [1.9, 1.6, 1.1], 0.7);
    poly(ctx, sh);
    ctx.fillStyle = tone(a, TUSK[1]);
    ctx.fill();
    pen(ctx, tone(a, TUSK[2]), 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx + s * 2.0 - 0.3, my + 3.4);
    ctx.lineTo(mx + s * 2.1 - 0.3, my + 6.6);
    pen(ctx, 'rgba(255,255,255,0.8)', 0.4);
    ctx.stroke();
  }
  if (q.sweat >= 0) sweat(ctx, -14, -4 + q.sweat * 3, 1.1);
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
// The gown's front: a cream lace stomacher with coral buttons, the velvet's light and shade, a coral sash
// with a pearl brooch; cut from her own outline.
function gownFront(ctx, a, mode, D) {
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
  const lt = C([st[0] + 8, st[1] + 10]);
  glow(ctx, lt[0], lt[1], 12, GOWN[0], 0.45);
  const sh = T([hp[0] - 18, hp[1] - 6]);
  glow(ctx, sh[0], sh[1], 12, GOWN[3], 0.45);
  const sto = chaikin([C([st[0] - 6, st[1] + 5]), C([st[0] + 9, st[1] + 5]), T([hp[0] + 4, hp[1] - 9]), T([hp[0] - 1, hp[1] - 9])], 1);
  poly(ctx, sto);
  ctx.fillStyle = tone(a, LACE[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, sto);
  ctx.clip();
  // the lace: soft rows of little arches (one quiet pattern, not beads)
  for (let r = 0; r < 4; r++) {
    const y = st[1] + 8 + r * 4;
    ctx.beginPath();
    for (let i = -3; i <= 4; i++) {
      const p0 = C([st[0] + i * 2.6 - 1.3, y]);
      const p1 = C([st[0] + i * 2.6, y - 1.2]);
      const p2 = C([st[0] + i * 2.6 + 1.3, y]);
      if (i === -3) ctx.moveTo(...p0);
      ctx.quadraticCurveTo(...p1, ...p2);
    }
    pen(ctx, tone(a, LACE[2], 0.8), 0.32);
    ctx.stroke();
  }
  ctx.restore();
  for (const k of [0, 1, 2]) {
    const b = C([st[0] + 1.8 - k * 0.3, st[1] + 9 + k * 4.4]);
    ell(ctx, b[0], b[1], 0.75, 0.75);
    ctx.fillStyle = tone(a, CORAL[1]);
    ctx.fill();
    ell(ctx, b[0] - 0.2, b[1] - 0.25, 0.3, 0.25);
    ctx.fillStyle = tone(a, CORAL[0]);
    ctx.fill();
  }
  // the coral sash at her waist, a pearl brooch
  const sa = chaikin([T([hp[0] - 30, hp[1] - 12]), T([hp[0] + 30, hp[1] - 12.4]), T([hp[0] + 30, hp[1] - 7.4]), T([hp[0] - 30, hp[1] - 7])], 1);
  poly(ctx, sa);
  ctx.fillStyle = tone(a, CORAL[1]);
  ctx.fill();
  ctx.save();
  poly(ctx, sa);
  ctx.clip();
  const sl = T([hp[0] + 6, hp[1] - 11]);
  glow(ctx, sl[0], sl[1], 6, CORAL[0], 0.6);
  ctx.restore();
  const br = T([hp[0] + 3, hp[1] - 9.8]);
  ell(ctx, br[0], br[1], 1.4, 1.4);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, br[0], br[1], 1, 1);
  ctx.fillStyle = tone(a, PEARL[1]);
  ctx.fill();
  ell(ctx, br[0] - 0.35, br[1] - 0.4, 0.38, 0.3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// The two short ruffled tiers at her hips, each swinging on its own (a soft wavy hem, never beads).
function hipTiers(ctx, a, mode, D) {
  const q = a.maQ ?? {};
  const tr = q.tiers ?? [0, 0];
  ctx.save();
  enter(ctx, a, D, 'torso');
  const hp = D.J.hip;
  for (const [i, y0, h, wd, col] of [[0, -8, 9, 25, GOWN[2]], [1, -3, 7.6, 27, GOWN[1]]]) {
    ctx.save();
    ctx.translate(hp[0] + 1, hp[1] + y0);
    ctx.rotate(tr[i]);
    const pts = [[-wd + 3, 0], [wd - 2, 0]];
    for (let k = 0; k <= 8; k++) {
      const x = wd - (k / 8) * (wd * 2 - 1);
      pts.push([x, h + (k % 2 ? 1.4 : 0) - Math.abs(x) * 0.06]);
    }
    const sh = chaikin(pts, 3);
    poly(ctx, sh);
    paint(ctx, a, mode, col, GOWN_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, sh);
      ctx.clip();
      glow(ctx, 8, 2, 12, GOWN[0], 0.35);
      for (let k = 1; k < 4; k++) {
        const x = -wd + k * (wd / 2);
        ctx.beginPath();
        ctx.moveTo(x, 1);
        ctx.quadraticCurveTo(x + 1.6, h * 0.5, x + 0.8, h);
        pen(ctx, tone(a, GOWN[3], 0.4), 0.8);
        ctx.stroke();
      }
      // a cream lace edge along its hem
      ctx.beginPath();
      sh.slice(Math.floor(sh.length * 0.18), Math.floor(sh.length * 0.98)).forEach((p, j) => (j ? ctx.lineTo(p[0], p[1] - 0.6) : ctx.moveTo(p[0], p[1] - 0.6)));
      pen(ctx, tone(a, LACE[1], 0.9), 1.1);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}
// The bustle behind her: three teal ruffle lobes cascading from her hips, each on its own spring.
function bustle(ctx, a, mode, D) {
  const q = a.maQ ?? {};
  const bs = q.bustle ?? [0, 0, 0];
  for (const [i, dx, dy, r] of [[0, -20, -12, 9], [1, -26, -3, 8.4], [2, -28, 6, 7.4]]) {
    const root = ptOf(a, D, 'torso', [D.J.hip[0] + dx * 0.5, D.J.hip[1] + dy * 0.6 - 4]);
    const an = Math.PI * 0.78 + bs[i];
    const c = [root[0] + Math.cos(an) * r * 0.5, root[1] + Math.sin(an) * r * 0.5];
    const pts = [];
    for (let k = 0; k < 14; k++) {
      const t = (k / 14) * TAU;
      const rr = r * 0.5 * (1 + 0.06 * Math.cos(t * 5));
      pts.push([c[0] + Math.cos(t) * rr * 1.1, c[1] + Math.sin(t) * rr * 0.8]);
    }
    const sh = chaikin(pts, 2);
    poly(ctx, sh);
    paint(ctx, a, mode, i % 2 ? GOWN[2] : GOWN[1], GOWN_INK);
    if (mode === 'fill') {
      ctx.save();
      poly(ctx, sh);
      ctx.clip();
      glow(ctx, c[0] - 1, c[1] - 2, r * 0.4, GOWN[0], 0.5);
      ctx.beginPath();
      ctx.ellipse(c[0], c[1] + r * 0.12, r * 0.5, r * 0.3, 0, 0.3, Math.PI - 0.3);
      pen(ctx, tone(a, LACE[1], 0.85), 0.9);
      ctx.stroke();
      ctx.restore();
    }
  }
}
// Her children: five little pastel barnacles on her capelet. `open` lifts their lids and their feathery
// fans come out to wave (rig space; `p` the barnacle's foot, `s` its size, `k` its colour).
function barnacle(ctx, a, mode, p, s, k, open, t, i) {
  const [c0, c1, c2] = BARN[k % 3];
  ctx.save();
  ctx.translate(...p);
  ctx.scale(s, s);
  const cone = chaikin([[-2.4, 0.6], [-1.9, -1.6], [-1.1, -3.2], [1.1, -3.2], [1.9, -1.6], [2.4, 0.6]], 2);
  if (mode === 'line') {
    poly(ctx, cone);
    pen(ctx, c2, LW * 1.2 / s);
    ctx.stroke();
    ctx.restore();
    return;
  }
  // the fan, out of the top when it's open: three soft curved lobes waving
  const o = clamp(open, 0, 1);
  if (o > 0.05) {
    const wave = Math.sin(t * 7 + i * 1.3) * 0.35;
    for (let j = -1; j <= 1; j++) {
      const an = -Math.PI / 2 + j * 0.45 + wave;
      const L = 3.2 * o;
      // (a soft rounded petal of a fan, never a thin leg)
      ctx.beginPath();
      ctx.ellipse(Math.cos(an) * L * 0.55, -3 + Math.sin(an) * L * 0.55, L * 0.55, 0.75 * o, an, 0, TAU);
      ctx.fillStyle = '#fffdf6';
      ctx.fill();
      pen(ctx, c2, 0.4);
      ctx.stroke();
    }
  }
  poly(ctx, cone);
  const g = ctx.createLinearGradient(-2.4, 0, 2.4, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fill();
  for (const x of [-0.9, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(x * 1.6, 0.2);
    ctx.quadraticCurveTo(x * 1.2, -1.6, x, -2.9);
    pen(ctx, c2, 0.35);
    ctx.stroke();
  }
  // its lids: two little rounded plates on top, tipped open
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * 1.0, -3.1);
    ctx.rotate(sd * o * 0.9);
    ell(ctx, -sd * 0.45, 0, 0.75, 0.42);
    ctx.fillStyle = c0;
    ctx.fill();
    pen(ctx, c2, 0.3);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
const BARNS = [[-17, 11.6, 1.4, 0], [-8, 15, 1.6, 1], [2.4, 15.6, 1.55, 2], [12, 14.2, 1.5, 0], [19.6, 10.4, 1.35, 1]];
// The lace capelet over her shoulders (its hem in soft scallops), the pearl choker, her children.
function capelet(ctx, a, mode, D) {
  const q = a.maQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const pts = [[st[0] - 25, st[1] + 5], [st[0] - 16, st[1] - 1.4], [st[0], st[1] - 2.4], [st[0] + 17, st[1] - 1.2], [st[0] + 26, st[1] + 5.4]];
  for (let k = 0; k <= 6; k++) {
    const x = st[0] + 26 - (k / 6) * 51;
    const sag = 17.5 - Math.abs(x - st[0] - 1) * 0.2;
    pts.push([x, st[1] + sag + (k % 2 ? 1.6 : 0)]);
  }
  const sh = chaikin(pts, 3);
  poly(ctx, sh);
  paint(ctx, a, mode, LACE[1], LACE[3]);
  if (mode === 'fill') {
    ctx.save();
    poly(ctx, sh);
    ctx.clip();
    glow(ctx, st[0] + 8, st[1] + 1, 10, LACE[0], 0.7);
    glow(ctx, st[0] - 18, st[1] + 6, 8, LACE[2], 0.6);
    // a quiet lace pattern: one row of soft arches above the hem
    ctx.beginPath();
    for (let i = -8; i <= 8; i++) {
      const x = st[0] + i * 2.8;
      const y = st[1] + 13 - Math.abs(i) * 0.35;
      if (i === -8) ctx.moveTo(x - 1.4, y);
      ctx.quadraticCurveTo(x, y - 1.2, x + 1.4, y);
    }
    pen(ctx, tone(a, LACE[2], 0.8), 0.35);
    ctx.stroke();
    ctx.restore();
  }
  // the pearl choker, one big pearl
  const ch = chaikin([[st[0] - 8, st[1] - 4.6], [st[0] + 9, st[1] - 4.6], [st[0] + 9, st[1] - 2.4], [st[0] - 8, st[1] - 2.4]], 2);
  poly(ctx, ch);
  paint(ctx, a, mode, PEARL[2], PEARL[3]);
  ell(ctx, st[0] + 1.6, st[1] - 1.2, 2.2, 2.2);
  paint(ctx, a, mode, PEARL[1], PEARL[3]);
  if (mode === 'fill') {
    glow(ctx, st[0] + 1, st[1] - 1.8, 1.8, '#ffffff', 0.8 + 0.2 * (q.pearlShine ?? 0));
    if ((q.pearlShine ?? 0) > 0.2) sparkle(ctx, st[0] + 2.6, st[1] - 2.6, 1.6 * q.pearlShine, 1, '#ffffff');
  }
  // her children
  const t = a.t ?? 0;
  const ops = q.barn ?? [0, 0, 0, 0, 0];
  for (const [i, [dx, dy, s, k]] of BARNS.entries()) barnacle(ctx, a, mode, [st[0] + dx, st[1] + dy - 2], s, k, ops[i], t, i);
  ctx.restore();
}
// Lace cuffs at the ends of her sleeves.
function cuff(ctx, a, mode, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const W = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const an = Math.atan2(W[1] - E[1], W[0] - E[0]);
  const len = Math.hypot(W[0] - E[0], W[1] - E[1]);
  ctx.save();
  ctx.translate(...W);
  ctx.rotate(an);
  const pts = chaikin([[-len * 0.25, -3.2], [0.8, -4], [1.6, -2], [1, 0], [1.6, 2], [0.8, 4], [-len * 0.25, 3.2]], 2);
  poly(ctx, pts);
  paint(ctx, a, mode, k === 'N' ? LACE[1] : LACE[2], LACE[3]);
  ctx.restore();
}
// Her flippers: broad and soft, three faint toe lines; `open` spreads them.
function flipper(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  ctx.scale(1.3, 1.3);
  const near = k === 'N';
  smooth(ctx, [[-3.6, -3.4], [3.6, -3.4], [4.4, 1], [3.4, 4.4], [0, 5.4], [-3.4, 4.4], [-4.4, 1]]);
  paint(ctx, a, mode, near ? HIDE[1] : HIDE[2], INK, LW / 1.3);
  if (mode === 'fill') {
    glow(ctx, 0.6, -0.6, 3, HIDE[0], 0.55);
    for (const dx of [-1.6, 0, 1.6]) {
      ctx.beginPath();
      ctx.moveTo(dx, 2.4);
      ctx.lineTo(dx * 1.1, 4.4);
      pen(ctx, tone(a, HIDE[3], 0.4), 0.35);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Her wide flipper feet.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 5.4, p[1] - 3], [p[0] + 2, p[1] - 3.6], [p[0] + 7.6, p[1] - 1], [p[0] + 9.6, p[1] + 2], [p[0] + 8, p[1] + 3.6], [p[0] - 5.6, p[1] + 3.6], [p[0] - 6.4, p[1] + 0.4]]);
  paint(ctx, a, mode, near ? HIDE[1] : HIDE[2]);
  if (mode === 'fill') {
    for (const dx of [3.4, 5.8, 8]) {
      ctx.beginPath();
      ctx.moveTo(p[0] + dx - 0.2, p[1] + 3.3);
      ctx.lineTo(p[0] + dx - 0.8, p[1] + 1.2);
      pen(ctx, tone(a, HIDE[3], near ? 0.5 : 0.3), 0.4);
      ctx.stroke();
    }
    ell(ctx, p[0] + 1.6, p[1] - 1.6, 3.2, 0.8, -0.15);
    ctx.fillStyle = tone(a, HIDE[0], near ? 0.6 : 0.3);
    ctx.fill();
  }
  ctx.restore();
}
// Her scallop-shell fan: coral ribs fanning from a pearl hinge, its edge in soft scallops; `open` 0 shut,
// 1 spread. (x, y) the hinge in her flipper, `ang` its heading.
export function fanAt(ctx, a, mode, x, y, ang, open = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const o = clamp(open, 0, 1);
  const spread = 0.12 + 1.05 * o;
  const R = 9;
  const n = 7;
  const pts = [[0, 0]];
  for (let i = 0; i <= n * 3; i++) {
    const u = i / (n * 3);
    const an = -spread / 2 + u * spread;
    const bump = 1 + 0.06 * Math.cos(u * n * TAU) * o;
    pts.push([Math.cos(an) * R * bump, Math.sin(an) * R * bump]);
  }
  const sh = chaikin(pts, 2);
  poly(ctx, sh);
  if (mode === 'line') {
    pen(ctx, CORAL[3], LW * 1.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
  g.addColorStop(0, a ? tone(a, CORAL[0]) : CORAL[0]);
  g.addColorStop(1, a ? tone(a, CORAL[1]) : CORAL[1]);
  ctx.fillStyle = g;
  ctx.fill();
  for (let i = 0; i <= n; i++) {
    const an = -spread / 2 + (i / n) * spread;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * 1.8, Math.sin(an) * 1.8);
    ctx.lineTo(Math.cos(an) * R * 0.92, Math.sin(an) * R * 0.92);
    pen(ctx, a ? tone(a, CORAL[2], 0.6) : CORAL[2], 0.4);
    ctx.stroke();
  }
  ell(ctx, 0.4, 0, 1.4, 1.4);
  ctx.fillStyle = PEARL[1];
  ctx.fill();
  ctx.restore();
}
function fan(ctx, a, mode, D) {
  const q = a.maQ ?? {};
  if ((q.holdFan ?? 1) < 0.5) return;
  const h = ptOf(a, D, 'handF', D.J.handF);
  const w = ptOf(a, D, 'handF', D.J.wrF);
  const ang = Math.atan2(h[1] - w[1], h[0] - w[0]) + (q.fanA ?? 0);
  fanAt(ctx, a, mode, h[0], h[1], ang, q.fanOpen ?? 1);
}

// ---------- Her act and her fight ----------
const SWINGS = ['slap', 'rap', 'bump'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.maN ?? 0) % SWINGS.length]);
const READY = { shN: -60, elN: -50, hwN: 0, shF: -40, elF: -70, hwF: 0 };
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'calm', look: [0.4, 0], turn: 0.4, sweat: -1, fx: null, fanA: -0.6, fanOpen: 0.15, holdFan: 1, barn: [0, 0, 0, 0, 0], pearlShine: 0, mirror: 0 };
  a.maQ = q;
  a.maUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const fanTo = (ang, open, k = 1) => {
    const kk = clamp(k, 0, 1);
    q.fanA = mix(q.fanA, ang, kk);
    q.fanOpen = mix(q.fanOpen, open, kk);
  };
  const kids = (v, k = 1) => {
    for (let i = 0; i < 5; i++) q.barn[i] = mix(q.barn[i], typeof v === 'function' ? v(i) : v, clamp(k, 0, 1));
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.2);
  const cineMood = m.cine?.mood;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const alive = m.hp > 0;
  const low = alive && m.hp / m.def.hp < 0.25;
  const cast = alive && m.cast && m.castPose ? m.cast : null;
  if (cast && st.maCastT0 !== cast.t0) {
    st.maCastT0 = cast.t0;
    st.maMove = m.castPose;
  }
  const since = now - (m.attackAt ?? -9);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.45);
  const winding = alive && !cast && m.windup > 0;
  if (winding && !(now - (st.maWindAt ?? -9) < 0.25)) {
    st.maN = (st.maN ?? m.uid ?? 0) + 1;
    st.maMove = pickSwing(m, st);
  }
  if (winding) st.maWindAt = now;
  const struck = alive && since >= 0 && since < 1.1;
  const mv = cast ? st.maMove : winding || struck ? (st.maMove ??= SWINGS[0]) : null;
  const cu = cast ? clamp((now - cast.t0) / cast.dur, 0, 1) : 1;
  const ct = cast ? now - cast.t0 : 99;
  let W = 0;
  if (cast) W = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  const s = cast || winding ? -1 : since;
  const busy = !alive || Boolean(mv);
  if (busy) st.maFreeAt = now;
  const freeK = busy ? 0 : sstep((now - (st.maFreeAt ?? -9)) / 0.35);
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const hurt = alive && hurtU >= 0 && hurtU < 0.5;

  // Standing: very upright, chin up, her near flipper folded at her waist, the fan held shut by her side
  // in her far flipper; a slow, grand breath.
  go({ shN: -30, elN: -80, hwN: 10, shF: 10, elF: -30, hwF: 0, tilt: -2, chest: -2 + breath * 0.6, head: -3 + Math.sin(t * 0.45) * 1, pelvis: 1 }, 1);
  if (walkW > 0.01) {
    const u = a.blkidU ?? a.wp ?? 0;
    // a stately waddle: rocking side to side over each step, the fan held up
    go({ shF: -60, elF: -60 }, walkW);
    add({ tilt: 1 + Math.sin(u * TAU * 2) * 2, chest: Math.sin(u * TAU * 2) * 2.4, head: -Math.sin(u * TAU * 2) * 1.6 }, walkW);
    fanTo(-1.2, 0.2, walkW);
    q.turn = mix(q.turn, 0.55, walkW);
  }
  if (fighting && !busy) {
    go({ ...READY, tilt: 3, drop: 0.05, head: 1 }, 0.85 * freeK);
    fanTo(-1.4, 0.1, 0.85 * freeK);
    say('focus');
    q.turn = 0.6;
  }
  if (fighting && !st.maHunt) st.maBangAt = now;
  if (!fighting && st.maHunt && alive) st.maLostAt = now;
  st.maHunt = fighting;
  q.bang = now - (st.maBangAt ?? -9);
  q.huh = now - (st.maLostAt ?? -9);
  // (her children notice you first: their lids pop open and they bristle)
  if (q.bang >= 0 && q.bang < 1.4 && alive) kids((i) => win(q.bang, 0.05 * i, 0.15 + 0.05 * i, 1, 1.4));
  if (gloat >= 0 && gloat < 1.4 && alive && !busy && !hurt) {
    // the fan flicked open under her chin: "Hmph!"
    const k = win(gloat, 0, 0.25, 0.9, 1.4) * freeK;
    go({ shF: -100, elF: -100, hwF: 10, head: -6, tilt: -3 }, k);
    fanTo(-0.4, 1, k);
    say('haughty', k);
    q.fx = { kind: 'hmph', u: gloat };
  }
  if (!alive) {
    st.maDeadAt ??= now;
    go({ drop: 0.8, tilt: -8, head: 12, shN: 34, elN: -30, shF: 40, elF: -24, fxN: 0.4, fxF: 0.2 });
    fanTo(0.4, 0.1);
    q.mood = 'dizzy';
    q.turn = 0.3;
    q.fx = { kind: 'beaten', u: now - st.maDeadAt };
  } else st.maDeadAt = undefined;

  if (alive && mv) {
    const snap = s >= 0 ? sstep(s / 0.14) : 0;
    const rel = s >= 0 ? 1 - sstep((s - 0.45) / 0.55) : 0;
    const hitK = snap * rel;
    const wu = sstep(W) * (1 - snap);
    const perf = cast ? sstep(ct / 0.4) : s >= 0 ? rel : 0;
    if (mv === 'slap') {
      // Flipper Slap: drawn back high beside her, then a grand backhand across
      go({ shN: -150, elN: -40, hwN: -20, tilt: -6, head: -4, chest: -4, turnC: -0.3 }, wu);
      go({ shN: -55, elN: -10, hwN: 20, tilt: 10, head: 4, x: 0.03, turnC: 0.3 }, hitK);
      say(hitK > 0.2 ? 'cross' : 'scold');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'slap', u: s };
    } else if (mv === 'rap') {
      // Fan Rap: the fan snapped shut, raised high, rapped down
      go({ shF: -165, elF: -30, tilt: -4, head: -6 }, wu);
      fanTo(-0.2, 0, Math.max(wu, hitK));
      go({ shF: -70, elF: -20, tilt: 8, head: 4, x: 0.02 }, hitK);
      say(hitK > 0.2 ? 'haughty' : 'scold');
      if (s >= 0 && s < 0.45) q.fx = { kind: 'rap', u: s };
    } else if (mv === 'bump') {
      // Belly Bump: a lean back, then a dignified bump forward
      go({ tilt: -12, chest: -6, head: -6, shN: 20, elN: -60, shF: 24, elF: -40, x: -0.03 }, wu);
      go({ tilt: 10, chest: 6, head: 2, pelvis: 6, x: 0.07, shN: 30, shF: 30 }, hitK);
      say(hitK > 0.2 ? 'sniff' : 'focus');
      if (s >= 0 && s < 0.5) q.fx = { kind: 'bump', u: s };
    } else if (mv === 'scold') {
      // A Proper Scolding: a flipper wagged at the tank, the fan on her hip; then a slap
      const wag = Math.sin(now * 9) * (1 - wu);
      go({ shN: -110 + wag * 12, elN: -60, hwN: wag * 20, shF: 30, elF: -90, tilt: 4, head: 2 }, Math.max(perf * (1 - hitK), 0));
      go({ shN: -150, elN: -40, hwN: -20, tilt: -6, head: -4, turnC: -0.3 }, wu);
      go({ shN: -55, elN: -10, hwN: 20, tilt: 12, head: 4, x: 0.04, turnC: 0.3, drop: 0.06 }, hitK);
      say(hitK > 0.2 ? 'shout' : 'scold');
      if (perf > 0.3 && hitK < 0.2 && cu < 0.85) q.fx = { kind: 'tut', u: ct };
      if (s >= 0 && s < 0.6) q.fx = { kind: 'slap', u: s, big: 1 };
    } else if (mv === 'babies') {
      // Barnacle Babies: a grand shimmy that shakes her children loose
      const sh2 = Math.sin(now * 14) * perf * (1 - hitK);
      go({ shN: -80, elN: -20, shF: -70, elF: -30, chest: sh2 * 4, tilt: -4, head: -2 + sh2 * 2, turnC: sh2 * 0.2 }, perf);
      go({ shN: -140, elN: -20, shF: -130, elF: -30, tilt: -6, head: -6 }, hitK);
      kids(1, perf);
      say(hitK > 0.2 ? 'proud' : 'coo');
      if (perf > 0.2) q.fx = { kind: 'babies', u: ct };
    } else if (mv === 'cluster') {
      // Cluster, Children!: the fan pointed at one of you, her near flipper on her chest
      go({ shF: -95, elF: -8, hwF: 0, shN: -40, elN: -110, tilt: -3, head: -2 }, perf * (1 - hitK));
      fanTo(0, 0.1, perf);
      go({ shF: -150, elF: -30, shN: -120, elN: -30, tilt: -6, head: -6 }, hitK);
      kids((i) => 0.6 + 0.4 * Math.sin(now * 8 + i), perf);
      say(hitK > 0.2 ? 'pleased' : 'haughty');
      q.look = [1.2, 0.2];
    } else if (mv === 'undertow') {
      // Undertow: both flippers raised high, then drawn down slowly, palms down
      const up = sstep(cu / 0.5);
      go({ shN: -165, elN: -20, shF: -160, elF: -24, tilt: -8, head: -8, chest: -4, lift: 0.01 }, perf * up * (1 - wu));
      go({ shN: -90, elN: -10, shF: -90, elF: -14, tilt: -2, head: -2 }, wu);
      go({ shN: -30, elN: -6, shF: -26, elF: -6, tilt: 8, head: 4, drop: 0.08 }, hitK);
      fanTo(-0.3, 0.1, perf);
      say(hitK > 0.2 ? 'shout' : 'focus');
      q.look = [0.2, -1];
      if (perf > 0.3) q.fx = { kind: 'swell', u: ct };
    } else if (mv === 'coral') {
      // Coral Bloom: flippers wide, then a clap; coral grows out round her
      go({ shN: -100, elN: -10, shF: -100, elF: -10, tilt: -4, head: -2 }, perf * (1 - wu) * (1 - hitK));
      go({ shN: -80, elN: -60, shF: -80, elF: -60, tilt: 2 }, wu);
      go({ shN: -82, elN: -70, shF: -82, elF: -70, tilt: 4, head: 2 }, hitK);
      fanTo(-1.4, 0, perf);
      say(hitK > 0.2 ? 'pleased' : 'focus');
      if (s >= 0 && s < 0.6) q.fx = { kind: 'clap', u: s };
    } else if (mv === 'pearl') {
      // Find the Pearl: her pearl held up high, then her flippers conducting the shells round, then a
      // grand "voila"
      const show = win(cu, 0, 0.06, 0.16, 0.22);
      const cond = win(cu, 0.2, 0.26, 0.84, 0.9);
      const voila = win(cu, 0.86, 0.92, 1, 1.2) + hitK;
      go({ shN: -165, elN: -20, hwN: 0, head: -8, tilt: -4 }, show * perf);
      const beat = Math.sin(now * 5.5);
      go({ shN: -110 + beat * 22, elN: -40 - beat * 16, shF: -110 - beat * 22, elF: -40 + beat * 16, head: beat * 3 - 2, tilt: beat * 1.5 }, cond * perf);
      go({ shN: -120, elN: -10, shF: -120, elF: -10, tilt: -6, head: -6 }, clamp(voila, 0, 1));
      fanTo(-0.5, cond > 0.5 ? 0.9 : 0.1, perf);
      kids((i) => cond * (0.5 + 0.5 * Math.sin(now * 6 + i * 1.2)), perf);
      say(show > 0.4 ? 'proud' : voila > 0.4 ? 'pleased' : 'coo');
      if (show > 0.3) q.fx = { kind: 'pearlup', u: ct };
    }
  }
  if (alive) {
    if (hurt && !mv) {
      const k = win(hurtU, 0, 0.07, 0.18, 0.5);
      go({ tilt: -8, head: -10, x: -0.02, ...READY }, k);
      kids(1, k);
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const pu = now - (m.phaseAt ?? -9);
    if (pu >= 0 && pu < 1.8 && !mv) {
      const k = win(pu, 0, 0.25, 1.4, 1.8);
      if ((m.mech?.phase ?? 1) >= 3) {
        go({ shF: -170, elF: -10, shN: -60, elN: -100, tilt: -8, head: -8, chest: -4 }, k);
        fanTo(-0.2, 1, k);
        kids(1, k);
        say('shout', k);
        q.fx = { kind: 'spring', u: pu };
      } else {
        go({ shN: -160, elN: -20, shF: -155, elF: -30, tilt: -6, head: -8 }, k);
        kids(1, k);
        say('shout', k);
        q.fx = { kind: 'rising', u: pu };
      }
    }
    // ----- her entrance's acts -----
    if (act && actU >= 0) {
      const d = act.dur ?? 1;
      const ka = win(actU, 0, 0.25, d - 0.1, d + 0.3);
      if (act.move === 'fan' && actU < d + 0.3) {
        const fl = Math.sin(actU * 7);
        go({ shF: -110 + fl * 10, elF: -100, hwF: fl * 14, head: -6, tilt: -3 }, ka);
        fanTo(-0.4, 1, ka);
        say('haughty', ka);
      } else if (act.move === 'children' && actU < d + 0.3) {
        go({ shN: -60, elN: -100, shF: -100, elF: -20, head: -4, tilt: -2 }, ka);
        fanTo(0, 0.1, ka);
        kids((i) => sstep((actU - i * 0.12) / 0.25), ka);
        say('cross', ka);
        q.look = [1.2, 0];
      } else if (act.move === 'windup') {
        go({ shN: -150, elN: -40, hwN: -20, tilt: -6, head: -4, chest: -4, turnC: -0.3, drop: 0.04 }, ka);
        kids(1, ka);
        say('scold', ka);
      } else if (act.move === 'splash' && actU < d + 0.3) {
        const sl = sstep((actU - 0.15) / 0.12);
        go({ shN: -150, elN: -40, tilt: -6, head: -4 }, ka * (1 - sl));
        go({ shN: -40, elN: -10, hwN: 20, tilt: 14, head: 6, drop: 0.12, x: 0.03 }, ka * sl);
        kids(1, ka);
        say(sl > 0.5 ? 'shout' : 'scold', ka);
        if (actU > 0.25) q.fx = { kind: 'splash', u: actU - 0.25 };
      } else if (act.move === 'sway') {
        go({ tilt: Math.sin(actU * (act.speed ?? 2.5)) * 4, shF: -100, elF: -100, head: -4 }, ka);
        fanTo(-0.4, 1, ka);
        say('pleased', ka);
      }
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (cineMood || fighting || busy || hurt || m.cine ? 0 : 1);
    st.maCalm = mix(st.maCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 8)));
    if (st.maCalm > 0.02 && !q.fx) idleAct(m, a, out, go, add, fanTo, kids, q, sstep(st.maCalm), t, now, st);
    if (cineMood && !mv) q.mood = { angry: 'cross', happy: 'pleased', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'drowsy', hurt: 'hurt' }[cineMood] ?? q.mood;
    if (low && !mv) {
      if (!cineMood) q.mood = q.mood === 'calm' || q.mood === 'focus' ? 'worried' : q.mood;
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  q.turn = spring(st, 'maTurn', q.turn, 200, 28, dt);
  const F = FACES[q.mood] ?? FACES.calm;
  const f = (st.maF ??= { ...FACES.calm, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0, sniff: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 6) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 12);
  for (const k of ['lid', 'lo', 'bt', 'by', 'bq', 'mw', 'ms', 'mo', 'bl', 'sm', 'np']) f[k] = mix(f[k], tgt[k], k === 'lid' ? 1 - Math.exp(-dt * (tgt[k] > f[k] ? 36 : 16)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.maF = f;
  q.fanA = spring(st, 'maFanA', q.fanA, 260, 32, dt);
  q.fanOpen = clamp(spring(st, 'maFanO', q.fanOpen, 240, 26, dt), 0, 1);
  q.barn = q.barn.map((v, i) => clamp(spring(st, `mb${i}`, v, 220 - i * 10, 20, dt), 0, 1.15));
  const kick = (st.maLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.maLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.maLast = out.head;
  st.maLastT = out.tilt;
  const step = walkW * Math.sin((a.blkidU ?? a.wp ?? 0) * TAU * 2);
  const tiltR = ((out.tilt ?? 0) * Math.PI) / 180;
  q.tiers = [0, 1].map((i) => clamp(spring(st, `tr${i}`, -tiltR * 0.4 + step * 0.05 * (i ? -1 : 1) + Math.sin(t * 1.1 + i * 2) * 0.012, 130 - i * 15, 13, dt, kick * 0.005), -0.16, 0.16));
  q.bustle = [0, 1, 2].map((i) => clamp(spring(st, `bu${i}`, -tiltR * 0.5 + step * 0.12 + Math.sin(t * 0.9 - i * 0.7) * 0.03, 90 - i * 12, 9, dt, kick * 0.01), -0.35, 0.35));
}
const PIECES = [
  { name: 'fan', t0: 0.4, len: 7 },
  { name: 'children', t0: 8, len: 7.4 },
  { name: 'pearl', t0: 16, len: 6.6 },
  { name: 'doze', t0: 23, len: 6.8 },
];
function idleAct(m, a, out, go, add, fanTo, kids, q, w, t, now, st) {
  const lu = (t + ((m.uid ?? 0) % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.maPiece !== cur.name) {
      const fits = left >= cur.t0 + cur.len - lu;
      if (lu - cur.t0 < 0.3 && fits) st.maPiece = cur.name;
      else return;
    }
  } else {
    st.maPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'fan') {
    // fanning herself grandly; a slow look round; "Hmph."
    const k = win(u, 0, 0.6, 6.4, 7);
    const fl = Math.sin(u * 7);
    go({ shF: -110 + fl * 10, elF: -100, hwF: fl * 14, head: -4, tilt: -2 }, k * w);
    fanTo(-0.4, 1, k * w);
    const look1 = win(u, 1.6, 2.0, 3.0, 3.4);
    const look2 = win(u, 3.4, 3.8, 4.6, 5.0);
    const hm = win(u, 5.0, 5.3, 6.2, 6.6);
    go({ neckR: 5, head: -2 }, look1 * k * w);
    go({ neckR: -5, head: -2 }, look2 * k * w);
    go({ head: -8, chest: -3 }, hm * k * w);
    if (at(k)) {
      q.mood = hm > 0.4 ? 'sniff' : 'haughty';
      q.look = look1 > 0.4 ? [-0.9, 0] : look2 > 0.4 ? [1.2, 0] : [0.4, 0];
      if (hm > 0.5) q.fx = { kind: 'hmph', u: u - 5.2 };
    }
  } else if (cur.name === 'children') {
    // her children's lids pop open one by one and they wave; she counts them with a tap each; she beams
    const k = win(u, 0, 0.6, 6.8, 7.4);
    kids((i) => sstep((u - 0.4 - i * 0.35) / 0.25) * (1 - sstep((u - 6.4) / 0.5)), k * w);
    const count = win(u, 2.4, 2.7, 4.8, 5.1);
    const beat = (u - 2.7) * 2.3;
    const i = clamp(Math.floor(beat), 0, 4);
    const bx = [0.9, 0.5, 0.1, -0.3, -0.6][i];
    go({ shN: -100 - bx * 40, elN: -110 + Math.max(0, Math.sin((beat % 1) * Math.PI)) * 20, hwN: 10, head: 8, tilt: 2 }, count * k * w);
    const beam = win(u, 5.0, 5.3, 6.6, 7.2);
    go({ shN: -60, elN: -120, head: -4, chest: -3 }, beam * k * w);
    if (at(k)) {
      q.mood = beam > 0.4 ? 'coo' : count > 0.4 ? 'pleased' : 'coo';
      q.look = count > 0.4 ? [0.2, 1.3] : [0.4, 0.6];
      if (count > 0.4) q.fx = { kind: 'count', u: beat, i };
    }
  } else if (cur.name === 'pearl') {
    // her choker's pearl polished with her flipper, a huff, a sparkle
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const huff = win(u, 0.5, 0.8, 1.6, 1.9);
    const rub = win(u, 1.9, 2.2, 4.2, 4.6);
    const admire = win(u, 4.6, 4.9, 6.0, 6.4);
    go({ shN: -100, elN: -120, hwN: 20, head: 12, tilt: 2 }, (huff + rub) * k * w);
    add({ hwN: Math.sin(u * 12) * 16 * rub }, k * w);
    go({ head: 8, chest: -2 }, admire * k * w);
    q.pearlShine = admire;
    if (at(k)) {
      q.mood = admire > 0.4 ? 'proud' : huff > 0.4 ? 'focus' : 'pleased';
      q.look = [0.1, 1.4];
      if (huff > 0.5) q.fx = { kind: 'huff', u: u - 0.6 };
    }
  } else {
    // the doze: her chin sinks, a little snore; she snorts awake, straightens her crown, looks round
    const k = win(u, 0, 0.5, 6.3, 6.8);
    const sink = win(u, 0.4, 1.6, 3.6, 3.8);
    const snort = win(u, 3.7, 3.85, 4.3, 4.6);
    const fix = win(u, 4.5, 4.8, 5.5, 5.8);
    const round = win(u, 5.7, 6.0, 6.4, 6.8);
    go({ head: 14 + Math.sin(u * 2) * 1.5, chest: 3, tilt: 2, shF: 20, elF: -20 }, sink * k * w);
    go({ head: -10, tilt: -4, lift: 0.015 }, snort * k * w);
    go({ shN: -165, elN: -70, hwN: 10, head: -2 }, fix * k * w);
    go({ neckR: Math.sin(u * 8) * 5 }, round * k * w);
    if (at(k)) {
      q.mood = sink > 0.4 ? (u > 1.4 ? 'sleepy' : 'drowsy') : snort > 0.4 ? 'startled' : fix > 0.4 ? 'haughty' : round > 0.4 ? 'worried' : 'calm';
      if (sink > 0.5 && u > 1.6) q.fx = { kind: 'snore', u: u - 1.6 };
    }
  }
}

// ---------- Effects ----------
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(220,250,246,0.45)';
  ctx.fill();
  pen(ctx, WATER[3], Math.max(0.4, r * 0.18));
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.22, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A curl of sea-green water: a soft rounded crest with a white lip.
function curl(ctx, x, y, r, al, d = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(d, 1);
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, 0);
  ctx.quadraticCurveTo(-r * 0.6, -r * 1.6, r * 0.6, -r * 1.3);
  ctx.quadraticCurveTo(r * 1.2, -r * 1.0, r * 0.7, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.8, -r * 0.1, -r * 0.2);
  ctx.quadraticCurveTo(r * 0.4, 0, r * 1.2, 0);
  ctx.closePath();
  pen(ctx, WATER[3], Math.max(0.6, r * 0.16));
  ctx.stroke();
  ctx.fillStyle = WATER[1];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.9);
  ctx.quadraticCurveTo(0, -r * 1.35, r * 0.6, -r * 1.15);
  pen(ctx, WATER[0], Math.max(0.5, r * 0.18));
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}
// Her own marks: a "!" or "?" in a little scallop shell.
function shellMark(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.2 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  for (const mode of ['line', 'fill']) fanAt(ctx, null, mode, 0, 5.4, -Math.PI / 2, 1);
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? CORAL[3] : GOWN[3];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.2);
    ctx.lineTo(0, 0.6);
    ctx.stroke();
    ell(ctx, 0, 2, 0.6, 0.6);
    ctx.fill();
  } else {
    ctx.moveTo(-1.1, -1.2);
    ctx.quadraticCurveTo(-0.9, -2.5, 0.3, -2.4);
    ctx.quadraticCurveTo(1.5, -2.2, 1, -1);
    ctx.quadraticCurveTo(0.2, -0.4, 0.15, 0.6);
    ctx.stroke();
    ell(ctx, 0.15, 2, 0.6, 0.6);
    ctx.fill();
  }
  ctx.restore();
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) bustle(ctx, a, mode, D);
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.maQ;
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
  const hd = headAt(a, D, [0.5, 0]);
  const mo = headAt(a, D, [1, 9]);
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  if (q.bang >= 0 && q.bang < 1.1 && m.hp > 0 && !m.cine) shellMark(ctx, crown[0] + 6, crown[1] - 6, '!', q.bang, 1.1, fl);
  else if (q.huh >= 0 && q.huh < 1.4 && m.hp > 0 && !m.cine) shellMark(ctx, crown[0] + 6, crown[1] - 6, '?', q.huh, 1.4, fl);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'slap') {
    const big = X.big ? 1.5 : 1;
    const v = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 4; i++) curl(ctx, hN[0] + 3 + v * 10 * big + i * 2, hN[1] + 2 - i * 2.5 + v * 3, (1.6 + v * 1.4) * big, 1 - v);
    for (let i = 0; i < 3; i++) bubble(ctx, hN[0] + 4 + i * 3 + v * 8, hN[1] - 4 - v * 8 - i * 2, 0.9, 1 - v);
  } else if (X.kind === 'rap') {
    const v = clamp(u / 0.45, 0, 1);
    for (let i = 0; i < 4; i++) sparkle(ctx, hF[0] + Math.cos(i * 1.6) * (3 + v * 7), hF[1] - 4 + Math.sin(i * 1.6) * (2 + v * 5), 1.6 * (1 - v), 1 - v, '#fff0e8');
    if (u < 0.45) cue(ctx, 'tok!', hF[0] + 8, hF[1] - 10, 6, fl, -0.1, CORAL[3]);
  } else if (X.kind === 'bump') {
    const v = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 3; i++) curl(ctx, 12 + v * 10 + i * 3, -2 - i * 1.5, 2 + v, 0.8 * (1 - v));
    dust(ctx, 8, -1.5, 3 + v * 3, 0.5 * (1 - v), WATER[0], WATER[2]);
  } else if (X.kind === 'tut') {
    if (u < 2.4) cue(ctx, Math.floor(u * 3) % 2 ? 'tsk!' : 'tut!', hd[0] + 20, hd[1] - 26, 6, fl, -0.1, CORAL[3]);
  } else if (X.kind === 'babies') {
    for (let i = 0; i < 4; i++) {
      const ph = (u * 1.3 + i / 4) % 1;
      const p = [hd[0] - 10 + i * 6 + ph * 8 * (i % 2 ? 1 : -1), hd[1] + 18 - ph * 28];
      barnacle(ctx, a, 'line', p, 0.7, i, 1, t, i);
      barnacle(ctx, a, 'fill', p, 0.7, i, 1, t, i);
    }
    if (u < 1.4) cue(ctx, 'Off you go, dears!', hd[0] + 26, hd[1] - 30, 6, fl, -0.08, GOWN[3]);
  } else if (X.kind === 'swell') {
    for (let i = 0; i < 4; i++) {
      const ph = (u * 0.8 + i / 4) % 1;
      bubble(ctx, -16 + i * 10, -4 - ph * 30, 1 + ph * 1.2, Math.sin(Math.PI * ph));
    }
  } else if (X.kind === 'clap') {
    const v = clamp(u / 0.6, 0, 1);
    const mid = [(hN[0] + hF[0]) / 2, (hN[1] + hF[1]) / 2];
    for (let i = 0; i < 5; i++) sparkle(ctx, mid[0] + Math.cos(i * 1.25) * (2 + v * 8), mid[1] + Math.sin(i * 1.25) * (2 + v * 6), 1.7 * (1 - v), 1 - v, '#ffe4dc');
    if (u < 0.6) cue(ctx, 'clap!', mid[0] + 6, mid[1] - 10, 6, fl, -0.1, CORAL[3]);
  } else if (X.kind === 'pearlup') {
    // her pearl held up in her flipper, shining
    ell(ctx, hN[0], hN[1] - 5, 2.4, 2.4);
    ctx.fillStyle = PEARL[1];
    ctx.fill();
    pen(ctx, PEARL[3], 0.5);
    ctx.stroke();
    glow(ctx, hN[0], hN[1] - 5, 6, '#ffffff', 0.5);
    sparkle(ctx, hN[0] + 2, hN[1] - 8, 2 + Math.sin(t * 8) * 0.5, 1, '#ffffff');
  } else if (X.kind === 'splash') {
    const v = clamp(u / 0.8, 0, 1);
    for (let i = 0; i < 5; i++) curl(ctx, 10 + v * 40 + i * 6, -1, 3 + v * 3 - i * 0.3, 1 - v);
    for (let i = 0; i < 4; i++) bubble(ctx, 8 + i * 5 + v * 20, -8 - v * 16 - i * 3, 1.2, 1 - v);
  } else if (X.kind === 'hmph') {
    if (u < 1.2) cue(ctx, 'Hmph!', hd[0] + 18, hd[1] - 26, 7, fl, -0.1, GOWN[3]);
  } else if (X.kind === 'count') {
    const n = ['one', 'two', 'three', 'four', 'five'][X.i];
    if ((u % 1) < 0.8) cue(ctx, n, hd[0] + 20, hd[1] - 24 - (u % 1) * 3, 6, fl, -0.08, GOWN[3]);
  } else if (X.kind === 'huff') {
    const v = clamp(u / 1, 0, 1);
    for (let i = 0; i < 3; i++) dust(ctx, mo[0] + 2 + i * 1.6, mo[1] + 2 + v * 4, 1 + v, 0.45 * Math.sin(Math.PI * v), '#ffffff', '#e2e8f0');
  } else if (X.kind === 'snore') {
    const ph = (u * 0.7) % 1;
    zee(ctx, hd[0] + 14 + ph * 6, hd[1] - 18 - ph * 10, 1.4, Math.sin(Math.PI * ph), fl < 0, GOWN[3], LACE[0]);
  } else if (X.kind === 'rising') {
    for (let i = 0; i < 5; i++) curl(ctx, -24 + i * 12, -2 - Math.sin(u * 4 + i) * 2, 3, 0.8 * Math.sin(Math.PI * clamp(u / 1.8, 0, 1)), i % 2 ? 1 : -1);
    if (u < 1.5) cue(ctx, 'THE TIDE, CHILDREN!', hd[0] + 28, hd[1] - 32, 6, fl, -0.08, GOWN[3]);
  } else if (X.kind === 'spring') {
    const v = clamp(u / 1.2, 0, 1);
    for (let i = 0; i < 6; i++) bubble(ctx, hF[0] + Math.cos(i) * (3 + v * 14), hF[1] - 6 + Math.sin(i * 2) * (3 + v * 8), 1.2, 1 - v);
    if (u < 1.5) cue(ctx, 'SPRING TIDE!', hd[0] + 26, hd[1] - 32, 7, fl, -0.1, CORAL[3]);
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.4, 0, 1);
    for (let i = 0; i < 3; i++) sparkle(ctx, hd[0] - 8 - v * 6 + i * 4, hd[1] - 12 - v * 5 - i * 2.4, 1.5 * (1 - v), 1 - v, '#fff0e8');
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] + 6, 10, t, 3);
    if (u < 0.6) dust(ctx, hd[0] - 2, -1.5, 3.4, 0.6 * (1 - u / 0.6), WATER[0], WATER[2]);
  }
}

const DRESS = {
  id: 'matriarch',
  // (the skin is her gown, sleeves and all; her own hide on her flippers, legs and feet and neck)
  skin: {
    lt: GOWN[0], base: GOWN[1], sh: GOWN[2], deep: GOWN[3], ink: GOWN_INK, guides: false, out: LW,
    parts: {
      leg: { lt: HIDE[0], base: HIDE[1], sh: HIDE[2], deep: HIDE[3] },
      hand: { lt: HIDE[0], base: HIDE[1], sh: HIDE[2], deep: HIDE[3] },
      foot: { lt: HIDE[0], base: HIDE[1], sh: HIDE[2], deep: HIDE[3] },
      neck: { lt: HIDE[0], base: HIDE[1], sh: HIDE[2], deep: HIDE[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      gownFront(ctx, a, mode, D);
      hipTiers(ctx, a, mode, D);
    },
    neckSkin: (ctx, a, mode, S, D) => capelet(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => {
      cuff(ctx, a, mode, D, 'F');
      fan(ctx, a, mode, D);
    },
    handFskin: (ctx, a, mode, S, D) => flipper(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => flipper(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('walrus', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own).
export const MATRIARCH_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 190, 340, 250], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MATRIARCH_SIZE = { w: 62, h: Math.round(R.H * BIG * 1.06), speed: Math.round(R.speed * BIG) };
export { barnacle };
