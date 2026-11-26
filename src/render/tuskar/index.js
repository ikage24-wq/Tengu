// Tuskar the Behemoth on screen (2026-11-26, the Boar Den boss remade as the player's pick "A"):
// TUSKAR, the woolly mammoth calf. The den's self-appointed gate guard: a big, puffed-up young
// mammoth who takes his job far too seriously, brags, toots his trunk like a bugle, and sniffles
// when he's beaten. He moves on his own copy of the creature base (rig.js; body.js `mammoth`: chibi-
// stocky, a barrel body, short thick legs on big round feet, short thick arms), dressed here; his big
// head drawn here from scratch over the mannequin's (the shared face never used).
//   look    snowy wool shaded lilac, a peach face and trunk; three round wool puffs on his crown
//           (each on its own spring, rooted inside it); round ears with rosy insides; a long trunk (a
//           chain of five sprung pieces, curling at the tip, a soft rim of its own colour so it reads
//           over his face); two ivory tusks curving up beside it, a woven root band and a leaf (on a
//           spring) round the near one; a shaggy wool collar over his shoulders (its scalloped hem on
//           springs), a green root sash with a gold acorn badge (GATE GUARD) and a hanging sash end
//           (sprung), a pale belly, shaggy wool cuffs over big round feet with toenails, a tail tuft
//           (sprung); his own soft lilac-grey outline on the outer edge only, his face bare.
//   eyes    tall drop eyes: a frosty teal iris (paler low in it), a navy pupil, a big rounded-square
//           glint and a little round one, a thick cocoa upper lid with one curled lash at the outer
//           corner, a rosy lower lid; fluffy wool brows that do the bragging. Faces: proud (brows up,
//           a smug grin), cross, set (charging), hurt (> <), dizzy (spirals), happy (^ ^), shout,
//           teary, sniffly (teary, a wobbly mouth, his trunk tip twitching), shock, sleepy, talk.
//   idle    a 30 s act while he's calm (it pauses the moment he walks, fights or is in a scene):
//           polishing his near tusk (breathes on it, rubs it with his wool, a sparkle); a tiny
//           practice toot (one small note, very pleased); a salute and a march in place; his trunk up,
//           sniffing about for acorns; shaking the dust out of his wool (a twist this way and that,
//           dust puffing off him).
//   fight   (world/dungeon.js `boar`, world/hollow.js) his swings in turn: Tusk Toss (head down,
//           then up through you, "HUP!"), Trunk Slap (the trunk swung back over his shoulder and
//           whipped down), Shoulder Barge (a lunge, shoulder first); the Gore (m.big): a two-tusk
//           lunge from a deep crouch. Lowering his tusks (m.aim): a deep crouch, tusks level, trunk
//           curled up out of the way, a foot pawing dust, a steam snort ("hrrmph"). The Charge
//           (m.charging): leaning right in, legs pounding, a dust trail; stampeding, he trumpets at
//           each turn. A pillar or the wall (m.hold 'stun'): CLONK, his head snaps back, stars and
//           rubble; then he sits down hard, spiral eyes, his trunk limp, stars wheeling. The Belly
//           Flop (m.move 'flop', 1.4 s warning): a wiggle, a starfish leap ("WHEEE!") timed to land
//           as the warning ends, "WHUMP!", dust rolling out both ways. His Wargs (m.callAt): a short
//           bugle blast from his trunk. Co-op: Woolly Wall (m.coop sides): he puffs up, braced, his
//           wool a shield in front (the wool guard round him: render/coop.js, ./fx.js); Earthquake
//           Stomp (m.coop split): a hop and a two-foot stomp as the ring comes down.
//   moods   hurt: a flinch, eyes squeezed (> <); low on health: teary with a sweat drop; after
//           landing a hit (m.gloatAt): chest out, a proud little toot; beaten: sat back, tusks
//           drooping, his trunk limp in his lap, sniffling.
//   scenes  his acts (m.cine.act): 'trumpet' (the Trumpet Call: reared back, trunk high, one foot
//           up, BWAAOOO!, dust, bark and leaves shaken from the roof), 'salute'; the director's
//           'windup' is his aim, 'attack' a Tusk Toss; the scene moods as faces.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, pulse, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, dustRoll, rubble, steam, sweat, tear, cue, note, splinter, leaf, streak, spring } from './fx.js';

const INK = '#8e84a6';
const WOOL = ['#ffffff', '#eef0f8', '#d2d6e8', '#acb2ca'];
const FACE = ['#fff0e6', '#ffd8c6', '#f0b8a4'];
const EAR = ['#ffd2c4', '#f3a9a0'];
const IVORY = ['#fffdf0', '#fbefc8', '#dcc898'];
const TEAL = ['#bff4ef', '#5cc6cc', '#2a8494', '#22506a'];
const SASH = ['#b7dc9a', '#86b86c', '#5f8f4e'];
const GOLD = ['#fff2a8', '#f4c64a', '#c9922c'];
const LID = '#6a4632';
// (his drawn size over the base's: a boss's bulk)
const BIG = 2.2;
const LW = 2 / BIG;

const paint = (ctx, a, mode, col, w = LW) => {
  if (mode === 'line') {
    pen(ctx, INK, w);
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
// ---------- His head (kid units about his neck joint, drawn 1.3x: a big chibi head) ----------
const HS = 1.3;
const HO = [0, -21];
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};

// The eye: a tall drop. look: gaze; face: mood.
function eye(ctx, a, x, y, side, face, look, k = 1) {
  const w = 4.5 * k;
  const h = 5.8;
  const [lx, ly] = look ?? [0, 0];
  const t = a.t ?? 0;
  if (face === 'dizzy') {
    pen(ctx, tone(a, LID), 0.9);
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
      const an = (i / 36) * TAU * 2.2 + t * 5 * side;
      const r = (i / 36) * 4.6;
      const px = x + Math.cos(an) * r * k;
      const py = y + Math.sin(an) * r * 1.1;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    return;
  }
  if (face === 'hurt' || face === 'shout' || face === 'happy' || face === 'shut') {
    pen(ctx, tone(a, LID), 1.25);
    ctx.beginPath();
    if (face === 'happy') {
      ctx.moveTo(x - w, y + 1);
      ctx.quadraticCurveTo(x, y - 5, x + w, y + 1);
    } else if (face === 'shut') {
      ctx.moveTo(x - w, y);
      ctx.quadraticCurveTo(x, y + 3, x + w, y);
    } else {
      // squeezed: > < (pointing in)
      const s = side;
      ctx.moveTo(x - s * w, y - 3.4);
      ctx.quadraticCurveTo(x + s * w * 0.2, y - 0.6, x + s * w * 0.9, y);
      ctx.quadraticCurveTo(x + s * w * 0.2, y + 0.6, x - s * w, y + 3.4);
    }
    ctx.stroke();
    // the curled lash at the outer corner
    const ox = x + side * w * 0.95;
    pen(ctx, tone(a, LID), 0.8);
    ctx.beginPath();
    ctx.moveTo(ox, y - (face === 'happy' ? 0 : 1.6));
    ctx.quadraticCurveTo(ox + side * 1.6, y - 2.6, ox + side * 1.4, y - 4);
    ctx.stroke();
    return;
  }
  // the white, the iris, the pupil, the glints, clipped to the eye's drop
  const lidY = { angry: 0.42, focus: 0.52, sad: 0.36, sniffly: 0.36, teary: 0.3, smug: 0.46, proud: 0.16, sleepy: 0.6 }[face] ?? 0;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x - w, y - h * 0.25);
    ctx.bezierCurveTo(x - w, y - h * 1.02, x + w, y - h * 1.02, x + w, y - h * 0.25);
    ctx.bezierCurveTo(x + w, y + h * 0.78, x - w, y + h * 0.78, x - w, y - h * 0.25);
  };
  shape();
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = face === 'shock' ? 0.55 : 1;
  const ix = x + lx * 1.4;
  const iy = y + 0.4 + ly * 1.2;
  const g = ctx.createLinearGradient(0, iy - 5, 0, iy + 5);
  g.addColorStop(0, tone(a, TEAL[3]));
  g.addColorStop(0.45, tone(a, TEAL[2]));
  g.addColorStop(1, tone(a, TEAL[1]));
  ell(ctx, ix, iy, 3.7 * k * small, 4.9 * small);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix, iy + 2.4 * small, 2.6 * k * small, 1.6 * small);
  ctx.fillStyle = tone(a, TEAL[0], 0.75);
  ctx.fill();
  ell(ctx, ix, iy - 0.3, 1.8 * k * small, 2.6 * small);
  ctx.fillStyle = tone(a, '#1d3448');
  ctx.fill();
  // the glints: a big rounded square up at the back, a little round one low at the front (wet and
  // wobbling when he's teary)
  const wet = face === 'teary' || face === 'sniffly' || face === 'sad';
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(ix - 2.6 * k * small - side * 0.2, iy - 3.6 * small, 2.3 * small * (wet ? 1.2 : 1), 2.3 * small * (wet ? 1.2 : 1), 0.8);
  ctx.fill();
  ell(ctx, ix + 1.6 * k * small, iy + 2.1 * small, 0.75 * small * (wet ? 1.4 : 1), 0.75 * small * (wet ? 1.4 : 1));
  ctx.fill();
  if (wet) {
    ell(ctx, ix, iy + 3.6, 3.4 * k, 1.1);
    ctx.fillStyle = 'rgba(200,240,255,0.7)';
    ctx.fill();
  }
  // a lid down over the top (cross, set, smug, sad, sleepy)
  const tiltIn = face === 'angry' || face === 'focus' ? 1 : wet ? -1 : 0;
  const yIn = y - h + h * 1.6 * lidY + tiltIn * 1.6;
  const yOut = y - h + h * 1.6 * lidY - tiltIn * 1.2;
  if (lidY > 0) {
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.beginPath();
    ctx.moveTo(x - w * 1.2, y - h * 1.2);
    ctx.lineTo(x + w * 1.2, y - h * 1.2);
    ctx.lineTo(x + w * 1.2, side > 0 ? yOut : yIn);
    ctx.lineTo(x - w * 1.2, side > 0 ? yIn : yOut);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // the lids: a thick cocoa upper line (following the lid when it's down), a rosy lower one
  pen(ctx, tone(a, LID), 1.3);
  ctx.beginPath();
  if (lidY > 0) {
    ctx.moveTo(x - w * 1.02, side > 0 ? yIn : yOut);
    ctx.quadraticCurveTo(x, (yIn + yOut) / 2 - 0.5, x + w * 1.02, side > 0 ? yOut : yIn);
  } else {
    ctx.moveTo(x - w * 1.02, y - h * 0.2);
    ctx.bezierCurveTo(x - w * 0.98, y - h * 0.98, x + w * 0.98, y - h * 0.98, x + w * 1.02, y - h * 0.2);
  }
  ctx.stroke();
  const ox = x + side * w * 1.0;
  const oy = lidY > 0 ? (side > 0 ? yOut : yIn) : y - h * 0.3;
  pen(ctx, tone(a, LID), 0.85);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.quadraticCurveTo(ox + side * 1.7, oy - 0.6, ox + side * 1.6, oy - 2.2);
  ctx.stroke();
  pen(ctx, tone(a, '#d88a7c'), 0.7);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.55, y + h * 0.62);
  ctx.quadraticCurveTo(x, y + h * 0.8, x + w * 0.55, y + h * 0.62);
  ctx.stroke();
}
// A fluffy wool brow: two soft lobes; its tilt and height are the mood (bragging: high, tilted up
// at the outside).
const BROW = { proud: [0.2, -2.8], angry: [-0.5, 0.8], focus: [-0.42, 0.6], hurt: [0.3, 0], sad: [0.45, -0.6], teary: [0.45, -0.8], sniffly: [0.5, -0.6], happy: [0.15, -1.6], shout: [-0.2, -1.8], smug: [0.3, -0.8], shock: [0.1, -2.4], dizzy: [0.2, -0.6], sleepy: [0.1, 0.2], shut: [0.1, 0], talk: [0.2, -1.2] };
function brow(ctx, a, x, y, side, face) {
  const [tilt, up] = BROW[face] ?? [0, 0];
  ctx.save();
  ctx.translate(x, y + up);
  ctx.rotate(-tilt * side);
  smooth(ctx, [[-3.6, 0.8], [-3, -1.4], [-0.6, -2], [0.6, -1.4], [2.4, -2.2], [3.8, -0.4], [3.2, 1.2], [0, 1.4]]);
  ctx.fillStyle = tone(a, WOOL[2]);
  ctx.fill();
  ell(ctx, -0.6, -0.8, 2.2, 0.8);
  ctx.fillStyle = tone(a, WOOL[0]);
  ctx.fill();
  ctx.restore();
}
// His mouth: under the trunk's root on the side he faces.
function mouth(ctx, a, mo, x, y) {
  pen(ctx, tone(a, LID), 0.95);
  if (mo === 'shout' || mo === 'oh' || mo === 'talk') {
    const r = mo === 'shout' ? 3 : mo === 'talk' ? 1.2 + Math.abs(Math.sin((a.t ?? 0) * 9)) * 1.2 : 1.8;
    ell(ctx, x, y + r * 0.6, r * 0.9, r);
    ctx.fillStyle = tone(a, '#a44c52');
    ctx.fill();
    ctx.stroke();
    ell(ctx, x, y + r * 1.15, r * 0.6, r * 0.4);
    ctx.fillStyle = tone(a, '#ff98a0');
    ctx.fill();
    return;
  }
  ctx.beginPath();
  if (mo === 'grin' || mo === 'proud') {
    ctx.moveTo(x - 2.4, y);
    ctx.quadraticCurveTo(x, y + 2.6, x + 2.6, y - 0.6);
  } else if (mo === 'grit') {
    ctx.moveTo(x - 2.6, y + 0.6);
    ctx.lineTo(x + 2.6, y + 0.2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 0.4, 4, 1.2);
    return;
  } else if (mo === 'sad' || mo === 'pout') {
    ctx.moveTo(x - 2.2, y + 1.4);
    ctx.quadraticCurveTo(x, y - 0.6, x + 2.2, y + 1.4);
  } else if (mo === 'wobble') {
    const w = Math.sin((a.t ?? 0) * 14) * 0.5;
    ctx.moveTo(x - 2.4, y + 1 + w);
    ctx.quadraticCurveTo(x - 1.2, y - 0.4 - w, x, y + 0.8);
    ctx.quadraticCurveTo(x + 1.2, y + 2 + w, x + 2.4, y + 0.6);
  } else {
    ctx.moveTo(x - 1.6, y + 0.4);
    ctx.quadraticCurveTo(x, y + 1.6, x + 1.6, y + 0.4);
  }
  ctx.stroke();
  if (mo === 'tongue') {
    ell(ctx, x + 0.6, y + 1.6, 1.3, 1.6);
    ctx.fillStyle = tone(a, '#ff98a0');
    ctx.fill();
  }
}
// The trunk: a chain of five sprung segments from between his eyes, tapering, the tip curling.
function trunkPts(a) {
  const q = a.tkQ ?? {};
  const tr = a.tkTrunk ?? [92, 88, 76, 50, 14];
  const tx = (q.turn ?? 0.35) * 5;
  const pts = [[tx, 3.8]];
  const L = [5.8, 5.6, 5.2, 4.6, 3.8];
  for (let i = 0; i < 5; i++) {
    const an = (tr[i] * Math.PI) / 180;
    const p = pts[pts.length - 1];
    pts.push([p[0] + Math.cos(an) * L[i], p[1] + Math.sin(an) * L[i]]);
  }
  return pts;
}
function trunk(ctx, a, mode) {
  const pts = trunkPts(a);
  const W = [7.4, 6.6, 5.8, 5, 4.4, 4.1];
  const L = [];
  const Rt = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const nx = -Math.sin(an);
    const ny = Math.cos(an);
    L.push([pts[i][0] + (nx * W[i]) / 2, pts[i][1] + (ny * W[i]) / 2]);
    Rt.push([pts[i][0] - (nx * W[i]) / 2, pts[i][1] - (ny * W[i]) / 2]);
  }
  const tip = pts[pts.length - 1];
  const draw = () => {
    ctx.beginPath();
    ctx.moveTo(...L[0]);
    for (let i = 1; i < L.length; i++) ctx.quadraticCurveTo(L[i - 1][0], L[i - 1][1], (L[i - 1][0] + L[i][0]) / 2, (L[i - 1][1] + L[i][1]) / 2);
    ctx.lineTo(...L[L.length - 1]);
    ctx.arc(tip[0], tip[1], W[W.length - 1] / 2, Math.atan2(L[L.length - 1][1] - tip[1], L[L.length - 1][0] - tip[0]), Math.atan2(Rt[Rt.length - 1][1] - tip[1], Rt[Rt.length - 1][0] - tip[0]), false);
    for (let i = Rt.length - 1; i > 0; i--) ctx.quadraticCurveTo(Rt[i][0], Rt[i][1], (Rt[i - 1][0] + Rt[i][0]) / 2, (Rt[i - 1][1] + Rt[i][1]) / 2);
    ctx.lineTo(...Rt[0]);
    ctx.closePath();
  };
  draw();
  if (mode === 'line') {
    pen(ctx, INK, LW / HS);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = tone(a, FACE[1]);
  ctx.fill();
  ctx.save();
  draw();
  ctx.clip();
  // soft wrinkles across it, a light down the top
  pen(ctx, tone(a, FACE[2]), 0.55);
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const nx = -Math.sin(an);
    const ny = Math.cos(an);
    ctx.beginPath();
    ctx.moveTo(p[0] + nx * W[i] * 0.35, p[1] + ny * W[i] * 0.35);
    ctx.quadraticCurveTo(p[0] + Math.cos(an) * 0.8, p[1] + Math.sin(an) * 0.8, p[0] - nx * W[i] * 0.35, p[1] - ny * W[i] * 0.35);
    ctx.stroke();
  }
  glow(ctx, pts[1][0] - 1.6, pts[1][1], 5, FACE[0], 0.7);
  ctx.restore();
  // (a soft deeper rim, so it reads over his face: the trunk's own colour, never the outline)
  draw();
  pen(ctx, tone(a, '#e49c88'), 0.9);
  ctx.stroke();
  // the tip: a soft rosy lip
  ell(ctx, tip[0], tip[1], 1.6, 1.3);
  ctx.fillStyle = tone(a, '#f2a7a0', 0.9);
  ctx.fill();
}
// A tusk: from under the cheek, down, out and curving up; ivory, a soft tip; the near one wears his
// woven root band with a leaf on its own spring.
function tusk(ctx, a, mode, side, near) {
  const q = a.tkQ ?? {};
  const tx = (q.turn ?? 0.35) * 5;
  const sx = side * (near ? 1 : 0.8);
  const r = [tx * 0.5 + side * 10.5, 11];
  const up = q.tuskUp ?? 0;
  const pts = [r, [r[0] + sx * 4.6, r[1] + 9], [r[0] + sx * 10, r[1] + 14.6 - up * 2], [r[0] + sx * 16, r[1] + 11.4 - up * 5], [r[0] + sx * 18.6, r[1] + 3 - up * 8]];
  const W = [5.4, 5, 4.2, 3.2, 1.8];
  const L = [];
  const Rt = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    L.push([pts[i][0] - (Math.sin(an) * W[i]) / 2, pts[i][1] + (Math.cos(an) * W[i]) / 2]);
    Rt.push([pts[i][0] + (Math.sin(an) * W[i]) / 2, pts[i][1] - (Math.cos(an) * W[i]) / 2]);
  }
  const run = (P) => {
    for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
    ctx.lineTo(...P[P.length - 1]);
  };
  const tip = pts[pts.length - 1];
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  run(L);
  ctx.quadraticCurveTo(tip[0] + (tip[0] - pts[3][0]) * 0.5, tip[1] + (tip[1] - pts[3][1]) * 0.5, ...Rt[Rt.length - 1]);
  run([...Rt].reverse());
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, INK, LW / HS);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = tone(a, near ? IVORY[1] : IVORY[2]);
  ctx.fill();
  if (!near) return;
  pen(ctx, tone(a, IVORY[0]), 0.9);
  ctx.beginPath();
  ctx.moveTo(Rt[1][0] - side * 0.3, Rt[1][1] + 0.6);
  ctx.quadraticCurveTo(Rt[2][0] - side * 0.3, Rt[2][1] + 0.6, Rt[3][0] - side * 0.3, Rt[3][1] + 0.6);
  ctx.stroke();
  // the woven root band, two wraps, and a little leaf on its spring
  const b = pts[1];
  for (const dy of [-0.9, 0.9]) {
    ell(ctx, b[0] + side * 0.2, b[1] + dy, 2.6, 0.9, side * 0.6);
    ctx.fillStyle = tone(a, dy < 0 ? '#9a6a4a' : '#b88a62');
    ctx.fill();
  }
  leaf(ctx, b[0] + side * 2.8, b[1] - 0.4, 1.7, side * 0.5 - 0.3 + (a.tkLeaf ?? 0), 1, '#9fd47c');
}
// The topknot: three round wool puffs on short sprung stalks, the middle biggest, one leaning the
// other way; their roots inside his crown.
function topknot(ctx, a, mode) {
  const sw = a.tkTuft ?? [0, 0, 0];
  const flop = (a.tkQ ?? {}).flop ?? 0;
  const puffs = [
    { r: [-4, -20], len: 5.4, rad: 4.6, ang: -2.1 + sw[0] - flop * 0.7 },
    { r: [0.6, -21], len: 7.4, rad: 5.8, ang: -1.5 + sw[1] + flop * 1.2 },
    { r: [5, -20], len: 4.8, rad: 4, ang: -0.85 + sw[2] + flop * 1.5 },
  ];
  for (const L of puffs) {
    const c = [L.r[0] + Math.cos(L.ang) * L.len, L.r[1] + Math.sin(L.ang) * L.len];
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU;
      const rr = L.rad * (i % 2 ? 0.94 : 1.06);
      pts.push([c[0] + Math.cos(an) * rr, c[1] + Math.sin(an) * rr * 0.92]);
    }
    smooth(ctx, pts);
    ctx.moveTo(L.r[0] - 2.6, L.r[1] + 3);
    ctx.quadraticCurveTo(c[0] - 2.4, (c[1] + L.r[1]) / 2, c[0] - 2, c[1]);
    ctx.lineTo(c[0] + 2, c[1]);
    ctx.quadraticCurveTo(c[0] + 2.4, (c[1] + L.r[1]) / 2, L.r[0] + 2.6, L.r[1] + 3);
    ctx.closePath();
    if (mode === 'line') {
      pen(ctx, INK, LW / HS);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, WOOL[1]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      glow(ctx, c[0] - L.rad * 0.3, c[1] - L.rad * 0.35, L.rad * 1.1, WOOL[0], 0.95);
      glow(ctx, c[0] + L.rad * 0.5, c[1] + L.rad * 0.7, L.rad * 0.9, WOOL[2], 0.6);
      ctx.restore();
    }
  }
}
// The skull: a high woolly dome (soft lumps of wool along its top), the cheeks full.
function skullPts() {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const an = (i / 28) * TAU - Math.PI / 2;
    const s = Math.sin(an);
    const c = Math.cos(an);
    const top = Math.max(0, -s);
    const rx = 24.6 - Math.max(0, s) * 4 + top * 0.6;
    const ry = s < 0 ? 24 : 19.5;
    const lump = top > 0.1 && i % 2 ? 1.3 : 0;
    const k = 1 - Math.max(0, s) * 0.18 * Math.max(0, s);
    pts.push([c * (rx + lump) * k, s * (ry + lump)]);
  }
  return pts;
}
function ear(ctx, a, mode, side, out, drop) {
  const flap = a.tkEar?.[side < 0 ? 0 : 1] ?? 0;
  ctx.save();
  ctx.translate(side * 21.5, -3);
  ctx.rotate(side * (0.25 + out * 0.5 + flap) + side * drop * 0.6);
  smooth(ctx, [[0, -9], [side * 7, -12], [side * 13, -6], [side * 13.5, 4], [side * 9, 11], [side * 2, 9], [-side * 2, 2]]);
  paint(ctx, a, mode, WOOL[1], LW / HS);
  if (mode === 'fill') {
    smooth(ctx, [[side * 2, -6], [side * 7.4, -8.4], [side * 11, -4], [side * 11, 3.6], [side * 7.6, 8], [side * 2.6, 6]]);
    ctx.fillStyle = tone(a, EAR[0]);
    ctx.fill();
    glow(ctx, side * 7, 4, 5, EAR[1], 0.5);
  }
  ctx.restore();
}
function head(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
  const q = a.tkQ ?? {};
  const face = q.face ?? 'proud';
  const turn = q.turn ?? 0.35;
  const tx = turn * 5;
  if (part === 'back') {
    // behind the head: the far ear, the far tusk
    ear(ctx, a, mode, -1, q.earOut ?? 0, q.earDrop ?? 0);
    tusk(ctx, a, mode, -1, false);
    ctx.restore();
    return;
  }
  ear(ctx, a, mode, 1, q.earOut ?? 0, q.earDrop ?? 0);
  topknot(ctx, a, mode);
  smooth(ctx, skullPts());
  paint(ctx, a, mode, WOOL[1], LW / HS);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, skullPts());
    ctx.clip();
    glow(ctx, -6, -14, 18, WOOL[0], 0.95);
    glow(ctx, -18, 10, 12, WOOL[2], 0.5);
    // the face: a peach patch of short fur, its top edge under a fringe of uneven wool lumps
    smooth(ctx, [[tx - 17, 2], [tx - 15, -8], [tx - 6, -12], [tx + 6, -12], [tx + 15, -8], [tx + 17, 2], [tx + 14, 13], [tx, 17], [tx - 14, 13]]);
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    glow(ctx, tx - 3, -4, 13, FACE[0], 0.9);
    ctx.fillStyle = tone(a, WOOL[1]);
    for (const [fx, fy, r] of [[-14.5, -8.6, 4.6], [-8.2, -11.6, 5.4], [-1.6, -12.8, 4.2], [4.6, -12, 5.8], [11.6, -9.6, 4.4], [16, -5.2, 3.2]]) {
      ell(ctx, tx + fx, fy - 1.6, r, r * 0.8);
      ctx.fill();
    }
    ctx.restore();
    // cheeks
    const bl = { hurt: 0.75, shout: 0.7, happy: 0.75, sad: 0.65, teary: 0.7, sniffly: 0.75, angry: 0.65, proud: 0.6 }[face] ?? 0.5;
    for (const s of [-1, 1]) {
      ell(ctx, tx + s * 15.2, 7.6, 3.6, 2.2);
      ctx.fillStyle = tone(a, '#ff9e9a', bl * (s > 0 ? 1 : 0.8));
      ctx.fill();
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * 9 + (s < 0 ? -turn * 1.2 : 0), -1, s, face, q.look, s < 0 ? 1 - turn * 0.18 : 1);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * 9.4, -9.6, s, face);
    if (q.sweat) sweat(ctx, tx + 18, -10 + (q.sweat % 1) * 3, 1.5);
    if (q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 12.5, 5 + (((a.t ?? 0) * 1.4) % 1) * 3, 1.1, 0.9);
  }
  // the trunk, then the near tusk over it; his mouth tucked under the trunk's root
  if (mode === 'fill') mouth(ctx, a, q.mouth ?? 'proud', tx + 6.4 + turn * 1.4, 13.6);
  trunk(ctx, a, mode);
  tusk(ctx, a, mode, 1, true);
  ctx.restore();
}

// ---------- His body ----------
// A pale belly on his barrel.
function belly(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const w = D.J.waist;
  ell(ctx, h[0] + 1.5, (h[1] + w[1]) / 2 + 1, 17, 13);
  ctx.fillStyle = tone(a, '#fff8f2', 0.9);
  ctx.fill();
  glow(ctx, h[0] - 4, w[1] - 2, 12, '#ffffff', 0.8);
  // a few soft curls of wool on it
  pen(ctx, tone(a, WOOL[2], 0.7), 0.8);
  for (const [x, y] of [[-8, 4], [3, 8], [10, 1], [-2, -4]]) {
    ctx.beginPath();
    ctx.arc(h[0] + x, (h[1] + w[1]) / 2 + y, 2, 0.4, Math.PI - 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
// The collar: shaggy wool round his shoulders (its scallops on springs), the root sash with its
// acorn badge, and the sash's end hanging at his hip (sprung).
function collar(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const sh = D.J.shN;
  const sf = D.J.shF;
  const cx = (sh[0] + sf[0]) / 2;
  const cy = sh[1] - 1;
  const sw = a.tkHem ?? [0, 0, 0, 0, 0, 0, 0];
  const puff = (a.tkQ ?? {}).puff ?? 0;
  const hem = [];
  const N = 6;
  const halfW = 27 + puff * 4;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = cx - halfW + u * halfW * 2;
    const drop = 9 + Math.sin(u * Math.PI) * 6 + (i % 2 ? 1.8 : -0.4) + (i === 3 ? 1.2 : 0) + puff * 2;
    hem.push([x + (sw[i] ?? 0) * 1.6, cy + drop + Math.abs(sw[i] ?? 0) * 0.4]);
  }
  const pts = [[cx - halfW + 3, cy - 3], [cx - 13, cy - 7 - puff], [cx + 13, cy - 7 - puff], [cx + halfW - 3, cy - 3], [cx + halfW + 1, cy + 4], ...hem.reverse().map(([x, y], i) => [x, y + (i % 2 ? 0 : 1.8)]), [cx - halfW - 1, cy + 4]];
  smooth(ctx, pts);
  paint(ctx, a, mode, WOOL[0], LW);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    glow(ctx, cx - 8, cy - 4, 20, '#ffffff', 0.8);
    glow(ctx, cx + 12, cy + 12, 13, WOOL[2], 0.55);
    ctx.restore();
    // the root sash, across from his far shoulder down to his near hip
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 2);
    ctx.quadraticCurveTo(cx + 2, cy + 11, cx + 18, cy + 29);
    pen(ctx, tone(a, SASH[2]), 5.8);
    ctx.stroke();
    pen(ctx, tone(a, SASH[1]), 4.3);
    ctx.stroke();
    pen(ctx, tone(a, SASH[0]), 1.2);
    ctx.beginPath();
    ctx.moveTo(cx - 17, cy - 3.2);
    ctx.quadraticCurveTo(cx + 2.4, cy + 9.6, cx + 18.6, cy + 27.6);
    ctx.stroke();
    // the gold acorn badge on it
    const bx = cx + 1;
    const by = cy + 9;
    ell(ctx, bx, by + 1.2, 3.4, 3.8);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    pen(ctx, tone(a, GOLD[2]), 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bx, by - 1.6, 4.2, 2.3, 0, Math.PI, TAU);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#d49a3a');
    ctx.fill();
    ctx.stroke();
    ell(ctx, bx - 1.2, by + 0.4, 0.9, 1.4);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
    if ((a.tkQ ?? {}).badge) sparkle(ctx, bx + 2, by - 2, 3, a.tkQ.badge);
  }
  ctx.restore();
}
function sashEnd(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const sw = a.tkSash ?? 0;
  ctx.translate(h[0] + 17, h[1] - 6);
  ctx.rotate(0.15 + sw);
  smooth(ctx, [[-2.6, -1], [2.6, -1], [3, 8], [2.2, 13], [0, 15.4], [-2.2, 13], [-3, 8]]);
  paint(ctx, a, mode, SASH[1], LW);
  if (mode === 'fill') {
    pen(ctx, tone(a, SASH[0]), 0.9);
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(-1.2, 12);
    ctx.stroke();
    ell(ctx, 0, 15, 1.8, 1.4);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
  }
  ctx.restore();
}
// Shaggy wool cuffs over his big round feet, and round toenails.
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  const pts = [[p[0] - 9, p[1] - 3], [p[0] - 6.4, p[1] - 6.6], [p[0] - 2, p[1] - 5.6], [p[0] + 2.4, p[1] - 7], [p[0] + 7, p[1] - 5.4], [p[0] + 9.6, p[1] - 2.4], [p[0] + 8.6, p[1] + 1.6], [p[0] + 4, p[1] + 3], [p[0] - 1, p[1] + 2], [p[0] - 6, p[1] + 3.2], [p[0] - 9.4, p[1] + 1]];
  smooth(ctx, pts);
  paint(ctx, a, mode, near ? WOOL[0] : WOOL[2], LW);
  if (mode === 'fill') {
    glow(ctx, p[0] - 2, p[1] - 4, 6, '#ffffff', near ? 0.8 : 0.3);
    ctx.fillStyle = tone(a, IVORY[near ? 0 : 2]);
    for (const dx of [-4.6, 0, 4.6]) {
      ell(ctx, p[0] + dx + 2, p[1] + 6.4, 1.9, 1.4);
      ctx.fill();
    }
  }
  ctx.restore();
}
// The tail tuft, on its spring, rooted inside his rump.
function tailTuft(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const p = D.J.hip;
  const w = a.tkTail ?? 0;
  ctx.translate(p[0] - 21, p[1] + 1);
  ctx.rotate(-0.6 - w);
  smooth(ctx, [[2, -1.6], [-6, -2.2], [-10.4, -4.4], [-12.4, 0], [-10.2, 4], [-6, 2.2], [2, 1.6]]);
  paint(ctx, a, mode, WOOL[2], LW);
  ctx.restore();
}

// ---------- His act and his fight (on the base's channels) ----------
// His swings, in turn (m.move read only as a name).
const SWINGS = ['toss', 'slap', 'barge'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.tkN ?? 0) % SWINGS.length]);
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { face: 'proud', mouth: 'proud', look: [0.3, 0], turn: 0.35, earOut: 0, earDrop: 0, flop: 0, tuskUp: 0, sweat: 0, fx: null, puff: 0, badge: 0 };
  a.tkQ = q;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (f, mo, k = 1) => {
    if (k > 0.4) {
      q.face = f;
      if (mo) q.mouth = mo;
    }
  };
  const HANG = [92, 88, 76, 50, 14];
  let trunkGoal = HANG.map((v, i) => v + (i < 3 ? Math.sin(t * 1.1) * 4 : 0));
  const trunkTo = (g, k = 1) => {
    if (k > 0.001) trunkGoal = trunkGoal.map((v, i) => v + (g[i] - v) * k);
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.6);
  const mood = m.cine?.mood;
  const frac = m.hp / m.def.hp;
  const low = m.hp > 0 && frac < 0.3;
  // (a scene's acts)
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  // ---- his state in the fight ----
  const stun = m.hp > 0 && m.hold === 'stun' && (m.frozenUntil ?? 0) > now;
  if (stun && !st.tkStun) st.tkStunAt = now;
  st.tkStun = stun;
  const stunU = stun ? now - (st.tkStunAt ?? now) : -1;
  const flop = m.move?.kind === 'flop' ? now - m.move.at : -1;
  const ch = m.charging;
  if (ch && st.tkChDir != null && ch.dir !== st.tkChDir) st.tkTurnAt = now;
  st.tkChDir = ch ? ch.dir : null;
  const turnU = ch ? now - (st.tkTurnAt ?? -9) : -1;
  const call = m.callAt != null ? now - m.callAt : -1;
  const goring = m.big != null && now > m.big - 1 && now < m.big + 0.9;
  // (a swing: the next in turn picked as it begins, kept until it's done)
  const since = now - (m.attackAt ?? -9);
  const anticK = m.windup > 0 && !goring ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !goring && (anticK > 0 || (since >= 0 && since < 0.8));
  if (swinging && !st.tkAtk) {
    st.tkN = (st.tkN ?? (m.uid ?? 0)) + 1;
    st.tkPick = pickSwing(m, st);
  }
  st.tkAtk = swinging;
  const coop = m.coop?.mechs ?? [];
  const wall = coop.find((s) => s.def.kind === 'sides');
  const stomp = coop.find((s) => s.def.kind === 'split' && s.ring);
  const gloat = now - (m.gloatAt ?? -9);
  const hurtU = a.hurtAgo ?? 9;
  const sceneTrumpet = act?.move === 'trumpet' && actU >= 0 && actU < (act.dur ?? 1.8) + 0.3;
  const sceneSalute = act?.move === 'salute' && actU >= 0 && actU < (act.dur ?? 1.4) + 0.2;
  const sceneAim = m.cine && m.windup > 0;
  const busy = m.hp <= 0 || stun || flop >= 0 || ch || m.aim || (call >= 0 && call < 1.6) || goring || swinging || wall?.guard || stomp || sceneTrumpet || sceneSalute || sceneAim;

  // Standing proud: chest out, chin up, stubby arms angled out from his belly, feet planted wide.
  go({ tilt: -2, chest: -3 + breath * 0.8, head: -3 + Math.sin(t * 0.8), shN: -28, elN: -26, shF: 26, elF: 24, fxN: 0.12, fxF: -0.1 }, 1 - walkW);
  // Walking: a heavy proud stride, his arms still angled out, the trunk swinging with his steps.
  if (walkW > 0.01) {
    out.shN = (out.shN ?? 0) - 18 * walkW;
    out.shF = (out.shF ?? 0) + 18 * walkW;
    out.head = (out.head ?? 0) - 2 * walkW;
    trunkTo([94 + Math.sin(t * 6) * 8, 86 + Math.sin(t * 6 - 0.8) * 10, 70, 44, 10], walkW);
    q.turn = mix(q.turn, 0.6, walkW);
  }
  if (m.engaged || (m.aggroUntil ?? 0) > now) say('angry', 'grit');
  if (m.aggroUntil === Infinity) say('angry', 'grit');
  if (gloat >= 0 && gloat < 1.4 && m.hp > 0 && !busy) {
    // after landing a hit: chest out, a proud little toot
    const k = win(gloat, 0, 0.2, 1, 1.4);
    go({ tilt: -6, chest: -8, head: -10 }, k);
    trunkTo([40, 0, -30, -50, -70], k);
    say('happy', 'grin', k);
    if (k > 0.3) q.fx = { kind: 'toot', u: gloat };
  }
  if (m.hp <= 0) {
    // beaten: sat back, tusks drooping, his trunk limp in his lap, sniffling
    go({ drop: 1, tilt: -22, head: 26, shN: -16, elN: 20, shF: 16, elF: -20, fxN: 0.7, fxF: 0.6, x: -0.02, pelvis: 0, waist: 0 });
    trunkTo([96, 104, 110, 120, 150]);
    q.face = 'sniffly';
    q.mouth = 'wobble';
    q.turn = 0.15;
    q.flop = 1;
    q.earDrop = 1;
    q.tuskUp = -0.4;
    q.tears = true;
    q.fx = { kind: 'beaten', u: now - (st.tkDeadAt ??= now) };
  } else st.tkDeadAt = undefined;

  if (m.hp > 0) {
    if (stun) {
      if (stunU < 0.5) {
        // CLONK: snapped back off the pillar (or the wall), arms flung out, eyes squeezed
        const u = sstep(stunU / 0.1);
        const back = 1 - sstep((stunU - 0.25) / 0.25);
        go({ tilt: 24 - 44 * u, head: 18 - 44 * u, x: -0.06 * u, drop: 0.1, shN: -80 * u, elN: -20, shF: 80 * u, elF: 20, fxN: 0.2, fxF: -0.3, hop: 0.03 * u * back });
        trunkTo([40, -10, -60, -100, -150]);
        q.face = 'hurt';
        q.mouth = 'shout';
        q.turn = 1;
        q.earOut = 1;
        q.flop = 0.6 * u;
        q.fx = { kind: 'crash', u: stunU };
      }
      if (stunU >= 0.35) {
        // sat down hard, swaying, stars going round, his trunk limp
        const k = sstep((stunU - 0.35) / 0.3);
        const sw = Math.sin(t * 2.2);
        go({ drop: 1, tilt: -8 + sw * 5, head: 10 - sw * 6, shN: -40, elN: 20, shF: 36, elF: -20, fxN: 0.6, fxF: 0.4, x: -0.02 }, k);
        trunkTo([96, 100, 104, 80, 40], k);
        if (k > 0.5) {
          q.face = 'dizzy';
          q.mouth = 'tongue';
          q.turn = 0.2;
          q.flop = 1;
          q.earDrop = 0.7;
          q.fx = { kind: 'dazed', u: stunU };
        }
      }
    } else if (flop >= 0) {
      const warn = m.move.warn ?? 1.4;
      const lift0 = warn - 0.55;
      if (flop < lift0) {
        // the wiggle: arms out, a little crouch, his rump wiggling, a cheeky grin
        const k = sstep(flop / 0.25);
        const wig = Math.sin(flop * 16);
        go({ drop: 0.3 * k, tilt: 4, pelvis: wig * 6 * k, waist: -wig * 4 * k, head: -6, shN: -70, elN: -20, shF: 70, elF: 20, fxN: 0.2, fxF: -0.2 }, 1);
        trunkTo([60, 20, -10, -40, -70], k);
        q.face = 'smug';
        q.mouth = 'grin';
        q.turn = 0.7;
        q.fx = { kind: 'wiggle', u: flop };
      } else if (flop < warn) {
        // WHEEE: the starfish leap, up and over, coming down belly first as the warning ends
        const u = (flop - lift0) / (warn - lift0);
        go({ hop: 0.34 * Math.sin(Math.PI * u), tilt: mix(-6, 64, sstep((u - 0.25) / 0.75)), head: -14, shN: -112, elN: -10, shF: 112, elF: 10, fxN: -0.2, fyN: -0.26, fxF: -0.4, fyF: -0.22, drop: 0 });
        trunkTo([30, -6, -36, -60, -86]);
        q.face = 'shout';
        q.mouth = 'shout';
        q.turn = 0.9;
        q.earOut = 1;
        q.fx = { kind: 'flopAir', u };
      } else {
        // WHUMP: flat on his belly, wool splayed, the dust rolling out both ways; then up again
        const u = flop - warn;
        const up = sstep((u - 0.5) / 0.3);
        go({ tilt: 70, drop: 1, head: -30, shN: -100, elN: -20, shF: 100, elF: 20, fxN: -0.4, fxF: -0.6 }, 1 - up);
        trunkTo([0, -10, -20, -40, -70], 1 - up);
        q.face = up > 0.5 ? 'proud' : 'happy';
        q.mouth = 'grin';
        q.turn = 0.9;
        q.earOut = 1;
        q.fx = { kind: 'flopLand', u };
      }
    } else if (ch) {
      // the rush: leaning right in, head down, legs pounding, wool and ears streaming
      go({ tilt: 30, head: 24, shN: 40, elN: -70, shF: -40, elF: 70, drop: 0.12 }, 0.85);
      trunkTo([70, 40, 0, -40, -80]);
      q.face = 'focus';
      q.mouth = 'grit';
      q.look = [1, 0.3];
      q.turn = 1;
      q.earOut = 1;
      q.fx = { kind: 'rush', u: now };
      if (turnU >= 0 && turnU < 0.8) {
        // stampeding: a trumpet at each turn, trunk flung up
        const k = win(turnU, 0, 0.12, 0.55, 0.8);
        go({ tilt: 10, head: -12 }, k);
        trunkTo([20, -10, -40, -62, -84], k);
        if (k > 0.4) {
          q.face = 'shout';
          q.mouth = 'shout';
          q.fx = { kind: 'turnToot', u: turnU };
        }
      }
    } else if (m.aim || sceneAim) {
      // lowering his tusks down the lane: a deep crouch, head down, tusks level, trunk curled up
      // out of the way, his near foot pawing the floor, snorting steam
      const paw = Math.sin(now * 9);
      go({ drop: 0.46, tilt: 22, head: 18, shN: -14, elN: 40, shF: 10, elF: -30, fxN: 0.32 + paw * 0.12, fyN: -0.08 + Math.min(0, paw) * 0.1, fxF: -0.3 });
      trunkTo([50, 10, -30, -70, -110]);
      q.face = 'focus';
      q.mouth = 'grit';
      q.look = [1, 0.2];
      q.turn = 0.95;
      q.earOut = 0.8;
      q.fx = { kind: 'aim', u: now };
    } else if (call >= 0 && call < 1.6) {
      // his Wargs: reared back, a short bugle blast from his trunk
      const k = win(call, 0, 0.2, 1.2, 1.6);
      go({ tilt: -12, chest: -8, head: -16, shN: -120, elN: -60, shF: 40, elF: 30, fyF: -0.1 }, k);
      trunkTo([10, -24, -52, -70, -96], k);
      say('shout', 'shout', k);
      q.turn = 0.8;
      q.earOut = k;
      if (k > 0.3) q.fx = { kind: 'bugle', u: call };
    } else if (goring) {
      // the Gore: a deep crouch, both tusks levelled, then a lunge right through you
      const wind = m.windup > 0 ? clamp(1 - m.windup / 0.9, 0, 1) : 1;
      const s = since >= 0 && since < 0.8 ? since : -1;
      const hitK = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.35) / 0.4)) : 0;
      go({ drop: 0.5 * sstep(wind / 0.6) * (1 - hitK * 0.6), tilt: 14 + 22 * hitK, head: 22, x: -0.03 * (1 - hitK) + 0.12 * hitK, shN: 30 - 60 * hitK, elN: -40, shF: -30, elF: 40, fxN: 0.3, fxF: -0.35 });
      trunkTo([40, 0, -40, -80, -120]);
      q.face = hitK > 0.3 ? 'shout' : 'angry';
      q.mouth = hitK > 0.3 ? 'shout' : 'grit';
      q.turn = 1;
      q.earOut = 0.6 + 0.4 * hitK;
      q.fx = { kind: s >= 0 ? 'gore' : 'snort', u: s >= 0 ? s : now };
    } else if (swinging) {
      const kind = st.tkPick ?? 'toss';
      const hitK = since >= 0 ? (since < 0.07 ? sstep(since / 0.07) : 1 - sstep((since - 0.25) / 0.5)) : 0;
      const wK = since >= 0 ? 1 - hitK : sstep(anticK);
      if (kind === 'toss') {
        // Tusk Toss: head down and drawn back, then flung up through you, HUP!
        go({ drop: 0.38, tilt: 16, head: 20, shN: 34, elN: -30, shF: -30, elF: 30, fxN: 0.3, fxF: -0.25, x: -0.02 }, wK);
        go({ drop: 0, tilt: -8, head: -24, shN: -46, elN: -30, shF: 40, elF: 30, fxN: 0.3, fxF: -0.25, x: 0.05, hop: 0.03 }, hitK);
        trunkTo([40, 10, -20, -50, -80], wK);
        trunkTo([20, -20, -50, -70, -90], hitK);
        q.tuskUp = 0.8 * hitK;
      } else if (kind === 'slap') {
        // Trunk Slap: the trunk swung back over his shoulder, then whipped down in front
        go({ tilt: -6, head: -8, turnC: -0.4, shN: -40, elN: -40, shF: 30, elF: 20 }, wK);
        go({ tilt: 14, head: 14, turnC: 0.4, x: 0.04, shN: -20, elN: -10, shF: 40, elF: 30 }, hitK);
        trunkTo([-60, -120, -160, -190, -210], wK);
        trunkTo([10, 20, 40, 70, 100], hitK);
      } else {
        // Shoulder Barge: drawn back, then a lunge, shoulder first
        go({ tilt: -10, head: -4, x: -0.03, turnC: -0.5, shN: 20, elN: -60, shF: -20, elF: 60 }, wK);
        go({ tilt: 22, head: 10, x: 0.1, turnC: 0.6, hop: 0.03, shN: 40, elN: -80, shF: -40, elF: 60, fxN: 0.35, fxF: -0.35 }, hitK);
        trunkTo([70, 40, 0, -40, -80]);
      }
      q.face = hitK > 0.3 ? (kind === 'toss' ? 'shout' : 'hurt') : 'angry';
      if (kind !== 'toss' && hitK > 0.3) q.face = 'shout';
      q.mouth = hitK > 0.3 ? 'shout' : 'grit';
      q.turn = 0.9;
      q.earOut = 0.6 + 0.4 * hitK;
      q.fx = { kind: since >= 0 ? kind : 'snort', u: since >= 0 ? since : now };
    } else if (wall?.guard) {
      // Woolly Wall: puffed up, braced, arms crossed over his wool, chin tucked, tusks out front
      const last = (wall.hits?.[1] ?? -9) > (wall.hits?.[-1] ?? -9) ? 1 : -1;
      const lit = now - Math.max(wall.hits?.[1] ?? -9, wall.hits?.[-1] ?? -9) < 1.2 ? 1 : 0;
      go({ drop: 0.2, tilt: 8 + last * 4 * lit, head: 14, shN: 20, elN: 110, shF: -20, elF: -110, fxN: 0.3, fxF: -0.3 });
      trunkTo([60, 30, -10, -50, -90]);
      q.face = 'angry';
      q.mouth = 'grit';
      q.turn = 0.8;
      q.earOut = 0.7;
      q.puff = 1;
      q.fx = { kind: 'woolwall', u: now };
    } else if (stomp) {
      // Earthquake Stomp: arms pumping, a hop, and down on both feet as the ring comes down
      const u = clamp(stomp.ring.t / stomp.ring.warn, 0, 1);
      const pump = Math.sin(now * 8) * (1 - sstep((u - 0.6) / 0.15));
      const hopU = clamp((u - 0.72) / 0.24, 0, 1);
      go({ drop: 0.25 + 0.1 * pump, tilt: 4, head: -6, shN: -80 + pump * 20, elN: -60, shF: 80 - pump * 20, elF: 60, hop: 0.16 * Math.sin(Math.PI * hopU), fyN: -0.15 * Math.sin(Math.PI * hopU), fyF: -0.15 * Math.sin(Math.PI * hopU) });
      trunkTo([40, 0, -30, -60, -90]);
      q.face = u > 0.9 ? 'shout' : 'angry';
      q.mouth = u > 0.9 ? 'shout' : 'grit';
      q.turn = 0.6;
      q.fx = { kind: 'stomp', u };
    } else if (sceneTrumpet) {
      // the Trumpet Call: reared back, trunk up high, one foot up, a blast that shakes the roots
      const k = win(actU, 0, 0.3, (act.dur ?? 1.8) - 0.1, (act.dur ?? 1.8) + 0.3);
      go({ tilt: -12, chest: -8, head: -14, shN: -150, elN: -40, shF: 30, elF: 30, fyN: -0.32, fxN: 0.2, fxF: -0.1 }, k);
      trunkTo([20, -10, -40, -62, -84], k);
      say('shout', 'shout', k);
      q.turn = 1;
      q.earOut = k;
      if (k > 0.3) q.fx = { kind: 'trumpet', u: actU };
    } else if (sceneSalute) {
      const k = win(actU, 0, 0.25, (act.dur ?? 1.4) - 0.1, (act.dur ?? 1.4) + 0.2);
      go({ tilt: -4, chest: -6, head: -6, shN: -160, elN: -96, hwN: 30 }, k);
      say('proud', 'grin', k);
      q.badge = k;
    } else if (hurtU < 0.45) {
      // a flinch, eyes squeezed, a tuft of wool knocked loose
      const k = 1 - sstep(hurtU / 0.45);
      go({ tilt: -8, head: -12, x: -0.02, shN: -50, shF: 40 }, k);
      say('hurt', 'shout', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    // his idle act: only when he's calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.aggroUntil === Infinity || m.engaged || busy ? 0 : 1);
    if (calmK > 0.02 && !q.fx) idleAct(m, a, out, go, trunkTo, q, calmK, t);
    // a scene's mood as his face
    if (mood && !busy) {
      q.face = { angry: 'angry', happy: 'happy', sad: 'teary', talk: 'proud', sleep: 'shut', blink: 'shut', hurt: 'hurt' }[mood] ?? q.face;
      q.mouth = { angry: 'grit', happy: 'grin', sad: 'wobble', talk: 'talk', sleep: 'pout', blink: 'pout', hurt: 'shout' }[mood] ?? q.mouth;
      if (mood === 'angry') go({ head: 6, tilt: 4 }, 1);
      if (mood === 'sad') {
        go({ head: 14 }, 1);
        q.tears = true;
        q.earDrop = 0.7;
      }
      if (mood === 'talk') q.turn = 0.5;
    }
    // low on health: teary, a sweat drop (unless a move has his face)
    if (low && !busy) {
      q.face = mood === 'angry' || m.engaged ? 'teary' : 'sniffly';
      q.mouth = 'wobble';
      q.sweat = (t * 0.6) % 1;
    } else if (low) q.sweat = (t * 0.6) % 1;
  }
  // springs: each trunk segment trails the last; the topknot puffs; the collar's scallops; the sash
  // end; the tail tuft; the tusk band's leaf; the ears
  const kick = (st.tkLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.tkLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.5;
  st.tkLast = out.head;
  st.tkLastT = out.tilt;
  const sniff = q.face === 'sniffly' ? Math.sin(t * 11) * 3 * win(t % 2.6, 0, 0.1, 0.5, 0.7) : 0;
  a.tkTrunk = trunkGoal.map((g, i) => spring(st, `tr${i}`, g + (i > 0 ? Math.sin(t * 1.3 - i * 0.6) * 2 : 0) + (i > 2 ? sniff : 0), 90 - i * 12, 9 - i * 0.8, dt, (kick * 6 * (i + 1)) / 5));
  a.tkTuft = [0, 1, 2].map((i) => spring(st, `tf${i}`, Math.sin(t * 1.7 + i * 1.3) * 0.08, 70 + i * 14, 6, dt, kick * 0.02 * (i + 1)));
  a.tkHem = [0, 1, 2, 3, 4, 5, 6].map((i) => spring(st, `hm${i}`, Math.sin(t * 1.4 + i * 0.9) * 0.4 - (out.tilt ?? 0) * 0.04, 80 + i * 6, 7, dt, kick * 0.03));
  a.tkSash = spring(st, 'sash', Math.sin(t * 1.2) * 0.06 - (out.tilt ?? 0) * 0.012 + walkW * Math.sin(t * 6) * 0.15, 60, 5, dt, kick * 0.01);
  a.tkTail = spring(st, 'tail', Math.sin(t * 2.2) * 0.25 + walkW * Math.sin(t * 6 + 1) * 0.3, 50, 4, dt, kick * 0.01);
  a.tkLeaf = spring(st, 'leaf', Math.sin(t * 1.9) * 0.15, 70, 5, dt, kick * 0.03);
  a.tkEar = [0, 1].map((i) => spring(st, `ear${i}`, Math.sin(t * 0.9 + i * 2) * 0.04 + (ch ? Math.sin(t * 14 + i) * 0.12 : 0), 60, 5, dt, kick * 0.008));
}
// The 30 s act: polishing his tusk; a tiny practice toot; a salute and a march in place; trunk up,
// sniffing for acorns; shaking the dust out of his wool.
function idleAct(m, a, out, go, trunkTo, q, w, t) {
  const lu = (t + (m.uid % 7) * 3.1) % 30;
  const at = (k) => k * w > 0.5;
  // polishing his near tusk: a breath on it, a rub with his wool, a sparkle
  const pol = win(lu, 0.4, 1, 5.4, 6);
  if (pol > 0.01) {
    const rub = Math.sin(t * 9) * sstep((lu - 2) / 0.4);
    go({ shN: -98 + rub * 8, elN: -118 - rub * 6, hwN: 10, tilt: -4, head: -8, chest: -5 }, pol * w);
    trunkTo([70, 40, 10, -16, -40], pol * w);
    if (at(pol)) {
      q.face = lu < 2 ? 'happy' : 'proud';
      q.mouth = lu < 2 ? 'oh' : 'grin';
      q.turn = 0.55;
      q.fx = { kind: 'polish', u: lu };
    }
  }
  // a tiny practice toot: trunk up, one small note, very pleased with himself
  const toot = win(lu, 6.4, 7, 10.6, 11.2);
  if (toot > 0.01) {
    go({ tilt: -6, chest: -6, head: -12 }, toot * w);
    trunkTo([20, -10, -40, -62, -84], toot * w);
    if (at(toot)) {
      q.face = lu < 9 ? 'shut' : 'happy';
      q.mouth = 'grin';
      q.turn = 0.8;
      q.fx = { kind: 'toot', u: lu - 7.4 };
    }
  }
  // a salute and a march in place, knees up
  const mar = win(lu, 11.6, 12.2, 17.4, 18);
  if (mar > 0.01) {
    const step = Math.sin(t * 5.4);
    go({ shN: -160, elN: -96, hwN: 30, tilt: -4, chest: -6, head: -6, fyN: -Math.max(0, step) * 0.3, fyF: -Math.max(0, -step) * 0.3, lift: Math.abs(step) * 0.008 }, mar * w);
    if (at(mar)) {
      q.face = 'proud';
      q.mouth = 'grin';
      q.badge = Math.max(0, Math.sin(t * 2));
    }
  }
  // trunk up, sniffing about for acorns, this way and that
  const sn = win(lu, 18.4, 19, 23.6, 24.2);
  if (sn > 0.01) {
    const look = Math.sin(t * 1.4);
    go({ head: -10 + look * 4, tilt: -2, turnC: look * 0.15 }, sn * w);
    trunkTo([40 + look * 20, 0 + look * 20, -30 + Math.sin(t * 7) * 10, -50, -70 + Math.sin(t * 9) * 16], sn * w);
    if (at(sn)) {
      q.face = 'shut';
      q.mouth = 'pout';
      q.turn = 0.4 + look * 0.4;
      q.fx = { kind: 'sniff', u: lu - 19 };
    }
  }
  // shaking the dust out of his wool: a twist this way and that, dust puffing off him
  const sh = win(lu, 24.6, 25, 28.8, 29.4);
  if (sh > 0.01) {
    const tw = Math.sin(t * 13);
    go({ turnC: tw * 0.5, turnP: -tw * 0.3, head: tw * 6, tilt: 2, shN: -60, shF: 60 }, sh * w);
    trunkTo([92 + tw * 30, 80 - tw * 30, 60, 40, 10], sh * w);
    if (at(sh)) {
      q.face = 'shut';
      q.mouth = 'grin';
      q.flop = 0.3;
      q.fx = { kind: 'shake', u: lu - 25 };
    }
  }
}

// ---------- Effects in the room (the rig's space, facing right) ----------
function fx(ctx, m, a, S, matOf, D) {
  const q = a.tkQ;
  if (!q?.fx) return;
  // (in game px: the rig's points scaled up by his size, the room's own numbers as they are)
  ctx.save();
  ctx.scale(1 / BIG, 1 / BIG);
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const X = q.fx;
  const t = a.t ?? 0;
  const u = X.u;
  // (words read left to right whichever way he faces)
  const f = a.flip ? -1 : 1;
  const B = (p) => [p[0] * BIG, p[1] * BIG];
  const hd = B(headAt(a, D, [8, 4]));
  const crown = B(headAt(a, D, [0, -22]));
  const tip = B(headAt(a, D, trunkPts(a).pop()));
  const tuskTip = B(headAt(a, D, [(q.turn ?? 0.35) * 2.5 + 29, 14 - (q.tuskUp ?? 0) * 8]));
  const foot = B(D.at(a, 'footN', [0, 0]));
  const chest = B(D.at(a, 'chest', [0, 0]));
  if (X.kind === 'polish') {
    if (u < 2) steam(ctx, tuskTip[0] - 4, tuskTip[1] - 2, 3.4, 0.7 * win(u, 0.6, 1, 1.8, 2.2));
    const sp = win(u, 4.4, 4.6, 5.3, 5.6);
    sparkle(ctx, tuskTip[0] + 1, tuskTip[1] - 4, 4, sp);
    sparkle(ctx, tuskTip[0] - 6, tuskTip[1] + 2, 2.4, sp * 0.7);
  } else if (X.kind === 'toot') {
    if (u > 0 && u < 2) note(ctx, tip[0] + 3 + u * 6, tip[1] - 4 - u * 8, 2.6, 0.2, 1 - sstep((u - 1.4) / 0.6));
    if (u > 0 && u < 1) cue(ctx, 'toot!', tip[0] + 8, tip[1] - 12, 7, f, -0.1);
  } else if (X.kind === 'sniff') {
    const s = win(u % 1.4, 0, 0.1, 0.3, 0.5);
    steam(ctx, tip[0] + 2, tip[1] - 2, 2, 0.5 * s);
    if (u > 2.4) cue(ctx, 'acorns?', hd[0] + 22, hd[1] - 30, 7, f, -0.1);
  } else if (X.kind === 'shake') {
    for (let i = 0; i < 5; i++) {
      const v = (u * 1.6 + i / 5) % 1;
      const side = i % 2 ? 1 : -1;
      dust(ctx, chest[0] + side * (18 + v * 18), chest[1] - 6 + i * 6 - v * 6, 2.6 + v * 2, (1 - v) * 0.7);
    }
  } else if (X.kind === 'snort') {
    steam(ctx, tip[0] + 3, tip[1] - 2, 3, 0.75);
    steam(ctx, tip[0] + 7, tip[1] - 5, 2.2, 0.5);
    dust(ctx, foot[0] + 4, -1.5, 3.4, 0.6);
  } else if (X.kind === 'toss' || X.kind === 'gore' || X.kind === 'slap' || X.kind === 'barge') {
    if (u > -0.05 && u < 0.5) {
      const k = clamp(u / 0.4, 0, 1);
      const at = X.kind === 'slap' ? tip : X.kind === 'barge' ? [chest[0] + 26, chest[1]] : tuskTip;
      for (let i = 0; i < 4; i++) sparkle(ctx, at[0] + 6 + Math.cos(i * 1.7) * 7 * (0.4 + k), at[1] - 4 + Math.sin(i * 1.7) * 6 * (0.4 + k), 2.6, 1 - k * 0.6);
      const word = { toss: 'HUP!', gore: 'HRAAH!', slap: 'THWAP!', barge: 'OOF!' }[X.kind];
      cue(ctx, word, hd[0] + 30, hd[1] - 18, 10, f, -0.1);
    }
    dust(ctx, foot[0] + 10, -2, 4.4, 0.7 * (1 - clamp(u / 0.6, 0, 1)));
  } else if (X.kind === 'aim') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 1.4 + i / 3) % 1;
      dust(ctx, foot[0] - 6 - v * 16, -2 - v * 5, 2.4 + v * 2, (1 - v) * 0.8);
    }
    steam(ctx, tip[0] - 3, tip[1] - 3, 3, 0.6 + 0.3 * Math.sin(t * 6));
    cue(ctx, 'hrrmph', hd[0] - 34, hd[1] - 16, 8, f, -0.1);
  } else if (X.kind === 'rush' || X.kind === 'turnToot') {
    for (let i = 0; i < 6; i++) {
      const v = (u * 2.2 + i / 6) % 1;
      dust(ctx, -18 - v * 44, -2 - v * 4, 3 + v * 4, (1 - v) * 0.85);
    }
    for (let i = 0; i < 4; i++) {
      const y = -22 - i * 15;
      streak(ctx, -66 - (i % 2) * 8, y, -36 - (i % 2) * 10, y, 1.4, 0.5);
    }
    if (X.kind === 'turnToot') {
      for (let i = 0; i < 3; i++) note(ctx, tip[0] + 4 + i * 7, tip[1] - 6 - i * 6, 2.6, 0.2, 1 - u);
      cue(ctx, 'BWAAOOO!', tip[0] + 10, tip[1] - 14, 10, f, -0.12);
    }
  } else if (X.kind === 'crash') {
    // CLONK: stars and sparkles burst off whatever he hit, rubble and dust come down
    const k = clamp(u / 0.25, 0, 1);
    const cx = 36;
    const cy = -66;
    for (let i = 0; i < 5; i++) {
      const an = -2.6 + i * 0.6;
      if (i % 2) sparkle(ctx, cx + Math.cos(an) * 14 * (0.4 + k), cy + Math.sin(an) * 12 * (0.4 + k), 3, 1 - k * 0.3);
      else star(ctx, cx + Math.cos(an) * 14 * (0.4 + k), cy + Math.sin(an) * 12 * (0.4 + k), 3.2, an, 1 - k * 0.3);
    }
    for (let i = 0; i < 5; i++) rubble(ctx, cx - 4 + hash(i) * 14, cy - 30 + k * (20 + hash(i + 2) * 34), 1.8 + hash(i + 4) * 1.6, i + k * 3);
    dust(ctx, cx - 6, -4, 6, 0.8 * (1 - k * 0.5));
    dust(ctx, cx + 8, -3, 4.6, 0.7 * (1 - k * 0.5));
    cue(ctx, 'CLONK!', cx - 34, cy - 20, 12, f, -0.12);
  } else if (X.kind === 'dazed') {
    dizzy(ctx, crown[0], crown[1] - 8, 15, t);
  } else if (X.kind === 'wiggle') {
    dust(ctx, -16, -2, 3.4, 0.5);
    dust(ctx, 14, -2, 3, 0.4);
  } else if (X.kind === 'flopAir') {
    ell(ctx, 0, -1, 30 * (0.6 + 0.4 * u), 4);
    ctx.fillStyle = 'rgba(60,30,20,0.28)';
    ctx.fill();
    cue(ctx, 'WHEEE!', hd[0] + 30, hd[1] + 14, 10, f, 0.1);
  } else if (X.kind === 'flopLand') {
    dustRoll(ctx, 0, 0, 80, clamp(u / 0.7, 0, 1), 9);
    for (let i = 0; i < 6; i++) {
      const v = clamp(u / 0.5, 0, 1);
      rubble(ctx, -44 + i * 17 + hash(i) * 6, -4 - Math.sin(Math.PI * v) * (8 + hash(i + 1) * 10), 1.6 + hash(i + 1), i + v * 4, 1 - sstep((u - 0.5) / 0.3));
    }
    if (u < 0.6) cue(ctx, 'WHUMP!', 10, -64, 13, f, -0.08);
  } else if (X.kind === 'bugle' || X.kind === 'trumpet') {
    // the blast: notes tumbling out of his trunk; the call shakes dust and root bark from the roof
    for (let i = 0; i < 4; i++) {
      const v = (u * 0.9 + i / 4) % 1;
      note(ctx, tip[0] + 4 + v * 26, tip[1] - 4 - v * 16 + Math.sin(v * 9 + i) * 3, 2.8, 0.2 * Math.sin(i + v * 4), 1 - v);
    }
    if (X.kind === 'trumpet') {
      for (let i = 0; i < 7; i++) {
        const v = (u * 0.7 + hash(i)) % 1;
        const x = -50 + hash(i + 3) * 100;
        if (i % 3 === 0) leaf(ctx, x, -150 + v * 140, 2.4, v * 6 + i, 1 - v * 0.6);
        else if (i % 3 === 1) splinter(ctx, x, -150 + v * 140, 2.6, v * 4 + i, 1 - v * 0.6);
        else dust(ctx, x, -146 + v * 70, 3.4, (1 - v) * 0.6);
      }
      dust(ctx, foot[0] + 6, -2, 4, 0.6);
    }
    cue(ctx, X.kind === 'trumpet' ? 'BWAAOOO!' : 'TOOT-TOOOT!', tip[0] + 18, tip[1] - 4, 10, f, -0.12);
  } else if (X.kind === 'woolwall') {
    // his wool puffed out in front of him as a shield: one soft cloud over his chest and arms
    // (outlined on its outer edge only, a pass of its outline, then its fill)
    const lobes = [[0, -12, 7], [3, -2, 8.4], [1, 9, 7.4], [-4, 18, 6], [6, 15, 5.2]];
    const cx = chest[0] + 20;
    const cy = chest[1] + 4;
    for (const pass of ['line', 'fill']) {
      for (const [dx, dy, r] of lobes) {
        const rr = r + Math.sin(t * 3 + dy) * 0.4;
        ell(ctx, cx + dx, cy + dy, rr, rr * 0.92);
        if (pass === 'line') {
          pen(ctx, INK, 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = tone(a, WOOL[1]);
          ctx.fill();
        }
      }
    }
    glow(ctx, cx - 2, cy - 8, 12, '#ffffff', 0.9);
  } else if (X.kind === 'stomp') {
    if (u > 0.95) {
      dustRoll(ctx, 0, 0, 50, (u - 0.95) / 0.05, 7);
      cue(ctx, 'STOMP!', 0, -76, 11, f, -0.06);
    }
  } else if (X.kind === 'hurt') {
    // a tuft of wool knocked loose, drifting off
    const v = clamp(u / 0.45, 0, 1);
    ell(ctx, chest[0] - 10 - v * 14, chest[1] - 14 - v * 10, 3, 2.4);
    ctx.fillStyle = tone(a, WOOL[0], 1 - v);
    ctx.fill();
  } else if (X.kind === 'beaten') {
    dizzy(ctx, crown[0], crown[1] - 4, 11, t * 0.6, 2);
    // the sniffles: a little puff from his trunk tip now and then
    const s = win((t * 0.8) % 1.6, 0, 0.1, 0.3, 0.5);
    steam(ctx, tip[0] + 2, tip[1] - 1, 2, 0.6 * s);
    if (u < 1.6) cue(ctx, '*sniff*', hd[0] + 24, hd[1] - 24, 7, f, -0.1);
  }
}

const DRESS = {
  id: 'tuskar',
  skin: { lt: WOOL[0], base: WOOL[1], sh: WOOL[2], deep: WOOL[3], ink: INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  under: {
    neckSkin: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'back'),
  },
  under2: (ctx, m, a, S, matOf, D) => {
    tailTuft(ctx, a, 'line', D);
    tailTuft(ctx, a, 'fill', D);
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      belly(ctx, a, mode, D);
      sashEnd(ctx, a, mode, D);
      collar(ctx, a, mode, D);
    },
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
  },
  pose,
  fx,
};
const R = dressRig('mammoth', DRESS);
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
// His art entry and his size as drawn (standing: from his tail tuft to his trunk, his feet to the
// top of his wool puffs), his walking pace (the base's own walk at his size).
export const TUSKAR_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 460, 220, 260], draw: R.still, rig, noHop: true };
// (measured on tools/zz-tuskarcheck.html: standing, 80 wide and 107 tall, centred over his spot)
export const TUSKAR_SIZE = { w: 80, h: 107, speed: Math.round(R.speed * BIG) };
