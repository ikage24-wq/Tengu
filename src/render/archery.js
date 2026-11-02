// The archers' effects, in Tengu's own effect art (tools/fx-art.js, the `cel*` strips), matched to
// the sprites like every other effect (CLAUDE.md). The Archer's are warm gold and sky blue: gold
// arrows trailing sky-blue streaks, bursts of gold feathers, and a great falcon of light. The
// Ranger's are emerald wind:
// curls of wind spinning, gusts of leaves, a wind spirit, a tornado, rings of wind. The Sniper's
// are ice blue and rose: a lens of light tearing through each monster a bolt pierces, sparks off
// the crossbow, snowflakes and a frost burst, a puffy blast, and a rose sight for the Deadeye.
// Code draws only the small supporting parts: the arrow and bolt shafts and the sight's ticks.
//
// Shots draw at their head (x, y) flying along `dir`; the rest are drawn from progress `p` (0-1)
// and a seed, at a monster's feet for per-target effects and the bow hand for muzzle bursts.

import { SCHOOL_COLORS } from './spells.js';
import { shock, wash, easeOut, deep, inked } from './fxkit.js';
import { fxSprite } from './fx-sprites.js';
import { groundRing, lightPillar, debris } from './warrior-fx.js';

const TAU = Math.PI * 2;
const FOCUS = SCHOOL_COLORS.focus;
const GALE = SCHOOL_COLORS.wind;
const HAWK = SCHOOL_COLORS.hawk;
const STORM = SCHOOL_COLORS.storm;
// The Sniper's sight.
export const SIGHT = '#ff5a7a';
const INK = '#3a2d4f';
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// An arrow (or bolt) along +x with its head at (0, 0): shaft, head, fletching. `bolt` makes it
// short and thick with fins.
function shaft(ctx, len, w, head, fletch, bolt = false) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.strokeStyle = bolt ? '#8a7aa0' : '#c89a6a';
  ctx.lineWidth = w;
  ctx.stroke();
  const hw = bolt ? w * 1.9 : w * 1.6;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(hw * 2.4 + 1, 0);
  ctx.lineTo(-1, -hw - 1);
  ctx.lineTo(-1, hw + 1);
  ctx.fill();
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.moveTo(hw * 2.4, 0);
  ctx.lineTo(0, -hw);
  ctx.lineTo(0, hw);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, -hw * 0.5, hw * 1.1, Math.max(0.6, hw * 0.3));
  ctx.fillStyle = fletch;
  if (bolt) {
    ctx.beginPath();
    ctx.moveTo(-len + 1, 0);
    ctx.lineTo(-len - 2, -w * 2.2);
    ctx.lineTo(-len + w * 3, 0);
    ctx.lineTo(-len - 2, w * 2.2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-len, -w - 2, 5, 2);
    ctx.fillRect(-len, w, 5, 2);
  }
}


// A straight streak of glowing plasma from (x0, y0) to (x1, y1), `w` wide: the body of one of the
// Stormcaller's bolts in flight (no outline, the way her lightning is drawn).
function plasmaStreak(ctx, x0, y0, x1, y1, w) {
  ctx.save();
  ctx.lineCap = 'round';
  const a0 = ctx.globalAlpha;
  for (const [k, colour, a] of [[6, STORM.deep, 0.18], [3.2, STORM.main, 0.6], [1.7, STORM.light, 0.95], [0.8, '#ffffff', 1]]) {
    ctx.globalAlpha = a0 * a;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(0.8, w * k);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();
}

// A crackle of lightning from (x0, y0) to (x1, y1) (the Stormcaller's Crackle style): two thin
// fractal strands of plasma twisting round each other, struck afresh many times a second (`seed`
// and `time`); `kink` is how far it wanders.
export function zigzag(ctx, x0, y0, x1, y1, time, seed = 0, w = 2, kink = 7) {
  // Re-struck 18 times a second: each beat is a fresh channel, so it crackles.
  const beat = Math.floor(time * 18);
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const depth = Math.max(2, Math.min(6, Math.round(Math.log2(len / 5))));
  const rough = Math.min(0.55, (kink * 2.4) / len);
  // A jagged channel by midpoint displacement: kinks at every scale, like real lightning.
  const channel = (k) => {
    let pts = [[x0, y0], [x1, y1]];
    let n = 0;
    for (let d = 0; d < depth; d++) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        const l = Math.hypot(bx - ax, by - ay) || 1;
        const off = (rand(seed * 97 + beat * 13 + k * 389 + n++) - 0.5) * l * rough;
        out.push([(ax + bx) / 2 - ((by - ay) / l) * off, (ay + by) / 2 + ((bx - ax) / l) * off], [bx, by]);
      }
      pts = out;
    }
    return pts;
  };
  const line = (pts, width, colour, alpha) => {
    ctx.globalAlpha = a0 * alpha;
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  };
  ctx.save();
  const a0 = ctx.globalAlpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Plasma, the way the strips draw it (tools/fx-art.js crackle): a faint halo, a violet body and a
  // white-hot core, no outline; a fainter second strand twisting round the first.
  for (const [k, ww, a] of [[1, w * 0.5, 0.7], [0, w, 1]]) {
    const pts = channel(k);
    line(pts, ww * 3.6, STORM.deep, 0.18 * a);
    line(pts, ww * 2, STORM.main, 0.6 * a);
    line(pts, ww * 1, STORM.light, 0.95 * a);
    line(pts, Math.max(0.6, ww * 0.45), '#ffffff', a);
  }
  ctx.restore();
}

// ---------- Shots ----------


// ---------- Shots ----------

export function drawArcheryShot(ctx, f, x, y, dir, time) {
  const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
  const u = f.dur ? Math.min(1, f.t / f.dur) : 0;
  const along = (d) => [x - Math.cos(ang) * d, y - Math.sin(ang) * d];
  switch (f.shot) {
    case 'ptarrow': case 'ptbig': case 'ptcard': case 'ptdove': {
      // The Phantom Trickster's: a plum arrow trailing smoke, her big one with card suits tumbling
      // behind, a spinning playing card, and a silver dove flapping along (always right way up).
      const nose = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(nose) < 0;
      const name = { ptarrow: 'celptarrow', ptbig: 'celptbig', ptcard: 'celptcard', ptdove: 'celptdove' }[f.shot];
      const upright = f.shot === 'ptcard' || f.shot === 'ptdove';
      fxSprite(ctx, name, x, y, { t: time + (f.seed ?? 0), flip: left, rot: upright ? 0 : left ? nose + Math.PI : nose, scale: { ptarrow: 0.5, ptbig: 0.62, ptcard: 0.32, ptdove: 0.4 }[f.shot] * (f.split ? 0.85 : 1) });
      return true;
    }
    case 'acarrow': case 'acbig': {
      // The Acrobat Archer's: a gold arrow trailing a curling mint ribbon, and her big one wrapped in
      // two; under Showtime the extra arrows are a little smaller.
      const nose = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(nose) < 0;
      fxSprite(ctx, f.shot === 'acarrow' ? 'celacarrow' : 'celacbig', x, y, { t: time + (f.seed ?? 0), flip: left, rot: left ? nose + Math.PI : nose, scale: (f.shot === 'acarrow' ? 0.5 : 0.62) * (f.split ? 0.85 : 1) });
      return true;
    }
    case 'hawkarrow': {
      // A gold arrow trailing sky-blue streaks. Under Hawkeye it bends as it homes in.
      const bend = (f.bend ?? 0) * Math.sin(Math.PI * u);
      const hx = x - Math.sin(ang) * bend;
      const hy = y + Math.cos(ang) * bend;
      // Bent into an arc (a lob), it points along its path: nose up as it climbs, down as it drops.
      const along = Math.hypot(f.tx - f.x, f.ty - f.y) || 1;
      const nose = ang + Math.atan(((f.bend ?? 0) * Math.PI * Math.cos(Math.PI * u)) / along);
      const [tx, ty] = [hx - Math.cos(nose) * 22, hy - Math.sin(nose) * 22];
      fxSprite(ctx, 'celhawktrail', tx, ty, { t: time + (f.seed ?? 0), rot: nose, scale: 0.45 });
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(nose);
      if (u < 0.15) ctx.rotate(Math.sin(u * 120) * 0.08 * (1 - u / 0.15));
      shaft(ctx, 20, 1.7, HAWK.light, HAWK.main);
      ctx.restore();
      return true;
    }
    case 'hawkbig': {
      // A skill's heavy gold arrow, drawn big: a long sky-blue trail and feathers torn off behind.
      const bend = (f.bend ?? 0) * Math.sin(Math.PI * u);
      const hx = x - Math.sin(ang) * bend;
      const hy = y + Math.cos(ang) * bend;
      const [tx, ty] = [hx - Math.cos(ang) * 34, hy - Math.sin(ang) * 34];
      fxSprite(ctx, 'celhawktrail', tx, ty, { t: time + (f.seed ?? 0), rot: ang, scale: 0.75 });
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(ang);
      shaft(ctx, 30, 3, '#ffffff', HAWK.main);
      ctx.restore();
      return true;
    }
    case 'falcon': {
      // Falcon Dive: the great falcon of light itself, beating its wings as it dives through the
      // line, a long trail of sky-blue streaks and feathers behind it.
      const flip = Math.cos(ang) < 0;
      const tilt = flip ? Math.atan2(-(f.ty - f.y), -(f.tx - f.x)) : ang;
      const [tx, ty] = along(90);
      fxSprite(ctx, 'celhawktrail', tx, ty, { t: time, rot: ang, scale: 0.9 });
      fxSprite(ctx, 'celfeathers', tx, ty, { t: (time * 1.4) % 0.44, flip, scale: 0.8 });
      fxSprite(ctx, 'celfalcon', x - Math.cos(ang) * 30, y - Math.sin(ang) * 30, { t: time * 1.6, flip, rot: tilt * (flip ? -1 : 1), scale: 1 });
      return true;
    }
    case 'featherwake': {
      // The falcon's wake: a storm of gold feathers streaming along its line.
      for (let i = 0; i < 3; i++) {
        const [tx, ty] = along(10 + i * 50);
        fxSprite(ctx, 'celfeathers', tx, ty + (i % 2 ? 10 : -10), { t: (time * 1.3 + i * 0.13) % 0.44, flip: dir < 0, scale: 0.8 - i * 0.15 });
      }
      return true;
    }
    case 'windarrow': {
      // An arrow riding a spin of wind: the swirl turns round its tail as it flies.
      const [tx, ty] = along(12);
      fxSprite(ctx, 'celwindspin', tx, ty, { t: time + (f.seed ?? 0), rot: ang, scale: 0.32, sy: 0.7 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // The archer's paradox: a hero arrow shivers for its first moments of flight (archery.md 5).
      if (u < 0.15) ctx.rotate(Math.sin(u * 120) * 0.08 * (1 - u / 0.15));
      shaft(ctx, 20, 1.7, '#ffffff', GALE.main);
      ctx.restore();
      return true;
    }
    case 'galearrow': {
      // A skill arrow, drawn big (MapleStory's skill arrows run 1.5-3x the hero; archery.md 10):
      // two spins of wind wrapped along it and a gust of leaves torn off behind.
      for (let i = 0; i < 3; i++) {
        const [tx, ty] = along(8 + i * 16);
        fxSprite(ctx, 'celwindspin', tx, ty, { t: time * (1 + i * 0.2) + i * 0.3, rot: ang, scale: 0.6 - i * 0.12, sy: 0.75 });
      }
      const [gx, gy] = along(30);
      fxSprite(ctx, 'celleaves', gx, gy + 6, { t: (time * 1.5) % 0.45, flip: dir < 0, scale: 0.55 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 32, 3, '#ffffff', GALE.deep);
      ctx.restore();
      return true;
    }
    case 'cyclone': {
      // A tornado on the ground line twice her height (bands of wind stacked into a funnel, leaves
      // caught up in it), dust kicked up at its foot, and the arrow at its heart.
      const grow = easeOut(Math.min(1, u * 4));
      const foot = y + 22;
      fxSprite(ctx, 'celtornado', x, foot, { t: time, scale: 0.7 * grow });
      fxSprite(ctx, 'celdust', x - dir * 6, foot, { t: (time * 1.2) % 0.35, scale: 0.7 * grow, flip: dir < 0 });
      ctx.save();
      ctx.translate(x, y - 20);
      ctx.rotate(ang);
      shaft(ctx, 20, 2.2, '#ffffff', GALE.main);
      ctx.restore();
      return true;
    }
    case 'wisp': {
      // A wind spirit from a full Gale: a little wind orb with a curly tail, swooping out on a curve
      // and homing in (Wind Archer's Trifling Wind; archery.md 23).
      const bend = (f.bend ?? 30) * Math.sin(Math.PI * u);
      const hx = x - Math.sin(ang) * bend;
      const hy = y + Math.cos(ang) * bend;
      fxSprite(ctx, 'celwisp', hx, hy, { t: time, rot: ang, scale: 0.5 });
      return true;
    }
    case 'heavybolt': {
      // A crossbow bolt, drawn big enough to follow (a steel head, a thick shaft, fins); no streak
      // behind it (a line read as a laser, not a bolt).
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 24, 2.6, '#eef4ff', FOCUS.main, true);
      ctx.restore();
      return true;
    }
    case 'blastbolt': {
      // A bolt with a charge in its head: lines of light rushing into a swelling diamond.
      fxSprite(ctx, 'celchargegold', x + dir * 6, y, { t: time, scale: 0.4 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 26, 2.8, '#ffd27a', FOCUS.main, true);
      ctx.restore();
      return true;
    }
    case 'frostbolt': {
      // A bolt with a snowflake spinning at its head.
      fxSprite(ctx, 'celsnowflake', x + dir * 6, y, { t: time, scale: 0.4 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 24, 2.6, '#bff0ff', '#3f9fd8', true);
      ctx.restore();
      return true;
    }
    case 'ballista': {
      // A huge bolt pushing rings of force ahead of it.
      fxSprite(ctx, 'celring', x + dir * 12, y, { t: (time * 2) % 0.25, scale: 0.4, sx: 0.4 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 36, 4, '#ffffff', SIGHT, true);
      ctx.restore();
      return true;
    }
    case 'heartbolt': {
      // Heartseeker: one giant bolt (twice a ballista's size), rose rings of force pushed ahead of
      // it; no beam (it should read as a bolt, not a laser).
      fxSprite(ctx, 'celringsight', x + dir * 18, y, { t: (time * 2.5) % 0.25, scale: 0.6, sx: 0.4 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 52, 5, '#ffffff', SIGHT, true);
      ctx.restore();
      return true;
    }
    default:
      return false;
  }
}

// One falling arrow of a wind rain (Storm Volley).
// One gold arrow of the Archer's Arrow Rain, falling.
export function hawkRainPiece(ctx, x, y, s, time) {
  const ang = Math.atan2(2.6, 1);
  fxSprite(ctx, 'celhawktrail', x - Math.cos(ang) * 16 * s, y - Math.sin(ang) * 16 * s, { t: time, rot: ang, scale: 0.4 * s });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  shaft(ctx, 16 * s, 1.6, HAWK.light, HAWK.main);
  ctx.restore();
}

export function windRainPiece(ctx, x, y, s, time) {
  const a = Math.atan2(2.6, 1);
  fxSprite(ctx, 'celwindspin', x - Math.cos(a) * 12 * s, y - Math.sin(a) * 12 * s, { t: time, rot: a, scale: 0.3 * s, sy: 0.7 });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  shaft(ctx, 18 * s, 1.7 * s, '#ffffff', GALE.main);
  ctx.restore();
}

// ---------- Hits, bursts, and sights ----------

export function drawArchery(ctx, f, x, y, p, cam, time) {
  const flip = (f.dir || 1) < 0;
  switch (f.kind) {
    case 'pthit':
      // The Phantom Trickster's arrow landing: a silver flash, a puff of plum smoke, three cards.
      return fxSprite(ctx, 'celpthit', x, y - (f.h ?? 24) / 2, { p, flip, scale: f.big || f.crit ? 0.6 : 0.44 }) || true;
    case 'ptsmoke':
      // A puff of her stage smoke (vanishing, appearing, a copy popping, Smoke Bomb).
      return fxSprite(ctx, 'celptsmoke', x, y + 4, { p, scale: f.small ? 0.35 : 0.7 }) || true;
    case 'ptillusion':
      // Grand Illusion: the great ring of stage smoke, cards fluttering down through it.
      return fxSprite(ctx, 'celptillusion', x, y + 4, { p, scale: 1 }) || true;
    case 'achit': {
      // The Acrobat Archer's arrow landing: a gold star popping in a loop of mint ribbon, then
      // confetti; heavy shots are bigger.
      return fxSprite(ctx, 'celachit', x, y - (f.h ?? 24) / 2, { p, flip, scale: f.big || f.crit ? 0.6 : 0.44 }) || true;
    }
    case 'acfirework':
      // Firework Arrow going off.
      return fxSprite(ctx, 'celacfirework', x, y - (f.h ?? 24) / 2, { p, scale: 0.6 }) || true;
    case 'acburst':
      // Grand Somersault: the gold ring of arrows bursting round her at the top of her leap.
      return fxSprite(ctx, 'celacburst', x, y - 72, { p, scale: 0.7 }) || true;
    case 'hawkhit': {
      // An Archer's arrow landing: a gold star pops with a sky-blue swoosh across it and gold
      // feathers burst off; heavy shots and crits add a gold ring racing out along the ground.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celhawkhit', x, cy, { p, flip, scale: big ? 0.95 : 0.7 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.5 });
      if (big) groundRing(ctx, 'celringhawk', x, y, p, 50);
      return true;
    }
    case 'feathers': {
      // A gust of gold feathers off the bow.
      fxSprite(ctx, 'celfeathers', x + (f.dir || 1) * 6, y, { p, flip, scale: 0.7 });
      return true;
    }
    case 'falconcall': {
      // Falcon Dive begins: a pillar of gold light with the hawk emblem, a ring racing out, and the
      // falcon wheeling high above, gathering.
      lightPillar(ctx, 'celpillarhawk', x, y, Math.min(1, p * 1.2), 120);
      groundRing(ctx, 'celringhawk', x, y, Math.min(1, p * 1.4), 70);
      if (p > 0.1) fxSprite(ctx, 'celembhawk', x, y - 62 - 14 * Math.min(1, p * 2), { p: (p - 0.1) / 0.9, scale: 0.55 });
      const a = time * 4;
      const k = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      fxSprite(ctx, 'celfalcon', x + Math.cos(a) * 46, y - 112 + Math.sin(a) * 10, { t: time * 1.5, flip: Math.sin(a) > 0, scale: 0.5 * k, alpha: k });
      return true;
    }
    case 'falconloose': {
      // The falcon leaves the bow: a gold ring of force breaks out and feathers burst.
      fxSprite(ctx, 'celringhawk', x + (f.dir || 1) * 10, y, { p, scale: 0.9, sx: 0.5 });
      fxSprite(ctx, 'celfeathers', x + (f.dir || 1) * 8, y, { p, flip, scale: 1 });
      fxSprite(ctx, 'celdust', x - (f.dir || 1) * 18, y + 16, { p, flip: !flip, scale: 0.8 });
      return true;
    }
    case 'falconhit': {
      // The falcon tearing through a monster: a big gold burst of feathers and a ring.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'celhawkhit', x, cy, { p, flip, scale: 1.25 });
      fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.6 });
      groundRing(ctx, 'celringhawk', x, y, p, 70);
      return true;
    }
    case 'galehit': {
      // A Ranger's arrow landing: a curl of wind cuts across the target and leaves burst off it;
      // heavy shots and crits add a ring of wind racing out along the ground.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celwindhit', x, cy, { p, flip, scale: big ? 0.95 : 0.7 });
      if (big) groundRing(ctx, 'celringwind', x, y, p, 50);
      return true;
    }
    case 'focushit': {
      // A Sniper's bolt tearing through: a lens of light along the shot with a ring round it, a
      // star burst on crits. Each monster a bolt passes through lands a little bigger than the last
      // (Piercing Arrow).
      const cy = y - (f.h ?? 24) / 2;
      const grow = 1 + 0.1 * Math.min(6, f.rank ?? 0);
      fxSprite(ctx, 'celboltburst', x, cy, { p, flip, scale: 0.65 * grow });
      if (f.big || f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.5 * grow });
      return true;
    }
    case 'trap': {
      // (The Acrobat Archer's springboard, bobbing on its spring.)
      if (f.look === 'spring') {
        const a2 = Math.min(1, f.t / 0.15) * Math.min(1, (f.dur - f.t) / 0.4);
        return fxSprite(ctx, 'celacspring', x, y + 2, { frame: Math.floor(time * 8) % 4, scale: 0.4, alpha: a2 }) || true;
      }
      // Spring Trap, armed on the ground (it fades in as it's set, and out as it rusts away).
      const a = Math.min(1, f.t / 0.15) * Math.min(1, (f.dur - f.t) / 0.4);
      fxSprite(ctx, 'celtrap', x, y, { t: time, scale: 0.6, alpha: a });
      return true;
    }
    case 'trapsnap': {
      if (f.look === 'spring') return fxSprite(ctx, 'celacspring', x, y + 2, { frame: 4 + Math.min(3, Math.floor(p * 4)), scale: 0.4 }) || true;
      // The trap snapping shut on a monster, sparks and dust flying.
      fxSprite(ctx, 'celtrapsnap', x, y, { p, scale: 0.7 });
      return true;
    }
    case 'zap': {
      // A small zap: a jump of chain lightning or charged ground biting a monster.
      fxSprite(ctx, 'celstormhit', x, y - (f.h ?? 24) / 2, { p, flip, scale: 0.42 });
      return true;
    }
    case 'cometfall': {
      // Comet Arrow falling: the flaming arrow streaks from high over her down into the ground ahead
      // (the first quarter of its life), its fire trail pointing back up the way it came.
      const k = Math.min(1, p / 0.26);
      if (k >= 1) return true;
      const dir = f.dir || 1;
      const x0 = x - dir * 6;
      const y0 = y - 88;
      const x1 = x + dir * 126;
      const e = k * k;
      const ang = Math.atan2(y - y0, x1 - x0);
      fxSprite(ctx, 'celcomet', x0 + (x1 - x0) * e, y0 + (y - y0) * e, { t: time, scale: 0.75, rot: ang - Math.PI / 2 });
      return true;
    }
    case 'cometimpact': {
      // Where the comet hits: a huge burst of fire and cloud, gold rock thrust up, a gold ring.
      fxSprite(ctx, 'celblast', x, y, { p, scale: 1.8 });
      debris(ctx, x, y, p, 170, 'hawk');
      groundRing(ctx, 'celringhawk', x, y, p, 150);
      return true;
    }
    case 'cometwave': {
      // The shockwave racing out both ways along the ground, dust thrown up behind it.
      groundRing(ctx, 'celringhawk', x, y, p, 250);
      groundRing(ctx, 'celringhawk', x, y, Math.min(1, p * 1.4), 150);
      for (const sd of [-1, 1]) fxSprite(ctx, 'celdust', x + sd * 160 * Math.min(1, p * 1.6), y + 2, { p, flip: sd < 0, scale: 1 });
      return true;
    }
    case 'galeblast': {
      // The Beastmaster's blast arrow: a gale bursting out of it, curls of wind and leaves flung
      // every way, and a ring of wind racing out.
      fxSprite(ctx, 'celgaleblast', x, y, { p, scale: 0.8 });
      groundRing(ctx, 'celringwind', x, y + 14, p, 60);
      return true;
    }
    case 'blast': {
      // A blast bolt bursting: a soft star of fire, puffs of cloud billowing out and breaking up.
      fxSprite(ctx, 'celblast', x, y, { p, scale: 0.85 });
      return true;
    }
    case 'frostburst': {
      // A frost bolt shattering: a great snowflake bursts open over an icy ring, then breaks into
      // ice beads and little flakes.
      fxSprite(ctx, 'celfrostburst', x, y - (f.h ?? 24) / 2, { p, scale: 0.8 });
      groundRing(ctx, 'celringice', x, y, p, 60);
      return true;
    }
    case 'frostshard': {
      fxSprite(ctx, 'celsnowflake', x, y - (f.h ?? 24) / 2, { t: time, scale: 0.4, alpha: 1 - p });
      return true;
    }
    case 'gust': {
      // A gust of leaves off the bow as a big arrow goes.
      fxSprite(ctx, 'celleaves', x + (f.dir || 1) * 14, y + 6, { p, flip, scale: 0.6 });
      return true;
    }
    case 'boltshock': {
      // A heavy bolt's kick: sparks off the crossbow and dust off her heels.
      fxSprite(ctx, 'celboltspark', x + (f.dir || 1) * 6, y, { p, flip, scale: f.small ? 0.45 : 0.7 });
      if (!f.small) fxSprite(ctx, 'celdust', x - (f.dir || 1) * 14, y + 16, { p, flip: !flip, scale: 0.55 });
      return true;
    }
    case 'heartshock': {
      // Heartseeker's release: a rose ring of force breaking out from the bow, sparks, and a skid
      // of dust as she's shoved back.
      fxSprite(ctx, 'celringsight', x + (f.dir || 1) * 10, y, { p, scale: 0.9, sx: 0.5 });
      fxSprite(ctx, 'celboltspark', x + (f.dir || 1) * 10, y, { p, flip, scale: 1 });
      fxSprite(ctx, 'celdust', x - (f.dir || 1) * 18, y + 16, { p, flip: !flip, scale: 0.8 });
      return true;
    }
    case 'galeburst': {
      // Storm Volley's lift-off: a ring of wind racing out from her feet, gusts of leaves blown up
      // either side, and wind spinning up around her.
      groundRing(ctx, 'celringwind', x, y, p, 70);
      fxSprite(ctx, 'celleaves', x - 10, y - 10, { p, flip: true, scale: 0.75 });
      fxSprite(ctx, 'celleaves', x + 10, y - 10, { p, scale: 0.75 });
      for (let i = 0; i < 3; i++) fxSprite(ctx, 'celwindspin', x, y - 8 - p * 40 - i * 14, { t: time + i * 0.2, scale: 0.5 + i * 0.15, sy: 0.4, alpha: 1 - p });
      return true;
    }
    case 'stormburst': {
      // The dive landing: rings of wind blasting out along the ground, gusts of leaves thrown both
      // ways, dust kicked up, and wind spinning out wide.
      groundRing(ctx, 'celringwind', x, y, p, 140);
      groundRing(ctx, 'celringwind', x, y, Math.min(1, p * 1.4), 80);
      for (const sd of [-1, 1]) {
        fxSprite(ctx, 'celleaves', x + sd * 30, y - 12, { p, flip: sd < 0, scale: 1 });
        fxSprite(ctx, 'celdust', x + sd * 40, y + 2, { p, flip: sd < 0, scale: 0.9 });
      }
      fxSprite(ctx, 'celwindspin', x, y - 16, { t: time, scale: 1.4 * (0.6 + 0.4 * p), sy: 0.3, alpha: 1 - p });
      return true;
    }
    case 'reticle': {
      // A sight locking on: four ticks and a broken ring that close in and turn, going from
      // blue to rose as it locks, a tiny diamond at the heart, and a snap pulse once locked.
      const m = f.mob;
      const mx = m ? m.x - cam.x : x;
      const my = (m ? m.y - (m.air ?? 0) - cam.y : y) - (f.h ?? 24) / 2;
      if (m && m.hp <= 0 && p < 0.9) return true;
      const lock = Math.min(1, p / 0.85);
      const r = 30 - 18 * easeOut(lock);
      const color = lock >= 1 ? SIGHT : lock > 0.6 ? '#ff9ab8' : FOCUS.main;
      ctx.save();
      ctx.globalAlpha = p < 0.1 ? p / 0.1 : 1;
      ctx.translate(mx, my);
      ctx.rotate((1 - easeOut(lock)) * 1.6);
      const line = (w, c) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, r, (i / 4) * TAU + 0.25, ((i + 1) / 4) * TAU - 0.25);
          ctx.stroke();
          const a = (i / 4) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
          ctx.lineTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6));
          ctx.stroke();
        }
      };
      if (inked(ctx)) line(3.2, deep(color));
      line(1.6, color);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -2.4);
      ctx.lineTo(2.4, 0);
      ctx.lineTo(0, 2.4);
      ctx.lineTo(-2.4, 0);
      ctx.fill();
      ctx.restore();
      if (lock >= 1) shock(ctx, mx, my, r + 10 * easeOut((p - 0.85) / 0.15), r + 10 * easeOut((p - 0.85) / 0.15), 2 * (1 - (p - 0.85) / 0.15), SIGHT);
      return true;
    }
    case 'aimdim': {
      // The world dims while a sight locks on, so the rose sights are the brightest thing there
      // (Red Dead's Dead Eye; research/archery.md 27).
      const a = Math.min(1, p / 0.15) * (p > 0.8 ? (1 - p) / 0.2 : 1);
      ctx.globalAlpha = 0.32 * a;
      ctx.fillStyle = '#1a1440';
      wash(ctx);
      ctx.globalAlpha = 1;
      return true;
    }
    case 'chargeglow': {
      // A bolt charging as the crank winds: lines of light rushing in to the bolt's tip.
      fxSprite(ctx, 'celcharge', x + (f.dir || 1) * 6, y, { t: f.t, scale: 0.5, alpha: p < 0.15 ? p / 0.15 : 1 });
      return true;
    }
    case 'windtrail': {
      // The path a gale shot tore through the air: curls of wind left hanging along it, fading,
      // and a gust of leaves drifting out of the middle.
      const tx = f.tx - cam.x;
      const ty = f.ty - cam.y;
      const ang = Math.atan2(ty - y, tx - x);
      const n = Math.max(2, Math.round(Math.hypot(tx - x, ty - y) / 40));
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n;
        if (k > Math.min(1, p / 0.15)) break;
        fxSprite(ctx, 'celwindspin', x + (tx - x) * k, y + (ty - y) * k - p * 10, { t: time + i * 0.13, rot: ang, scale: f.big ? 0.5 : 0.38, sy: 0.6, alpha: 1 - p });
      }
      fxSprite(ctx, 'celleaves', (x + tx) / 2, (y + ty) / 2 + 6, { p, flip: tx < x, scale: 0.6 });
      return true;
    }
    case 'windstep': {
      // Tailwind at her heels: a puff of dust and a gust of leaves peeling off behind her.
      fxSprite(ctx, 'celdust', x - (f.dir || 1) * 10, y + 2, { p, flip: !flip, scale: 0.5 });
      fxSprite(ctx, 'celleaves', x - (f.dir || 1) * 14, y - 6, { p, flip: !flip, scale: 0.45 });
      return true;
    }
    case 'stormsky': {
      // Storm Volley's sky: a green storm cast over the whole view, and gusts of leaves blown
      // across it while the arrows pour down (the rain itself is drawn by 'rain').
      const a = Math.min(1, p / 0.12) * (p > 0.8 ? (1 - p) / 0.2 : 1);
      ctx.globalAlpha = 0.22 * a;
      ctx.fillStyle = '#0f6a5a';
      wash(ctx);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 6; i++) {
        const u = (p * 2 + rand(i * 2.7)) % 1;
        fxSprite(ctx, 'celleaves', -60 + u * 760, 40 + rand(i * 5.3) * 220, { p: (u * 1.3) % 1, scale: 0.9, alpha: a });
      }
      return true;
    }
    case 'deadeye': {
      // A Deadeye: a rose sight snapping shut round the bow with a star of light inside it, and a
      // rose ring blowing out.
      fxSprite(ctx, 'celdeadeye', x, y, { p, scale: 0.75 });
      fxSprite(ctx, 'celringsight', x, y, { p, scale: 0.9 });
      return true;
    }
    default:
      return false;
  }
}
