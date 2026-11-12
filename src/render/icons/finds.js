// Icons for everything else you find, grow, buy or earn: the newer monster drops, every gathered
// herb, flower and fruit, the home furniture sets and trophies, the mount keys and the odd tonics
// (Royal Jelly, the Home Shell, Lantern Bait). Same kit and style as the drop icons
// (icons/items.js): flat parts lit from the top left, a light, a base and a shadow tone, a white
// glint, the sprite's own outline. Added to ITEM_ART so icons.js draws them like any other.

import { ITEM_ART, hi, lt, sh, dk, S, oval, arcPts, bez, bez3, rect, clip, ball, tube, line, bevel, twinkle, glint, leaf, turn, framed, W, GOLD, D2R } from './items.js';

// ---------- Shapes ----------

function rrect(x, y, w, h, r, n = 5) {
  const cs = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
  return cs.flatMap(([cx, cy, a]) => arcPts(cx, cy, r, r, a, a + 90, n));
}
const starPts = (cx, cy, R, r, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => {
  const a = (rot + (i * 180) / n) * D2R;
  const k = i % 2 ? r : R;
  return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
});
const heartPts = (cx, cy, s) => [...bez3([cx, cy + s * 0.9], [cx - s * 1.3, cy], [cx - s * 0.9, cy - s * 1.1], [cx, cy - s * 0.4], 10), ...bez3([cx, cy - s * 0.4], [cx + s * 0.9, cy - s * 1.1], [cx + s * 1.3, cy], [cx, cy + s * 0.9], 10).slice(1)];
// A crescent: the outer arc of a disc with an offset disc bitten out.
const crescent = (cx, cy, r, bx, by, k = 0.82) => [...arcPts(cx, cy, r, r, -40, 230, 18), ...arcPts(cx + bx, cy + by, r * k, r * k, 230, -40, 18)];
const disc = (cx, cy, r, c, o) => ball(oval(cx, cy, r, r, 0, 22), c, o);
// A five-petal blossom: petals round a centre, lit on the upper ones.
function blossom(cx, cy, r, c, mid = '#ffe36b', n = 5, rot = -90) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (rot + (i * 360) / n) * D2R;
    const px = cx + Math.cos(a) * r * 0.62;
    const py = cy + Math.sin(a) * r * 0.62;
    out.push(S(oval(px, py, r * 0.52, r * 0.42, (a / D2R), 16), Math.sin(a) < -0.2 ? lt(c) : Math.sin(a) > 0.4 ? sh(c) : c));
  }
  out.push(S(oval(cx, cy, r * 0.3, r * 0.3, 0, 12), mid));
  return out;
}
const stem = (pts, c = '#6fbf5a', w = 0.7) => S(tube(pts, w), c);
// Sugar sprinkles / seeds: little dashes.
const dots = (list, c, r = 0.35) => list.map(([x, y]) => S(oval(x, y, r, r * 0.8, 0, 8), c));

// ---------- Tonics and keys ----------

// Royal Jelly: a squat glass jar of golden jelly, a little crown on the lid.
function royal_jelly() {
  const jelly = '#ffd86a';
  const out = [...ball(rrect(2.4, 6, 11.2, 9.2, 2.6), '#eef6ff', { glow: 0.6 })];
  out.push(...ball(rrect(3.2, 8, 9.6, 6.6, 2), jelly, { k: 0.9 }), S(oval(8, 8.2, 4.6, 0.9, 0, 16), hi(jelly)));
  out.push(...ball(rrect(3, 4.4, 10, 2.4, 1), '#ff9ec0', { glow: 0.5 }));
  out.push(...ball([[4.6, 4.6], [4.4, 1.4], [6.2, 3], [8, 0.8], [9.8, 3], [11.6, 1.4], [11.4, 4.6]], GOLD, { k: 0.9 }));
  out.push(S(oval(8, 2.8, 0.7, 0.7, 0, 10), '#ff6b8a'));
  out.push(S(rect(3.8, 9, 1, 4.4), '#f6fbff'), ...glint(5, 10, 0.5));
  return out;
}

// Home Shell: a pink spiral conch, the sound of the island's waves curling out of it.
function home_shell() {
  const c = '#ffc2d4';
  const out = [...ball(oval(7, 8.4, 6, 5.8, 0, 28), c)];
  // The whorl spiralling in to its tip, and the glossy lip of the opening at the lower right.
  const whorl = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    const a = (200 + t * 560) * D2R;
    const r = 5 * (1 - t * 0.85);
    return [6.6 + Math.cos(a) * r, 8.2 + Math.sin(a) * r];
  });
  out.push(line(whorl, 0.55, sh(c)), S(oval(10.6, 11.6, 3, 2.4, -30, 18), '#ff8fb0'), S(oval(10.9, 11.4, 1.7, 1.2, -30, 14), '#ffe6ee'));
  out.push(line(arcPts(12.6, 6, 1.8, 1.8, -70, 40, 8), 0.45, '#8fd8ff'), line(arcPts(12.6, 6, 3.2, 3.2, -60, 30, 8), 0.4, '#bfeaff'));
  out.push(...glint(4, 5.4, 0.55));
  return out;
}

// A brass key on a ribbon; its bow is a little kettle (the Kettle Racer).
function mount_kettle() {
  const brass = '#e8b04a';
  const out = [S(tube(bez([2, 1.6], [3.6, 4], [5.4, 4.6], 6), 1.1), '#f4a98a'), S(tube(bez([2, 1.6], [0.8, 3.4], [1.6, 5.2], 6), 1), sh('#f4a98a'))];
  out.push(...ball(oval(6.4, 6.6, 3.4, 2.8, 0, 22), brass));
  out.push(S(tube(arcPts(6.4, 4.6, 1.8, 1.4, 190, 350, 8), 0.55), dk(brass)), S(tube([[9.4, 6.2], [11, 4.8]], 0.9), brass));
  out.push(S(oval(6.4, 6.8, 1.2, 0.9, 0, 12), dk(brass)));
  out.push(S(tube([[8.4, 8.6], [13.8, 14]], 1.5), brass), S(tube([[8.2, 8.2], [13.4, 13.4]], 0.5), lt(brass)));
  out.push(S([[11.2, 12.6], [12.8, 11], [13.6, 11.8], [12, 13.4]], brass), S([[12.6, 14], [14.2, 12.4], [15, 13.2], [13.4, 14.8]], brass));
  out.push(...glint(4.8, 5.6, 0.5));
  return out;
}

// Nimbus Whistle: a white cloud-shaped whistle, a sleepy puff of cloud blowing out of it.
function mount_nimbus() {
  const c = '#dfe6fb';
  const out = [];
  for (const [x, y, r] of [[11.6, 4.4, 2], [13.6, 5.8, 1.6], [10.2, 2.6, 1.4]]) out.push(...disc(x, y, r, '#ffffff', { glow: 0.6 }));
  out.push(S(tube([[1.4, 12.6], [5.4, 9.4]], 2.2), '#8fb0e8'));
  out.push(...ball([...bez3([4, 12], [3.4, 8], [6, 6.8], [9, 7.2], 10), ...bez3([9, 7.2], [11.8, 7.6], [12.6, 10.8], [10.6, 13], 10).slice(1), ...bez3([10.6, 13], [8.4, 15], [4.6, 15], [4, 12], 10).slice(1)], c));
  out.push(S(oval(9.2, 9.4, 1.2, 0.8, 0, 12), sh(c)), S(rect(5.4, 11.6, 4, 0.7), '#ffd36a'));
  out.push(...glint(6, 9, 0.55));
  return out;
}

// Lantern Bait: a jar of plump little shrimp that glow gold.
function lantern_bait() {
  const glow = '#ffd27a';
  const out = [];
  out.push(...ball(rrect(3, 4.6, 10, 10.6, 2.6), '#e6f2ff', { glow: 0.4 }));
  for (const [x, y, d] of [[6.4, 11.6, 0], [9.6, 9.2, 30], [6.6, 7.8, -20]]) {
    const curl = turn(arcPts(x, y, 1.8, 1.6, 140, 400, 10), d, x, y);
    out.push(S(tube(curl, (t) => 1.6 - t * 1.1), '#ff9a6a'), S(tube(curl.slice(0, 6), 0.5), glow));
  }
  out.push(...ball(rrect(2.6, 3, 10.8, 2.2, 0.8), '#c99a6b', { glow: 0.5 }));
  out.push(S(rect(4, 6, 1, 7.6), '#f4faff'), twinkle(12.6, 7, 1.2, '#fff6c0'));
  return out;
}

// ---------- Monster drops ----------

function bee_fuzz() {
  const c = '#ffd65a';
  // A round pom of fuzz with a tufted edge, two soft brown stripes, and a wisp floating off.
  const pom = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const r = 5.6 + (i % 2 ? 0.7 : -0.2);
    return [8 + Math.cos(a) * r, 9 + Math.sin(a) * r * 0.92];
  });
  const out = [...ball(pom, c, { glow: 0.9 })];
  for (const x of [6.4, 10]) out.push(S(clip(tube([[x - 1.4, 3], [x + 1.4, 15]], 1.6), oval(8, 9, 5.2, 4.8, 0, 24)), '#7a5a40'));
  out.push(S(oval(5.6, 6.4, 1.8, 1.2, -30, 12), hi(c)));
  out.push(...ball(oval(13.4, 2.6, 1.4, 1, -20, 12), lt(c), { glow: 0.5 }), line([[12.2, 3.4], [11.4, 4.4]], 0.3, sh(c)));
  out.push(...glint(5, 6, 0.5));
  return out;
}

// (Kept its id; 2026-11-11 it became the Dandelion Puff's seed.) A parachute seed: a brown seed at
// the bottom, a slim stalk, and a fan of white fluff on top, a tuft at each filament's end.
function sprite_petal() {
  const c = '#f4f0ff';
  const out = [...ball(oval(8, 14, 1.3, 2, 0, 12), '#c8a070', { glow: 0.4 }), line([[8, 12.4], [8, 6]], 0.45, '#b8a8b8')];
  for (let i = 0; i < 9; i++) {
    const a = (-160 + i * 17.5) * D2R;
    const tx = 8 + Math.cos(a) * 6;
    const ty = 6 + Math.sin(a) * 5;
    out.push(line([[8, 6], [tx, ty]], 0.3, sh(c)), ...ball(oval(tx, ty, 0.9, 0.9, 0, 10), c, { glow: 0.5 }));
  }
  out.push(twinkle(13.6, 10, 1.3, '#fff6ff'), ...glint(5, 3, 0.5));
  return out;
}

// (2026-11-11) The Strawhog's Hay Quill: one soft golden spine, pale at the tip, a curl of hay
// at its root.
function hay_quill() {
  const c = '#f2c766';
  const out = [S(tube(bez3([4.4, 14], [6.6, 9.6], [9.4, 5.4], [12, 1.8], 10), 1.5, 0.35), c)];
  out.push(S(tube(bez3([5, 13.2], [7, 9.4], [9.6, 5.8], [11.6, 2.6], 10), 0.45, 0.15), lt(c)));
  out.push(S(tube(bez3([3.4, 14.8], [5.2, 13.4], [6.6, 14.4], [8, 13.2], 8), 0.6, 0.3), sh(c)));
  out.push(...glint(9, 5, 0.5));
  return out;
}

// (2026-11-11) The Pumpkin Goblin's Pumpkin Seed: a plump cream seed with its pale rim and a
// little shine, a second one peeking behind it.
function pumpkin_seed() {
  const c = '#f6e2b0';
  const seed = (cx, cy, rot, col) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = 1 - 0.32 * Math.max(0, Math.cos(a));
      const x = Math.sin(a) * 3.4 * r;
      const y = -Math.cos(a) * 5.4;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  };
  const out = [S(seed(10.4, 7.6, 0.5, c), sh(c)), S(seed(7, 8.6, -0.25, c), c)];
  out.push(S(seed(7, 8.9, -0.25, c).map(([x, y]) => [7 + (x - 7) * 0.62, 8.9 + (y - 8.9) * 0.7]), lt(c)));
  out.push(...glint(5.8, 6, 0.55));
  return out;
}

// (2026-11-11) The Lambkin's Curly Wool: a soft cream tuft of curls, a few swirls in it, a pink
// bit of festival bunting tangled in.
function curly_wool() {
  const c = '#fff6ec';
  const out = [];
  for (const [x, y, r] of [[5, 9, 3.4], [8.4, 6.4, 3.8], [11.6, 8.6, 3.2], [8, 10.6, 3.6], [4.6, 6, 2.6]]) out.push(S(oval(x, y, r, r * 0.92), sh(c)));
  for (const [x, y, r] of [[5, 8.6, 2.8], [8.4, 6, 3.2], [11.4, 8.2, 2.6], [8, 10.2, 3], [4.8, 5.8, 2.1]]) out.push(S(oval(x, y, r, r * 0.92), c));
  for (const [x, y] of [[7.6, 5.4], [10.6, 8], [6.6, 9.8], [4.6, 6.2]]) out.push(S(tube(arcPts(x, y, 1.2, 1.1, 200, 470, 8), 0.35), sh(c)));
  out.push(S([[11.6, 11], [14.6, 12.4], [13, 14.4]], '#ff8fb0'), S([[12.6, 11.6], [14, 12.4], [13.2, 13.4]], '#ffc0d4'));
  out.push(...glint(7, 4.6, 0.5));
  return out;
}

// (2026-11-12) The Moss Tortoise's Mossy Scute: a six-sided shell plate, its growth rings showing,
// a cushion of moss and a tiny sprout on top.
function moss_scute() {
  const c = '#c49a64';
  const hex = (r) => starPts(8, 9, r, r, 3, -90);
  const out = [S(hex(6.8), sh(c)), S(hex(6.2), c), S(hex(4.2), lt(c))];
  out.push(S(tube(hex(5.2).concat([hex(5.2)[0]]), 0.35), sh(c)));
  out.push(S(oval(6.6, 6.6, 3.6, 2.2), '#6aa452'), S(oval(6.2, 6.1, 2.6, 1.4), '#8cc46a'));
  out.push(S(tube([[7.6, 5.2], [8.2, 3]], 0.45), '#6aa452'), S(oval(8.9, 3, 1.1, 0.6), '#9ad884'));
  out.push(...glint(10.6, 8.2, 0.5));
  return out;
}

// (2026-11-12) The Moss Owlet's Mossy Down: a soft fluffy feather, cream at the quill and mossy
// green at its tip, a wisp of fluff at its base.
function owl_down() {
  const out = [S(oval(8.6, 7.4, 3.2, 6.2, 40), sh('#a8d48e')), S(oval(8.4, 7.2, 2.8, 5.8, 40), '#cfe8b4'), S(oval(10, 5.2, 2.2, 3.4, 40), '#a8d48e')];
  for (const [x, y] of [[6.4, 9.2], [7.6, 7.4], [9, 5.8]]) out.push(S(tube([[x - 1.4, y + 0.2], [x + 0.6, y - 0.8]], 0.35), '#f4fbe8'));
  out.push(S(tube([[3.6, 13.4], [11.6, 3.2]], 0.55), '#e8dcc0'));
  out.push(S(oval(4.4, 12.2, 1.6, 1.2), '#f4fbe8'), S(oval(3.4, 12.8, 1.1, 0.9), '#f4fbe8'));
  out.push(...glint(10.6, 4.6, 0.5));
  return out;
}

// (2026-11-12) The Red Panda's Ringed Tail Fluff: a fat fluffy tuft of tail fur in rust and pale
// orange rings.
function panda_fluff() {
  const out = [S(oval(8, 8.4, 4.6, 6.4, 35), sh('#d9663a'))];
  const rings = ['#d9663a', '#f2a878', '#d9663a', '#f2a878', '#c4542e'];
  rings.forEach((c, i) => out.push(S(oval(5 + i * 1.6, 11.6 - i * 1.8, 3.6 - i * 0.3, 3.2 - i * 0.25), c)));
  for (const [x, y, d] of [[3.2, 13.2, -40], [12.6, 3.6, 40], [11.4, 6.2, 60]]) out.push(S(oval(x, y, 0.8, 1.6, d), '#f2a878'));
  out.push(...glint(6.4, 9, 0.5));
  return out;
}

// (Kept its id; 2026-11-11 it became the Chickling's Golden Grain: a little ear of wheat.)
function brownie_crumb() {
  const c = '#f2c860';
  const out = [S(tube(bez([8, 15.4], [8.6, 10], [7.4, 4], 8), 0.6), '#c8a050')];
  for (let i = 0; i < 5; i++) {
    const y = 4.4 + i * 1.9;
    for (const s2 of [-1, 1]) out.push(...ball(oval(8 + s2 * 1.5, y, 1.5, 1, s2 * 30, 10), i % 2 ? c : lt(c), { glow: 0.5 }));
  }
  out.push(...ball(oval(7.6, 2.8, 1.1, 1.4, 0, 10), lt(c), { glow: 0.5 }), line([[7.4, 1.6], [6.2, -0.6]], 0.3, sh(c)), line([[8, 1.6], [9.4, -0.6]], 0.3, sh(c)));
  out.push(...glint(5.6, 5, 0.45));
  return out;
}
// (2026-11-11) The Harvest Mouse's Woven Nest: a little round ball of woven grass, strands
// wrapped round it, a round doorway, a wheat ear sticking out of the top.
function woven_nest() {
  const c = '#e2c878';
  const out = [S(oval(8, 9.4, 6, 5.4), sh(c)), S(oval(8, 9, 5.6, 5), c)];
  for (const [a0, a1, r] of [[200, 340, 4.4], [20, 160, 4], [150, 300, 3], [-30, 120, 2.6]]) out.push(S(tube(arcPts(8, 9, r, r * 0.86, a0, a1, 10), 0.35), sh(c)));
  out.push(S(oval(9.4, 10, 1.7, 1.6), '#7a5a30'), S(oval(9.2, 9.8, 1.2, 1.1), '#4a3420'));
  out.push(S(tube(bez([6, 4.6], [5.4, 2.6], [6.4, 0.8], 6), 0.45), '#c8a050'));
  for (const k of [0, 1, 2]) out.push(S(oval(6.2 + (k % 2 ? 0.6 : -0.4), 1.6 + k * 0.9, 0.7, 0.5), '#f0d070'));
  out.push(...glint(5.4, 6.6, 0.5));
  return out;
}

function moonlit_ribbon() {
  const c = '#c9a6ff';
  const out = [];
  for (const s of [-1, 1]) {
    out.push(...ball([[8, 7], [8 + s * 6.4, 3.4], [8 + s * 6.6, 9.4]], c, { glow: 0.7 }));
    out.push(S(tube([[8, 8], [8 + s * 3, 12], [8 + s * 2.4, 15]], (t) => 1.6 - t * 0.6), sh(c)));
  }
  out.push(...disc(8, 7.4, 1.4, sh(c)));
  out.push(...ball(crescent(8, 12.2, 2.4, 1.2, -0.8), '#fff3b0'));
  out.push(twinkle(13.6, 12.8, 1.1, '#fff6ff'), ...glint(4, 5.4, 0.5));
  return out;
}

function porcelain_shard() {
  const c = '#ffe6ee';
  const shard = [[2, 6], [7.4, 1.6], [10, 4.4], [14.6, 3.4], [13, 9.6], [15, 13.4], [8.4, 14.6], [6, 11], [1.8, 12]];
  const out = [...bevel(shard, [[3.4, 6.6], [7.4, 3], [10, 5.8], [13, 5], [11.8, 9.6], [13, 12.4], [8.8, 13.2], [6.4, 10], [3.2, 10.8]], sh(c), c)];
  // A blue painted flower and a rim band.
  out.push(...blossom(8.6, 8.4, 3, '#8fb4ff', '#ffffff'), S(tube([[3, 7.4], [7.4, 3.6], [9.8, 6]], 0.6), '#8fb4ff'));
  out.push(...glint(5, 8, 0.55));
  return out;
}

function candle_wax() {
  const c = '#fff4d6';
  const out = [S(oval(8, 12.4, 6, 2.6, 0, 22), sh(c)), S(oval(7.6, 12, 5, 1.8, 0, 20), c)];
  out.push(...ball([[4.6, 12], [4.6, 6.6], [11.4, 6.6], [11.4, 12]], c, { k: 0.9 }));
  out.push(S(oval(8, 6.6, 3.4, 1, 0, 16), lt(c)));
  for (const [x, l] of [[5.4, 3], [10.2, 4.4], [8, 2]]) out.push(S(tube([[x, 6.6], [x, 6.6 + l]], (t) => 1.1 - t * 0.3), lt(c)));
  out.push(S(tube([[8, 6.6], [8, 4.6]], 0.4), '#5a4a60'));
  out.push(S(oval(8, 2.8, 1.6, 2.4, 0, 16), '#8fd8ff'), S(oval(8, 3.4, 0.8, 1.3, 0, 12), '#e6faff'));
  out.push(...glint(5.6, 8, 0.5));
  return out;
}

function tide_pearl() {
  const shell = '#9fd0e8';
  const out = [...ball([...arcPts(8, 9, 7, 5.6, 180, 360, 14), [15, 9], [8, 10.6], [1, 9]], shell, { glow: 0.6 })];
  for (const x of [4, 6.4, 9.6, 12]) out.push(line([[8, 9.6], [x, 4]], 0.35, sh(shell)));
  out.push(...ball([...arcPts(8, 10, 7, 4.6, 0, 180, 14)], lt(shell), { glow: 0.4 }));
  out.push(...disc(8, 9.6, 3, '#f4fbff', { glow: 1.1 }), S(oval(8.8, 10.6, 1.4, 1, 0, 12), '#d8e8ff'));
  out.push(...glint(6.8, 8.4, 0.6));
  return out;
}

function sea_glass() {
  const c = '#9fe8d8';
  const out = [];
  for (const [x, y, rx, ry, d, col] of [[6, 7, 4.6, 3.4, -20, c], [11, 11.4, 3.4, 2.6, 15, '#9fc8ff'], [11.6, 4.6, 2.2, 1.8, 30, '#d8f4c8']]) {
    out.push(...ball(oval(x, y, rx, ry, d, 22), col, { glow: 0.7 }), S(oval(x - rx * 0.3, y - ry * 0.3, rx * 0.4, ry * 0.25, d, 12), '#f4faff'));
  }
  out.push(twinkle(3.6, 12.6, 1.2), ...glint(4.6, 6, 0.5));
  return out;
}

function jelly_ribbon() {
  const c = '#ffb3e0';
  const band = bez3([1, 12], [5, 1], [10, 16], [15, 4], 18);
  const out = [S(tube(band, 3.6), sh(c)), S(tube(band.map(([x, y]) => [x - 0.3, y - 0.4]), 2.4), c), S(tube(band.map(([x, y]) => [x - 0.5, y - 0.8]), 0.8), hi(c))];
  out.push(...dots([[4.6, 8], [8.4, 9.4], [12, 8]], '#ffffff', 0.4), ...glint(3, 9, 0.5));
  return out;
}

function golden_ticket() {
  const c = '#ffd36b';
  const body = [[1, 4], [15, 4], [15, 7], ...arcPts(15, 8.4, 1.4, 1.4, 90, 270, 6), [15, 9.8], [15, 12.8], [1, 12.8], [1, 9.8], ...arcPts(1, 8.4, 1.4, 1.4, 270, 450, 6), [1, 7]];
  const out = [...ball(body, c, { k: 0.9, glow: 0.6 })];
  out.push(S(tube(rrect(2.4, 5.2, 11.2, 6.4, 1).concat([[3.4, 5.2]]), 0.35), dk(c)));
  out.push(...ball(starPts(6.4, 8.4, 2.6, 1.1), '#fff6c8', { glow: 0.5 }), S(rect(9.6, 7, 3, 0.6), dk(c)), S(rect(9.6, 8.6, 2.4, 0.6), dk(c)));
  out.push(twinkle(13.6, 2.6, 1.6), ...glint(3.4, 6, 0.5));
  return out;
}

function astral_shard() {
  const c = '#c9b6ff';
  const pts = [[8, 0.8], [12.4, 6], [10.6, 15], [5.4, 15], [3.6, 6]];
  const out = [S(pts, sh(c)), S([[8, 0.8], [3.6, 6], [5.4, 15], [8, 13]], lt(c)), S([[8, 0.8], [8, 13], [10.6, 15], [12.4, 6]], c)];
  out.push(S([[8, 0.8], [6.2, 6.6], [8, 13], [9.8, 6.6]], hi(c)));
  out.push(twinkle(7.4, 6, 1.4, '#fff6ff'), twinkle(9.4, 10.4, 0.9, '#fff3b0'), twinkle(13.6, 2.6, 1.2));
  return out;
}

function sugar_gem() {
  const c = '#ff9ad8';
  const out = [...bevel([[4, 3], [12, 3], [15, 7], [8, 15], [1, 7]], [[5.4, 4.6], [10.6, 4.6], [12, 7], [8, 12], [4, 7]], c, lt(c))];
  out.push(...dots([[6.4, 6.4], [9, 6], [7.6, 8.6], [10, 8.4], [6, 9]], '#ffffff', 0.35));
  out.push(twinkle(13, 2, 1.5), ...glint(5.6, 5.4, 0.5));
  return out;
}

function taffy_twist() {
  const c = '#ffb3cf';
  const out = [];
  for (const s of [-1, 1]) out.push(...ball([[8 + s * 3.6, 7], [8 + s * 7, 3.6], [8 + s * 7.4, 8], [8 + s * 7, 12.4], [8 + s * 3.6, 9]], '#fff6fa', { glow: 0.5 }));
  out.push(...ball(rrect(3.6, 4.4, 8.8, 7.2, 3.4), c));
  for (const x of [5, 7.6, 10.2]) out.push(S(tube([[x, 4.8], [x + 1.6, 11.2]], 0.9), '#ffffff'));
  out.push(...glint(5.4, 6, 0.5));
  return out;
}

function cocoa_bean() {
  const c = '#8a5a3a';
  const out = [];
  for (const [x, y, d] of [[5.6, 9, -30], [10.6, 7.6, 20]]) {
    out.push(...ball(oval(x, y, 3, 4.8, d, 24), c), line(turn([[x, y - 3.6], [x + 0.6, y], [x, y + 3.6]], d, x, y), 0.4, dk(c)));
  }
  out.push(...leaf([10, 14], [15, 11], 2.6, '#7fd07a').shapes);
  out.push(...glint(4.2, 6.4, 0.5));
  return out;
}

function encore_rose() {
  const c = '#e0405a';
  const out = [stem(bez([8, 15.4], [7, 12], [8, 9], 8), '#5aa05a', 0.9), ...leaf([7.6, 12.4], [3.4, 10.4], 2.6, '#6fbf5a').shapes, ...leaf([8.2, 13.6], [12.4, 12.4], 2.4, '#6fbf5a').shapes];
  out.push(...ball([...bez3([3, 6], [2.6, 1.4], [13.4, 1.4], [13, 6], 10), ...bez3([13, 6], [12.6, 10.4], [3.4, 10.4], [3, 6], 10).slice(1)], c));
  for (const [cx, cy, r, a0, a1] of [[8, 5.4, 3.4, 150, 400], [8.2, 5, 2, 200, 470], [8.4, 4.8, 0.9, 0, 300]]) out.push(line(arcPts(cx, cy, r, r * 0.8, a0, a1, 12), 0.45, dk(c)));
  out.push(...glint(5, 4, 0.55));
  return out;
}

function sequin() {
  const c = '#ffd0e4';
  const out = [];
  for (const [x, y, r, col] of [[5.6, 6, 4, c], [11.4, 10, 3.4, '#c9e4ff'], [5.4, 12.6, 2.4, '#fff0a8']]) {
    out.push(...bevel(oval(x, y, r, r, 0, 20), oval(x, y, r * 0.66, r * 0.66, 0, 20), col, lt(col)), S(oval(x, y, r * 0.22, r * 0.22, 0, 10), dk(col)));
  }
  out.push(twinkle(13.6, 3, 1.6), ...glint(4, 4.6, 0.5));
  return out;
}

function script_page() {
  const c = '#f6ecd6';
  const page = [[2.6, 1.4], [13.4, 1.4], [13.4, 9], [12, 10.4], [13, 12], [11.4, 13.4], [12, 15], [2.6, 15]];
  const out = [...ball(page, c, { k: 0.8, glow: 0.4 })];
  for (let y = 4; y < 13; y += 2) out.push(S(rect(4, y, y > 9 ? 5.6 : 7.6, 0.6), '#b8a0c8'));
  out.push(S(rect(4, 2.4, 4, 0.9), '#e05a7a'));
  out.push(S([[13.4, 1.4], [10.8, 1.4], [13.4, 4]], sh(c)));
  out.push(...glint(4, 13, 0.45));
  return out;
}

function sky_scale() {
  const c = '#9fd0ff';
  const body = [...arcPts(8, 6, 6.4, 5, 180, 360, 14), ...bez3([14.4, 6], [14.4, 11], [10, 14.6], [8, 15.2], 8).slice(1), ...bez3([8, 15.2], [6, 14.6], [1.6, 11], [1.6, 6], 8).slice(1)];
  const out = [...ball(body, c)];
  for (const r of [3.6, 6.4]) out.push(line(arcPts(8, 15, r * 0.9, r, 220, 320, 10), 0.4, sh(c)));
  out.push(S(oval(6, 6.4, 2.6, 1.6, -20, 14), '#d8c4ff'), S(oval(10.6, 8.4, 1.8, 1.2, 20, 12), '#c4f4e8'));
  out.push(...glint(5, 5, 0.6));
  return out;
}

function sky_silk() {
  const c = '#eaf6ff';
  const band = (o) => bez3([1 + o, 13], [4 + o, 3], [9 + o, 15], [15, 3 + o], 18);
  const out = [S(tube(band(0), 4), sh(c)), S(tube(band(0).map(([x, y]) => [x - 0.3, y - 0.5]), 2.6), c), S(tube(band(0).map(([x, y]) => [x - 0.6, y - 0.9]), 0.8), W)];
  out.push(line(band(0).map(([x, y]) => [x + 0.6, y + 1.2]), 0.35, '#bfe0ff'));
  out.push(twinkle(13.6, 12.6, 1.3, '#bfe6ff'), twinkle(3, 3, 1));
  return out;
}

function barnacle_shell() {
  const c = '#ece4d4';
  const out = [S(oval(8, 13, 7, 2, 0, 20), '#8fb0a8')];
  for (const [x, y, w, h] of [[5, 13, 4.6, 7], [11, 13, 4, 5.6], [8.2, 13.4, 3, 3.6]]) {
    out.push(...ball([[x - w / 2, y], [x - w * 0.3, y - h], [x + w * 0.3, y - h], [x + w / 2, y]], c, { glow: 0.6 }));
    out.push(S(oval(x, y - h, w * 0.3, w * 0.12, 0, 12), dk(c)), line([[x - w * 0.2, y - h * 0.9], [x - w * 0.3, y - 0.3]], 0.3, sh(c)));
  }
  out.push(...glint(4, 8.4, 0.5));
  return out;
}

function moth_scale() {
  const c = '#f0e0c8';
  const wing = [...bez3([2, 13.6], [1, 6], [6, 1], [14.6, 2], 14), ...bez3([14.6, 2], [13, 7], [12, 12], [2, 13.6], 14).slice(1)];
  const out = [...ball(wing, c)];
  out.push(...disc(8.6, 6.4, 2.4, '#c9a6ff', { glow: 0.5 }), S(oval(8.6, 6.4, 1.1, 1.1, 0, 12), '#5a4a80'), S(oval(8.2, 6, 0.4, 0.4, 0, 8), W));
  for (const t of [0.3, 0.55, 0.8]) out.push(line([[2.4, 13], [2 + t * 12, 2 + (1 - t) * 4 + t * 7]], 0.3, sh(c)));
  out.push(twinkle(13.4, 12.4, 1.1, '#fff6e0'), ...glint(4, 6.4, 0.5));
  return out;
}

function meteorite() {
  const c = '#7a6a8a';
  const rock = [[2, 8], [4, 3.4], [9, 2], [13.6, 4], [15, 9], [12, 14], [6, 14.6], [2.4, 12]];
  const out = [...ball(rock, c, { k: 1.1, glow: 0.7 })];
  out.push(line([[4, 6], [7, 8.4], [6, 11.6]], 0.6, '#ff9a5a'), line([[7, 8.4], [11, 7], [13, 10]], 0.55, '#ffb36b'), line([[9, 4], [11, 7]], 0.45, '#ffd27a'));
  for (const [x, y, r] of [[10, 11.6, 1], [5, 4.6, 0.7], [12.4, 4.6, 0.6]]) out.push(S(oval(x, y, r, r * 0.8, 0, 10), dk(c)));
  out.push(...glint(5.6, 4.4, 0.5));
  return out;
}

function tin_spring() {
  const c = '#d8e2f6';
  const out = [];
  for (let i = 0; i < 6; i++) {
    const y = 2.4 + i * 2.1;
    out.push(S(tube(arcPts(8, y, 5, 1.4, 180, 360, 10), 0.9), sh(c)), S(tube(arcPts(8, y + 1, 5, 1.4, 0, 180, 10), 1.1), i % 2 ? c : lt(c)));
  }
  out.push(S(tube([[3, 3.4], [3, 13.6]], 0.3), '#f0f4ff'), ...glint(4.4, 3.6, 0.45));
  return out;
}

function music_cylinder() {
  const brass = '#e8b04a';
  const out = [...ball(rrect(2.4, 4.4, 11.2, 7.2, 1.4), brass, { k: 0.9 })];
  out.push(S(oval(2.6, 8, 1.2, 3.6, 0, 14), dk(brass)), S(oval(13.4, 8, 1.2, 3.6, 0, 14), lt(brass)));
  for (const [x, y] of [[4.4, 5.6], [6, 7.6], [7.4, 5.4], [8.8, 9], [10.2, 6.4], [11.6, 8.6], [5.2, 10], [9.4, 4.8]]) out.push(S(oval(x, y, 0.4, 0.4, 0, 8), '#fff6dc'));
  out.push(S(tube([[13.4, 8], [15.2, 8]], 0.8), '#9aa8c6'));
  out.push(...dots([[3, 13.4], [7, 14]], '#c9a6ff', 0.6), S(tube([[3.5, 13.4], [3.5, 11.6], [4.6, 11.4]], 0.3), '#c9a6ff'));
  out.push(...glint(4, 5.4, 0.5));
  return out;
}

function derby_medal() {
  const c = '#ffd66b';
  const out = [S([[4, 0.6], [7, 0.6], [9.4, 7], [6.6, 7]], '#6fc8ff'), S([[12, 0.6], [9, 0.6], [6.6, 7], [9.4, 7]], '#ff8fb0')];
  out.push(...bevel(oval(8, 10.4, 5.2, 5.2, 0, 24), oval(8, 10.4, 3.6, 3.6, 0, 24), c, lt(c)));
  // A little fish on its face.
  out.push(S([[5.4, 10.4], [7.4, 8.8], [10, 9.4], [10.8, 10.4], [10, 11.4], [7.4, 12]], dk(c)), S([[10.4, 10.4], [12, 9], [12, 11.8]], dk(c)));
  out.push(twinkle(13.4, 6, 1.3), ...glint(5.8, 8.6, 0.5));
  return out;
}

function promise_bouquet() {
  const out = [];
  for (const [x, y] of [[6, 10.4], [10, 10.4], [8, 11]]) out.push(stem([[x, y], [8, 15]], '#6fbf5a', 0.6));
  out.push(...leaf([7, 10], [2.4, 7.4], 2.6, '#7fd07a').shapes, ...leaf([9, 10], [13.6, 7.4], 2.6, '#7fd07a').shapes);
  out.push(...blossom(5, 5.6, 3, '#ffb7d3'), ...blossom(11, 5.4, 3, '#c9c4ff', '#fff6ff'), ...blossom(8, 3.2, 2.6, '#ff8fc4'));
  out.push(...leaf([8, 8.6], [8.4, 5.6], 2.2, '#7fd07a').shapes);
  out.push(...ball([[5.6, 10.6], [10.4, 10.6], [9.4, 13], [6.6, 13]], '#fff0f6', { glow: 0.5 }));
  out.push(...ball(oval(5.8, 12.4, 1.6, 1, -20, 12), '#ff8fc4'), ...ball(oval(10.2, 12.4, 1.6, 1, 20, 12), '#ff8fc4'));
  out.push(...glint(3.6, 4.6, 0.5));
  return out;
}

function seashell_ring() {
  const silver = '#dfe6f5';
  const out = [S(tube(arcPts(8, 10.4, 5, 4.4, 0, 360, 28), 1.8), sh(silver)), S(tube(arcPts(7.8, 10.1, 4.8, 4.2, 150, 300, 12), 0.7), W)];
  const fan = [[8, 7.6], ...arcPts(8, 6, 4, 4, 200, 340, 12)];
  out.push(...ball(fan, '#ffd2e0'));
  for (const a of [215, 240, 270, 300, 325]) out.push(line([[8, 7.4], [8 + Math.cos(a * D2R) * 3.6, 6 + Math.sin(a * D2R) * 3.6]], 0.3, '#ff9ec0'));
  out.push(twinkle(13.6, 3, 1.4), ...glint(6, 3.6, 0.45));
  return out;
}

// ---------- Herbs, flowers and fruit ----------

function clover() {
  const g = '#7fd07a';
  const out = [stem(bez([8, 8], [9, 12], [11, 15.4], 8), '#5aa05a', 0.8)];
  for (const a of [-135, -45, 45, 135]) {
    const r = a * D2R;
    out.push(...ball(heartPts(8 + Math.cos(r) * 3.4, 8 + Math.sin(r) * 3.4, 2.8).map(([x, y]) => turn([[x, y]], a + 90, 8 + Math.cos(r) * 3.4, 8 + Math.sin(r) * 3.4)[0]), g, { glow: 0.8 }));
  }
  out.push(...[-135, -45, 45, 135].map((a) => line([[8, 8], [8 + Math.cos(a * D2R) * 3.6, 8 + Math.sin(a * D2R) * 3.6]], 0.35, lt(g))));
  out.push(...glint(4.4, 4.2, 0.5));
  return out;
}

function honeycomb() {
  const c = '#ffc83a';
  const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * 60) * D2R) * r, cy + Math.sin((i * 60) * D2R) * r]);
  const out = [];
  for (const [x, y] of [[4.6, 5.4], [9.6, 2.6], [9.6, 8.2], [14.6, 5.4], [4.6, 11], [14.6, 11], [9.6, 13.8]]) out.push(...bevel(hex(x, y, 3), hex(x, y, 2), c, sh(c)), S(oval(x - 0.4, y - 0.5, 0.9, 0.5, 0, 10), lt(c)));
  out.push(S(tube([[9.4, 10.4], [9.2, 14.4]], (t) => 1.2 + t * 0.6), '#ffb020'), S(oval(9.2, 15, 1.2, 1, 0, 12), '#ffb020'));
  out.push(...glint(4, 4.6, 0.5));
  return out;
}

function cherry() {
  const c = '#ff6b8a';
  const out = [S(tube(bez([5, 11], [6, 5], [10, 1.6], 8), 0.6), '#7a9a4a'), S(tube(bez([11, 11.6], [11, 6], [10, 1.6], 8), 0.6), '#7a9a4a')];
  out.push(...leaf([10, 1.8], [14.6, 3.6], 2.6, '#7fd07a').shapes);
  out.push(...disc(5, 11.4, 3.4, c, { glow: 0.9 }), ...disc(11, 12, 3.2, shade_(c)));
  out.push(...glint(3.6, 10, 0.55), ...glint(9.8, 10.8, 0.5));
  return out;
}
const shade_ = (c) => sh(c);

function wild_strawberry() {
  const c = '#ff5a6e';
  const berry = [...bez3([8, 15], [1.6, 11], [1.4, 4.6], [8, 4.4], 12), ...bez3([8, 4.4], [14.6, 4.6], [14.4, 11], [8, 15], 12).slice(1)];
  const out = [...ball(berry, c)];
  out.push(...dots([[5, 7.4], [8, 7], [11, 7.4], [4.6, 10], [7.2, 9.6], [9.6, 10], [11.6, 10.2], [6.4, 12.4], [9, 12.6]], '#fff0a0', 0.4));
  for (const a of [-160, -120, -60, -20, -90]) out.push(...leaf([8, 4.6], [8 + Math.cos(a * D2R) * 4, 4.6 + Math.sin(a * D2R) * 3], 1.8, '#6fbf5a').shapes);
  out.push(...glint(4.6, 7, 0.5));
  return out;
}

function prickle_pear() {
  const c = '#ff8fb8';
  const out = [...ball(oval(8, 9.4, 5.4, 6, 0, 26), c)];
  for (const [x, y] of [[5.4, 7], [9.4, 6], [11, 9.4], [6.6, 11], [9.6, 12.6], [4.6, 10.4]]) out.push(S(oval(x, y, 0.5, 0.5, 0, 8), '#ffe6a0'), line([[x, y], [x + 0.8, y - 0.9]], 0.2, '#fff6dc'));
  out.push(...ball([[5.4, 4], [6.4, 1.4], [8, 3], [9.6, 1.4], [10.6, 4]], '#8fd08a', { glow: 0.5 }));
  out.push(...glint(5, 6.4, 0.55));
  return out;
}

function sea_kelp() {
  const c = '#5aae7a';
  const out = [];
  for (const [x0, x1, w, col] of [[5, 2.6, 2.6, sh(c)], [8, 9.4, 3, c], [11, 13.4, 2.4, lt(c)]]) {
    const pts = bez3([x0, 15.4], [x0 - 3, 11], [x1 + 3, 6], [x1, 1], 14);
    out.push(S(tube(pts, (t) => w * (1 - t * 0.5) * (0.8 + 0.2 * Math.sin(t * 20))), col));
  }
  out.push(...disc(6.4, 8.6, 1.1, '#c8b04a', { glow: 0.5 }), ...disc(10, 5.6, 1, '#c8b04a', { glow: 0.5 }));
  out.push(...glint(8, 4, 0.45));
  return out;
}

function moonpetal() {
  const c = '#c9c4ff';
  const out = [];
  out.push(stem([[8, 10], [8, 15.4]], '#6fbf5a', 0.7), ...leaf([8, 13.4], [12.4, 11.4], 2.4, '#7fd07a').shapes);
  out.push(...blossom(8, 7.4, 6, c, '#fff6c0'));
  out.push(...ball(crescent(8, 7.4, 1.6, 0.7, -0.5), '#fff6c0', { glow: 0 }));
  out.push(twinkle(13.6, 2.4, 1.2), twinkle(2.4, 12.6, 0.9), ...glint(5.4, 4.6, 0.5));
  return out;
}

function chanterelle() {
  const c = '#ffb347';
  const cap = [...bez3([1.4, 5], [4, 7.4], [12, 7.4], [14.6, 5], 10), ...bez3([14.6, 5], [13, 3], [3, 3], [1.4, 5], 10).slice(1)];
  const out = [...ball([[6.4, 6.6], [9.6, 6.6], [9, 15], [7, 15]], lt(c), { glow: 0.4 })];
  out.push(...ball([[1.4, 5], [6.4, 7], [9.6, 7], [14.6, 5], [9.4, 10], [6.6, 10]], c));
  for (const x of [5, 7, 9, 11]) out.push(line([[x, 6.6], [7 + (x - 8) * 0.3, 9.8]], 0.3, sh(c)));
  out.push(...ball(cap, c), S(oval(8, 4, 4.6, 0.8, 0, 14), hi(c)));
  out.push(...glint(4.6, 4.2, 0.5));
  return out;
}

function whisperberry() {
  const c = '#9f8cff';
  const out = [S(tube(bez([8, 1], [8, 3], [6, 5], 6), 0.5), '#7a9a4a'), ...leaf([8, 1.4], [12.6, 2.4], 2.4, '#7fd07a').shapes];
  for (const [x, y, r] of [[6, 6.4, 2.2], [9.6, 7, 2.2], [4.6, 9.8, 2.1], [8, 10.2, 2.3], [11.4, 10.4, 2], [6.4, 13.4, 2], [9.8, 13.4, 1.9]]) out.push(...disc(x, y, r, c, { glow: 0.8 }));
  out.push(line(arcPts(13, 6, 1.6, 1.6, -60, 60, 6), 0.4, '#e6dcff'), line(arcPts(13, 6, 2.8, 2.8, -50, 50, 6), 0.35, '#e6dcff'));
  out.push(...glint(4.8, 5.4, 0.45));
  return out;
}

function temple_mint() {
  const c = '#7fe0b0';
  const out = [stem(bez([8, 15.4], [7.6, 9], [8, 2], 10), '#4f9a6a', 0.8)];
  for (const [y, s, w] of [[11.6, 1, 4], [11.6, -1, 4], [7.6, 1, 3.6], [7.6, -1, 3.6], [4, 1, 3], [4, -1, 3]]) out.push(...leaf([8, y], [8 + s * 5.6, y - 2.6], w, c, { bend: s * 0.6, veins: 2, veinC: sh(c) }).shapes);
  out.push(...leaf([8, 3], [8, 0.4], 2.4, lt(c)).shapes, ...glint(4.4, 8.6, 0.45));
  return out;
}

function duskcap() {
  const c = '#7fe6d6';
  const out = [];
  out.push(...ball([[6.4, 8], [9.6, 8], [10, 15], [6, 15]], '#eaf4f0', { glow: 0.4 }));
  out.push(...ball([...arcPts(8, 8.4, 6.6, 6, 180, 360, 16), [14.6, 8.4], [1.4, 8.4]], c));
  out.push(S(oval(8, 8.6, 6.4, 1.2, 0, 16), sh(c)));
  for (const [x, y, r] of [[5, 5, 1.1], [9, 3.6, 0.9], [11.6, 6, 1], [7.4, 6.6, 0.7]]) out.push(S(oval(x, y, r, r, 0, 10), '#fffbd6'));
  out.push(twinkle(13.6, 12.6, 1.1, '#fffbd6'), ...glint(4, 4, 0.45));
  return out;
}

function shrine_plum() {
  const c = '#e05a7a';
  const out = [...ball([...bez3([8, 4], [2, 2], [0.6, 10], [6, 14.4], 12), ...bez3([6, 14.4], [8, 15.4], [10, 15], [12, 13], 6).slice(1), ...bez3([12, 13], [15.4, 9], [13.6, 2.6], [8, 4], 12).slice(1)], c)];
  out.push(line(bez([8, 4.4], [9.6, 9], [8.4, 14.4], 8), 0.4, sh(c)));
  out.push(S(tube([[8, 4.4], [8.6, 1.4]], 0.6), '#7a5a3a'), ...leaf([8.6, 2], [13.6, 1.4], 2.6, '#7fd07a').shapes);
  out.push(S(oval(5, 7, 1.6, 2.4, 20, 14), '#ff9ab0'), ...glint(4.6, 6.4, 0.55));
  return out;
}

function moon_thyme() {
  const c = '#b8c8f0';
  const out = [];
  for (const [x0, x1] of [[8, 4], [8, 8.4], [8, 12.4]]) {
    const pts = bez([x0, 15.4], [(x0 + x1) / 2, 9], [x1, 1.6], 10);
    out.push(stem(pts, '#8a9ac8', 0.5));
    for (let i = 2; i < 10; i += 2) {
      const [x, y] = pts[i];
      out.push(S(oval(x - 1, y, 1, 0.55, -30, 10), lt(c)), S(oval(x + 1, y + 0.4, 1, 0.55, 30, 10), c));
    }
  }
  out.push(...ball(crescent(13.4, 3, 1.8, 0.8, -0.6), '#fff6c0', { glow: 0 }), ...glint(4.6, 5, 0.45));
  return out;
}

function crystal_truffle() {
  const c = '#9a7a6a';
  const body = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2;
    const r = 5 + Math.sin(i * 2.3) * 0.6;
    return [8 + Math.cos(a) * r * 1.1, 10 + Math.sin(a) * r * 0.85];
  });
  const out = [...ball(body, c, { glow: 0.7 })];
  for (const [x, y] of [[5, 9], [9, 12], [11.6, 9.4], [7, 13]]) out.push(S(oval(x, y, 0.6, 0.45, 0, 8), dk(c)));
  for (const [x, y, h, d] of [[6, 6.4, 5, -20], [9.4, 5.8, 6, 10], [12, 7, 3.6, 30]]) {
    const pts = turn([[x - 1.1, y], [x, y - h], [x + 1.1, y]], d, x, y);
    out.push(S(pts, '#c8e8ff'), S([pts[0], pts[1], [x, y]], '#f4fbff'));
  }
  out.push(twinkle(13.6, 2.4, 1.2), ...glint(4.4, 9, 0.45));
  return out;
}

function steam_ginger() {
  const c = '#ffc88a';
  const out = [];
  for (const [x, y, rx, ry, d] of [[4, 11.6, 3.2, 2.2, -15], [8.4, 10.4, 3, 2.4, 10], [12.2, 11.8, 2.6, 2, 25], [7.4, 13.4, 2.2, 1.6, 0], [10.6, 7.6, 1.6, 2, 20]]) out.push(...ball(oval(x, y, rx, ry, d, 18), c, { glow: 0.7 }));
  for (const [x, y] of [[3.4, 12.4], [8, 11.4], [11.6, 12.6]]) out.push(line([[x - 0.7, y], [x + 0.7, y - 0.2]], 0.3, sh(c)));
  for (const x of [4.6, 8.2]) out.push(S(tube(bez([x, 8], [x - 1.4, 5.4], [x + 0.4, 2.2], 8), (t) => 0.6 - t * 0.35), '#ffffff'));
  out.push(twinkle(13.6, 3.4, 1), ...glint(3.4, 10.8, 0.45));
  return out;
}

function foxfire_lily() {
  const c = '#ffa86b';
  const out = [stem(bez([8, 15.4], [7.6, 12], [8, 9.4], 6), '#6fbf5a', 0.8), ...leaf([8, 13.4], [3.4, 10.6], 2.4, '#7fd07a').shapes];
  for (const a of [-150, -110, -70, -30, -90]) {
    const tip = [8 + Math.cos(a * D2R) * 6.4, 9.6 + Math.sin(a * D2R) * 5];
    out.push(...leaf([8, 9.6], tip, 3, a === -90 ? lt(c) : c, { rib: '#ffe6c8' }).shapes);
  }
  out.push(...ball([...arcPts(8, 6, 1.6, 1.6, 0, 180, 8), [8.6, 2.4], [8, 0.6], [7.2, 3]], '#8fe0ff', { glow: 0 }), S(oval(8, 5.6, 0.7, 1, 0, 10), '#ffffff'));
  out.push(...glint(4.4, 6.6, 0.45));
  return out;
}

function snow_peach() {
  const c = '#ffd8d0';
  const out = [...ball(oval(8, 9.6, 6, 5.6, 0, 26), c)];
  out.push(S(oval(5.6, 9.6, 2, 3, 10, 14), '#ffb0b8'), line(bez([8, 4.6], [10.4, 9], [8.6, 15], 8), 0.4, sh(c)));
  out.push(...ball([...arcPts(8, 6.4, 5, 3, 180, 360, 14), [11, 6.8], [10, 7.6], [8.6, 6.8], [7, 7.8], [5.6, 6.8], [4, 7.4]], '#ffffff', { glow: 0, shadow: '#dfe8ff' }));
  out.push(...leaf([8.4, 3.6], [13, 1.4], 2.4, '#7fd07a').shapes, twinkle(2.6, 3, 1, '#dff4ff'), ...glint(5.4, 9.4, 0.5));
  return out;
}

function cloudberry() {
  const c = '#ffc06b';
  const out = [...leaf([6, 4.6], [1.4, 1.6], 3, '#7fd07a').shapes, ...leaf([10, 4.6], [14.6, 1.6], 3, '#7fd07a').shapes];
  for (const [x, y] of [[6, 6.4], [8, 5.6], [10, 6.4], [5, 8.6], [7.4, 8.4], [9.6, 8.4], [11.4, 8.8], [6.2, 10.8], [8.6, 10.8], [10.6, 10.8], [7.4, 13], [9.4, 13]]) out.push(...disc(x, y, 1.5, c, { glow: 0.9 }));
  out.push(...glint(5.6, 6.4, 0.4));
  return out;
}

function star_anise() {
  const c = '#e0a85a';
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 - 90) * D2R;
    const tip = [8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7];
    const l = [8 + Math.cos(a - 0.5) * 2.2, 8 + Math.sin(a - 0.5) * 2.2];
    const r = [8 + Math.cos(a + 0.5) * 2.2, 8 + Math.sin(a + 0.5) * 2.2];
    out.push(...ball([l, [l[0] + Math.cos(a) * 3, l[1] + Math.sin(a) * 3], tip, [r[0] + Math.cos(a) * 3, r[1] + Math.sin(a) * 3], r], i % 2 ? sh(c) : c, { glow: 0.6 }));
    out.push(S(oval(8 + Math.cos(a) * 4.4, 8 + Math.sin(a) * 4.4, 0.8, 0.5, a / D2R, 10), '#7a4a2a'));
  }
  out.push(...disc(8, 8, 1.6, dk(c)), ...glint(5, 4, 0.45));
  return out;
}

function starbloom() {
  const c = '#fff0a0';
  const out = [stem([[8, 10], [8, 15.4]], '#6fbf5a', 0.7), ...leaf([8, 13], [3.4, 11], 2.4, '#7fd07a').shapes];
  out.push(...blossom(8, 7, 6, '#ffd0ec', '#ffffff', 6));
  out.push(...ball(starPts(8, 7, 3, 1.3), '#ffd84a', { glow: 0.6 }));
  out.push(twinkle(13.6, 2.4, 1.3), ...glint(5, 4.6, 0.45));
  return out;
}

// ---------- Furniture: the Seaside Cottage (driftwood, sea blue, rope) ----------

const DRIFT = '#d8c0a0';
const SEA = '#5fb8d8';
const legs = (xs, y0, y1, c, w = 1.2) => xs.flatMap((x) => [S(rect(x, y0, w, y1 - y0), sh(c)), S(rect(x, y0, w * 0.45, y1 - y0), c)]);

function sea_table() {
  const out = [...legs([3, 11.8], 8, 15, DRIFT)];
  out.push(...bevel(rrect(0.8, 5.4, 14.4, 3.2, 1), rrect(1.4, 5.8, 13.2, 1.6, 0.6), DRIFT, lt(DRIFT)));
  for (const x of [5, 9.6]) out.push(line([[x, 5.8], [x + 0.2, 7.4]], 0.3, sh(DRIFT)));
  out.push(...ball(oval(10.6, 4.4, 1.6, 1.2, 0, 12), SEA), S(starPts(4.6, 4.6, 1.6, 0.7), '#ffb08a'));
  out.push(...glint(3, 6.4, 0.4));
  return out;
}

function sea_chair() {
  const out = [...legs([3.6, 10.6], 10, 15.4, DRIFT)];
  out.push(...bevel(rrect(3, 1.4, 10, 2.4, 1), rrect(3.6, 1.9, 8.8, 1.2, 0.5), DRIFT, lt(DRIFT)), ...legs([3.6, 11.2], 3.6, 9, DRIFT));
  out.push(...ball(rrect(2.4, 8.2, 11.2, 2.6, 1.2), SEA, { glow: 0.5 }));
  for (const x of [4.4, 7.4, 10.4]) out.push(S(rect(x, 8.4, 1.4, 2.2), '#ffffff'));
  out.push(...glint(4, 2.4, 0.4));
  return out;
}

function sea_bed() {
  const out = [...bevel(rrect(0.6, 5, 2.4, 10.4, 1), rrect(1, 5.6, 1.6, 9.2, 0.6), DRIFT, lt(DRIFT))];
  out.push(...ball(rrect(2.6, 9.6, 12.8, 4.6, 1), DRIFT, { glow: 0.4 }));
  out.push(...ball(oval(5.4, 8.4, 2.6, 1.6, 0, 16), '#ffffff', { shadow: '#dfe8f4' }));
  out.push(...ball(rrect(7, 7.6, 8.4, 4.4, 1.4), SEA, { glow: 0.6 }));
  out.push(line(bez3([7.4, 9.6], [9, 8.6], [10.4, 10.4], [12, 9.4], 10), 0.4, '#ffffff'), line(bez3([10, 11], [11.6, 10], [13, 11.6], [15, 10.6], 10), 0.4, '#bfeaff'));
  out.push(S(rect(3, 14, 1, 1.6), sh(DRIFT)), S(rect(14, 14, 1, 1.6), sh(DRIFT)), ...glint(4.4, 7.8, 0.4));
  return out;
}

function sea_lamp() {
  const c = '#ffd2b0';
  const out = [];
  out.push(...ball(rrect(5, 12.4, 6, 2.6, 1), DRIFT, { glow: 0.4 }));
  const fan = [[8, 12.6], ...arcPts(8, 8.4, 6, 6, 190, 350, 14)];
  out.push(...ball(fan, c));
  for (const a of [200, 225, 250, 270, 290, 315, 340]) out.push(line([[8, 12], [8 + Math.cos(a * D2R) * 5.6, 8.4 + Math.sin(a * D2R) * 5.6]], 0.35, sh(c)));
  out.push(...disc(8, 10.4, 1.4, '#fff6b0', { glow: 0 }), twinkle(13.6, 3, 1.1, '#fff6b0'), ...glint(4.6, 5, 0.45));
  return out;
}

function sea_hammock() {
  const rope = '#e8d0a0';
  const out = [...legs([0.8, 13.8], 2, 15.4, DRIFT, 1.4)];
  out.push(S(tube([[1.6, 3], [4, 6.6]], 0.4), rope), S(tube([[14.4, 3], [12, 6.6]], 0.4), rope));
  const sling = [...bez3([3.4, 6.4], [5, 12.6], [11, 12.6], [12.6, 6.4], 14), ...bez3([12.6, 6.4], [10.4, 9], [5.6, 9], [3.4, 6.4], 10).slice(1)];
  out.push(...ball(sling, SEA));
  for (const x of [5.6, 8, 10.4]) out.push(line([[x, 8.4], [x, 11]], 0.5, '#ffffff'));
  out.push(...glint(5, 8.6, 0.4));
  return out;
}

function sea_net() {
  const rope = '#e8d0a0';
  const out = [...bevel(rrect(0.8, 1, 14.4, 2, 0.8), rrect(1.2, 1.4, 13.6, 1, 0.4), DRIFT, lt(DRIFT))];
  for (const [x0, x1] of [[2, 3.4], [6, 6.4], [10, 9.6], [14, 12.6]]) out.push(line(bez([x0, 2.8], [(x0 + x1) / 2 + 0.4, 8.6], [x1, 14], 6), 0.55, rope));
  for (const y of [6.6, 10.6]) out.push(line(bez([2.4, y], [8, y + 1.8], [13.6, y], 8), 0.55, rope));
  for (const [x, y] of [[3.4, 14.4], [9.6, 14.6]]) out.push(...ball(oval(x, y, 1.1, 0.9, 0, 10), '#ffb08a', { glow: 0.5 }));
  out.push(...ball(starPts(11.6, 9.4, 2.8, 1.2), '#ff9a7a', { glow: 0.6 }), ...glint(10.8, 8.2, 0.4));
  return out;
}

// ---------- Furniture: the Sweet Bakery (cake pinks, cream, cherries) ----------

const ICING = '#ffb8d0';
const CREAM = '#fff4e6';
const icingDrip = (x0, x1, y, c) => {
  const pts = [[x0, y - 1]];
  for (let x = x0; x <= x1 + 0.01; x += 1.6) pts.push([x, y + ((x - x0) / 1.6) % 2 * 1.2 + 0.4]);
  pts.push([x1, y - 1]);
  return S(pts, c);
};

function bake_table() {
  const out = [S(rect(7, 9, 2, 5), sh(CREAM)), ...ball(oval(8, 14.6, 4, 1.1, 0, 16), CREAM, { glow: 0.3 })];
  out.push(...ball(rrect(1.4, 5.6, 13.2, 3.6, 1.6), '#ffe0a8', { glow: 0.4 }), ...ball(oval(8, 5.6, 6.6, 1.8, 0, 22), ICING, { glow: 0.5 }), icingDrip(1.6, 14.4, 6.4, ICING));
  out.push(...dots([[4, 5.4], [7, 4.8], [10, 5.6], [12, 5]], '#ffffff', 0.35), ...ball(oval(8, 3.4, 1.2, 1.1, 0, 12), '#ff4a6a'), S(tube([[8, 2.4], [9, 0.8]], 0.3), '#6fbf5a'));
  return out;
}

function bake_stool() {
  const c = '#ffb8d0';
  const out = [...legs([4.4, 10.4], 11, 15.4, '#e8c69a')];
  out.push(...ball(rrect(2, 7.4, 12, 3.6, 1.8), c, { glow: 0.5 }), S(rect(2.6, 6.4, 10.8, 1.4), CREAM), ...ball(rrect(2, 3.4, 12, 3.6, 1.8), lt(c)));
  out.push(...glint(4, 4.4, 0.45));
  return out;
}

function bake_lamp() {
  const out = [];
  out.push(...ball([[3, 9.4], [13, 9.4], [11.6, 15.2], [4.4, 15.2]], '#ffd0a0', { k: 0.9 }));
  for (const x of [5.4, 8, 10.6]) out.push(line([[x, 9.8], [x + (x - 8) * 0.1, 14.8]], 0.4, sh('#ffd0a0')));
  for (const [x, y, r] of [[4, 8.4, 2], [8, 7, 2.6], [12, 8.4, 2], [6, 6.4, 1.8], [10, 6.4, 1.8]]) out.push(...disc(x, y, r, ICING, { glow: 0.6 }));
  out.push(...disc(8, 3.6, 1.8, '#ff4a6a', { glow: 1.1 }), S(tube([[8.4, 2], [9.6, 0.6]], 0.35), '#6fbf5a'), ...glint(7.4, 3, 0.4));
  return out;
}

function bake_rug() {
  const c = '#ff7088';
  const out = [...ball(oval(8, 9, 7.4, 5.6, 0, 28), c, { glow: 0.6 }), S(tube(arcPts(8, 9, 6.4, 4.6, 0, 360, 28), 0.4), '#ffffff')];
  out.push(...dots([[5, 7], [8, 6], [11, 7], [4, 10], [7, 9.4], [10, 9.6], [12.4, 10.4], [6.4, 12], [9.4, 12.4]], '#fff0a0', 0.5));
  for (const a of [-130, -90, -50]) out.push(...leaf([8, 4], [8 + Math.cos(a * D2R) * 3.4, 4 + Math.sin(a * D2R) * 2.6], 1.8, '#6fbf5a').shapes);
  out.push(...glint(4, 7.4, 0.45));
  return out;
}

function bake_shelf() {
  const wood = '#f0c8a0';
  const out = [...bevel(rect(0.8, 8.4, 14.4, 2, 0.6), rect(1.2, 8.8, 13.6, 0.8), wood, lt(wood))];
  for (let x = 1.4; x < 14.6; x += 2.2) out.push(S(oval(x + 1.1, 10.6, 1.1, 1.1, 0, 12), '#ffffff'));
  out.push(S([[2, 10.4], [3.6, 14.4], [5.2, 10.4]], sh(wood)), S([[10.8, 10.4], [12.4, 14.4], [14, 10.4]], sh(wood)));
  out.push(...ball([[2.4, 8.4], [2.6, 4], [5.6, 4], [5.8, 8.4]], '#c8e8ff', { glow: 0.5 }), S(rect(2.4, 3.4, 3.4, 1), '#ff9ec0'));
  out.push(...ball(rrect(7, 5.6, 6, 2.8, 1.2), '#ffd0a0', { glow: 0.5 }), ...ball(oval(10, 5.4, 3.2, 1.6, 0, 14), ICING, { glow: 0.5 }));
  out.push(...glint(3.4, 5.4, 0.4));
  return out;
}

function bake_cake() {
  const out = [S(oval(8, 14.4, 7, 1.4, 0, 20), '#e8c69a')];
  out.push(...ball(rrect(3, 10.4, 10, 3.6, 0.8), CREAM, { glow: 0.4 }), ...ball(rrect(4.4, 7.2, 7.2, 3.4, 0.8), ICING, { glow: 0.4 }), ...ball(rrect(5.8, 4.6, 4.4, 2.8, 0.6), CREAM, { glow: 0.4 }));
  out.push(icingDrip(3, 13, 10.8, ICING), ...disc(8, 3.6, 1, '#ff4a6a'));
  const dome = [...arcPts(8, 13.6, 6.6, 12.6, 180, 360, 20)];
  out.push(S(tube(dome, 0.5), '#dcefff'), S(tube(arcPts(8, 13.6, 5.6, 11.4, 200, 250, 8), 0.7), '#ffffff'));
  out.push(...disc(8, 0.9, 0.8, '#dfe6f5', { glow: 0.5 }));
  return out;
}

// ---------- Furniture: Starry Night (violet, moon gold, brass) ----------

const NIGHT = '#8f7fe0';
const MOONG = '#ffe08a';
const BRASS = '#e8b04a';

function star_bed() {
  const out = [...ball(crescent(8, 7.4, 7, 2.6, -2.6, 0.78), MOONG)];
  out.push(...ball(rrect(1.6, 9.6, 12.8, 3, 1.2), NIGHT, { glow: 0.5 }), ...ball(oval(4.6, 9.4, 2.2, 1.2, 0, 14), '#ffffff', { shadow: '#dfe0f8' }));
  out.push(...dots([[8, 10.6], [11, 11.2], [12.6, 10.4]], '#fff3b0', 0.4), S(rect(3, 13, 1, 2.4), sh(NIGHT)), S(rect(12, 13, 1, 2.4), sh(NIGHT)));
  out.push(twinkle(11.4, 3.4, 1.3), ...glint(3.6, 5.4, 0.45));
  return out;
}

function star_lights() {
  const out = [line(bez3([0.6, 3], [5, 9], [11, 9], [15.4, 3], 16), 0.4, '#6a5ab0')];
  const curve = bez3([0.6, 3], [5, 9], [11, 9], [15.4, 3], 6);
  curve.slice(1, -1).forEach(([x, y], i) => {
    const col = ['#ffe36b', '#ffb8d0', '#bfe6ff', '#c8f4b8', '#ffe36b'][i];
    out.push(...ball(starPts(x, y + 2.4, 2.2, 1, 5, -90), col, { glow: 0.6 }));
  });
  out.push(twinkle(8, 13.6, 1.1, '#fff6c0'));
  return out;
}

function star_scope() {
  const out = [];
  for (const [a, b] of [[[8, 9], [3, 15.4]], [[8, 9], [13, 15.4]], [[8, 9], [8, 15.4]]]) out.push(S(tube([a, b], 0.9), '#a07850'));
  out.push(...ball(tube([[2, 11], [13, 4]], 3.4), BRASS), S(tube([[2.4, 10.2], [12.6, 3.4]], 0.8), lt(BRASS)));
  out.push(S(oval(13.2, 3.9, 1.2, 2, 33, 12), '#c8e4ff'), S(tube([[6.2, 7.6], [7.2, 9.2]], 2.6), '#6a5ab0'));
  out.push(twinkle(14.4, 0.8, 1.2, '#fff6c0'), ...glint(4.4, 8.4, 0.4));
  return out;
}

function star_globe() {
  const out = [S(tube([[8, 11], [8, 14]], 0.9), BRASS), ...ball(rrect(4.4, 13.6, 7.2, 1.8, 0.8), BRASS, { glow: 0.5 })];
  const ring = (a0, a1, c) => S(turn(tube(arcPts(8, 6.6, 7.2, 2.2, a0, a1, 14), 0.8), -18, 8, 6.6), c);
  out.push(ring(180, 360, '#c8bce8'), ...disc(8, 6.6, 4.4, NIGHT), S(turn(rect(3.8, 6, 8.4, 0.9), -18, 8, 6.6), '#b8a8f0'), ring(0, 180, '#ece6ff'));
  out.push(twinkle(14.4, 13, 1), ...glint(6.2, 4.6, 0.5));
  return out;
}

function star_lamp() {
  const out = [S(tube([[6, 6], [6, 14.6]], 0.8), BRASS), ...ball(oval(6, 14.8, 3.4, 0.9, 0, 14), BRASS, { glow: 0.4 })];
  out.push(S(tube(bez([6, 6], [6, 2], [8.4, 2.4], 6), 0.7), BRASS));
  out.push(...ball(crescent(10, 4.6, 3.6, -1.6, -1.2, 0.78), MOONG), ...disc(10.4, 6.6, 1, '#fff6c8', { glow: 0 }));
  out.push(twinkle(14, 1.6, 1), ...glint(7.6, 3.4, 0.4));
  return out;
}

function star_clock() {
  const out = [...bevel(oval(8, 8, 7, 7, 0, 28), oval(8, 8, 5.4, 5.4, 0, 28), NIGHT, '#efeaff')];
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * D2R;
    out.push(S(starPts(8 + Math.cos(a) * 4.4, 8 + Math.sin(a) * 4.4, i % 3 ? 0.6 : 1, i % 3 ? 0.25 : 0.4), i % 3 ? '#b8a8f0' : MOONG));
  }
  out.push(S(tube([[8, 8], [8, 4.6]], 0.6), '#4a3a80'), S(tube([[8, 8], [10.6, 9.4]], 0.6), '#4a3a80'), S(oval(8, 8, 0.8, 0.8, 0, 10), MOONG));
  out.push(...glint(4.6, 4.6, 0.5));
  return out;
}

// ---------- Trophies ----------

const TGOLD = '#ffcf5a';
const WOOD = '#b8805a';

function trophy_plaque() {
  const out = [...bevel(rrect(1, 2, 14, 12, 2), rrect(2.4, 3.4, 11.2, 9.2, 1.2), WOOD, '#e8f4ff')];
  out.push(S([[3.6, 8], [6.6, 5.6], [10.4, 6], [12, 8], [10.4, 10], [6.6, 10.4]], '#6fc8ff'), S([[11.6, 8], [13.4, 6], [13.4, 10]], '#6fc8ff'));
  out.push(S(oval(10.4, 7.4, 0.6, 0.6, 0, 8), '#3a2d4f'), S(oval(6.6, 7, 2, 0.8, -10, 12), '#bfeaff'));
  out.push(...ball(rrect(5, 12.6, 6, 1.6, 0.4), TGOLD, { glow: 0.4 }), ...glint(3.4, 4, 0.45));
  return out;
}

function trophy_figure() {
  const out = [...ball(rrect(3, 12.4, 10, 3, 0.8), WOOD, { glow: 0.4 }), S(rect(3.6, 13.4, 8.8, 0.6), TGOLD)];
  // A carved little pony, rearing proudly.
  const c = '#e8c69a';
  out.push(...ball([[4.4, 12.4], [4.6, 8.4], [9.6, 7.6], [11.6, 3.6], [13.4, 4.4], [12.6, 7.6], [11.4, 9.4], [11.6, 12.4], [10.2, 12.4], [9.6, 10], [6.4, 10.4], [6, 12.4]], c));
  out.push(S([[11.4, 3.8], [10.4, 2], [12, 3]], c), S(tube(bez([10.6, 4.4], [9.4, 6], [9, 8], 6), 0.8), sh(c)), S(tube(bez([4.6, 8.8], [2.6, 9], [2.4, 11.6], 6), 0.8), sh(c)));
  out.push(S(oval(12.2, 5, 0.4, 0.4, 0, 8), '#5a3a28'), ...glint(6, 8.8, 0.45));
  return out;
}

function trophy_cup() {
  const out = [S(tube(arcPts(3.4, 5.6, 2.2, 2.6, 90, 270, 10), 0.9), sh(TGOLD)), S(tube(arcPts(12.6, 5.6, 2.2, 2.6, -90, 90, 10), 0.9), sh(TGOLD))];
  out.push(...ball([[2.6, 1.6], [13.4, 1.6], [12.4, 6], [9.6, 9.4], [6.4, 9.4], [3.6, 6]], TGOLD, { k: 0.9 }), S(oval(8, 1.8, 5.2, 0.8, 0, 16), dk(TGOLD)));
  out.push(S(rect(7, 9.2, 2, 2.8), sh(TGOLD)), ...ball(rrect(4, 12, 8, 3.4, 0.8), WOOD, { glow: 0.4 }), S(rect(5.6, 13, 4.8, 1), TGOLD));
  out.push(...ball(starPts(8, 5, 2, 0.9), '#fff6c8', { glow: 0.4 }), ...glint(4.6, 3.4, 0.55));
  return out;
}

function trophy_crown() {
  const c = '#c04a7a';
  const out = [...ball([...bez3([1, 12], [1, 8.6], [15, 8.6], [15, 12], 12), ...bez3([15, 12], [15, 15], [1, 15], [1, 12], 12).slice(1)], c, { glow: 0.6 })];
  for (const [x, y] of [[1.6, 10.2], [14.4, 10.2], [1.6, 14], [14.4, 14]]) out.push(...disc(x, y, 0.9, TGOLD, { glow: 0.4 }));
  out.push(...ball([[3.6, 9.6], [3.4, 3.4], [5.8, 6], [8, 1.6], [10.2, 6], [12.6, 3.4], [12.4, 9.6]], TGOLD, { k: 0.9 }));
  out.push(S(rect(3.6, 8, 8.8, 1.4), dk(TGOLD)), S(oval(8, 6.4, 1, 1.1, 0, 10), '#6fc8ff'), S(oval(5.4, 7.4, 0.6, 0.6, 0, 8), '#ff6b8a'), S(oval(10.6, 7.4, 0.6, 0.6, 0, 8), '#7fe87a'));
  out.push(...glint(5, 4.6, 0.45));
  return out;
}

function trophy_ribbon() {
  const out = [S([[5, 9], [3, 15.4], [5.4, 14], [7, 15.4], [8, 10]], '#6fc8ff'), S([[11, 9], [13, 15.4], [10.6, 14], [9, 15.4], [8, 10]], '#4aa8e0')];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    out.push(S(oval(8 + Math.cos(a) * 4.6, 6.6 + Math.sin(a) * 4.6, 1.8, 1.8, 0, 12), i % 2 ? '#ff8fb0' : '#ffb0c8'));
  }
  out.push(...bevel(oval(8, 6.6, 4, 4, 0, 24), oval(8, 6.6, 2.8, 2.8, 0, 24), TGOLD, lt(TGOLD)), S(starPts(8, 6.6, 2, 0.9), '#fff6c8'));
  out.push(...glint(6, 4.6, 0.45));
  return out;
}

// ---------- Looks too small to read worn ----------

// Dew Sparkle (a capsule-machine face piece: dewdrop gems on the cheeks): two cut dewdrops on a
// blush of pink, glinting.
function dewsparkle() {
  const c = '#a8e8ff';
  const drop = (x, y, r) => {
    const pts = [...bez3([x, y - r * 1.9], [x + r * 0.5, y - r * 1], [x + r * 1.05, y - r * 0.4], [x + r, y + r * 0.2], 8), ...arcPts(x, y + r * 0.2, r, r * 0.95, 0, 180, 10).slice(1), ...bez3([x - r, y + r * 0.2], [x - r * 1.05, y - r * 0.4], [x - r * 0.5, y - r], [x, y - r * 1.9], 8).slice(1)];
    return [...ball(pts, c, { glow: 0.8 }), S([[x, y - r * 1.6], [x - r * 0.55, y - r * 0.2], [x, y + r * 0.6]], hi(c)), S(oval(x - r * 0.4, y - r * 0.1, r * 0.22, r * 0.45, 20, 10), W)];
  };
  const out = [S(oval(5.4, 12.6, 3.4, 1.4, 0, 16), '#ffc8d8'), S(oval(11.6, 13.2, 2.6, 1.1, 0, 14), '#ffc8d8')];
  out.push(...drop(5.6, 9.4, 3.4), ...drop(11.8, 10.8, 2.4));
  out.push(twinkle(12.6, 3.4, 2, '#ffffff'), twinkle(2.2, 3, 1.1, '#e6faff'), twinkle(14.6, 8, 0.9, '#e6faff'));
  return out;
}

const ART = {
  look_gacha_dewsparkle_face: dewsparkle,
  royal_jelly, home_shell, mount_kettle, mount_nimbus, lantern_bait,
  bee_fuzz, sprite_petal, hay_quill, pumpkin_seed, curly_wool, woven_nest, moss_scute, owl_down, panda_fluff, brownie_crumb, moonlit_ribbon, porcelain_shard, candle_wax, tide_pearl, sea_glass,
  jelly_ribbon, golden_ticket, astral_shard, sugar_gem, taffy_twist, cocoa_bean, encore_rose, sequin, script_page, sky_scale, sky_silk,
  barnacle_shell, moth_scale, meteorite, tin_spring, music_cylinder, derby_medal, promise_bouquet, seashell_ring,
  clover, honeycomb, cherry, wild_strawberry, prickle_pear, sea_kelp, moonpetal, chanterelle, whisperberry, temple_mint, duskcap, shrine_plum,
  moon_thyme, crystal_truffle, steam_ginger, foxfire_lily, snow_peach, cloudberry, star_anise, starbloom,
  sea_table, sea_chair, sea_bed, sea_lamp, sea_hammock, sea_net,
  bake_table, bake_stool, bake_lamp, bake_rug, bake_shelf, bake_cake,
  star_bed, star_lights, star_scope, star_globe, star_lamp, star_clock,
  trophy_plaque, trophy_figure, trophy_cup, trophy_crown, trophy_ribbon,
};
for (const [id, draw] of Object.entries(ART)) if (!ITEM_ART[id]) ITEM_ART[id] = framed(draw);
