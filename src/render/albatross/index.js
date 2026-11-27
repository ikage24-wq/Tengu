// The Windsock Albatross (2026-11-27, the Sky Garden's Sky Harpy remade from scratch as a new creature; the
// id stays `windbird`). Albatrosses can hardly take off without a good wind, so they nest where the wind
// never stops: round the Harpy Roost's pillar, where the skyward wind rises, and on Starfall Heights' rims.
// This one wears a knitted windsock for a cap so it always knows which way the wind blows (the cap streams
// out behind it in a breeze and flops when the wind drops, which is when it panics). A proper bird, never a
// person with wings: a chibi Laysan albatross on its own copy of the bird base (birdbase.js, its own
// `albatross` preset), dressed here; everything else drawn here from scratch (the face too).
//   look    snow-white head and body, long narrow slate-plum wings and tail, a soft grey smudge over each
//           eye (an albatross's own), a long peach bill with a soft rounded hook, pink webbed feet tucked
//           back in flight; its windsock cap WORN on its crown (a ribbed cream band round its head, coral and
//           cream stripes, a soft pom at the end), streaming back on its own springs. Its own soft
//           slate-lilac outline, outer edge only, face bare.
//   eyes    its own "half-moon eyes": round on top, flat underneath (a determined, cheerful look), a navy
//           iris warming to sea-teal at the bottom, a soft square shine and a dot, a neat lash line with one
//           round flick at the outer end; the far eye a sliver round the front of its face. Soft grey brows
//           over the smudge do the acting; the gape of its bill curls up or down with its mood.
//   flight  always on the wing (`fly`): it glides with its wings held up in a soft V, a lazy pair of strokes
//           now and then (its own rhythm from its id), the body bobbing on each stroke.
//   idle    four pieces, each the next that fits the time it has (data `rest`, world/mobs.js
//           `m.restUntil`); a flier never waits on standing still (`a.calm`), only on being left alone:
//           - sky-point (6.4 s): the albatross dance: bill pointed straight up at the sky, wings spread
//             high, a long "wooo"; two quick bill clacks; a deep bow;
//           - windsock (6.8 s): the wind drops! the cap flops, it sinks and flaps hard, worried; the wind is
//             back, the cap streams out, a gust; a long smug glide;
//           - stretch (6.4 s): wings stretched right up over its back, tail fanned; a big yawn; a shake of
//             its head;
//           - doze (6.8 s): albatrosses nap on the wing: its eyes close, its head nods, it drifts down...
//             it jolts awake flapping, and looks round to see if anyone saw.
//   moves   Stoop (up high, wings raised; then wings tucked and a steep dive at you, pulling up with a
//           whoosh); Wing Buffet (both wings raised right up; then one huge downstroke, a gust of wind and
//           two feathers thrown forward); Bill Clack (head back, bill open; then three quick clacks at you,
//           a "clack!" at each).
//   else    hurt: jolted back, feathers fluffed, a soft puff of down; after landing a hit: a smug head up,
//           a little note; hunting you: leaning in, the cap streaming hard; low on health: worried, a bead
//           of sweat, the cap drooping; beaten: dizzy. Its marks over its head (!, ?) are its own
//           (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: soft curling white wind lines, soft feathers and
// down, rings for its call, the game's curvy sparkles, never specks.
import { dressedBird } from './birdbase.js';
import { TAU, clamp, mix, sstep, win, pulse, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, cue, note, dust } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, ribbon } from './act.js';

const C = { lt: '#ffffff', base: '#f7f6fc', sh: '#dedbec', deep: '#c3bed8', guide: '#e6e2f0', beak: '#f9d0bc', beakSh: '#e6a898', leg: '#f2b6ae' };
// (its wings and tail: a soft slate-plum, never near-black)
const CW = { lt: '#a49ebc', base: '#857f9f', sh: '#6c6688', deep: '#575174' };
// (its short tail: a soft dove grey, so it never reads as a dark lump behind it)
const CT = { lt: '#e8e4f2', base: '#d6d1e6', sh: '#b7b1cf', deep: '#9a94b6' };
const INK = '#7a7294';
const SMUDGE = '#a29cba';
const LASH = '#3a3456';
const IRIS = ['#1c1a3a', '#2c3c70', '#3f7ea8', '#8fd2d6'];
const SOCK = ['#ff9a86', '#e8786a', '#fff6ec', '#ecdcc8'];
const WIND = ['#ffffff', '#e4eefc'];

// ---------- Its face ----------
// b: [far brow lift, near brow lift] (negative up); g: where it looks; m: its bill's gape
const FACES = {
  calm: { e: 'open', g: [0.3, 0.1], b: [0, 0], m: 'calm' },
  point: { e: 'shut', b: [-0.6, -0.8], m: 'calm' },
  proud: { e: 'happy', b: [-0.6, -0.4], m: 'smile' },
  worried: { e: 'open', g: [0.2, 0.8], b: [-1.2, -1.4], m: 'frown' },
  relief: { e: 'happy', b: [-1, -1.2], m: 'smile' },
  smug: { e: 'smug', g: [-0.4, 0.1], b: [0.2, -0.8], m: 'smile' },
  reach: { e: 'squeeze', b: [-0.4, -0.6], m: 'calm' },
  yawn: { e: 'shut', b: [-0.8, -1], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  sleep: { e: 'sleep', b: [0.3, 0.3], m: 'calm' },
  spot: { e: 'wide', g: [0.6, -0.4], b: [-1.6, -1.8], m: 'calm' },
  sheepish: { e: 'open', g: [-0.7, 0.6], b: [-1.2, -0.6], m: 'frown' },
  focus: { e: 'open', g: [0.8, 0.3], b: [0.8, 1], m: 'calm' },
  fierce: { e: 'open', g: [0.9, 0.2], b: [1, 1.2], m: 'frown' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'calm' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'frown' },
  sad: { e: 'open', g: [0.1, 1], b: [-1.4, -1.6], m: 'frown' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'frown' },
};
const SHUTS = new Set(['point', 'proud', 'relief', 'reach', 'yawn', 'shut', 'sleep', 'shout', 'hurt', 'happy', 'dizzy']);

// ---------- Its moves over the bird's (x, hop in body heights; angles in degrees) ----------
const MOVES = {
  // Stoop: up high, wings raised; then the wings tucked and a steep dive at you, pulling up with a stroke.
  dive: {
    anticT: 0.45,
    keys: [
      [0, { hop: 0.22, pitch: -22, head: -10, wgrab: 1, wbeat: 0.02, spread: 1, tailUp: 12 }],
      [0.1, { hop: -0.02, x: 0.34, pitch: 40, head: 22, tuck: 1, wingN: 0.05, wingF: 0.05, spread: 0.2, tailUp: -6 }, 'out'],
      [0.26, { hop: -0.05, x: 0.4, pitch: 32, head: 18, tuck: 1, wingN: 0.1, wingF: 0.1 }, 'io'],
      [0.44, { hop: 0.06, x: 0.3, pitch: -12, head: -6, wgrab: 1, wbeat: 0.45, spread: 1 }, 'out'],
      [0.85, {}, 'io'],
    ],
  },
  // Wing Buffet: both wings raised right up; then one huge downstroke, a gust thrown forward.
  buffet: {
    anticT: 0.4,
    keys: [
      [0, { x: -0.06, pitch: -14, head: -8, wgrab: 1, wbeat: 0.0, spread: 1, tailUp: 10, fluff: 0.3 }],
      [0.07, { x: 0.06, pitch: 6, head: 4, wgrab: 1, wbeat: 0.45, spread: 0.8 }, 'out'],
      [0.3, { x: 0.05, pitch: 2, wgrab: 1, wbeat: 0.5 }, 'io'],
      [0.7, {}, 'io'],
    ],
  },
  // Bill Clack: head back, bill open; then three quick clacks at you.
  clack: {
    anticT: 0.3,
    keys: [
      [0, { head: -18, reach: -0.4, beak: 0.7, pitch: -8, x: -0.03 }],
      [0.05, { head: 10, reach: 1, beak: 0, pitch: 6, x: 0.05 }, 'out'],
      [0.12, { head: 4, reach: 0.6, beak: 0.7, x: 0.05 }, 'io'],
      [0.17, { head: 12, reach: 1, beak: 0, x: 0.07 }, 'out'],
      [0.24, { head: 4, reach: 0.6, beak: 0.7, x: 0.07 }, 'io'],
      [0.29, { head: 12, reach: 1, beak: 0, x: 0.08 }, 'out'],
      [0.5, { head: 0, reach: 0.1, beak: 0, x: 0.03 }, 'io'],
      [0.8, {}, 'io'],
    ],
  },
  // (its own hurt, and its own pleased look after landing a hit: no generic sparks)
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -12, head: -14, reach: -0.3, fluff: 1, tailUp: 16, beak: 0.4, wgrab: 1, wbeat: 0.1 }, 'out'], [0.24, { x: -0.04, pitch: -6, head: -8, fluff: 0.6, beak: 0.1, wgrab: 0.6, wbeat: 0.2 }], [0.45, { x: -0.02, fluff: 0.2 }, 'io'], [0.76, {}, 'io']],
  },
  flutter: {
    anticT: 0.1,
    keys: [[0, {}], [0.14, { pitch: -10, head: -28, beak: 0.3, spread: 1, tailUp: 14, fluff: 0.3 }, 'out'], [0.3, { pitch: -9, head: -24, beak: 0 }, 'io'], [0.42, { pitch: -10, head: -28, beak: 0.4 }, 'io'], [0.56, { pitch: -9, head: -24, beak: 0 }, 'io'], [0.95, {}, 'io']],
  },
};

// ---------- Its act ----------
const PIECES = { skypoint: 6.4, windsock: 6.8, stretch: 6.4, doze: 6.8 };
const ORDER = ['skypoint', 'windsock', 'stretch', 'doze'];
const POOL = ['dive', 'buffet', 'clack'];

function pose(m, a, out, K, mv, mt) {
  const st = a.mo.rig;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, POOL);
  const now = F.now;
  const alive = m.hp > 0;
  const q = (a.gl = { face: null, wind: 1, blush: 0, moanS: -1, clackS: -1, gustS: -1, sweat: -1, zz: 0, smugS: -1, startle: -1, mood: 'calm' });
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  // Always on the wing: gliding, a lazy pair of strokes now and then (its own rhythm, from its id).
  if (alive) out.hover = 1;
  const per = 4.4 + ((m.uid ?? 0) % 5) * 0.37;
  const ph = (now + (m.uid ?? 0) * 1.3) % per;
  const strokes = win(ph, 0, 0.3, 1.5, 1.9);
  // (travelling faster it strokes more often: its pace from its own odometer, never a.calm)
  const v = Math.abs((m.odo ?? 0) - (st.alOdo ?? m.odo ?? 0)) / Math.max(1e-3, a.dt ?? 0.016);
  st.alOdo = m.odo ?? 0;
  st.alV = mix(st.alV ?? 0, Math.min(200, v), ease(4));
  const busyFly = clamp((st.alV - 30) / 50, 0, 1);
  const glideGoal = mv ? out.glide : 1 - Math.max(strokes * 0.95, busyFly * 0.6);
  out.glide = glideGoal;
  out.spread = Math.max(out.spread, 0.5);
  q.wind = 1;
  const hurt = F.hurt;
  const fighting = F.fighting && alive;

  // ----- The act (not waiting on standing still: a flier is always drifting) -----
  const calmGoal = alive && !mv && !hurt && !fighting && !m.cine && !F.napping ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  if (k > 0.001 && piece === 'skypoint') {
    // bill pointed straight up at the sky, wings spread high, a long "wooo"
    const pt = win(pu, 0.3, 0.9, 2.9, 3.3);
    go({ pitch: -12, head: -64, reach: 0.5, beak: 0.35, wgrab: 1, wbeat: 0.04, spread: 1, tailUp: 8, glide: 0 }, pt * k);
    say('point', pt * k);
    if (pu > 0.9 && pu < 3.4) q.moanS = (pu - 0.9) / 2.5;
    // two quick bill clacks
    const cl = win(pu, 3.2, 3.4, 4.0, 4.2);
    go({ head: -18, reach: 0.6, beak: 0.6 * pulse(pu, 3.35, 0.2) + 0.6 * pulse(pu, 3.65, 0.2), pitch: -4 }, cl * k);
    say('happy', cl * k);
    if (pu > 3.35 && pu < 4.2) q.clackS = pu - 3.35;
    // a deep bow
    const bw = win(pu, 4.1, 4.5, 5.6, 6.2);
    go({ head: 40, pitch: 14, reach: 0.3 }, bw * k);
    say('proud', bw * k);
  }
  if (k > 0.001 && piece === 'windsock') {
    // the wind drops: the cap flops, it sinks and flaps hard
    const dr = win(pu, 0.3, 0.8, 2.4, 2.8);
    q.wind = 1 - dr * k;
    go({ hop: -0.12, pitch: 6, head: 6, glide: 0, fluff: 0.3 }, dr * k);
    say('worried', dr * k);
    // the wind is back: the cap streams out, a gust
    const bk = win(pu, 2.7, 2.9, 3.8, 4.2);
    go({ hop: 0.04, pitch: -8, head: -10, glide: 0.6 }, bk * k);
    say('relief', bk * k);
    if (pu > 2.7 && pu < 3.9) q.gustS = (pu - 2.7) / 1.2;
    // a long smug glide
    const sg = win(pu, 4.0, 4.4, 6.0, 6.6);
    go({ glide: 1, head: -6, pitch: -4, spread: 1 }, sg * k);
    say('smug', sg * k);
  }
  if (k > 0.001 && piece === 'stretch') {
    // wings stretched right up over its back, tail fanned
    const sr = win(pu, 0.3, 0.9, 2.0, 2.4);
    go({ wgrab: 1, wbeat: 0.0, spread: 1, tailUp: 12, pitch: -8, head: -12, fluff: 0.6 }, sr * k);
    say('reach', sr * k);
    // a big yawn
    const yw = win(pu, 2.1, 2.5, 3.4, 3.8);
    go({ beak: 1, head: -22, reach: 0.3, glide: 1 }, yw * k);
    say('yawn', yw * k);
    // a shake of its head
    const sh = win(pu, 3.7, 3.9, 5.0, 5.5);
    go({ head: Math.sin((pu - 3.7) * 22) * 14 * (1 - sstep((pu - 4.4) / 0.6)), fluff: 0.4 }, sh * k);
    say(pu < 4.6 ? 'shut' : 'happy', sh * k);
  }
  if (k > 0.001 && piece === 'doze') {
    // its eyes close, its head nods, it drifts down
    const dz = win(pu, 0.3, 1.0, 3.9, 4.0);
    const nod = Math.max(0, Math.sin(pu * 1.7)) * sstep(pu / 2.5);
    go({ head: 14 + nod * 14, pitch: 6, hop: -0.06 - pu * 0.02, glide: 1 }, dz * k);
    say(pu < 1.0 ? 'shut' : 'sleep', dz * k);
    if (dz > 0.5) q.zz = dz * k * sstep((pu - 1.2) / 0.6);
    // it jolts awake flapping...
    const jt = win(pu, 3.95, 4.05, 4.5, 4.8);
    go({ head: -14, pitch: -10, fluff: 1, glide: 0, hop: 0.04 }, jt * k);
    say('spot', jt * k);
    if (pu > 3.95 && pu < 4.8) q.startle = (pu - 3.95) / 0.85;
    // ...and looks round to see if anyone saw
    const lk = win(pu, 4.7, 5.0, 6.2, 6.8);
    go({ head: Math.sin((pu - 4.7) * 3.4) * 16, fluff: 0.2 }, lk * k);
    say('sheepish', lk * k);
    q.blush = Math.max(q.blush, lk * k * 0.8);
  }

  const hunting = fighting && !hurt;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  // ----- Hunting you: leaning in, the cap streaming hard -----
  st.huntK = mix(st.huntK ?? 0, hunting && !mv ? 1 : 0, ease(6));
  const hw = alive ? sstep(st.huntK) : 0;
  if (hw > 0.001) {
    go({ pitch: 8, head: 4, glide: 0.5 }, hw);
    q.wind = Math.max(q.wind, 1 + 0.4 * hw);
    if (hw > 0.5) q.face = 'fierce';
  }
  if (F.low && !mv) {
    q.face = q.face ?? 'worried';
    q.sweat = ((a.t ?? 0) * 0.5) % 1;
    q.wind = Math.min(q.wind, 0.4);
  }
  // ----- Its moves: the face and the cap -----
  if (mv && alive) {
    if (mv === MOVES.dive) {
      say(mt < 0 ? 'focus' : 'shout', 1);
      q.wind = mt < 0 ? 1.2 : 1.6;
    } else if (mv === MOVES.buffet) {
      say(mt < 0 ? 'focus' : 'shout', 1);
      q.wind = 1.3;
    } else if (mv === MOVES.clack) {
      say(mt < 0 ? 'focus' : 'fierce', 1);
      if (mt >= 0) q.clackS = mt;
    } else if (mv === MOVES.hurt) {
      q.face = 'hurt';
      q.wind = 0.6;
    } else if (mv === MOVES.flutter) {
      q.face = 'smug';
      q.smugS = mt;
    }
  }
  // ----- Asleep (a nap the game gives it): dozing on the wing -----
  if (F.napping && !mv) {
    go({ head: 16, pitch: 6, glide: 1 }, 1);
    q.face = 'sleep';
    q.zz = 1;
  }
  const cine = F.cine;
  if (alive && !mv && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
  }
  if (!alive) {
    q.face = 'dizzy';
    q.wind = 0.2;
  }
  out.fluff = 0;
  settleFace(st, q, now, m.uid, SHUTS, 5.2);
  easeKeys(st, q, ['wind', 'blush'], dt, () => 5);
  // The windsock's three pieces on their own springs: each eases toward the wind's hang (streaming out
  // behind, or flopped down), lags the head's turns and nods, overshoots a little and settles.
  const wk = clamp(q.wind, 0, 1.6);
  const flut = Math.sin(now * 2.3 + (m.uid ?? 0)) * 0.06 * clamp(wk - 0.3, 0, 1);
  // (in the world's frame: streaming back and a little up in a wind, or standing up off its crown and
  // flopping down behind when the wind drops; drawn, the head's own turn is taken off, so the cap trails
  // every turn and nod of the head by itself)
  const wl = clamp(wk, 0, 1);
  const goals = [mix(-Math.PI / 2 - 0.75, -Math.PI + 0.22, wl), mix(-1.0, -0.12, wl), mix(-0.8, -0.1, wl)];
  goals[1] += flut;
  goals[2] += flut * 1.6;
  const headNow = out.head ?? 0;
  const S0 = (st.alSock ??= { a: goals.map((g) => g), v: [0, 0, 0], prev: headNow });
  if (dt > 0) {
    const dh = 0;
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 3; j++) {
        const kk = [110, 80, 60][j];
        const cc = [12, 9, 7.5][j];
        S0.v[j] += (-(S0.a[j] - goals[j]) * kk - S0.v[j] * cc - dh * (0.25 + j * 0.12)) * h;
        S0.a[j] += S0.v[j] * h;
      }
    }
  }
  S0.prev = headNow;
  q.sock = S0.a.slice();
  q.t = a.t ?? 0;
}
// Beaten, its own way: slumped, wings drooping.
function after(m, a, out) {
  if (m.hp <= 0) Object.assign(out, { hover: 0, sit: 1, pitch: 16, head: 24, wingN: 0.5, wingF: 0.5, fluff: 0, beak: 0.3, flap: 0, glide: 0, wgrab: 0, spread: 0.3 });
}

// ---------- Drawing ----------
const stroke = (ctx, col, w) => {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};
function softDab(ctx, x, y, rx, ry, col, al, rot = 0) {
  if (al <= 0.005) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, ry / rx);
  glow(ctx, 0, 0, rx, col, al);
  ctx.restore();
}
// Over the body: a soft cool shade along the belly, and a pale rim of light on the back.
function body(ctx, a, mode, K) {
  const bk = a.bk;
  if (!bk || mode === 'line') return;
  const sc = K.sc;
  const at = bk.at;
  softDab(ctx, ...at([-2, 5.6]), sc(8), sc(3.4), '#d4cfe6', 0.6, bk.th);
  softDab(ctx, ...at([5.4, 2]), sc(6), sc(5), '#ffffff', 0.9, bk.th);
}
// Over the near wing: a soft pale bar along its coverts (an albatross's underwing shows white at the root).
function wing(ctx, a, mode, K) {
  const wg = a.bk?.wings?.near;
  if (!wg?.root || !wg.tip || mode === 'line') return;
  const p = [mix(wg.root[0], wg.wrist[0], 0.5), mix(wg.root[1], wg.wrist[1], 0.5)];
  softDab(ctx, p[0], p[1], K.sc(3.4), K.sc(1.8), '#c4bed8', 0.55, wg.a1);
}
// The half-moon eye: round on top, flat underneath; the whole iris always clear awake.
function eye(ctx, a, x, y, erx, ery, f, sliver) {
  const K0 = (c) => tone(a, c);
  const kind = f.e;
  const w = Math.max(0.45, ery * 0.36);
  if (kind === 'happy' || kind === 'proud') {
    ctx.beginPath();
    ctx.moveTo(x - erx, y + ery * 0.3);
    ctx.quadraticCurveTo(x, y - ery * 0.95, x + erx, y + ery * 0.3);
    return stroke(ctx, K0(LASH), w);
  }
  if (kind === 'shut' || kind === 'sleep') {
    ctx.beginPath();
    ctx.moveTo(x - erx, y);
    ctx.quadraticCurveTo(x, y + ery * (kind === 'sleep' ? 0.75 : 0.6), x + erx, y);
    stroke(ctx, K0(LASH), w);
    if (!sliver) {
      ctx.beginPath();
      ctx.moveTo(x + erx, y);
      ctx.quadraticCurveTo(x + erx * 1.3, y - ery * 0.1, x + erx * 1.4, y - ery * 0.45);
      stroke(ctx, K0(LASH), w * 0.7);
    }
    return;
  }
  if (kind === 'squeeze') {
    ctx.beginPath();
    ctx.moveTo(x - erx * 0.9, y - ery * 0.7);
    ctx.lineTo(x + erx * 0.5, y);
    ctx.lineTo(x - erx * 0.9, y + ery * 0.7);
    return stroke(ctx, K0(LASH), w);
  }
  const big = kind === 'wide' ? 1.12 : 1;
  const ex = erx * big;
  const ey = ery * big;
  const shape = () => {
    ctx.beginPath();
    ctx.ellipse(x, y + ey * 0.36, ex, ey * 1.18, 0, Math.PI, TAU);
    ctx.quadraticCurveTo(x, y + ey * 0.66, x - ex, y + ey * 0.36);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = K0('#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const an = u * TAU * 1.6;
      if (i) ctx.lineTo(x + Math.cos(an) * u * ex * 0.7, y - ey * 0.15 + Math.sin(an) * u * ey * 0.55);
      else ctx.moveTo(x, y - ey * 0.15);
    }
    stroke(ctx, K0(IRIS[1]), Math.max(0.3, ery * 0.18));
  } else {
    const [gx, gy] = f.g ?? [0.3, 0.1];
    ctx.save();
    shape();
    ctx.clip();
    const r = ey * 0.56;
    const ix = x + gx * ex * 0.26;
    const iy = y - ey * 0.14 + gy * ey * 0.12;
    ell(ctx, ix, iy, r, r);
    ctx.fillStyle = K0(IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.42, r * 0.78, r * 0.52);
    ctx.fillStyle = K0(IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.74, r * 0.48, r * 0.22);
    ctx.fillStyle = K0(IRIS[3]);
    ctx.fill();
    ell(ctx, ix, iy - r * 0.06, r * 0.46, r * 0.46);
    ctx.fillStyle = K0(IRIS[0]);
    ctx.fill();
    // its shine: a soft rounded square up on the far side, a dot low on the near side
    const s0 = r * 0.34;
    smooth(ctx, [[ix - r * 0.52, iy - r * 0.62], [ix - r * 0.52 + s0, iy - r * 0.62], [ix - r * 0.52 + s0, iy - r * 0.62 + s0], [ix - r * 0.52, iy - r * 0.62 + s0]]);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ix + r * 0.4, iy + r * 0.34, r * 0.13, r * 0.13);
    ctx.fill();
    ctx.restore();
  }
  // a neat lash line along the round top, one round flick at the outer end (smug: the line sits lower
  // at its inner end, never over the iris)
  ctx.beginPath();
  ctx.ellipse(x, y + ey * 0.36, ex * 1.04, ey * 1.22, 0, Math.PI * 1.08, Math.PI * 1.96);
  stroke(ctx, K0(LASH), w);
  if (!sliver) {
    const fx0 = x + ex * 0.98;
    const fy0 = y + ey * 0.0;
    ctx.beginPath();
    ctx.moveTo(fx0, fy0);
    ctx.quadraticCurveTo(fx0 + ex * 0.32, fy0 - ey * 0.12, fx0 + ex * 0.42, fy0 - ey * 0.48);
    stroke(ctx, K0(LASH), w * 0.75);
  }
}
// The windsock cap, in the head's frame: a ribbed band round its crown, three striped pieces on their springs,
// a soft pom at the end.
function sockPts(q, r, rx, ha) {
  const root = [-rx * 0.12, -r * 0.72];
  const ang = q.sock ?? [-Math.PI - 0.18, 0.12, 0.06];
  // (its springs hang in the world, so the cap streams back however the head is turned)
  const a1 = ang[0] - ha;
  const a2 = a1 + ang[1];
  const a3 = a2 + ang[2];
  const L = [r * 0.62, r * 0.55, r * 0.48];
  const p1 = [root[0] + Math.cos(a1) * L[0], root[1] + Math.sin(a1) * L[0]];
  const p2 = [p1[0] + Math.cos(a2) * L[1], p1[1] + Math.sin(a2) * L[1]];
  const p3 = [p2[0] + Math.cos(a3) * L[2], p2[1] + Math.sin(a3) * L[2]];
  return { pts: [root, p1, p2, p3], widths: [r * 1.0, r * 0.76, r * 0.54, r * 0.36] };
}
function head(ctx, a, mode, K) {
  const bk = a.bk;
  if (!bk) return;
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const sc = K.sc;
  const Hd = K.P.head;
  const r = sc(Hd.r);
  const rx = sc(Hd.rx);
  ctx.translate(bk.hp[0], bk.hp[1]);
  ctx.rotate(bk.ha);
  const { pts, widths } = sockPts(q, r, rx, bk.ha);
  const pom = pts[3];
  const band = () => {
    ctx.beginPath();
    ctx.ellipse(-rx * 0.1, -r * 0.6, rx * 0.84, r * 0.34, -0.12, Math.PI * 0.98, Math.PI * 2.02);
    ctx.ellipse(-rx * 0.1, -r * 0.6, rx * 0.84, r * 0.12, -0.12, Math.PI * 0.02, Math.PI * 0.98);
    ctx.closePath();
  };
  if (mode === 'line') {
    ribbon(ctx, pts, widths, 5);
    stroke(ctx, INK, 2);
    ell(ctx, pom[0], pom[1], r * 0.3, r * 0.3);
    stroke(ctx, INK, 2);
    band();
    return stroke(ctx, INK, 2);
  }
  // --- the face ---
  ctx.save();
  ell(ctx, 0, 0, rx, r);
  ctx.clip();
  softDab(ctx, rx * 0.3, r * 0.45, rx * 0.7, r * 0.4, '#e4e0f0', 0.5);
  ctx.restore();
  const ex = rx * 0.36;
  const ey = -r * 0.1;
  const erx = sc(2.05);
  const ery = sc(2.15);
  // the soft grey smudge over the eye, and the brow riding on it
  softDab(ctx, ex - erx * 0.5, ey - ery * 0.85, erx * 1.9, ery * 1.0, SMUDGE, 0.55, -0.25);
  const browAt = (bx, by, o, lift, s) => {
    ctx.beginPath();
    ctx.moveTo(bx - s * 1.2, by + lift * sc(0.5) * (o > 0 ? 0.4 : 1) + sc(0.2));
    ctx.quadraticCurveTo(bx, by - sc(0.6) + lift * sc(0.4), bx + s * 1.2, by + lift * sc(0.5) * (o > 0 ? 1 : 0.4));
    stroke(ctx, tone(a, '#8d86a8'), Math.max(0.5, sc(0.62)));
  };
  // (a bird side on: one eye, one brow; the far eye is round the other side of its head)
  browAt(ex, ey - ery * 1.7, 1, ((f.b?.[1] ?? 0) + (f.b?.[0] ?? 0)) * 0.5, sc(1.5));
  // its cheek: a soft rose blush under the eye, toward the bill
  softDab(ctx, ex + erx * 0.5, ey + ery * 1.5, erx * 1.3, ery * 0.7, '#ffa8b8', 0.38 + (q.blush ?? 0) * 0.3);
  eye(ctx, a, ex, ey, erx, ery, f, false);
  // the gape of its bill, grown from the bill's root and curling up or down with its mood
  const B = K.P.beak;
  const gx = sc(B.at[0]) + sc(0.3);
  const gy = sc(B.at[1]) + sc(B.h) * 0.08;
  const up = f.m === 'smile' ? -1 : f.m === 'frown' ? 1 : -0.35;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.quadraticCurveTo(gx - sc(0.7), gy + up * sc(0.15), gx - sc(1.3), gy + up * sc(0.7));
  stroke(ctx, tone(a, C.beakSh), Math.max(0.45, sc(0.5)));
  // --- the windsock cap: the striped sock first, its band over its root ---
  ctx.save();
  const c = ribbon(ctx, pts, widths, 5);
  ctx.fillStyle = tone(a, SOCK[2]);
  ctx.fill();
  ctx.clip();
  // coral stripes across it, every other piece of its length
  for (let i = 0; i < c.length - 1; i++) {
    const u = i / (c.length - 1);
    if (Math.floor(u * 6) % 2 !== 0) continue;
    const p = c[i];
    const qq = c[i + 1];
    const an = Math.atan2(qq[1] - p[1], qq[0] - p[0]);
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.rotate(an);
    ctx.fillStyle = tone(a, SOCK[0]);
    ctx.fillRect(-0.2, -r, Math.hypot(qq[0] - p[0], qq[1] - p[1]) + 0.5, r * 2);
    ctx.restore();
  }
  softDab(ctx, pts[1][0], pts[1][1] - r * 0.2, r * 0.8, r * 0.4, '#ffffff', 0.55);
  softDab(ctx, pts[2][0], pts[2][1] + r * 0.25, r * 0.7, r * 0.35, SOCK[1], 0.4);
  ctx.restore();
  // the pom
  ell(ctx, pom[0], pom[1], r * 0.3, r * 0.3);
  ctx.fillStyle = tone(a, SOCK[2]);
  ctx.fill();
  softDab(ctx, pom[0] - r * 0.08, pom[1] - r * 0.1, r * 0.2, r * 0.18, '#ffffff', 0.9);
  softDab(ctx, pom[0] + r * 0.08, pom[1] + r * 0.12, r * 0.22, r * 0.16, SOCK[3], 0.6);
  // the ribbed band round its crown
  band();
  ctx.fillStyle = tone(a, SOCK[2]);
  ctx.fill();
  ctx.save();
  band();
  ctx.clip();
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const bx = -rx * 0.9 + u * rx * 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, -r * 1.0);
    ctx.lineTo(bx + rx * 0.05, -r * 0.4);
    stroke(ctx, tone(a, SOCK[3]), Math.max(0.3, sc(0.32)));
  }
  softDab(ctx, -rx * 0.2, -r * 0.78, rx * 0.6, r * 0.14, '#ffffff', 0.7);
  ctx.restore();
}

// ---------- Live effects ----------
const BUBBLE = [[-6.6, -0.6], [-5.2, -5], [0, -6.6], [5, -5.4], [6.8, -1.2], [5.2, 3.6], [1, 5], [-2.2, 7.4], [-2.6, 4.6], [-5.6, 3.2]];
const BCOL = [INK, '#fffcf6', SOCK[1], '#6a6488'];
// A soft curling line of wind.
function windLine(ctx, x, y, len, u, al, d = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al * Math.sin(Math.PI * clamp(u, 0, 1));
  ctx.beginPath();
  const x0 = x - d * len * 0.5;
  ctx.moveTo(x0, y);
  ctx.bezierCurveTo(x0 + d * len * 0.4, y - 2, x0 + d * len * 0.8, y + 1.5, x0 + d * len, y - 1);
  ctx.arc(x0 + d * len - d * 0.2, y - 2.6, 1.6, Math.PI / 2, d > 0 ? -Math.PI / 2 - 1 : -Math.PI / 2 + 1, d < 0);
  pen(ctx, WIND[1], 1.4);
  ctx.stroke();
  pen(ctx, WIND[0], 0.7);
  ctx.stroke();
  ctx.restore();
}
// A soft feather: a rounded leaf with a quill line, white tipped with slate.
function feather(ctx, x, y, s, ang, al, dark = false) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  smooth(ctx, [[-s * 1.6, 0], [-s * 0.6, -s * 0.6], [s * 0.9, -s * 0.56], [s * 1.7, 0], [s * 0.9, s * 0.56], [-s * 0.6, s * 0.6]]);
  ctx.fillStyle = dark ? CW.lt : '#fbfaff';
  ctx.fill();
  pen(ctx, dark ? CW.deep : '#cfc9e2', s * 0.22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 1.8, 0);
  ctx.lineTo(s * 1.2, 0);
  pen(ctx, dark ? CW.deep : '#d6d0e6', s * 0.18);
  ctx.stroke();
  ctx.restore();
}
function fx(ctx, m, a, K) {
  const q = a.gl;
  const bk = a.bk;
  if (!q || !bk) return;
  const base = ctx.globalAlpha;
  const sc = K.sc;
  const t = q.t ?? 0;
  const hp = bk.hp;
  const tip = bk.beakTip ?? hp;
  if (m.hp <= 0) {
    dizzy(ctx, hp[0], hp[1] - sc(12), 7, a.now ?? 0, 3);
    return;
  }
  // its long "wooo": soft rings rising off its bill, and a note
  if ((q.moanS ?? -1) >= 0 && q.moanS < 1) {
    for (let i = 0; i < 3; i++) {
      const u = (q.moanS * 2.2 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * u) * 0.8;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1] - 2 - u * 10, 2 + u * 5, Math.PI * 1.15, Math.PI * 1.85);
      pen(ctx, '#ffffff', 1.2);
      ctx.stroke();
      pen(ctx, '#d6e4f6', 0.5);
      ctx.stroke();
      ctx.restore();
    }
    note(ctx, tip[0] + 3 + q.moanS * 3, tip[1] - 8 - q.moanS * 9, 1, -0.2, Math.sin(Math.PI * q.moanS), '#ffc8b8');
  }
  // clacks: a little "clack!" and a soft sparkle at the bill's tip
  if ((q.clackS ?? -1) >= 0 && q.clackS < 0.7) {
    const e = q.clackS / 0.7;
    sparkle(ctx, tip[0] + 2, tip[1] - 1, 2 * Math.sin(Math.PI * clamp(e * 2, 0, 1)), 1, '#fff4dc');
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.7) / 0.3));
    cue(ctx, 'clack!', tip[0] + 6 + e * 3, tip[1] - 7 - e * 4, 3.2, a.flip ? -1 : 1, -0.12, CW.deep, '#fffcf6');
    ctx.restore();
  }
  // a gust: soft curling lines of wind streaming past it
  if ((q.gustS ?? -1) >= 0 && q.gustS < 1) {
    for (let i = 0; i < 3; i++) {
      const u = clamp(q.gustS * 1.3 - i * 0.12, 0, 1);
      windLine(ctx, hp[0] + 10 - u * 34, hp[1] - 6 + i * 7, 10, u, 0.85, -1);
    }
  }
  // jolted awake: a few soft feathers of down puffing off
  if ((q.startle ?? -1) >= 0 && q.startle < 1) {
    const c0 = bk.pivot;
    for (let i = 0; i < 3; i++) {
      const dir = -2.4 + i * 0.9;
      feather(ctx, c0[0] + Math.cos(dir) * (4 + q.startle * 9), c0[1] - 3 + Math.sin(dir) * (3 + q.startle * 5) + q.startle * q.startle * 5, 1.1, Math.sin(q.startle * 5 + i) * 0.8, 1 - q.startle);
    }
  }
  // ----- its moves -----
  const bm = a.bdMove;
  if (bm?.mv === MOVES.dive && bm.t >= 0) {
    // speed lines streaming off it in the dive, a soft whoosh puff where it pulls up
    const u = clamp((bm.t - 0.04) / 0.3, 0, 1);
    if (u > 0 && u < 1) {
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * u) * 0.8;
      for (let i = 0; i < 3; i++) {
        const y = bk.pivot[1] - sc(4) + sc((i - 1) * 4);
        ctx.beginPath();
        ctx.moveTo(bk.pivot[0] - sc(8), y - sc(5));
        ctx.lineTo(bk.pivot[0] - sc(18) - u * sc(6), y - sc(12));
        pen(ctx, '#ffffff', 1.1);
        ctx.stroke();
      }
      ctx.restore();
    }
    const w0 = (bm.t - 0.4) / 0.45;
    if (w0 > 0 && w0 < 1) {
      dust(ctx, bk.pivot[0] + sc(6), bk.pivot[1] + sc(6), 2 + w0 * 5, (1 - w0) * 0.7, '#ffffff', '#dfe4f4');
      for (let i = 0; i < 2; i++) windLine(ctx, bk.pivot[0] - sc(4) - w0 * 10, bk.pivot[1] + sc(4) + i * 5, 9, w0, 0.8, -1);
    }
  }
  if (bm?.mv === MOVES.buffet && bm.t >= 0) {
    // a gust of wind thrown forward off the downstroke, two feathers riding it
    const u = clamp((bm.t - 0.05) / 0.6, 0, 1);
    if (u > 0 && u < 1) {
      const wt = bk.wings.near.tip;
      for (let i = 0; i < 4; i++) windLine(ctx, wt[0] + sc(6) + u * 26 + i * 2, bk.pivot[1] - sc(6) + i * 5, 11, clamp(u * 1.3 - i * 0.08, 0, 1), 0.95, 1);
      feather(ctx, wt[0] + sc(4) + u * 24, bk.pivot[1] - sc(2) + Math.sin(u * 7) * 2, 1.3, u * 3, 1 - u, true);
      feather(ctx, wt[0] + sc(2) + u * 18, bk.pivot[1] + sc(4) + Math.sin(u * 6 + 1) * 2, 1.1, -u * 2.4, 1 - u);
      sparkle(ctx, wt[0] + sc(8) + u * 22, bk.pivot[1], 1.6 * Math.sin(Math.PI * u), 1, '#ffffff');
    }
  }
  if (bm?.mv === MOVES.hurt) {
    const u = clamp(bm.t / 0.6, 0, 1);
    for (let i = 0; i < 2; i++) feather(ctx, bk.pivot[0] - sc(2) + (i - 0.5) * 6 - u * 4, bk.pivot[1] - sc(6) - u * 6 + u * u * 8, 1, u * 2 + i, 1 - u);
  }
  if ((q.smugS ?? -1) >= 0 && q.smugS < 0.9) note(ctx, tip[0] + 2 + q.smugS * 5, tip[1] - 5 - q.smugS * 9, 1, -0.2, Math.sin(Math.PI * q.smugS / 0.9), '#ffc8b8');
  if ((q.sweat ?? -1) >= 0) sweat(ctx, hp[0] - sc(6), hp[1] - sc(4) + (q.sweat % 1) * 3, 1, Math.sin(Math.PI * (q.sweat % 1)));
  if ((q.zz ?? 0) > 0.05) {
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      const zx = hp[0] + sc(2) + f * 6;
      const zy = hp[1] - sc(14) - f * 9;
      ctx.save();
      ctx.globalAlpha *= q.zz * Math.sin(Math.PI * f);
      cue(ctx, 'z', zx, zy, 2.6 + f * 1.6, a.flip ? -1 : 1, 0.1, '#8a84a8', '#fffcf6');
      ctx.restore();
    }
  }
  const bx = hp[0] + sc(1);
  const by = hp[1] - sc(19);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const BIRD = dressedBird({
  kind: 'albatross',
  C,
  CW,
  CT,
  ink: INK,
  noGuide: true,
  moves: MOVES,
  pose,
  after,
  over: { body, wingN: wing, head },
  fx,
});
const rig = BIRD.art.rig;
rig.w = Math.round(rig.w * 1.3);
rig.h = Math.round(rig.h * 1.4);
// Its art entry (`noHop`: none of the monster drawer's hops; `ownEmotes`: its marks over its head its own),
// its size as drawn, and its pace.
export const WINDSOCK_ALBATROSS_ART = { ...BIRD.art, rig, noHop: true, ownEmotes: true };
export const WINDSOCK_ALBATROSS_SIZE = { w: 34, h: 34, speed: BIRD.speed };
