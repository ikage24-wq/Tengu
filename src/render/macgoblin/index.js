// Old MacGoblin on screen (2026-11-25, remade as Big Barnaby, the Clydesdale foreman, the player's
// pick "B" of three): Clover Hills' field boss. The farm's gentle giant and its grumpiest worker: a
// chestnut draft horse with a white blaze, a dark wavy mane and a swept forelock tied with one red
// ribbon, huge white fluffy "feathers" round his hooves like bell-bottoms, a padded leather work
// collar round his shoulders with two brass studs, patched sage overalls (one strap always
// unbuttoned, swinging) with carrots in the bib pocket, chunky cream work gloves, and a lucky
// horseshoe the size of a wreath hooked at his hip. Big, proud, sleepy-eyed, and secretly terrified
// of Honkers the goose. Drowsy brick eyes (wide rounded-oblong, the lid always half down, a small
// amber iris, a square glint), big bushy brows that do the acting, two buck teeth when he grins.
// He moves on his own copy of the brute base, made chibi (body.js `barnaby`: a short stocky torso,
// short thick legs, his own big horse head drawn over the mannequin's), rigged by rig.js (its bones,
// walk and springs; the base's own attack moves left out), skinned by skin.js in his own ink.
//   idle    a 34 s act while he stands calm (eased beats, his face changing with each; it pauses
//           the moment he walks, fights or is in a scene):
//           - a carrot from his bib pocket, munched with his eyes shut in bliss, crumbs;
//           - his chore list: a tiny note held out at arm's length, squinted at, a shrug;
//           - a mane toss and a big tail swish, ears flicking;
//           - a yawning whinny: head back, mouth wide, a stretch, a shake of the head;
//           - Honkers waddles up and HONKS at him: he jumps, hides behind his gloves, trembling,
//             peeks out once the goose has waddled off, a big sigh;
//           - his lucky horseshoe unhooked, breathed on, polished on his overalls, held up to shine;
//           - a slow roll of his big shoulders and a stretch of his back.
//   walk    the base's walk at his roam speed, heavy: his head nodding with each clop, the loose
//           strap and the feathering swinging with his legs.
//   fight   the slam, "Clover Quake" (m.special: through its 1.3 s warning he rears up on one leg,
//           both gloves high, nostrils flaring and ears pinned, trembling at the top; then STOMP: the
//           turf heaves up in slabs round his hoof, cracks run out, clods and clover fly, dust rolls
//           out both ways); up close (a touch, m.attackAt with no warning) he takes turns: "Hay Bale
//           Heave" (a bale hoisted over his head and flung down, bursting into straw) and "Lucky
//           Shoe" (the giant horseshoe flung spinning like a ring toss; it comes back, he catches it,
//           a proud snort); cross (aggro): ears back, brows down; hurt: a flinch away from the hit,
//           eyes squeezed; low on health: worried, a sweat drop, ears drooping, puffing; after
//           landing a hit (m.gloatAt): a proud snort, two steam puffs, a toothy grin; napping: sat
//           down, chin on his chest, z's; the co-op Barn-Door Guard (m.coop sides): arms out like a
//           gate, braced toward the side last struck.
//   entrance  woken at the big barn (world/nest.js, m.nested, his first 3 s): the barn's doors burst
//           open behind him at a mighty back-kick, he stomps out, snorts two puffs of steam, one stamp
//           that throws up dust, ears flicking up; the doors swing shut behind him.
//   beaten  a thud as he sits down hard; the horseshoe drops off his hip and lands upside down (his
//           luck runs out); he lies back, his forelock flopping over his eyes, ears down.
// Everything drawn here from scratch, live, outer outline only (an outline pass, then a fill pass).
import { dressRig } from './rig.js';
import { PUMPGOB } from '../pumpgob/index.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (0..1 through [t0, t0 + d], else -1)
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (a colour toward white while he flashes from a hit)
const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c).map((x) => Math.round(x + (255 - x) * k));
  return al >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${al})`;
};
const pen = (ctx, col, w) => {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};
// A closed smooth shape through points (midpoint curves: never a corner).
function smooth(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m1 = mid(i);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m1[0], m1[1]);
  }
  ctx.closePath();
}
// An open smooth line through points.
function sline(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  const l = pts[pts.length - 1];
  ctx.lineTo(l[0], l[1]);
}
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.01 || r <= 0.05) return;
  const [cr, cg, cb] = hexRgb(col);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function sparkle(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}
// A soft round puff (dust or steam): overlapping clouds, lit on top.
function puff(ctx, x, y, r, al, c0 = '#f4ead8', c1 = '#d8c6aa') {
  if (al <= 0.01 || r <= 0.05) return;
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * al;
  ctx.fillStyle = c1;
  for (const [dx, dy, k] of [[-0.7, 0.15, 0.62], [0.7, 0.2, 0.58], [0, 0, 0.8]]) {
    ell(ctx, x + dx * r, y + dy * r, r * k, r * k * 0.86);
    ctx.fill();
  }
  ctx.fillStyle = c0;
  for (const [dx, dy, k] of [[-0.62, 0.02, 0.48], [0.6, 0.06, 0.44], [0, -0.14, 0.64]]) {
    ell(ctx, x + dx * r, y + dy * r, r * k, r * k * 0.8);
    ctx.fill();
  }
  ctx.globalAlpha = a0;
}
const steam = (ctx, x, y, r, al) => puff(ctx, x, y, r, al, '#ffffff', '#e6e2ee');
// A clod of turf: a rounded lump of earth with a cap of grass.
function clod(ctx, x, y, r, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  smooth(ctx, [[-r, 0.1 * r], [-0.7 * r, -0.6 * r], [0.2 * r, -0.8 * r], [r, -0.3 * r], [0.9 * r, 0.6 * r], [-0.2 * r, 0.8 * r]]);
  pen(ctx, '#8a5a3a', Math.max(0.6, r * 0.28));
  ctx.stroke();
  ctx.fillStyle = '#a8724a';
  ctx.fill();
  ctx.fillStyle = '#7fc46a';
  smooth(ctx, [[-r, -0.1 * r], [-0.6 * r, -0.75 * r], [0.3 * r, -0.85 * r], [r, -0.35 * r], [0.2 * r, -0.3 * r]]);
  ctx.fill();
  ctx.restore();
}
// A clover leaf, three hearts.
function clover(ctx, x, y, s, ang, col = '#6cc06a') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = col;
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.9, -s * 0.4, -s * 0.6, -s * 1.3, 0, -s * 0.85);
    ctx.bezierCurveTo(s * 0.6, -s * 1.3, s * 0.9, -s * 0.4, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// A straw: a thin gold stalk, rounded at both ends.
function straw(ctx, x, y, len, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  pen(ctx, '#c99a3a', 1.1);
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.stroke();
  pen(ctx, '#f6d77a', 0.5);
  ctx.stroke();
  ctx.restore();
}

// ---------- His colours (his own soft ink: a warm chestnut brown, never near-black) ----------
const INK = '#8c5a44';
const BIG = 1.1;
const COAT = ['#e8b488', '#cf8f5e', '#b0703f', '#8e5530'];
const MANE = ['#9a6a54', '#7a4e3c', '#5e3a2e'];
const WHITE = ['#ffffff', '#fbf3e8', '#e8dccb', '#d2c2ad'];
const NOSE = ['#f6e6dc', '#e9cfc2', '#cfaa9c', '#a7807a'];
const SAGE = ['#bcd4a2', '#93b47c', '#6f915c'];
const LEATHER = ['#d99a64', '#b9773f', '#93582c'];
const BRASS = ['#fff1a8', '#f2c94c', '#cf9a2e'];
const RED = ['#ff9a90', '#ec6a62', '#c24a48'];
const STEEL = ['#eef0f6', '#c8ccd8', '#8f94a6'];
const SC0 = 0.625;
// (his outline: 1 game px each side of an edge, at his drawn size)
const LW = 2 / (SC0 * BIG);
const paint = (ctx, a, mode, col, w = LW) => {
  if (mode === 'line') {
    pen(ctx, INK, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
// A bone's frame in the base's kid-box units (1 unit = D.SC rig px).
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
// A kid-box point of a bone, now, in rig space.
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);

// ---------- His head (kid units about his neck joint; drawn 1.3x about it: a chibi head) ----------
const HS = 1.3;
// (the head's middle, from the neck joint)
const HO = [0, -21.5];
// Where a point of his head (head units, from its middle) is now, in rig space.
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};
// The eye: drowsy brick. `look` its gaze [-1..1, -1..1].
function eye(ctx, a, x, y, side, face, look) {
  const w = 6.4;
  const h = 4.6;
  const LID = tone(a, '#5e3a2e');
  const arc = (y0, bend, lw = 1.6) => {
    pen(ctx, LID, lw);
    ctx.beginPath();
    ctx.moveTo(x - w, y0);
    ctx.quadraticCurveTo(x, y0 + bend, x + w, y0);
    ctx.stroke();
  };
  if (face === 'happy' || face === 'munch' || face === 'proud' || face === 'yawn') return arc(y + 1.6, -5.6);
  if (face === 'sleep' || face === 'blink') return arc(y, 2.6);
  if (face === 'hurt' || face === 'hide') {
    pen(ctx, LID, 1.7);
    ctx.beginPath();
    ctx.moveTo(x - side * w * 0.9, y - 2.6);
    ctx.lineTo(x + side * w * 0.5, y);
    ctx.lineTo(x - side * w * 0.9, y + 2.6);
    ctx.stroke();
    return;
  }
  const wide = face === 'startle' || face === 'peek';
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - w, y - h - (wide ? 0.8 : 0), w * 2, h * 2 + (wide ? 0.8 : 0), 3.6);
  ctx.clip();
  ctx.fillStyle = tone(a, '#fffaf2');
  ctx.fillRect(x - w, y - h - 1, w * 2, h * 2 + 2);
  const ir = wide ? 2.6 : face === 'angry' ? 3.2 : 3.8;
  const ix = x + side * 0.6 + (look?.[0] ?? 0) * 2.2;
  const iy = y + (face === 'angry' ? 0.6 : -0.2) + (look?.[1] ?? 0) * 1.4;
  const g = ctx.createLinearGradient(0, iy - ir, 0, iy + ir);
  g.addColorStop(0, tone(a, '#4a2a1c'));
  g.addColorStop(0.6, tone(a, '#8a5232'));
  g.addColorStop(1, tone(a, '#d29a5a'));
  ctx.fillStyle = g;
  ell(ctx, ix, iy, ir, ir);
  ctx.fill();
  ctx.fillStyle = tone(a, '#2a160e');
  ell(ctx, ix, iy, ir * 0.48, ir * 0.48);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(ix - 1.8 - 0.9, iy - 2.4, 2, 1.8, 0.6);
  ctx.fill();
  ell(ctx, ix + 1.4, iy + 1.5, 0.5, 0.5);
  ctx.fill();
  // the heavy lid: half down when calm, lower and flat when cross or squinting, drooping out when
  // sad or worried, lifted when startled
  const lid = face === 'angry' ? 0.15 : face === 'squint' ? 0.9 : face === 'sad' || face === 'worried' ? 0.1 : wide ? -h - 1 : -0.6;
  const sl = face === 'angry' ? 1.6 : face === 'sad' || face === 'worried' ? -1.4 : 0;
  ctx.fillStyle = tone(a, COAT[1]);
  ctx.beginPath();
  ctx.moveTo(x - w - 1, y - h - 2);
  ctx.lineTo(x + w + 1, y - h - 2);
  ctx.lineTo(x + w + 1, y + lid - side * sl);
  ctx.lineTo(x - w - 1, y + lid + side * sl);
  ctx.fill();
  ctx.restore();
  pen(ctx, LID, 1.7);
  ctx.beginPath();
  if (wide) {
    ctx.moveTo(x - w, y - 1);
    ctx.quadraticCurveTo(x, y - h - 1.6, x + w, y - 1);
  } else {
    ctx.moveTo(x - w * 0.98, y + lid + side * sl);
    ctx.lineTo(x + w * 0.98, y + lid - side * sl);
  }
  ctx.stroke();
  // one short lash flick at the outer corner; a short lower line
  const ly = wide ? y - 1 : y + lid - sl;
  pen(ctx, LID, 1.1);
  ctx.beginPath();
  ctx.moveTo(x + side * w * 0.95, ly);
  ctx.quadraticCurveTo(x + side * (w + 1.6), ly - 0.6, x + side * (w + 2.2), ly - 2);
  ctx.stroke();
  pen(ctx, tone(a, COAT[3]), 0.9);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y + h + 0.6);
  ctx.quadraticCurveTo(x, y + h + 1.3, x + w * 0.5, y + h + 0.6);
  ctx.stroke();
}
// A bushy brow: a soft rounded tuft of mane colour, tipping with his mood (one at a time for mixed
// feelings: the squint knits them, a startle throws them up).
function brow(ctx, a, x, y, side, face) {
  const k = face === 'angry' ? 1 : face === 'squint' ? 0.7 : face === 'sad' || face === 'hurt' || face === 'worried' || face === 'hide' ? -1 : face === 'startle' || face === 'peek' ? -1.6 : face === 'proud' ? -0.4 * side : 0;
  ctx.save();
  ctx.translate(x, y - (face === 'startle' || face === 'peek' ? 2.4 : 0));
  ctx.rotate(side * k * 0.3);
  smooth(ctx, [[-side * 5, 1.2], [-side * 4, -1.6], [side * 1, -2.4], [side * 5.4, -1], [side * 5, 1.2], [0, 0.8]]);
  ctx.fillStyle = tone(a, MANE[1]);
  ctx.fill();
  ctx.restore();
}
// The mouth, on the bottom of his muzzle: resting (a long flat line, unimpressed), a toothy grin
// (two square buck teeth), munching (lips pursed, chewing side to side), gritted teeth, an open
// shout, a huge yawn, a small "o", a wobbly scared line, a frown; talking in vowel shapes.
function mouth(ctx, a, face, x, y) {
  const t = a.t ?? 0;
  pen(ctx, tone(a, NOSE[3]), 1.2);
  ctx.fillStyle = tone(a, '#9a5a5a');
  const teeth = (x0, y0) => {
    ctx.fillStyle = '#fffdf6';
    ctx.beginPath();
    ctx.roundRect(x0 - 2.4, y0, 2.2, 2.4, 0.6);
    ctx.roundRect(x0 + 0.2, y0, 2.2, 2.4, 0.6);
    ctx.fill();
  };
  ctx.beginPath();
  if (face === 'happy' || face === 'proud' || face === 'grin') {
    ctx.moveTo(x - 6, y - 1);
    ctx.quadraticCurveTo(x, y + 4.6, x + 6, y - 1);
    ctx.quadraticCurveTo(x, y + 1, x - 6, y - 1);
    ctx.fill();
    teeth(x, y + 0.2);
  } else if (face === 'munch') {
    const ch = Math.sin(t * 14);
    ctx.moveTo(x - 3.6 + ch, y + 0.4);
    ctx.quadraticCurveTo(x + ch * 0.6, y + 2.4 + Math.abs(ch), x + 3.6 + ch, y + 0.4);
    ctx.stroke();
  } else if (face === 'angry' || face === 'snort') {
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x + 4.4, y + 2.6);
    ctx.lineTo(x - 4.4, y + 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(x - 4.2, y + 0.4, 8.4, 1.8);
    pen(ctx, tone(a, NOSE[2]), 0.5);
    ctx.beginPath();
    for (const dx of [-1.4, 1.4]) {
      ctx.moveTo(x + dx, y + 0.4);
      ctx.lineTo(x + dx, y + 2.2);
    }
    ctx.stroke();
  } else if (face === 'shout' || face === 'yawn') {
    const big = face === 'yawn' ? 1.4 : 1;
    ell(ctx, x, y + 1.4 * big, 4 * big, 3.4 * big);
    ctx.fill();
    ctx.fillStyle = tone(a, '#ff9a9a');
    ell(ctx, x, y + 3 * big, 2.6 * big, 1.4 * big);
    ctx.fill();
    teeth(x, y - 2 * big);
  } else if (face === 'startle' || face === 'o' || face === 'peek') {
    ell(ctx, x, y + 1, 2, 2.4);
    ctx.fill();
  } else if (face === 'hide' || face === 'worried') {
    ctx.moveTo(x - 4.4, y + 1);
    for (let i = 1; i <= 6; i++) ctx.lineTo(x - 4.4 + i * 1.47, y + 1 + (i % 2 ? -0.9 : 0.6));
    ctx.stroke();
  } else if (face === 'sad' || face === 'hurt') {
    ctx.moveTo(x - 4, y + 1.6);
    ctx.quadraticCurveTo(x, y - 1.4, x + 4, y + 1.6);
    ctx.stroke();
  } else if (face === 'talk') {
    const v = Math.floor((t * 7) % 3);
    ell(ctx, x, y + 1, [3.4, 2, 4][v], [1.6, 2.4, 1.1][v]);
    ctx.fill();
  } else if (face === 'sleep') {
    ell(ctx, x, y + 1, 1.4, 1.2);
    ctx.fill();
  } else {
    ctx.moveTo(x - 5, y + 0.4);
    ctx.quadraticCurveTo(x, y + 1.2, x + 4.6, y - 0.4);
    ctx.stroke();
  }
}
// The forelock: swept to his left in a big chunk and a shorter one curling in, a small flick back
// the other way, tied at the root with a red ribbon; each tip on its own little swing. `over`
// (0..1): flopped down over his eyes (beaten).
function forelock(ctx, a, mode, cx, cy, over, toss) {
  const t = a.t ?? 0;
  const sw = (ph) => Math.sin(t * 2 + ph) * 0.5 + toss * Math.sin(t * 9 + ph) * 1.6;
  const s0 = sw(0);
  const s1 = sw(1.3);
  const s2 = sw(2.4);
  const d = over * 9;
  smooth(ctx, [[cx + 7, cy - 21], [cx - 2, cy - 20.6], [cx - 9, cy - 16.6 + d * 0.4], [cx - 12.6 + s0, cy - 11.4 + d], [cx - 13 + s0, cy - 8.6 + d], [cx - 10.6 + s0, cy - 9.4 + d], [cx - 6, cy - 12.6 + d], [cx + 1, cy - 15 + d * 0.7], [cx + 6, cy - 16.4]]);
  paint(ctx, a, mode, MANE[1]);
  smooth(ctx, [[cx + 8, cy - 20], [cx + 2, cy - 17.4], [cx - 1.4 + s1, cy - 12.4 + d], [cx - 0.6 + s1, cy - 9.8 + d * 1.1], [cx + 1.6 + s1, cy - 11 + d], [cx + 5, cy - 14.4 + d * 0.6], [cx + 9, cy - 16]]);
  paint(ctx, a, mode, MANE[1]);
  smooth(ctx, [[cx + 7, cy - 20.4], [cx + 10.6, cy - 18.4], [cx + 12.6 + s2, cy - 14.6 + d * 0.8], [cx + 11.4 + s2, cy - 13.4 + d * 0.8], [cx + 9, cy - 15.6], [cx + 6.4, cy - 17]]);
  paint(ctx, a, mode, MANE[1]);
  if (mode === 'fill') {
    pen(ctx, tone(a, MANE[0]), 0.9);
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 18.6);
    ctx.lineTo(cx - 5, cy - 17);
    ctx.moveTo(cx + 5.6, cy - 18);
    ctx.lineTo(cx + 7, cy - 17);
    ctx.stroke();
  }
  // the red ribbon: a little bow at the forelock's root
  const bx = cx + 7.4;
  const by = cy - 20.6;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.bezierCurveTo(bx + side * 2.4, by - 4, bx + side * 5.6, by - 2.6, bx + side * 5, by + 0.4);
    ctx.bezierCurveTo(bx + side * 4.6, by + 2.6, bx + side * 2, by + 2, bx, by);
    ctx.closePath();
    paint(ctx, a, mode, RED[1]);
  }
  ell(ctx, bx, by, 1.4, 1.4);
  paint(ctx, a, mode, RED[2]);
}
const SKULL = (cx, cy) => [[cx - 19.4, cy - 4], [cx - 17, cy - 17], [cx, cy - 22], [cx + 17, cy - 17], [cx + 19.4, cy - 4], [cx + 16, cy + 9], [cx + 11, cy + 16], [cx - 11, cy + 16], [cx - 16, cy + 9]];
const MUZ = (cx, cy, j = 0) => [[cx - 14.4, cy + 16], [cx - 12, cy + 9.4], [cx, cy + 7.6], [cx + 12, cy + 9.4], [cx + 14.4, cy + 16], [cx + 13, cy + 23 + j], [cx, cy + 26.4 + j], [cx - 13, cy + 23 + j]];
function head(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  const q = a.mgB ?? {};
  const face = q.face ?? 'calm';
  const t = a.t ?? 0;
  const [cx, cy] = HO;
  const jaw = face === 'yawn' ? 3 : face === 'shout' ? 1.4 : 0;
  // ears: upright soft leaves, rounded at the tip, each turning on its own (pinned back when cross,
  // drooping when sad, pricked when startled, flicking now and then)
  for (const side of [-1, 1]) {
    const flick = Math.max(0, Math.sin(t * 0.9 + side * 2.2) - 0.94) * 6;
    const sw = Math.sin(t * 1.3 + side * 2) * 0.05 + side * (q.earPin ?? 0) * 0.7 + side * (q.earDrop ?? 0) * 1.0 - side * (q.earUp ?? 0) * 0.2 + side * flick * 0.12;
    ctx.save();
    ctx.translate(cx + side * 10, cy - 15);
    ctx.rotate(side * 0.28 + sw);
    ctx.beginPath();
    ctx.moveTo(-4.6, 2);
    ctx.bezierCurveTo(-5.4, -6, -2.6, -12.6, 0, -14);
    ctx.bezierCurveTo(2.6, -12.6, 5.4, -6, 4.6, 2);
    ctx.closePath();
    paint(ctx, a, mode, COAT[1]);
    if (mode === 'fill') {
      ctx.beginPath();
      ctx.moveTo(-2.4, 1);
      ctx.bezierCurveTo(-3, -5, -1.4, -9.6, 0, -10.6);
      ctx.bezierCurveTo(1.4, -9.6, 3, -5, 2.4, 1);
      ctx.closePath();
      ctx.fillStyle = tone(a, NOSE[1]);
      ctx.fill();
    }
    ctx.restore();
  }
  smooth(ctx, SKULL(cx, cy));
  paint(ctx, a, mode, COAT[1]);
  smooth(ctx, MUZ(cx, cy, jaw));
  paint(ctx, a, mode, NOSE[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL(cx, cy));
    ctx.clip();
    glow(ctx, cx + 5, cy - 10, 14, COAT[0], 0.85);
    glow(ctx, cx - 13, cy + 6, 9, COAT[2], 0.55);
    // the white blaze: a soft stripe from the forehead widening down his nose
    smooth(ctx, [[cx - 2.6, cy - 19], [cx + 2.6, cy - 19], [cx + 3.4, cy - 6], [cx + 6, cy + 10], [cx, cy + 12], [cx - 6, cy + 10], [cx - 3.4, cy - 6]]);
    ctx.fillStyle = tone(a, WHITE[1]);
    ctx.fill();
    ctx.restore();
    ctx.save();
    smooth(ctx, MUZ(cx, cy, jaw));
    ctx.clip();
    glow(ctx, cx - 3, cy + 14, 9, NOSE[0], 0.95);
    glow(ctx, cx + 6, cy + 26, 8, NOSE[2], 0.5);
    ctx.restore();
    // the nostrils, flaring when he snorts
    const fl = 1 + (q.flare ?? 0) * 0.45;
    ctx.fillStyle = tone(a, NOSE[3]);
    for (const side of [-1, 1]) {
      ell(ctx, cx + side * 6.4, cy + 15.4, 1.9 * fl, 2.6 * fl, side * 0.4);
      ctx.fill();
    }
    ctx.fillStyle = tone(a, '#ffb7a8', 0.45 + (q.blush ?? 0) * 0.4);
    for (const side of [-1, 1]) {
      ell(ctx, cx + side * 12.4, cy + 5.4, 3, 1.8);
      ctx.fill();
    }
    for (const side of [-1, 1]) {
      // (one eye squeezed in a wink while proud)
      const f = face === 'proud' && side < 0 ? 'calm' : face;
      eye(ctx, a, cx + side * 10.4, cy - 2.4, side, f, q.look);
    }
    for (const side of [-1, 1]) brow(ctx, a, cx + side * 10.6, cy - 10.4, side, face);
    mouth(ctx, a, q.mouth ?? face, cx, cy + 21.4 + jaw * 0.6);
    if (face === 'hurt' || face === 'sad') {
      ctx.fillStyle = '#9ad8ff';
      ell(ctx, cx + 12.6, cy + 4, 1.2, 1.9);
      ctx.fill();
    }
    if (q.sweat) {
      ctx.fillStyle = '#9ad8ff';
      const sy = cy - 12 + (q.sweat % 1) * 4;
      ctx.beginPath();
      ctx.moveTo(cx + 15, sy - 3);
      ctx.quadraticCurveTo(cx + 17.4, sy + 1, cx + 15, sy + 1.8);
      ctx.quadraticCurveTo(cx + 12.6, sy + 1, cx + 15, sy - 3);
      ctx.fill();
    }
  }
  forelock(ctx, a, mode, cx, cy, q.lockOver ?? 0, q.toss ?? 0);
  ctx.restore();
}
// The mane: big wavy dark locks down the far side of his neck behind his head and over his far
// shoulder, one little braid with a red tie; tossed with his head.
function mane(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'neckB');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  const t = a.t ?? 0;
  const q = a.mgB ?? {};
  const s = Math.sin(t * 1.4) * 0.8 + (q.toss ?? 0) * Math.sin(t * 9) * 3 + (a.walkW ?? 0) * Math.sin(t * 6) * 1;
  smooth(ctx, [[-10, -30], [8, -34], [16, -24], [12, -8], [-4, 0], [-16, 8 + s], [-24, 12 + s], [-28, 6 + s], [-24, -2], [-20, -12], [-16, -22]]);
  paint(ctx, a, mode, MANE[1]);
  if (mode === 'fill') {
    pen(ctx, tone(a, MANE[0]), 1);
    for (const [x0, y0, x1, y1] of [[-12, -16, -20, -2], [-16, -4, -23, 8]]) {
      sline(ctx, [[x0, y0], [x0 - 3, (y0 + y1) / 2], [x1, y1 + s * 0.5]]);
      ctx.stroke();
    }
    ctx.fillStyle = tone(a, RED[1]);
    ell(ctx, -25, 8 + s, 2.4, 1.6, -0.6);
    ctx.fill();
  }
  ctx.restore();
}
// His tail: a heavy dark fall from behind his far hip, swishing.
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  ctx.translate(h[0], h[1]);
  const t = a.t ?? 0;
  const q = a.mgB ?? {};
  const sw = Math.sin(t * 1.2) * 2.4 + (q.swish ?? 0) * Math.sin(t * 8) * 9 + (a.walkW ?? 0) * Math.sin(t * 5) * 2;
  smooth(ctx, [[-14, -10], [-22, -6], [-30 + sw * 0.3, 4], [-34 + sw, 16], [-34 + sw, 26], [-28 + sw, 23], [-25 + sw * 0.6, 12], [-20, 2], [-14, -4]]);
  paint(ctx, a, mode, MANE[1]);
  if (mode === 'fill') {
    pen(ctx, tone(a, MANE[0]), 1);
    sline(ctx, [[-20, -4], [-27 + sw * 0.4, 6], [-30 + sw * 0.8, 18]]);
    ctx.stroke();
  }
  ctx.restore();
}
// ---------- His clothes (kid units in each bone's frame) ----------
// The overalls: the seat (hips) and a leg of the shorts on each thigh (so they swing with his legs),
// the bib (chest) with its pocket of carrots, the buckled strap on his near side, the far one loose
// and swinging; a patch on the near shorts leg.
function shortsLeg(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `thigh${k}`);
  const h = D.J[`hip${k}`];
  const kn = D.J[`knee${k}`];
  const o = k === 'N' ? 1 : -1;
  smooth(ctx, [[h[0] - 12, h[1] - 4], [h[0] + 12, h[1] - 4], [h[0] + 13.4 * (o > 0 ? 1.04 : 1), kn[1] - 2], [h[0], kn[1] - 0.4], [h[0] - 13.4, kn[1] - 2]]);
  paint(ctx, a, mode, SAGE[1]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, SAGE[2], 0.55);
    ctx.fillRect(h[0] - 13, kn[1] - 4, 26, 1.6);
    if (k === 'N') {
      ctx.fillStyle = tone(a, '#e9c98a');
      ctx.beginPath();
      ctx.roundRect(h[0] - 3, h[1] + 1, 8, 6.6, 1.4);
      ctx.fill();
      pen(ctx, tone(a, '#b08a4a'), 0.5);
      ctx.setLineDash([1, 1]);
      ctx.beginPath();
      ctx.roundRect(h[0] - 2.2, h[1] + 1.8, 6.4, 5, 1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}
function overalls(ctx, a, mode, D) {
  const J = D.J;
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = J.hip;
  smooth(ctx, [[h[0] - 27, h[1] - 12], [h[0], h[1] - 14], [h[0] + 27, h[1] - 12], [h[0] + 28, h[1]], [h[0] + 22, h[1] + 7], [h[0], h[1] + 5.4], [h[0] - 22, h[1] + 7], [h[0] - 28, h[1]]]);
  paint(ctx, a, mode, SAGE[1]);
  if (mode === 'fill') {
    glow(ctx, h[0] + 10, h[1] - 6, 14, SAGE[0], 0.7);
    ctx.fillStyle = tone(a, SAGE[2], 0.7);
    ctx.fillRect(h[0] - 0.6, h[1] - 4, 1.2, 9);
  }
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'chest');
  const r = J.ribs;
  const bib = [[r[0] - 14, r[1] - 15], [r[0], r[1] - 16], [r[0] + 14, r[1] - 15], [r[0] + 15, r[1] - 4], [r[0] + 17, r[1] + 6], [r[0], r[1] + 7], [r[0] - 17, r[1] + 6], [r[0] - 15, r[1] - 4]];
  smooth(ctx, bib);
  paint(ctx, a, mode, SAGE[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, bib);
    ctx.clip();
    glow(ctx, r[0] + 6, r[1] - 10, 10, SAGE[0], 0.8);
    ctx.restore();
    // the bib pocket, its carrots poking out (one fewer while he eats one)
    const n = a.mgB?.carrotOut ? 1 : 2;
    for (const [x, ang] of [[r[0] - 4, -0.25], [r[0] + 0.4, 0.15]].slice(0, n)) {
      ctx.save();
      ctx.translate(x, r[1] - 8);
      ctx.rotate(ang);
      ctx.fillStyle = tone(a, '#7cc46a');
      for (const dx of [-1.2, 0, 1.2]) {
        ell(ctx, dx, -6.6, 0.9, 2.4, dx * 0.4);
        ctx.fill();
      }
      ctx.fillStyle = tone(a, '#f59a4a');
      ctx.beginPath();
      ctx.moveTo(-1.8, -4.4);
      ctx.quadraticCurveTo(0, -5.4, 1.8, -4.4);
      ctx.lineTo(0.4, 4);
      ctx.lineTo(-0.4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = tone(a, SAGE[2]);
    ctx.beginPath();
    ctx.roundRect(r[0] - 8, r[1] - 8, 13, 9, 1.6);
    ctx.fill();
    ctx.fillStyle = tone(a, SAGE[0], 0.5);
    ctx.fillRect(r[0] - 8, r[1] - 8, 13, 1.2);
  }
  // the near strap, buckled, over his shoulder; the far one unbuttoned and swinging from the bib
  const t = a.t ?? 0;
  const sw = Math.sin(t * 1.6) * 0.8 + (a.walkW ?? 0) * Math.sin(t * 6.2) * 2.4 + (a.mgB?.strapK ?? 0) * Math.sin(t * 12) * 2;
  ctx.beginPath();
  ctx.moveTo(r[0] + 9, r[1] - 15);
  ctx.lineTo(r[0] + 15, r[1] - 15);
  ctx.lineTo(r[0] + 17, r[1] - 23);
  ctx.lineTo(r[0] + 11.4, r[1] - 23);
  ctx.closePath();
  paint(ctx, a, mode, SAGE[1]);
  sline(ctx, [[r[0] - 11, r[1] - 15], [r[0] - 15 + sw * 0.3, r[1] - 9], [r[0] - 17 + sw, r[1] - 2]]);
  if (mode === 'line') {
    pen(ctx, INK, 3.4 + LW);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, SAGE[1]), 3.4);
    ctx.stroke();
    ctx.fillStyle = tone(a, BRASS[1]);
    ell(ctx, r[0] - 17 + sw, r[1] - 2, 1.5, 1.5);
    ctx.fill();
    ell(ctx, r[0] + 13, r[1] - 15.4, 1.6, 1.6);
    ctx.fill();
  }
  ctx.restore();
}
// The work collar: a thick padded leather ring round his neck, resting on his shoulders, a cream
// padding rim showing inside it, stitching, two brass studs on its front.
function collar(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const c = [D.J.stern[0], D.J.stern[1] + 1.4];
  const ring = () => {
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], 22, 9.6, 0, 0, TAU);
    ctx.ellipse(c[0], c[1] - 1.6, 12.4, 5, 0, 0, TAU, true);
  };
  ring();
  paint(ctx, a, mode, LEATHER[1]);
  if (mode === 'fill') {
    ctx.save();
    ring();
    ctx.clip('evenodd');
    glow(ctx, c[0] - 9, c[1] - 6, 12, LEATHER[0], 0.85);
    ctx.fillStyle = tone(a, LEATHER[2], 0.7);
    ell(ctx, c[0], c[1] + 7.6, 21, 2.8);
    ctx.fill();
    pen(ctx, tone(a, '#fff0d8'), 2);
    ell(ctx, c[0], c[1] - 1.2, 13.6, 6);
    ctx.stroke();
    pen(ctx, tone(a, LEATHER[0]), 0.5);
    ctx.setLineDash([1.2, 1.2]);
    ell(ctx, c[0], c[1] + 0.4, 18.4, 7.8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    for (const side of [-1, 1]) {
      ctx.fillStyle = tone(a, BRASS[2]);
      ell(ctx, c[0] + side * 14.6, c[1] + 4, 2.4, 2.4);
      ctx.fill();
      ctx.fillStyle = tone(a, BRASS[1]);
      ell(ctx, c[0] + side * 14.6, c[1] + 3.6, 2, 2);
      ctx.fill();
      ctx.fillStyle = tone(a, BRASS[0]);
      ell(ctx, c[0] + side * 14.6 - 0.6, c[1] + 3, 0.8, 0.8);
      ctx.fill();
    }
  }
  ctx.restore();
}
// The lucky horseshoe: a steel shoe, its arms up (lucky) or down (luck run out), nail holes, a
// shine. Drawn about its middle, its size `s`.
function shoe(ctx, a, mode, x, y, ang, s = 1, w = LW) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(0, 0, 9, Math.PI * 0.82, Math.PI * 2.18, false);
  ctx.arc(9 * Math.cos(Math.PI * 2.18) - 1.4, 9 * Math.sin(Math.PI * 2.18) + 1, 1.6, 0, Math.PI);
  ctx.arc(0, 0, 5, Math.PI * 2.18, Math.PI * 0.82, true);
  ctx.closePath();
  paint(ctx, a, mode, STEEL[1], w / s);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, STEEL[0]);
    ctx.beginPath();
    ctx.arc(0, 0, 7.6, Math.PI * 1.05, Math.PI * 1.6);
    ctx.arc(0, 0, 6.6, Math.PI * 1.6, Math.PI * 1.05, true);
    ctx.fill();
    ctx.fillStyle = tone(a, STEEL[2]);
    for (let i = 0; i < 6; i++) {
      const an = Math.PI * (0.95 + i * 0.22);
      ell(ctx, Math.cos(an) * 7, Math.sin(an) * 7, 0.6, 0.6);
      ctx.fill();
    }
  }
  ctx.restore();
}
// The chunky cream work gloves (over the hands' own skin): a leather cuff, two stitched fingers.
// `grip`: closed round something.
function glove(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const w = D.J[`wr${k}`];
  const h = D.J[`hand${k}`];
  ctx.translate(h[0], h[1]);
  ctx.rotate(Math.atan2(h[1] - w[1], h[0] - w[0]) - Math.PI / 2);
  smooth(ctx, [[-8.6, -9], [0, -11], [8.6, -9], [9.4, 2], [6, 8], [-6, 8], [-9.4, 2]]);
  paint(ctx, a, mode, WHITE[1]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, '#e9c98a');
    ctx.beginPath();
    ctx.roundRect(-9, -11, 18, 4, 1.6);
    ctx.fill();
    glow(ctx, -3, -2, 6, '#ffffff', 0.8);
    pen(ctx, tone(a, WHITE[3]), 0.8);
    ctx.beginPath();
    ctx.moveTo(-2, 3);
    ctx.lineTo(-2, 7);
    ctx.moveTo(2.4, 3);
    ctx.lineTo(2.4, 7);
    ctx.stroke();
  }
  ctx.restore();
}
// The feathering: big soft scalloped fluffs of white round each lower leg down over the hoof, so
// he stands on two cream bell-bottoms; a peek of dark hoof at the front. In the shin's frame, so it
// swings and lifts with the leg; it flares out on a stomp and swishes as he walks.
function feather(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `shin${k}`);
  const kn = D.J[`knee${k}`];
  const an = D.J[`ank${k}`];
  const x = an[0];
  const y = an[1] + 7.5;
  const t = a.t ?? 0;
  const q = a.mgB ?? {};
  const ph = k === 'N' ? 0 : Math.PI;
  const walk = (a.walkW ?? 0) * Math.sin(t * 6.2 + ph);
  const fl = (q.fluff ?? 0) * 3 + Math.sin(t * 2 + (k === 'N' ? 0 : 1.4)) * 0.3;
  const top = Math.max(kn[1] + 1, y - 21);
  smooth(ctx, [[x - 10 - fl - walk, y - 1], [x - 11.6 - fl - walk * 0.8, y - 6], [x - 9, y - 12], [x - 7, top + 3], [x, top], [x + 7, top + 3], [x + 9, y - 12], [x + 11.6 + fl + walk * 0.8, y - 6], [x + 10 + fl + walk, y - 1], [x + 4, y + 1], [x - 4, y + 1]]);
  paint(ctx, a, mode, WHITE[1]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, '#6e4e46');
    ctx.beginPath();
    ctx.roundRect(x - 5.4, y - 2.6, 10.8, 3.2, 1.2);
    ctx.fill();
    ctx.fillStyle = tone(a, WHITE[2]);
    for (const [dx, dy] of [[-7, -5], [6.8, -6], [-3.8, -11.4], [3.8, -12.8]]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 2.6, 0.2, Math.PI - 0.2);
      ctx.fill();
    }
    glow(ctx, x - 2, y - 14, 5, '#ffffff', 0.9);
  }
  ctx.restore();
}
// A hay bale: a straw-gold block, soft-cornered, two twine ties.
function bale(ctx, a, mode, x, y, ang, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  const B = [[-20, -10], [0, -11], [20, -10], [21, 0], [20, 10], [0, 11], [-20, 10], [-21, 0]];
  smooth(ctx, B);
  paint(ctx, a, mode, '#f0cf6e', LW / s);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, B);
    ctx.clip();
    glow(ctx, -6, -5, 14, '#fff3b0', 0.9);
    ctx.fillStyle = tone(a, '#cfa646', 0.8);
    ctx.fillRect(-22, 6, 44, 6);
    pen(ctx, tone(a, '#d9b04e'), 0.7);
    ctx.beginPath();
    for (let i = -18; i < 20; i += 4.6) {
      ctx.moveTo(i, -8 + (i % 3));
      ctx.lineTo(i + 3, -8.6 + (i % 3));
    }
    ctx.stroke();
    ctx.fillStyle = tone(a, '#b0875a');
    ctx.fillRect(-9, -12, 1.8, 24);
    ctx.fillRect(7, -12, 1.8, 24);
    ctx.restore();
  }
  ctx.restore();
}
// Small things held in his near glove (rig space, game px at his drawn scale).
function carrot(ctx, x, y, ang, bite) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#7cc46a';
  for (const dx of [-0.8, 0, 0.8]) {
    ell(ctx, dx, -5.6, 0.6, 1.8, dx * 0.4);
    ctx.fill();
  }
  pen(ctx, '#c8662a', 0.6);
  ctx.fillStyle = '#f59a4a';
  const len = 3.4 * (1 - bite * 0.75);
  ctx.beginPath();
  ctx.moveTo(-1.6, -3.8);
  ctx.quadraticCurveTo(0, -4.6, 1.6, -3.8);
  ctx.lineTo(0.7, -3.8 + len + 3.4 * 0.2);
  ctx.quadraticCurveTo(0, -3.4 + len + 1, -0.7, -3.8 + len + 3.4 * 0.2);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
function note(ctx, x, y, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  pen(ctx, '#c8b8a0', 0.5);
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.roundRect(-2.6, -3.4, 5.2, 6.4, 0.6);
  ctx.fill();
  ctx.stroke();
  pen(ctx, '#9ab0d0', 0.35);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-1.8, -2 + i * 1.4);
    ctx.lineTo(1.6 - (i % 2) * 0.8, -2 + i * 1.4);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- His act: a 34 s cycle of beats (seconds into it) ----------
const CYCLE = 34;
const ACT = {
  // 1. a carrot from his bib pocket, munched with his eyes shut, crumbs
  reach: [0.4, 0.8, 1.0, 1.3], munch: [1.1, 1.5, 4.4, 4.9], bliss: [4.6, 4.9, 5.4, 5.8],
  // 2. his chore list held at arm's length, squinted at; a shrug
  list: [6.4, 7.0, 9.8, 10.4], shrug: [9.9, 10.2, 10.6, 11.0],
  // 3. a mane toss and a big tail swish
  toss: [12.0, 12.3, 13.6, 14.2],
  // 4. a yawning whinny, a stretch, a shake of the head
  yawn: [15.2, 15.8, 17.6, 18.0], shake: [17.9, 18.1, 18.6, 18.9],
  // 5. Honkers waddles up and honks; he jumps and hides; the goose waddles off; he peeks; a sigh
  goose: [19.4, 19.6, 25.8, 26.0], jump: [22.0, 22.1, 22.3, 22.5], hide: [22.1, 22.35, 24.6, 25.0], peek: [24.7, 25.0, 25.8, 26.1], sigh: [26.0, 26.3, 26.8, 27.2],
  // 6. his lucky horseshoe unhooked, breathed on, polished on his overalls, held up to shine
  polish: [27.6, 28.0, 29.4, 29.8], admire: [29.6, 29.9, 31.0, 31.4],
  // 7. a slow roll of his big shoulders and a stretch of his back
  roll: [31.8, 32.2, 33.4, 33.9],
};
const GOOSE_HONKS = [22.0, 22.7];
const W = (lu, k, w) => win(lu, ...ACT[k]) * w;

// (his own Honkers, the real goose rig, and its state between frames)
const gooseArt = PUMPGOB.art;
function gooseDef(def) {
  return { ...def, id: 'pumpgob', art: 'pumpgob', w: PUMPGOB.w, h: PUMPGOB.h, speed: PUMPGOB.speed, boss: false };
}

function pose(m, a, out, c) {
  const q = { face: null, mouth: null, look: [0.3, 0], flare: 0, earPin: 0, earDrop: 0, earUp: 0, toss: 0, swish: 0, fluff: 0, strapK: 0, lockOver: 0, blush: 0, sweat: 0, steam: [], shoeAt: 'hip', shoe: null, held: null, bale: null, quake: -1, kick: -1, stamp: -1, doors: -1, zz: 0, goose: null, crumbs: 0, carrotOut: false, glint: 0, guard: 0 };
  a.mgB = q;
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const mood = m.cine?.mood ?? a.mood;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (f, k, mo = null) => {
    if (k > 0.4) {
      q.face = f;
      if (mo) q.mouth = mo;
    }
  };
  const walkW = clamp(a.walkW ?? 0, 0, 1);
  const low = m.hp > 0 && m.hp < m.def.hp * 0.25 && !m.cine;
  // Standing: square and heavy, weight on one leg, his near thumb hooked in his strap, breathing
  // deep; the head nods with each clop as he walks.
  const breath = Math.sin(t * 1.5);
  go({ tilt: -1, pelvis: 3, waist: -2, head: 2 + Math.sin(t * 0.7) * 1.2, neckR: 0, shN: -8, elN: -18, shF: 8, elF: 14, chest: breath * 0.8 }, 1 - walkW);
  go({ head: 3 + Math.sin(t * 12.4) * 2.4, tilt: 3 }, walkW);
  // The fight. The slam's warning (m.special.warn), 0..1 through it.
  const total = m.def.special?.warn ?? 1.3;
  // (a scene or a dev stage may wind him up by m.windup instead)
  const rem = Math.max(m.special?.warn > 0 ? m.special.warn : 0, m.windup > 0 ? m.windup : 0);
  const wind = rem > 0 ? clamp(1 - rem / total, 0, 1) : 0;
  if (wind > 0) st.mgWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const slamming = since >= 0 && since < 1.3 && now - (st.mgWindAt ?? -9) < since + 0.25;
  // (a touch: he takes turns, the bale and the shoe)
  if (m.attackAt != null && m.attackAt !== st.mgAtkAt) {
    st.mgAtkAt = m.attackAt;
    if (!slamming && since >= 0 && since < 0.5) st.mgAtkN = (st.mgAtkN ?? (m.uid ?? 0)) + 1;
  }
  const touch = !slamming && since >= 0 && since < 1.6 && m.hp > 0 ? ((st.mgAtkN ?? 0) % 2 ? 'shoe' : 'bale') : null;
  const entrance = m.nested && (m.age ?? 9) < 3.2 && m.hp > 0 ? m.age : -1;
  const ring = m.coop?.mechs?.find((s) => s.def.kind === 'sides');
  const guardK = ring?.guard && m.hp > 0 ? 1 : 0;
  const busy = wind > 0 || slamming || touch || entrance >= 0 || m.hp <= 0;
  // Cross while he hunts you: ears back, brows down, nostrils working.
  if (mood === 'angry' || (now < (m.aggroUntil ?? 0) && m.hp > 0)) {
    q.face = 'angry';
    q.mouth = 'snort';
    q.earPin = 0.8;
    q.flare = 0.6 + 0.4 * Math.sin(t * 5);
  }
  if (low) {
    q.face = 'worried';
    q.mouth = 'worried';
    q.sweat = (t * 0.6) % 1;
    q.earDrop = 0.5;
    out.chest += Math.sin(t * 7) * 1.6;
  }
  if (mood === 'happy' && m.cine) say('happy', 1);
  if (mood === 'talk') say(q.face ?? 'calm', 1, 'talk');
  if (mood === 'sad') {
    say('sad', 1);
    q.earDrop = 1;
    go({ head: 10 }, 1);
  }
  // Napping (a scene's sleep, or a nap in his habitat): sat down heavily, chin on his chest, z's.
  const napping = mood === 'sleep' || m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
  if (napping && !busy) {
    go({ drop: 0.7, fxN: 0.5, fxF: -0.5, tilt: -4, head: 18, neckR: 4, shN: 20, elN: 30, shF: -20, elF: -30, chest: Math.sin(t * 1.2) * 2 }, 1);
    q.face = 'sleep';
    q.mouth = 'sleep';
    q.earDrop = 0.7;
    q.zz = 1;
  }
  // The co-op Barn-Door Guard: arms out wide like a gate, braced toward the side struck last.
  if (guardK && !busy) {
    const last = (ring.hits?.[1] ?? -9) > (ring.hits?.[-1] ?? -9) ? 1 : -1;
    const lit = now - Math.max(ring.hits?.[1] ?? -9, ring.hits?.[-1] ?? -9) < 1.2 ? 1 : 0;
    const side = last * (m.dir ?? 1);
    go({ shN: -86, elN: -14, shF: 86, elF: 14, drop: 0.12, fxN: 0.3, fxF: -0.3, tilt: side * 6 * lit, head: -side * 4 * lit }, 1);
    q.guard = 1;
    if (!q.face || q.face === 'calm') q.face = 'angry';
    q.mouth = 'snort';
    q.earPin = 1;
  }
  // Hurt: a flinch away from the hit, eyes squeezed, ears pinned.
  const hurtK = m.hp > 0 && !busy ? Math.max(sstep(1 - (a.hurtAgo ?? 9) / 0.5), mood === 'hurt' ? 1 : 0) : 0;
  if (hurtK > 0.01) {
    go({ tilt: -9, head: 12, neckR: 4, shN: -40, elN: -110, shF: 30, elF: 60, x: -0.03 }, hurtK);
    q.earPin = Math.max(q.earPin, hurtK);
    say('hurt', hurtK, 'hurt');
  }
  // After landing a hit: a proud snort (two steam puffs), a toothy grin, chest out.
  const gl = now - (m.gloatAt ?? -9);
  if (gl >= 0 && gl < 1.2 && m.hp > 0 && !busy) {
    const k = win(gl, 0, 0.15, 0.9, 1.2);
    go({ tilt: -5, chest: -6, head: -10, shN: -30, elN: -90, shF: 30, elF: 90 }, k);
    say('proud', k, 'grin');
    q.flare = Math.max(q.flare, win(gl, 0.1, 0.2, 0.4, 0.6));
    if (gl > 0.15) q.steam.push(gl - 0.15);
  }
  // CLOVER QUAKE. Through the warning: a snort and a shift of weight, then up he rears on his far
  // leg, his near hoof lifted high, both gloves up, leaning back, nostrils flaring, ears pinned; a
  // tremble at the top...
  if (wind > 0 && m.hp > 0) {
    const shift = sstep(wind / 0.2);
    const rear = sstep((wind - 0.15) / 0.6);
    const top = sstep((wind - 0.8) / 0.2);
    const tremble = Math.sin(now * 40) * top;
    go({ pelvis: -6, tilt: -2, head: -4 }, shift);
    go({ lift: 0.03, tilt: -9, pelvis: -8, waist: -6, chest: -6, head: -12 + tremble * 2, shN: -150 + tremble * 6, elN: -30, shF: 140 - tremble * 6, elF: 30, fyN: 0.62, fxN: 0.22, toeN: -12, fxF: -0.06 }, rear);
    q.face = 'angry';
    q.mouth = wind < 0.3 ? 'snort' : 'snort';
    q.flare = 1;
    q.earPin = 1;
    q.fluff = rear;
    q.swish = rear;
    if (wind < 0.35) q.steam.push(wind / 0.35);
  }
  // ...STOMP: down comes the hoof, his weight dropped onto it, the turf heaving up round it; a held
  // crouch, then he straightens with a satisfied snort.
  if (slamming && m.hp > 0) {
    const down = 1 - sstep((since - 0.45) / 0.7);
    go({ drop: 0.3, tilt: 8, pelvis: 4, waist: 6, chest: 6, head: 6, shN: -58, elN: -50, shF: 62, elF: 50, fxN: 0.32, fxF: -0.2, fyN: 0 }, down);
    q.face = since < 0.6 ? 'angry' : 'proud';
    q.mouth = since < 0.6 ? 'shout' : 'grin';
    q.quake = since;
    q.fluff = 1 - sstep((since - 0.3) / 0.6);
    q.earPin = 1 - sstep((since - 0.5) / 0.5);
    if (since > 0.7) q.steam.push(since - 0.7);
  }
  // A touch, the first of his turns: HAY BALE HEAVE. A bale swung up from behind him over his head
  // in both gloves, then flung down ahead, bursting into straw.
  if (touch === 'bale') {
    const up = win(since, 0, 0.22, 0.38, 0.5);
    const fling = win(since, 0.38, 0.5, 0.75, 1.3);
    go({ tilt: -7, waist: -4, chest: -5, head: -9, shN: -168, elN: -14, shF: 168, elF: 14, fxN: 0.16, fxF: -0.16 }, up);
    go({ tilt: 10, waist: 6, chest: 6, head: 6, shN: -70, elN: -10, shF: 50, elF: 20, drop: 0.12 }, fling);
    q.face = since < 0.5 ? 'angry' : 'proud';
    q.mouth = since < 0.5 ? 'snort' : 'grin';
    q.bale = since;
  }
  // The other: LUCKY SHOE. The horseshoe whipped off his hip and flung spinning like a ring toss;
  // it sails out, turns and comes back; he catches it and gives a proud snort.
  if (touch === 'shoe') {
    const wind2 = win(since, 0, 0.12, 0.18, 0.3);
    const throwK = win(since, 0.18, 0.3, 0.7, 1.0);
    const catchK = win(since, 1.0, 1.1, 1.3, 1.6);
    go({ tilt: -6, pelvis: -6, shN: 30, elN: -100, head: -4 }, wind2);
    go({ tilt: 8, pelvis: 6, waist: 6, shN: -96, elN: 6, shF: 50, elF: 40, fxN: 0.3, fxF: -0.2 }, throwK);
    go({ tilt: -3, shN: -120, elN: -40, head: -10, chest: -4 }, catchK);
    q.shoeAt = since < 0.24 ? 'hand' : since < 1.12 ? 'flying' : 'hand';
    q.shoe = since;
    q.face = since < 1.1 ? 'angry' : 'proud';
    q.mouth = since < 1.1 ? 'snort' : 'grin';
    if (since > 1.15) q.steam.push(since - 1.15);
  }
  // Beaten: a thud as he sits down hard; the horseshoe drops off his hip and lands upside down; he
  // lies back, his forelock flopping over his eyes, ears down.
  if (m.hp <= 0) {
    st.mgDeadAt ??= now;
    const d = now - st.mgDeadAt;
    const sit = sstep(d / 0.3);
    const back = sstep((d - 0.7) / 0.8);
    go({ drop: 0.85, fxN: 0.6, fxF: -0.6, tilt: -4, head: 10, shN: -50, elN: -40, shF: 50, elF: 40 }, sit);
    go({ tilt: -18, waist: -8, chest: -8, head: -22, neckR: -6, shN: -100, elN: 10, shF: 100, elF: -10 }, back);
    q.face = d < 0.7 ? 'hurt' : 'sad';
    q.mouth = 'sad';
    q.earDrop = 1;
    q.lockOver = back;
    q.shoeAt = 'drop';
    q.shoe = d;
    q.thud = d;
  } else st.mgDeadAt = undefined;
  // His entrance, woken at the big barn: a crouch, a mighty BACK-KICK (the barn doors burst open
  // behind him), he stomps out, two snorts of steam, one STAMP that throws up dust, ears up; the
  // doors swing shut behind him.
  if (entrance >= 0) {
    const e = entrance;
    q.doors = e;
    q.doorX = ((m.spawn?.x ?? m.x) - m.x) * (m.dir ?? 1);
    const crouch = win(e, 0, 0.25, 0.32, 0.42);
    const kick = win(e, 0.32, 0.42, 0.6, 0.9);
    go({ drop: 0.25, tilt: 10, head: 8, shN: -40, elN: -40, shF: 40, elF: 40 }, crouch);
    go({ tilt: 16, waist: 6, head: 6, shN: -70, elN: -10, shF: 70, elF: 10, fyN: 0.5, fxN: -0.5, toeN: 20 }, kick);
    const snort = win(e, 1.1, 1.3, 1.8, 2.0);
    go({ head: -14, tilt: -4, chest: -5 }, snort);
    for (const s0 of [1.25, 1.6]) if (e > s0) q.steam.push(e - s0);
    const stampUp = win(e, 2.0, 2.2, 2.3, 2.36);
    go({ fyN: 0.45, fxN: 0.1, tilt: -4, shN: -60, elN: -60, shF: 60, elF: 60 }, stampUp);
    const stampDn = win(e, 2.34, 2.38, 2.6, 2.9);
    go({ drop: 0.16, tilt: 4, shN: -40, elN: -50, shF: 40, elF: 50 }, stampDn);
    if (e >= 2.36) q.stamp = e - 2.36;
    q.kick = e >= 0.42 ? e - 0.42 : -1;
    q.face = e < 0.45 ? 'angry' : e < 1.1 ? 'snort' : e < 2.4 ? 'angry' : 'proud';
    q.mouth = e < 1.1 ? 'snort' : e < 2.4 ? 'shout' : 'grin';
    if (q.face === 'snort') q.face = 'angry';
    q.flare = win(e, 1.1, 1.2, 1.9, 2.1);
    q.earUp = win(e, 2.6, 2.8, 3.0, 3.2);
  }
  // His act: only while he stands calm (never walking, in the fight, a scene, just after a hit, cross,
  // napping or guarding); eased in and out on a spring, so starting to walk never snaps a pose.
  const goal = m.hp > 0 && !busy && !m.cine && !napping && !guardK && (a.hurtAgo ?? 9) > 2 && !(now < (m.aggroUntil ?? 0)) && !(gl >= 0 && gl < 1.2) && !low ? 1 - walkW : 0;
  const dt = clamp(a.dt ?? 0, 0, 0.1);
  st.mgCalm = Number.isFinite(st.mgCalm) ? st.mgCalm + (goal - st.mgCalm) * Math.min(1, dt * 6) : goal;
  const w = st.mgCalm;
  if (w > 0.01) {
    const lu = (t + 3) % CYCLE;
    // 1. a carrot: a glove to the bib pocket, up to his mouth, munch munch, eyes shut, bliss
    const reach = W(lu, 'reach', w);
    go({ shN: -4, elN: -110, head: 6 }, reach);
    const munch = W(lu, 'munch', w);
    const chew = Math.sin(lu * 14);
    go({ shN: 26, elN: 142, head: -3 + chew * 1.2, neckR: chew * 1.5 }, munch);
    if (munch > 0.3 || reach > 0.5) {
      q.held = 'carrot';
      q.bite = clamp((lu - 1.4) / 3, 0, 1);
      q.carrotOut = true;
    }
    say('munch', munch, 'munch');
    if (munch > 0.4) q.crumbs = lu;
    const bliss = W(lu, 'bliss', w);
    say('happy', bliss, 'grin');
    go({ head: -6, chest: -3 }, bliss);
    // 2. his chore list, held out at arm's length, squinted at; head back; a shrug
    const list = W(lu, 'list', w);
    go({ shN: -78, elN: -24, head: -8, tilt: -4, neckR: -3 }, list);
    if (list > 0.3) q.held = 'note';
    say('squint', list, 'calm');
    if (list > 0.4) q.look = [0.9, -0.2];
    const shrug = W(lu, 'shrug', w);
    go({ shrugN: 10, shrugF: 10, shN: -30, elN: -60, shF: 30, elF: 60, head: 4 }, shrug);
    say('sad', shrug * 0.9, 'calm');
    // 3. a mane toss and a big tail swish, ears flicking
    const toss = W(lu, 'toss', w);
    out.head += toss * Math.sin((lu - 12) * 7) * 12;
    out.neckR += toss * Math.sin((lu - 12) * 7 - 0.6) * 5;
    q.toss = toss;
    q.swish = toss;
    say('proud', toss * 0.9, 'calm');
    // 4. a yawning whinny: head back, mouth wide, gloves up in a stretch; a shake of the head
    const yawn = W(lu, 'yawn', w);
    go({ head: -18, tilt: -5, chest: -6, shN: -150, elN: -60, shF: 150, elF: 60 }, yawn);
    say('yawn', yawn, 'yawn');
    const shake = W(lu, 'shake', w);
    out.head += shake * Math.sin((lu - 17.9) * 30) * 6;
    q.toss = Math.max(q.toss, shake);
    say('blink', shake);
    // 5. Honkers: the goose waddles up; HONK; he jumps and hides behind his gloves, trembling;
    // the goose waddles off; he peeks out between his fingers; a big sigh
    const gooseK = W(lu, 'goose', w);
    if (lu > ACT.goose[0] && lu < ACT.goose[3]) q.goose = { lu, k: gooseK };
    const jump = W(lu, 'jump', w);
    go({ lift: 0.05, shN: -90, elN: -60, shF: 90, elF: 60 }, jump);
    say('startle', jump, 'startle');
    const hide = W(lu, 'hide', w);
    const tr = Math.sin(lu * 34) * 0.8;
    go({ drop: 0.1, tilt: -6, head: 8, shN: 74, elN: 140, shF: -74, elF: -140, x: -0.04, chest: tr }, hide);
    say('hide', hide, 'hide');
    q.earPin = Math.max(q.earPin, hide);
    const peek = W(lu, 'peek', w);
    go({ drop: 0.06, head: 2, shN: 60, elN: 130, shF: -30, elF: -60 }, peek);
    say('peek', peek, 'o');
    if (peek > 0.4) q.look = [0.8, 0.4];
    const sigh = W(lu, 'sigh', w);
    go({ head: 10, chest: 3, tilt: 2 }, sigh);
    say('blink', sigh, 'calm');
    if (sigh > 0.3) q.steam.push((lu - 26.1) * 1.4);
    // 6. the horseshoe: unhooked, breathed on, rubbed on his overalls; held up to shine
    const polish = W(lu, 'polish', w);
    const rub = Math.sin(lu * 16);
    go({ shN: -8 + rub * 6, elN: -100, shF: -30, elF: -110, head: 10 }, polish);
    if (polish > 0.3) {
      q.shoeAt = 'hand';
      q.shoe = 0;
    }
    say('squint', polish, 'calm');
    if (polish > 0.4 && lu < 28.4) q.steam.push((lu - 27.9) * 2);
    const admire = W(lu, 'admire', w);
    go({ shN: -130, elN: -30, head: -12, tilt: -3 }, admire);
    if (admire > 0.3) {
      q.shoeAt = 'hand';
      q.shoe = 0;
      q.glint = admire;
    }
    say('proud', admire, 'grin');
    // 7. a roll of his big shoulders and a stretch of his back
    const roll = W(lu, 'roll', w);
    out.shrugN += roll * (Math.sin((lu - 31.8) * 4) + 1) * 7;
    out.shrugF += roll * (Math.sin((lu - 31.8) * 4 + 1.8) + 1) * 7;
    go({ tilt: -4, chest: -5, head: -6 }, roll);
    say('blink', roll * 0.9, 'calm');
  }
  if (!q.face) q.face = (t + 0.4) % 4.6 < 0.13 ? 'blink' : 'calm';
}

// ---------- Live extras ----------
// Under everything: the barn's doors bursting open behind him as he wakes, and the dust kicked up
// under his hooves.
function under2(ctx, m, a, S, matOf, D) {
  const q = a.mgB ?? {};
  ctx.save();
  ctx.scale(1 / BIG, 1 / BIG);
  if (q.doors >= 0 && q.doors < 3.2) {
    // the barn's big double door (the barn's own: two red leaves with white X braces, 44 x 40 px),
    // each leaf swinging out on its hinges at the kick (seen edge-on as it turns, then flat out
    // beside the doorway), and back shut at the end
    const e = q.doors;
    const x0 = q.doorX ?? 0;
    const open = sstep((e - 0.42) / 0.14) * (1 - sstep((e - 2.7) / 0.4));
    // (a wobble as they bang against the wall, and as they slam shut)
    const wob = Math.sin(clamp((e - 0.56) / 0.4, 0, 1) * Math.PI * 3) * 0.08 * (1 - clamp((e - 0.56) / 0.4, 0, 1));
    const ang = (open * 0.86 + wob) * Math.PI;
    for (const side of [-1, 1]) {
      const hx = x0 + side * 21;
      const k = Math.cos(ang);
      ctx.save();
      ctx.translate(hx, -38);
      ctx.scale(side * -k, 1);
      ctx.beginPath();
      ctx.rect(0, 0, 19, 38);
      pen(ctx, '#b0444e', 1.2);
      ctx.stroke();
      ctx.fillStyle = k > 0 ? '#e8626c' : '#cc545e';
      ctx.fill();
      pen(ctx, '#ffffff', 1);
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.lineTo(18, 37);
      ctx.moveTo(18, 1);
      ctx.lineTo(1, 37);
      ctx.stroke();
      ctx.restore();
    }
    // the dark of the barn inside, showing between them
    if (open > 0.05) {
      ctx.globalAlpha = open;
      ctx.fillStyle = '#5a3a44';
      const gap = 21 * (1 - Math.max(0, Math.cos(ang)));
      ctx.fillRect(x0 - gap, -38, gap * 2, 38);
      ctx.globalAlpha = 1;
      // hay blown out of the doorway
      for (const [dx, dy, l, an, d] of [[-8, -6, 5, -0.4, 0.5], [6, -12, 4.4, 0.6, 0.6], [12, -4, 4, -0.2, 0.7], [-14, -16, 4, 0.9, 0.55]]) {
        const u = clamp((e - d) / 1, 0, 1);
        if (u <= 0 || u >= 1) continue;
        ctx.globalAlpha = 1 - u;
        straw(ctx, x0 + dx * (1 + u * 2), dy - u * 10 + u * u * 16, l, an + u * 3);
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
// Over everything: what he holds, the bale and the shoe in flight, the quake, the steam, the dust,
// the goose, the z's, the crumbs.
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mgB ?? {};
  const t = a.t ?? 0;
  const SC = D.SC;
  const hN = ptOf(a, D, 'handN', D.J.handN);
  const hF = ptOf(a, D, 'handF', D.J.handF);
  // (in game px from here: his rig space is drawn BIG)
  ctx.save();
  ctx.scale(1 / BIG, 1 / BIG);
  const G = (p) => [p[0] * BIG, p[1] * BIG];
  const hn = G(hN);
  const hf = G(hF);
  // the steam of a snort: two puffs from his nostrils, drifting out and fading
  for (const u0 of q.steam ?? []) {
    const u = clamp(u0 / 0.7, 0, 1);
    if (u <= 0 || u >= 1) continue;
    for (const side of [-1, 1]) {
      const p = G(headAt(a, D, [side * 6.4, 16]));
      steam(ctx, p[0] + side * (2 + u * 6), p[1] + 2 + u * 3, 1.6 + u * 2.4, (1 - u) * 0.9);
    }
  }
  // what he holds in his near glove
  if (q.held === 'carrot') carrot(ctx, hn[0] - 1, hn[1] - 3, -0.9, q.bite ?? 0);
  if (q.held === 'note') note(ctx, hn[0] + 1, hn[1] - 4, 0.2);
  if (q.crumbs) {
    const p = G(headAt(a, D, [0, 26]));
    ctx.fillStyle = '#f59a4a';
    for (let i = 0; i < 3; i++) {
      const u = ((q.crumbs * 1.3 + i * 0.37) % 1);
      ell(ctx, p[0] + (i - 1) * 2.4 + u * (i - 1) * 2, p[1] + u * 14, 0.6, 0.5);
      ctx.fill();
    }
  }
  // the horseshoe: on his hip (drawn with the overalls), in his glove, flying, or dropped
  if (q.shoeAt === 'hand') {
    const L = q.glint ?? 0;
    ctx.save();
    for (const mode of ['line', 'fill']) shoe(ctx, a, mode, hn[0] + 1, hn[1] - 8, 0.15, 0.9, 2);
    ctx.restore();
    if (L > 0.3) {
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, hn[0] + 6, hn[1] - 15, 2.6 * L + Math.sin(t * 9) * 0.4);
      ctx.fillStyle = '#ffe680';
      sparkle(ctx, hn[0] - 4, hn[1] - 12, 1.6 * L);
    }
  }
  if (q.shoeAt === 'flying') {
    // out on a flat arc ahead of him, spinning, then back
    const u = clamp((q.shoe - 0.24) / 0.88, 0, 1);
    const out = Math.sin(u * Math.PI);
    const x = hn[0] + out * 22;
    const y = hn[1] - 6 - Math.sin(u * Math.PI) * 8 + u * 2;
    for (const mode of ['line', 'fill']) shoe(ctx, a, mode, x, y, u * 14, 1.2, 2);
    ctx.globalAlpha = 0.8;
    for (let i = 1; i <= 3; i++) {
      const ub = clamp(u - i * 0.05, 0, 1);
      ctx.fillStyle = i % 2 ? '#ffe680' : '#ffffff';
      sparkle(ctx, hn[0] + Math.sin(ub * Math.PI) * 22, hn[1] - 6 - Math.sin(ub * Math.PI) * 8, 2.2 - i * 0.4);
    }
    ctx.globalAlpha = 1;
    if (u > 0.3 && u < 0.5) clover(ctx, x - 10, y + 3, 1.4, t * 3);
  }
  if (q.shoeAt === 'drop') {
    // off his hip, a bounce, and down upside down by his side (its luck run out)
    const d = q.shoe;
    const k = sstep(d / 0.6);
    const hip = G(ptOf(a, D, 'torso', [D.J.hip[0] - 25, D.J.hip[1] + 2]));
    const x = lerp(hip[0], hip[0] - 14, k);
    const y = lerp(hip[1], -3, k) - Math.sin(clamp(d / 0.6, 0, 1) * Math.PI) * 6 - (d > 0.6 && d < 0.9 ? Math.sin(((d - 0.6) / 0.3) * Math.PI) * 2 : 0);
    for (const mode of ['line', 'fill']) shoe(ctx, a, mode, x, y, lerp(0.25, Math.PI, k), 0.8, 2);
  }
  // the bale: hoisted over his head, then flung down ahead, bursting into straw
  if (q.bale != null) {
    const s = q.bale;
    if (s < 0.5) {
      const mx = (hn[0] + hf[0]) / 2;
      const my = Math.min(hn[1], hf[1]) - 7;
      const rise = sstep(s / 0.22);
      for (const mode of ['line', 'fill']) bale(ctx, a, mode, lerp(mx - 20, mx, rise), lerp(my + 30, my, rise), lerp(-0.8, -0.06, rise), 0.62);
    } else if (s < 0.72) {
      const u = (s - 0.5) / 0.22;
      for (const mode of ['line', 'fill']) bale(ctx, a, mode, lerp(hn[0], 36, u), lerp(hn[1] - 10, -7, u * u), 0.4 * u, 0.62);
    } else {
      const u = clamp((s - 0.72) / 0.8, 0, 1);
      puff(ctx, 36, -4, 5 + u * 5, 1 - u);
      for (const [dx, dy, l, an] of [[-10, -12, 6, -0.6], [9, -16, 5.4, 0.7], [-16, -4, 5, 0.2], [16, -6, 5, -0.4], [0, -20, 4.6, 1.2], [5, -9, 4, -1]]) {
        ctx.globalAlpha = 1 - u;
        straw(ctx, 36 + dx * (0.4 + u), dy * (0.4 + u) + u * u * 14, l, an + u * 4);
      }
      ctx.globalAlpha = 1;
    }
  }
  // CLOVER QUAKE: round his stomping hoof the turf heaves up in slabs and drops back, cracks run out
  // along the ground, clods and clover fly up and fall, dust rolls out both ways
  if (q.quake >= 0) {
    const s = q.quake;
    const f = G(ptOf(a, D, 'footN', D.J.ankN));
    const x = f[0];
    const crackK = sstep(s / 0.15) * (1 - sstep((s - 0.9) / 0.4));
    ctx.globalAlpha = crackK;
    pen(ctx, '#8a5a3a', 1);
    for (const side of [-1, 1]) {
      const reach = sstep(s / 0.25);
      ctx.beginPath();
      ctx.moveTo(x + side * 6, 0);
      ctx.lineTo(x + side * (6 + 8 * reach), -0.8);
      ctx.lineTo(x + side * (6 + 13 * reach), 0.3);
      ctx.lineTo(x + side * (6 + 20 * reach), -0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the slabs: heaved up and tipped, then settling back
    const heave = Math.sin(clamp(s / 0.6, 0, 1) * Math.PI);
    for (const [dx, w, h, an] of [[-12, 8, 3.6, -0.45], [13, 9, 4, 0.4], [-22, 6, 2.8, -0.25], [24, 6.4, 3, 0.3]]) {
      ctx.save();
      ctx.translate(x + dx, -1 - heave * 3.4 * (Math.abs(dx) < 15 ? 1 : 0.6));
      ctx.rotate(an * heave);
      smooth(ctx, [[-w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2]]);
      pen(ctx, '#8a5a3a', 0.9);
      ctx.stroke();
      ctx.fillStyle = '#a8724a';
      ctx.fill();
      ctx.fillStyle = '#7fc46a';
      ctx.fillRect(-w / 2, -h / 2, w, h * 0.4);
      ctx.restore();
    }
    // clods and clover flung up in arcs
    for (const [vx, vy, r, d] of [[-30, 46, 2.6, 0], [26, 52, 2.4, 0.02], [-44, 30, 1.8, 0.04], [42, 34, 2, 0.03], [6, 58, 1.7, 0.05]]) {
      const u = s - d;
      if (u < 0 || u > 1.1) continue;
      const y = -(vy * u - 90 * u * u);
      if (y > 1) continue;
      ctx.globalAlpha = 1 - sstep((u - 0.8) / 0.3);
      clod(ctx, x + vx * u, y - 2, r, vx * u * 0.08);
    }
    for (const [vx, vy, d] of [[-18, 50, 0.02], [20, 56, 0.05], [34, 40, 0.07]]) {
      const u = s - d;
      if (u < 0 || u > 1.2) continue;
      ctx.globalAlpha = 1 - sstep((u - 0.8) / 0.4);
      clover(ctx, x + vx * u, Math.min(-2, -(vy * u - 60 * u * u)), 1.8, u * 6);
    }
    ctx.globalAlpha = 1;
    for (const [dx, r, d] of [[-1, 5, 0], [1, 5.4, 0.02], [-1, 3.6, 0.1], [1, 3.8, 0.12]]) {
      const u = clamp((s - d) / 1.1, 0, 1);
      if (u <= 0) continue;
      const far = r > 4.5 ? 18 : 30;
      puff(ctx, x + dx * (far * 0.6 + u * far), -2.4 - u * 2, r * (0.7 + u * 0.8), (1 - u) * 0.95);
    }
  }
  // the entrance's back-kick: a dust puff at the doors; and its stamp: dust out both ways
  if (q.kick >= 0 && q.kick < 1) {
    const u = q.kick;
    puff(ctx, (q.doorX ?? 0), -10 - u * 6, 5 + u * 8, (1 - u) * 0.9);
  }
  if (q.stamp >= 0 && q.stamp < 0.9) {
    const u = q.stamp / 0.9;
    const f = G(ptOf(a, D, 'footN', D.J.ankN));
    for (const side of [-1, 1]) puff(ctx, f[0] + side * (6 + u * 16), -2.2, 3 + u * 3, (1 - u) * 0.95);
    clod(ctx, f[0] + 8 + u * 12, -2 - Math.sin(u * Math.PI) * 10, 1.6, u * 4);
    clod(ctx, f[0] - 8 - u * 10, -2 - Math.sin(u * Math.PI) * 8, 1.4, -u * 4);
  }
  // beaten: the thud's dust
  if (q.thud >= 0 && q.thud < 0.9) {
    const u = q.thud / 0.9;
    for (const side of [-1, 1]) puff(ctx, side * (14 + u * 14), -2.4, 4 + u * 3, (1 - u) * 0.9);
  }
  // asleep: soft z's drifting up off his head
  if (q.zz > 0) {
    const p = G(headAt(a, D, [14, -24]));
    ctx.fillStyle = '#7aa6e8';
    ctx.font = 'bold 6px sans-serif';
    for (let i = 0; i < 2; i++) {
      const u = (t * 0.45 + i * 0.5) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * q.zz;
      ctx.save();
      ctx.translate(p[0] + u * 6 + i * 2, p[1] - u * 12);
      ctx.scale(a.flip ? -1 : 1, 1);
      ctx.fillText('z', 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  // Honkers: the real goose, waddling up from ahead of him, honking twice, waddling off
  if (q.goose) drawGoose(ctx, m, a, q.goose);
  ctx.restore();
}
// The goose's own visit (the real Honkers rig, game px; it waddles in toward him from ahead, honks,
// then turns and waddles back off the way it came).
function drawGoose(ctx, m, a, g) {
  const st = a.mo?.rig ?? (a.mo.rig = {});
  const lu = g.lu;
  const [g0, , , g3] = ACT.goose;
  const tIn = 1.9;
  const tOut = 24.4;
  const near = 42;
  const far = 56;
  let x;
  let dir;
  let moving;
  if (lu < g0 + tIn) {
    x = lerp(far, near, sstep((lu - g0) / tIn));
    dir = -1;
    moving = lu < g0 + tIn - 0.1;
  } else if (lu < tOut) {
    x = near;
    dir = -1;
    moving = false;
  } else {
    x = lerp(near, far, sstep((lu - tOut) / (g3 - tOut)));
    dir = 1;
    moving = true;
  }
  const gm = (st.mgGoose ??= { def: gooseDef(m.def), hp: 88, uid: (m.uid ?? 0) + 7, x: 0, y: 0, dir: -1, state: 'idle', attackAt: -99, gloatAt: -99, aggroUntil: 0, odo: 0, flash: 0, phase: 0, windup: 0, move: 'honk' });
  const ga = (st.mgGooseA ??= { mo: {} });
  const prevX = gm.x;
  gm.x = x;
  gm.odo += Math.abs(x - prevX) < 20 ? Math.abs(x - prevX) : 0;
  gm.state = moving ? 'walk' : 'idle';
  gm.dir = dir;
  gm.heading = dir;
  // its honks: on the beat, the base's honk move
  let honk = -99;
  for (const h of GOOSE_HONKS) if (lu >= h) honk = h;
  gm.attackAt = honk > -99 ? (a.now ?? 0) - (lu - honk) : -99;
  Object.assign(ga, { t: (a.t ?? 0) + 3.1, now: a.now ?? a.t ?? 0, dt: a.dt ?? 0, mood: 'calm', moving, hurtAgo: 9, flip: (dir < 0) !== !!a.flip, flash: 0, alpha: 1 }); // (flip = mirrored on screen: his own space is mirrored when he faces left, so its HONK! reads right)
  const fade = sstep((lu - g0) / 0.5) * (1 - sstep((lu - (g3 - 0.5)) / 0.5));
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.translate(x, 0);
  if (dir < 0) ctx.scale(-1, 1);
  gooseArt.rig.draw(ctx, gm, ga);
  ctx.restore();
}

// ---------- Him ----------
const DRESS = {
  id: 'barnaby',
  skin: { lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  under2: (ctx, m, a, S, matOf, D) => {
    under2(ctx, m, a, S, matOf, D);
    tail(ctx, a, 'line', D);
    tail(ctx, a, 'fill', D);
  },
  under: {
    neckSkin: (ctx, a, mode, S, D) => mane(ctx, a, mode, D),
  },
  over: {
    handFskin: (ctx, a, mode, S, D) => glove(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => shortsLeg(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => feather(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => shortsLeg(ctx, a, mode, D, 'N'),
    footNskin: (ctx, a, mode, S, D) => feather(ctx, a, mode, D, 'N'),
    torsoSkin: (ctx, a, mode, S, D) => {
      overalls(ctx, a, mode, D);
      if ((a.mgB?.shoeAt ?? 'hip') === 'hip') {
        const p = D.J.hip;
        ctx.save();
        enter(ctx, a, D, 'torso');
        shoe(ctx, a, mode, p[0] - 25, p[1] + 2, 0.25, 1);
        ctx.restore();
      }
    },
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => glove(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};

const R = dressRig('barnaby', DRESS);
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
rig.h = Math.round(rig.h * BIG * 1.25);
// (noHop: no little happy hops from the monster drawer; his own weight carries his motion)
export const MACGOBLIN_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 460, 220, 260], draw: R.still, rig, noHop: true };
export const MACGOBLIN_SIZE = { w: 56, h: 88 };
