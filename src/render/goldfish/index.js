// The Comet Goldfish (2026-11-27, the Sky Garden's Star Seraph remade from scratch as a new creature; the id
// stays `starspirit`). The sky over the Starlit Terrace is so deep and still at night that fish swim in it,
// and the fanciest of them is the comet goldfish: a plump little fantail whose long double tail streams out
// behind it like a comet's, its tips softly alight with starlight it has nibbled (it snacks on falling
// stars, which are always too hot). It swims the terrace and Starfall Heights' crater and East Rim,
// showing off its tail to anyone who looks. A real goldfish, chibi: on its own copy of the fish base's
// round fish (fishbase.js, by way of the Sailfish Fencer's copy, with its own long `veil` tail), dressed
// here; its face and everything it shows drawn here from scratch (never the shared face, never the hero).
//   look    a round deep-bellied body in soft apricot gold, pearly cream under the belly and round the
//           face, a few faint pearly scale arcs over its back (soft light lines, never dots); a small white
//           star blaze on its brow (a marking: it only shines when it makes a wish); a tall flowing dorsal;
//           sheer peach pectorals; and the long double tail, apricot at the root, blush in the middle, a
//           pale starry lilac at the tips, each lobe three pieces on its own springs so it streams and
//           settles behind every start, stop and turn. Its own soft coral outline, outer edge only, face
//           bare.
//   eyes    its own "dome eyes": big round glassy eyes with a pale cream rim (a fish's eye ring), a deep
//           violet iris warming to rose at the bottom, a big curved dome shine and a little four-point star
//           glint; a short neat lash line with one round flick; soft round brows. Its mouth a round pink
//           pout that gulps now and then.
//   swim    the round fish's own swim (its beat from the distance swum), slow and graceful (26); the tail
//           flowing a beat behind.
//   idle    four pieces, each the next that fits the time it has (data `rest`, world/mobs.js
//           `m.restUntil`); it never waits on keeping still (`a.calm`), only on being left alone:
//           - star snack (7.0 s): a tiny falling star drifts down; it spots it, swims up and gulps it...
//             hot! cheeks aglow, it spits it out and the star floats off; sheepish;
//           - tail show (6.6 s): tail fanned wide, dorsal up; it curls round in a soft C to admire its own
//             tail swept forward under it, a slow swish for itself; straight again, proud;
//           - bubbles (6.0 s): three little bubbles blown up one after another; it boops the last with its
//             nose (a sparkle pop) and giggles;
//           - wish (6.8 s): eyes shut, fins clasped forward, its star blaze glowing, sparkles rising; it
//             opens its eyes, happy.
//   moves   Comet Swish (it coils, then whips round so the long tail sweeps through you in an arc of
//           sparkles); Wish Bubble (cheeks puffed, then a big bubble with a star inside blown at you, popping
//           into sparkles); Shooting Star (it backs up aglow; then darts through you trailing a comet streak).
//   else    hurt: jolted back, fins flared; after landing a hit: a happy wiggle, a sparkle; hunting you:
//           leaning in, fins out, dorsal up; low on health: worried, a bead of sweat, fins drooping; a nap
//           (habitat): sinking slowly, fins slow, eyes shut; beaten: dizzy. Its marks over its head (!, ?)
//           are its own little bubbles (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: soft glassy bubbles, the game's curvy sparkles and
// soft stars, a comet's streak of pale light, never specks.
import { dressedGoldfish } from './fishbase.js';
import { TAU, clamp, mix, sstep, win, pulse, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, cue } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble } from './act.js';

// (2026-11-27, the player: very pale and plain, the tail not reading as a comet. A richer goldfish gold,
// and the double tail now runs from warm gold through rose into a starry twilight lilac, with a few
// twinkling stars inside it, a soft comet glow off its tips and a little trail of stars behind.)
const C = { lt: '#fff0d4', base: '#ffb874', sh: '#f58f55', deep: '#d66e42' };
const CF = { lt: '#fff0f2', base: '#ffc8b6', sh: '#f0a0a8', deep: '#d4808f' };
const CV = ['#ffb478', '#ff9ebf', '#a99cf0'];
const INK = '#c66a4c';
const FIN_INK = '#cc8e9e';
const CREAM = '#fff6ea';
const LASH = '#4a2a3e';
const IRIS = ['#22163a', '#4a2f78', '#8a5aa8', '#f0a6b8'];
const STAR = ['#fffbe6', '#ffe8a0', '#f2c870'];

// ---------- Its face ----------
// b: [far brow lift, near brow lift] (negative up); g: where it looks; m: its mouth
const FACES = {
  calm: { e: 'open', g: [0.4, 0.1], b: [0, 0], m: 'pout' },
  spot: { e: 'wide', g: [0.6, -1.2], b: [-1.2, -1.4], m: 'o' },
  gulp: { e: 'happy', b: [-0.6, -0.8], m: 'gulp' },
  hot: { e: 'squeeze', b: [-1, -1.2], m: 'hot' },
  sheepish: { e: 'open', g: [-0.6, 0.8], b: [-1.2, -0.6], m: 'wobble' },
  admire: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  proud: { e: 'happy', b: [-1, -0.6], m: 'smile' },
  puff: { e: 'shut', b: [0.2, 0.2], m: 'puff' },
  blow: { e: 'open', g: [0.6, -0.3], b: [-0.4, -0.6], m: 'o' },
  giggle: { e: 'happy', b: [-1, -1.2], m: 'open' },
  wish: { e: 'shut', b: [-0.4, -0.6], m: 'pout' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  focus: { e: 'open', g: [0.9, 0.2], b: [0.7, 0.9], m: 'pout' },
  fierce: { e: 'open', g: [1, 0.1], b: [1, 1.2], m: 'frown' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'open' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'o' },
  worried: { e: 'open', g: [0.2, 0.9], b: [-1.3, -1.5], m: 'wobble' },
  sad: { e: 'open', g: [0.1, 1.1], b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.3, 0.3], m: 'pout' },
  shut: { e: 'shut', b: [0, 0], m: 'pout' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.4, 0.1], b: [0, -0.4], m: 'open' },
  talkO: { e: 'open', g: [0.4, 0.1], b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['gulp', 'hot', 'admire', 'proud', 'puff', 'giggle', 'wish', 'happy', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

// ---------- Its moves over the fish's (x, rise in body heights; angles in degrees) ----------
// (d1 its cheeks puffed, d2 its mouth blown open, d3 its glow before a dash, d4 its star blaze alight)
const MOVES = {
  swish: {
    anticT: 0.4,
    keys: [
      [0, { x: -0.04, pitch: -14, bend: -46, head: -8, fins: 0.7, dorsal: 1, spread: 1 }],
      [0.1, { x: 0.05, pitch: 26, bend: 116, head: 10, fins: -0.4, dorsal: 0.3, spread: 1.2 }, 'out'],
      [0.2, { x: 0.06, pitch: 20, bend: 92, spread: 1.1 }, 'in'],
      [0.4, { x: 0.03, pitch: 2, bend: -10, head: 0, fins: 0.3, dorsal: 0.4, spread: 0.5 }, 'io'],
      [0.72, {}, 'io'],
    ],
  },
  bubble: {
    anticT: 0.5,
    keys: [
      [0, { x: -0.05, pitch: -10, head: -10, fins: 0.9, dorsal: 0.8, spread: 0.6, d1: 1 }],
      [0.1, { x: 0.04, pitch: 4, head: 4, fins: 0.4, d1: 0, d2: 1 }, 'out'],
      [0.35, { x: 0.03, d2: 0.3 }, 'io'],
      [0.7, {}, 'io'],
    ],
  },
  dash: {
    anticT: 0.45,
    keys: [
      [0, { x: -0.14, pitch: -6, head: -6, fins: 0.9, dorsal: -0.4, spread: 0.3, thrash: 0.6, d3: 1 }],
      [0.1, { x: 0.42, pitch: 6, head: 8, fins: -1, dorsal: -1, spread: 0.1, thrash: 1, d3: 1 }, 'out'],
      [0.2, { x: 0.32, pitch: -10, head: -10, fins: 0.6, dorsal: 0.6, spread: 0.9, thrash: 0.3, d3: 0.6 }, 'out'],
      [0.4, { x: 0.25, pitch: -2, head: 0, fins: 0.2, thrash: 0, dorsal: 0.2, d3: 0 }, 'io'],
      [0.75, {}, 'io'],
    ],
  },
  // (its own hurt and its own pleased wiggle: no generic bubbles)
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.06, pitch: -16, head: -10, bend: 30, fins: 1, dorsal: 1, spread: 1 }, 'out'], [0.2, { x: -0.06, pitch: -9, bend: 12, fins: 0.6 }], [0.4, { x: -0.03, pitch: -2, bend: 0, fins: 0.2, dorsal: 0.3 }, 'io'], [0.76, {}, 'io']],
  },
  beam: {
    anticT: 0.1,
    keys: [[0, { rise: -0.03, fins: 0.4 }], [0.14, { rise: 0.14, pitch: -12, fins: 1, dorsal: 1, spread: 1.1, thrash: 0.8 }, 'out'], [0.6, { rise: 0.1, pitch: -9, fins: 0.9, dorsal: 1, spread: 1, thrash: 0.8 }], [0.76, { rise: 0, pitch: 2, fins: 0.2, thrash: 0 }, 'in'], [1.05, {}, 'io']],
  },
};
const POOL = ['swish', 'bubble', 'dash'];
const PIECES = { snack: 7.0, show: 6.6, bubbles: 6.0, wish: 6.8 };
const ORDER = ['snack', 'show', 'bubbles', 'wish'];
const VOWELS = ['talkA', 'talkO', 'calm', 'talkO'];

function pose(m, a, out, K, mv, mt) {
  const st = a.mo.rig;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, POOL);
  const now = F.now;
  const alive = m.hp > 0;
  const q = (a.gl = { face: null, blush: 0, gulp: 0, puff: 0, blow: 0, glow: 0, blaze: 0, snackS: -1, starOut: -1, bubT: -1, boop: -1, wishS: -1, sweat: -1, zz: 0, beamS: -1 });
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  // a slow gulp of its pout now and then (its own rhythm, from its id)
  const gp = (now + (m.uid ?? 0) * 0.83) % 3.7;
  q.gulp = pulse(gp, 2.9, 0.5);

  // ----- The act (never waiting on keeping still: it is always swimming a little) -----
  const calmGoal = alive && !mv && !F.hurt && !F.fighting && !m.cine && !F.napping ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  if (k > 0.001 && piece === 'snack') {
    // a tiny falling star drifts down; it spots it
    if (pu < 2.4) q.snackS = pu / 2.4;
    const sp = win(pu, 0.8, 1.1, 1.6, 1.8);
    go({ pitch: -18, head: -12, fins: 0.6, dorsal: 0.8 }, sp * k);
    say('spot', sp * k);
    // up, and a gulp
    const up = win(pu, 1.6, 2.1, 2.5, 2.8);
    go({ rise: 0.16, pitch: -10, head: -6, thrash: 0.5, fins: -0.2 }, up * k);
    say('gulp', up * k);
    // hot! cheeks aglow, a little shiver
    const hot = win(pu, 2.6, 2.8, 3.8, 4.1);
    go({ rise: 0.08, pitch: Math.sin(pu * 30) * 3, head: Math.sin(pu * 26) * 4, fins: 1, dorsal: 1, spread: 1 }, hot * k);
    say('hot', hot * k);
    q.glow = Math.max(q.glow, hot * k);
    q.puff = Math.max(q.puff, hot * k * 0.8);
    // it spits it out and the star floats off
    const sp2 = win(pu, 3.9, 4.0, 4.3, 4.5);
    go({ head: 8, pitch: 6, x: -0.02 }, sp2 * k);
    say('blow', sp2 * k);
    q.blow = Math.max(q.blow, sp2 * k);
    if (pu > 4.0 && pu < 6.6) q.starOut = (pu - 4.0) / 2.6;
    // sheepish
    const sh = win(pu, 4.4, 4.7, 6.4, 7.0);
    go({ head: 6, pitch: 4, fins: -0.3, dorsal: -0.2 }, sh * k);
    say('sheepish', sh * k);
    q.blush = Math.max(q.blush, sh * k * 0.8);
  }
  if (k > 0.001 && piece === 'show') {
    // tail fanned wide, dorsal up
    const fan = win(pu, 0.2, 0.8, 5.6, 6.4);
    go({ spread: 1.25, dorsal: 1.1, fins: 0.6, pitch: -4 }, fan * k);
    // it curls round in a soft C to admire its own tail (the tail swept forward under it, its eyes on it),
    // and gives it a slow swish for itself
    const ad = win(pu, 1.1, 1.8, 3.6, 4.2);
    go({ bend: -52 + Math.sin((pu - 1.1) * 2.4) * 10, head: 12, pitch: 6, fins: 0.4 }, ad * k);
    say('admire', ad * k);
    q.blush = Math.max(q.blush, ad * k * 0.5);
    // straight again, proud
    const pr = win(pu, 4.2, 4.6, 6.0, 6.6);
    go({ pitch: -8, head: -6 }, pr * k);
    say('proud', pr * k);
  }
  if (k > 0.001 && piece === 'bubbles') {
    // three little bubbles blown up one after another
    const bl = win(pu, 0.2, 0.5, 3.0, 3.3);
    go({ pitch: -12, head: -8, fins: 0.4 }, bl * k);
    const b3 = pulse(pu, 0.6, 0.45) + pulse(pu, 1.4, 0.45) + pulse(pu, 2.2, 0.45);
    q.blow = Math.max(q.blow, b3 * k);
    say(b3 > 0.3 ? 'blow' : 'calm', bl * k);
    if (pu > 0.5 && pu < 5.2) q.bubT = pu - 0.5;
    // it boops the last with its nose: a sparkle pop
    const bp = win(pu, 3.2, 3.5, 3.8, 4.1);
    go({ rise: 0.12, pitch: -20, head: -10, thrash: 0.6 }, bp * k);
    if (pu > 3.6 && pu < 4.4) q.boop = (pu - 3.6) / 0.8;
    // and giggles
    const gg = win(pu, 3.9, 4.2, 5.4, 6.0);
    go({ pitch: Math.sin(pu * 14) * 3, fins: 0.8, dorsal: 0.8, spread: 0.9 }, gg * k);
    say('giggle', gg * k);
    q.blush = Math.max(q.blush, gg * k * 0.6);
  }
  if (k > 0.001 && piece === 'wish') {
    // eyes shut, fins clasped forward, its star blaze glowing, sparkles rising
    const ws = win(pu, 0.3, 0.9, 4.6, 5.2);
    go({ pnA: 72, pnW: 1, pfA: 74, pfW: 1, pitch: -6, head: -6, dorsal: 0.6, spread: 0.7 }, ws * k);
    say('wish', ws * k);
    q.blaze = Math.max(q.blaze, win(pu, 0.9, 1.6, 4.4, 5.2) * k);
    if (pu > 1.2 && pu < 5.4) q.wishS = (pu - 1.2) / 4.2;
    // it opens its eyes, happy
    const hp = win(pu, 5.0, 5.4, 6.2, 6.8);
    go({ fins: 0.9, dorsal: 1, spread: 1, thrash: 0.4, pitch: -6 }, hp * k);
    say('happy', hp * k);
  }

  const hunting = F.fighting && alive && !F.hurt;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  // ----- Hunting you: leaning in, fins out, dorsal up -----
  st.huntK = mix(st.huntK ?? 0, hunting && !mv ? 1 : 0, ease(6));
  const hw = alive ? sstep(st.huntK) : 0;
  if (hw > 0.001) {
    go({ pitch: 6, head: 4, fins: 0.7, dorsal: 1 }, hw);
    if (hw > 0.5) q.face = 'fierce';
  }
  if (F.low && !mv) {
    q.face = q.face ?? 'worried';
    q.sweat = ((a.t ?? 0) * 0.5) % 1;
    go({ fins: -0.5, dorsal: -0.6 }, 0.8);
  }
  // ----- Its moves: the face, the cheeks, the glow -----
  if (mv && alive) {
    if (mv === MOVES.swish) say(mt < 0 ? 'focus' : 'shout', 1);
    else if (mv === MOVES.bubble) say(mt < 0 ? 'puff' : 'blow', 1);
    else if (mv === MOVES.dash) say(mt < 0 ? 'focus' : 'shout', 1);
    else if (mv === MOVES.hurt) q.face = 'hurt';
    else if (mv === MOVES.beam) {
      q.face = 'happy';
      q.beamS = mt;
    }
  }
  q.puff = Math.max(q.puff, clamp(out.d1 ?? 0, 0, 1));
  q.blow = Math.max(q.blow, clamp(out.d2 ?? 0, 0, 1));
  q.glow = Math.max(q.glow, clamp(out.d3 ?? 0, 0, 1));
  if (F.napping && !mv) {
    q.face = 'sleep';
    q.zz = 1;
  }
  const cine = F.cine;
  if (alive && !mv && !F.hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  settleFace(st, q, now, m.uid, SHUTS, 4.7);
  easeKeys(st, q, ['blush', 'puff', 'blow', 'glow', 'blaze'], dt, () => 9);
  q.t = a.t ?? 0;
}

// ---------- Its colouring and face ----------
// Over the body: pearly cream under the belly, a soft light on the back, a few faint pearly scale arcs.
function bodyFill(ctx, a, sk, K) {
  const s = K.s;
  const n = sk.pos.length;
  const pv = 2;
  K.soft(ctx, sk.along(0, sk.back[1] * 0.4), sk.back[1] * 1.1, C.lt, 0.85);
  K.soft(ctx, sk.along(sk.back[1] * 0.4, sk.back[pv] * 0.55), sk.back[pv] * 1.2, C.lt, 0.55);
  // the cream belly and throat
  K.soft(ctx, sk.along(sk.back[1] * 0.6, -sk.belly[pv] * 0.7), sk.belly[pv] * 1.15, CREAM, 0.95);
  K.soft(ctx, sk.along(0, -sk.belly[0] * 0.5), sk.belly[0] * 1.2, CREAM, 0.9);
  K.soft(ctx, sk.pos[n - 1], 5 * s, C.sh, 0.4);
  K.soft(ctx, sk.along(sk.back[1] * 1.2, sk.back[pv] * 0.9), sk.back[pv] * 0.7, C.sh, 0.35);
  // faint pearly scale arcs over the back (soft light lines, never dots)
  ctx.save();
  ctx.strokeStyle = K.tone(a, '#fff6ec', 0.4);
  ctx.lineWidth = 0.4 * s;
  ctx.lineCap = 'round';
  for (const [u, off] of [[0.32, 0.45], [0.46, 0.5], [0.6, 0.45], [0.39, 0.15], [0.53, 0.18]]) {
    const L = sk.back[pv] * 4.2;
    const c = sk.along(L * u, sk.back[pv] * off);
    const f = sk.fwdAt(L * u);
    const an = Math.atan2(f[1], f[0]);
    ctx.beginPath();
    ctx.arc(c[0], c[1], 1.6 * s, an - 1.1, an + 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
// The dome eye, in the head's frame (units).
function eye(ctx, a, x, y, r, o, f, far) {
  const kind = f.e;
  const lw = (w) => w;
  const line = (pts, w) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    ctx.quadraticCurveTo(...pts[1], ...pts[2]);
    pen(ctx, tone(a, LASH), w);
    ctx.stroke();
  };
  if (kind === 'happy') return line([[x - r, y + r * 0.25], [x, y - r * 1.05], [x + r, y + r * 0.25]], lw(0.55));
  if (kind === 'shut' || kind === 'sleep') {
    line([[x - r, y], [x, y + r * (kind === 'sleep' ? 0.7 : 0.55)], [x + r, y]], lw(0.55));
    if (!far) line([[x + o * r, y], [x + o * r * 1.25, y - r * 0.05], [x + o * r * 1.35, y - r * 0.45]], lw(0.4));
    return;
  }
  if (kind === 'squeeze') {
    ctx.beginPath();
    ctx.moveTo(x - o * r * 0.9, y - r * 0.7);
    ctx.lineTo(x + o * r * 0.5, y);
    ctx.lineTo(x - o * r * 0.9, y + r * 0.7);
    pen(ctx, tone(a, LASH), lw(0.55));
    ctx.stroke();
    return;
  }
  const R = r * (kind === 'wide' ? 1.1 : 1);
  // its pale rim (a fish's eye ring), then the glassy eye
  ell(ctx, x, y, R * 1.16, R * 1.16);
  ctx.fillStyle = tone(a, CREAM);
  ctx.fill();
  ell(ctx, x, y, R, R);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const an = u * TAU * 1.6 * o;
      if (i) ctx.lineTo(x + Math.cos(an) * u * R * 0.7, y + Math.sin(an) * u * R * 0.7);
      else ctx.moveTo(x, y);
    }
    pen(ctx, tone(a, IRIS[1]), 0.35);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.4, 0.1];
    ctx.save();
    ell(ctx, x, y, R, R);
    ctx.clip();
    const ir = R * 0.78;
    const ix = x + gx * R * 0.16;
    const iy = y + gy * R * 0.14;
    ell(ctx, ix, iy, ir, ir);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ir * 0.4, ir * 0.8, ir * 0.55);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + ir * 0.76, ir * 0.5, ir * 0.22);
    ctx.fillStyle = tone(a, IRIS[3]);
    ctx.fill();
    ell(ctx, ix, iy - ir * 0.05, ir * 0.48, ir * 0.48);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    // the big curved dome shine, and its little four-point star glint
    ctx.beginPath();
    ctx.arc(x - R * 0.05, y + R * 0.05, R * 0.72, Math.PI * 1.1, Math.PI * 1.55);
    pen(ctx, 'rgba(255,255,255,0.95)', R * 0.22);
    ctx.stroke();
    const sx = ix + ir * 0.36;
    const sy = iy + ir * 0.3;
    const ss = ir * 0.3;
    ctx.beginPath();
    ctx.moveTo(sx, sy - ss);
    ctx.quadraticCurveTo(sx + ss * 0.16, sy - ss * 0.16, sx + ss, sy);
    ctx.quadraticCurveTo(sx + ss * 0.16, sy + ss * 0.16, sx, sy + ss);
    ctx.quadraticCurveTo(sx - ss * 0.16, sy + ss * 0.16, sx - ss, sy);
    ctx.quadraticCurveTo(sx - ss * 0.16, sy - ss * 0.16, sx, sy - ss);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // a short neat lash line along the top, one round flick at the outer end
  ctx.beginPath();
  ctx.arc(x, y, R * 1.02, o > 0 ? -2.45 : -Math.PI + 0.25, o > 0 ? -0.25 : -0.7);
  pen(ctx, tone(a, LASH), far ? 0.35 : 0.5);
  ctx.stroke();
  if (!far) line([[x + o * R * 0.98, y - R * 0.22], [x + o * R * 1.3, y - R * 0.3], [x + o * R * 1.4, y - R * 0.7]], 0.38);
}
function brow(ctx, a, x, y, o, lift, w) {
  ctx.beginPath();
  ctx.moveTo(x - o * w, y + lift * 0.5 + 0.15);
  ctx.quadraticCurveTo(x, y - 0.5 + lift * 0.4, x + o * w, y + lift * 0.2 + 0.15);
  pen(ctx, tone(a, '#c27866'), 0.5);
  ctx.stroke();
}
// Its little white four-point star blaze (a marking; it only shines making a wish).
function blaze(ctx, a, x, y, s, lit) {
  if (lit > 0.02) glow(ctx, x, y, s * 3.4, STAR[1], 0.7 * lit);
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.2, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.2, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.2, x, y - s);
  ctx.fillStyle = tone(a, lit > 0.3 ? STAR[0] : '#fffaf2');
  ctx.fill();
}
function mouth(ctx, a, x, y, q, f) {
  const LIP = '#f08aa0';
  const DARK = '#7a2e48';
  const g = q.gulp ?? 0;
  const m = q.blow > 0.4 ? 'o' : f.m;
  // (cheeks puffed: two soft rounds either side of the pout)
  if ((q.puff ?? 0) > 0.05) {
    for (const [cx, cy, r] of [[-1.4, 1.2, 1.5], [1.8, 1.4, 1.0]]) {
      ell(ctx, x + cx, y + cy, r * (0.6 + q.puff * 0.5), r * (0.55 + q.puff * 0.45));
      ctx.fillStyle = tone(a, '#fff2ec', 0.9 * q.puff);
      ctx.fill();
    }
  }
  if (m === 'o' || m === 'gulp' || m === 'hot') {
    const big = m === 'hot' ? 1.15 : m === 'gulp' ? 0.75 : 0.95;
    ell(ctx, x, y, 0.95 * big, 1.1 * big);
    ctx.fillStyle = tone(a, LIP);
    ctx.fill();
    ell(ctx, x, y + 0.05, 0.55 * big, 0.7 * big);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    return;
  }
  if (m === 'open') {
    smooth(ctx, [[x - 1.2, y - 0.3], [x + 1.1, y - 0.4], [x + 0.9, y + 1.1], [x, y + 1.5], [x - 1, y + 1.1]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + 1, 0.55, 0.3);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
    return;
  }
  // its round pink pout: small and closed, opening a touch on each gulp; smiling or frowning a little
  const curve = m === 'smile' ? -0.35 : m === 'frown' ? 0.35 : m === 'wobble' ? 0.1 : 0;
  smooth(ctx, [[x - 0.9, y + curve], [x - 0.3, y - 0.55], [x + 0.6, y - 0.5], [x + 1.0, y + curve * 0.8], [x + 0.5, y + 0.55], [x - 0.4, y + 0.55]]);
  ctx.fillStyle = tone(a, LIP);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 0.6, y + curve * 0.6);
  ctx.quadraticCurveTo(x, y + 0.05 - curve * 0.4 + g * 0.2, x + 0.7, y + curve * 0.5);
  pen(ctx, tone(a, DARK), 0.32 + g * 0.3);
  ctx.stroke();
  ell(ctx, x - 0.15, y - 0.3, 0.3, 0.14);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill();
}
function face(ctx, a, sk, K) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  K.headFrame(ctx, a);
  // a soft pearly cheek round its eyes, rosy cheeks (glowing warm when a star is too hot)
  glow(ctx, -0.6, -1.6, 4.4, CREAM, 0.6);
  glow(ctx, -1.2, 1.6, 2.2, '#ffa4b6', 0.4 + (q.blush ?? 0) * 0.35);
  glow(ctx, 3.0, 1.2, 1.4, '#ffa4b6', 0.3 + (q.blush ?? 0) * 0.3);
  if ((q.glow ?? 0) > 0.02) glow(ctx, 0.6, 1.2, 4, '#ffd88a', 0.55 * q.glow);
  blaze(ctx, a, -3.8, -6.2, 1.25, q.blaze ?? 0);
  eye(ctx, a, -0.9, -2.3, 2.05, -1, f, false);
  eye(ctx, a, 2.7, -2.7, 1.3, 1, f, true);
  brow(ctx, a, -1.1, -5.2, -1, f.b?.[1] ?? 0, 1.4);
  brow(ctx, a, 2.7, -4.6, 1, f.b?.[0] ?? 0, 0.8);
  ctx.save();
  ctx.translate(2.3, 1.0);
  ctx.scale(1.25, 1.25);
  mouth(ctx, a, 0, 0, q, f);
  ctx.restore();
}

// ---------- Live effects ----------
const BUBBLE = [[-5.6, 0.6], [-5.8, -3.2], [-3, -6], [1, -6.6], [4.6, -5], [6, -1.4], [5, 2.6], [1.6, 4.6], [-1, 6.6], [-1.6, 4.4], [-4.2, 3.4]];
const BCOL = [INK, '#fffaf6', '#e07a68', '#7a6a8a'];
// A soft glassy bubble (a sparkle inside it when it carries a star).
function glassBubble(ctx, x, y, r, al, withStar = false) {
  if (al <= 0.02 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 1.3, '#f0eaff', 0.35);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(240,236,255,0.35)';
  ctx.fill();
  pen(ctx, 'rgba(200,190,236,0.9)', Math.max(0.35, r * 0.14));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.66, -2.5, -1.6);
  pen(ctx, '#ffffff', Math.max(0.3, r * 0.2));
  ctx.stroke();
  ctx.restore();
  if (withStar) sparkle(ctx, x + r * 0.05, y + r * 0.08, r * 0.55, al, STAR[1]);
}
// A tiny falling star: a soft five-point star with a short tail of light.
function tinyStar(ctx, x, y, s, al, tail = [0, 0]) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  if (tail[0] || tail[1]) {
    const g = ctx.createLinearGradient(x, y, x + tail[0], y + tail[1]);
    g.addColorStop(0, 'rgba(255,240,200,0.8)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tail[0], y + tail[1]);
    ctx.strokeStyle = g;
    ctx.lineWidth = s * 0.9;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  glow(ctx, x, y, s * 2.4, STAR[1], 0.6);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? s * 0.48 : s;
    const an = (i / 10) * TAU - Math.PI / 2;
    ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.fillStyle = STAR[0];
  ctx.fill();
  pen(ctx, STAR[2], s * 0.2);
  ctx.stroke();
  ctx.restore();
}
// Inside each lobe of the comet tail: two little stars twinkling in turn along it, toward the tip.
function veilPaint(ctx, a, lobe, W, k) {
  const t = a.gl?.t ?? a.t ?? 0;
  for (let i = 0; i < 2; i++) {
    const u = 0.55 + i * 0.28;
    const j = Math.min(2, Math.floor(u * 3));
    const f = u * 3 - j;
    const p = [mix(lobe[j][0], lobe[j + 1][0], f), mix(lobe[j][1], lobe[j + 1][1], f)];
    const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 2.2 + k * 1.3);
    sparkle(ctx, p[0], p[1] + (i ? 0.6 : -0.6) * (k ? -1 : 1), 0.7 + 0.5 * tw, 0.55 + 0.45 * tw, STAR[1]);
  }
}
function fx(ctx, m, a, K) {
  const q = a.gl;
  const sk = a.fk;
  if (!q || !sk) return;
  const base = ctx.globalAlpha;
  const s = K.s;
  const t = q.t ?? 0;
  const mouthAt = sk.inHead(3.4, 0.9);
  const top = sk.inHead(-1.5, -9);
  if (m.hp <= 0) {
    dizzy(ctx, top[0], top[1] - 2, 6, a.now ?? 0, 3);
    return;
  }
  // its comet tail's tips: a soft comet glow off each, and a little trail of stars streaming on
  // behind them, each star drifting back along the tail's line and fading (three a lobe, out of step)
  if (sk.veil) {
    for (let i = 0; i < 2; i++) {
      const lobe = sk.veil[i];
      const tip = lobe[3];
      const dx = tip[0] - lobe[2][0];
      const dy = tip[1] - lobe[2][1];
      const dl = Math.hypot(dx, dy) || 1;
      glow(ctx, tip[0] + (dx / dl) * 1.5, tip[1] + (dy / dl) * 1.5, 6.5, '#fff0c0', 0.32);
      for (let j = 0; j < 3; j++) {
        const u = (t * 0.55 + j / 3 + i * 0.17 + (m.uid ?? 0) * 0.13) % 1;
        const d = 1.5 + u * 9;
        sparkle(ctx, tip[0] + (dx / dl) * d, tip[1] + (dy / dl) * d + (i ? 1 : -1) * u * 1.6, (1.1 - j * 0.15) * Math.sin(Math.PI * u), 0.9, j % 2 ? '#ffffff' : STAR[1]);
      }
    }
  }
  // star snack: the tiny star drifting down to it, then spat out and floating off
  if ((q.snackS ?? -1) >= 0 && q.snackS < 1) {
    const u = sstep(q.snackS);
    const x = mouthAt[0] + 5 - u * 4;
    const y = mouthAt[1] - 13 + u * 12;
    tinyStar(ctx, x, y, 1.3, Math.min(1, q.snackS * 4) * (1 - sstep((q.snackS - 0.9) / 0.1)), [3, -5]);
  }
  if ((q.starOut ?? -1) >= 0 && q.starOut < 1) {
    const u = q.starOut;
    tinyStar(ctx, mouthAt[0] + 3 + u * 7, mouthAt[1] - u * 9 + Math.sin(u * 8) * 1.2, 1.2, 1 - sstep((u - 0.6) / 0.3));
    if (u < 0.3) glassBubble(ctx, mouthAt[0] + 2 + u * 6, mouthAt[1] - 1 - u * 4, 0.8, 1 - u / 0.3);
  }
  // little bubbles blown up one after another; the last booped into a sparkle
  if ((q.bubT ?? -1) >= 0) {
    for (let i = 0; i < 3; i++) {
      const u = (q.bubT - i * 0.8) / 3.4;
      if (u <= 0 || u >= 1) continue;
      if (i === 2 && (q.boop ?? -1) >= 0) continue;
      glassBubble(ctx, mouthAt[0] + 2 + u * 3 + Math.sin(u * 9 + i) * 1.2, mouthAt[1] - 2 - u * 11, 0.9 + i * 0.25, 1 - sstep((u - 0.7) / 0.25));
    }
  }
  if ((q.boop ?? -1) >= 0 && q.boop < 1) {
    const p = sk.inHead(4, -3);
    for (let i = 0; i < 4; i++) {
      const an = -Math.PI / 2 + (i - 1.5) * 0.7;
      sparkle(ctx, p[0] + Math.cos(an) * (2 + q.boop * 5), p[1] - 2 + Math.sin(an) * (2 + q.boop * 4), 1.2 * (1 - q.boop), 1, i % 2 ? '#ffffff' : STAR[1]);
    }
  }
  // a wish: sparkles rising off its star blaze
  if ((q.wishS ?? -1) >= 0 && q.wishS < 1) {
    const b = sk.inHead(-3.8, -6.2);
    for (let i = 0; i < 3; i++) {
      const u = (q.wishS * 2.4 + i / 3) % 1;
      sparkle(ctx, b[0] + Math.sin(u * 6 + i * 2) * 3, b[1] - 2 - u * 9, 1.3 * Math.sin(Math.PI * u), 1, i % 2 ? '#ffffff' : STAR[1]);
    }
  }
  // ----- its moves -----
  const fm = a.fsMove;
  if (fm?.mv === MOVES.swish && fm.t >= 0 && fm.t < 0.5 && sk.veil) {
    // an arc of sparkles following the sweeping tail tips
    const u = fm.t / 0.5;
    for (const lobe of sk.veil) {
      const tip = lobe[3];
      for (let i = 0; i < 3; i++) sparkle(ctx, tip[0] + (i - 1) * 2.4, tip[1] + Math.sin(i * 2.1) * 2, 1.6 * (1 - u) * (1 - i * 0.2), 1, i % 2 ? '#ffffff' : STAR[1]);
    }
    glow(ctx, sk.slapPt[0], sk.slapPt[1], 7 * (1 - u), '#fff0c8', 0.5 * (1 - u));
  }
  if (fm?.mv === MOVES.bubble && fm.t >= 0.04 && fm.t < 0.95) {
    // the big wish bubble with a star inside, blown at you, popping into sparkles
    const u = (fm.t - 0.04) / 0.91;
    const fwd = sk.fwd;
    const pop = sstep((u - 0.78) / 0.22);
    const bx = mouthAt[0] + fwd[0] * (3 + sstep(u / 0.8) * 26);
    const by = mouthAt[1] + fwd[1] * (3 + u * 26) - Math.sin(Math.PI * u) * 3;
    glassBubble(ctx, bx, by, 2.2 + sstep(u / 0.3) * 1.6, 1 - pop, true);
    if (pop > 0) for (let i = 0; i < 5; i++) {
      const an = (i / 5) * TAU;
      sparkle(ctx, bx + Math.cos(an) * (2 + pop * 6), by + Math.sin(an) * (2 + pop * 6), 1.4 * (1 - pop), 1, i % 2 ? '#ffffff' : STAR[1]);
    }
  }
  if (fm?.mv === MOVES.dash) {
    // aglow as it backs up; then a comet streak behind it through the dash
    if (fm.t < 0.1) glow(ctx, sk.pivot[0], sk.pivot[1], 12, '#fff0c0', 0.35 * (q.glow ?? 0));
    if (fm.t >= 0 && fm.t < 0.45) {
      const u = fm.t / 0.45;
      const back = [-sk.fwd[0], -sk.fwd[1]];
      const p0 = sk.pivot;
      const L = 30 * (1 - u * 0.6);
      const g = ctx.createLinearGradient(p0[0], p0[1], p0[0] + back[0] * L, p0[1] + back[1] * L);
      g.addColorStop(0, `rgba(255,244,214,${0.75 * (1 - u)})`);
      g.addColorStop(1, 'rgba(232,226,255,0)');
      ctx.save();
      ctx.beginPath();
      const nn = [-back[1], back[0]];
      ctx.moveTo(p0[0] + nn[0] * 5, p0[1] + nn[1] * 5);
      ctx.lineTo(p0[0] + back[0] * L, p0[1] + back[1] * L);
      ctx.lineTo(p0[0] - nn[0] * 5, p0[1] - nn[1] * 5);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 3; i++) sparkle(ctx, p0[0] + back[0] * (8 + i * 7), p0[1] + back[1] * (8 + i * 7) + (i - 1) * 2, 1.4 * (1 - u), 1, i % 2 ? '#ffffff' : STAR[1]);
    }
  }
  if (fm?.mv === MOVES.hurt) {
    const u = clamp(fm.t / 0.6, 0, 1);
    for (let i = 0; i < 3; i++) glassBubble(ctx, sk.pivot[0] - 4 + i * 4 - u * 3, sk.pivot[1] - 6 - u * 8 - i * 2, 0.7 + i * 0.2, 1 - u);
  }
  if ((q.beamS ?? -1) >= 0 && q.beamS < 0.9) sparkle(ctx, top[0] + 4, top[1] - q.beamS * 6, 1.8 * Math.sin(Math.PI * q.beamS / 0.9), 1, STAR[1]);
  if ((q.sweat ?? -1) >= 0) {
    const p = sk.inHead(-5.4, -5);
    sweat(ctx, p[0], p[1] + (q.sweat % 1) * 3, 1, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      glassBubble(ctx, top[0] + 3 + f * 5, top[1] - f * 9, 0.6 + f * 0.6, q.zz * Math.sin(Math.PI * f));
      ctx.save();
      ctx.globalAlpha *= q.zz * Math.sin(Math.PI * f);
      cue(ctx, 'z', top[0] + 3 + f * 5, top[1] - f * 9, 1.8 + f, a.flip ? -1 : 1, 0.1, '#9a7aa8', '#fffaf6');
      ctx.restore();
    }
  }
  const [bx, by] = [top[0] + 1, top[1] - 6];
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const look = {
  P: {
    scale: 1,
    // (a plump fancy goldfish: a round deep belly, a short body, a short tail stock to the long veil)
    spine: [[10.6, 0.6, 6.8, 6.6], [6.6, -0.2, 10.2, 10.2], [1.6, -0.6, 11.2, 11.4], [-3.4, -0.4, 10.2, 10.4], [-7.4, 0, 7.4, 7.2], [-10.6, 0.3, 4.4, 4.2], [-12.6, 0.2, 2.8, 2.6]],
    pivot: 2,
    nose: 2.8,
    pec: { at: [6.4, -5.6], len: 5, w: 3.4, ang: 146, scull: 20, tuck: 170, out: 104 },
    sail: { s0: 5, s1: 15.5, h: 7, prof: [0.84, 1.0, 0.96, 0.82, 0.62, 0.42], up: 6, fan: 16, flat: 76, foldLen: 0.42, flutter: 7, inset: 1.6, scallop: 0.05 },
    tail: { kind: 'veil', len: 26, w: 2.6, spread: 18, notch: 0.6, seg: [0.3, 0.35, 0.35], w4: [1.8, 3.9, 5.2, 3.9], droop: 8, curl: 9 },
    swim: { amp: 12, fin: 1.7, lag: 0.8, beats: 1.6, idle: 0.42, scull: 0.8, paddle: 20, recoil: 3, bob: 0.8, flutter: 6 },
    speed: 26,
    lean: 1,
    swimFins: -0.1,
    turn: [0.16, 0.5, 30],
    float: 4,
    playful: 0,
    moves: POOL,
  },
  C,
  CF,
  CS: CF,
  CV,
  veilGlow: '#fff2b8',
  veilPaint,
  inks: { body: [INK, INK], fin: FIN_INK, sail: FIN_INK },
  ink: INK,
  fxC: { fill: 'rgba(240,236,255,0.4)', edge: '#c8bee8', glint: '#ffffff', spark: '#f2c870' },
  moves: MOVES,
  pleased: 'beam',
  bodyFill,
  face,
  pose,
  fx,
};

export const COMET_GOLDFISH = dressedGoldfish(look);
// (`noHop`: none of the monster drawer's hops or idle notes over it; `ownEmotes`: its marks its own)
COMET_GOLDFISH.art.noHop = true;
COMET_GOLDFISH.art.ownEmotes = true;
export const COMET_GOLDFISH_ART = COMET_GOLDFISH.art;
export const COMET_GOLDFISH_SIZE = { w: 32, h: Math.round(COMET_GOLDFISH.h), speed: COMET_GOLDFISH.speed };
