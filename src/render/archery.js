// The archer paths' effects. The Ranger's are the wind's shape language: rounded swirls, ribbons
// and leaves that flow and curl, green and white (fx research C14: rounded, flowing, trails that
// start fast then slow). The Sniper's are the opposite: hard straight lines, sharp glints, a rose
// sight, and heavy kicks; frost bolts that shatter into shards, and blasts that flash, swell, and
// break up into smoke (fx research C12, C17: a blast is a sequence, not one orange disc).
//
// Shots draw at their head (x, y) flying along `dir`; the rest are drawn from progress `p` (0-1)
// and a seed, at a monster's feet for per-target effects and the bow hand for muzzle bursts.

import { SCHOOL_COLORS } from './spells.js';
import { needle, starFlash, shardRing, crescent, shock, puff, crown, wisp, wash, easeOut, easeIn, deep, inked } from './fxkit.js';

const TAU = Math.PI * 2;
const WIND = SCHOOL_COLORS.wind;
const FOCUS = SCHOOL_COLORS.focus;
const ICE = SCHOOL_COLORS.ice;
// The Sniper's sight, and the hot core of a blast.
export const SIGHT = '#ff5a7a';
const BLAST = { main: '#ff8a3c', light: '#ffe9a8', deep: '#e0442b', smoke: '#e8dcef', shadow: '#a898c0' };
const INK = '#3a2d4f';
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function glow(ctx, x, y, r, color, a) {
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// A leaf, pointed both ends, turned by `rot`.
function leaf(ctx, x, y, r, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(0, -r * 0.7, r, 0);
  ctx.quadraticCurveTo(0, r * 0.7, -r, 0);
  ctx.fill();
  ctx.restore();
}

// A tapering ribbon along points (each [x, y]), widest at the head (the last point), stepping
// white, main, deep from head to tail (fx research D: trails step colour instead of fading).
function ribbon(ctx, pts, w, c) {
  if (pts.length < 2) return;
  const band = (k, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const n = pts.length;
    const side = (i, s) => {
      const [x0, y0] = pts[Math.max(0, i - 1)];
      const [x1, y1] = pts[Math.min(n - 1, i + 1)];
      const l = Math.hypot(x1 - x0, y1 - y0) || 1;
      const ww = (w * k * (i / (n - 1))) / 2;
      return [pts[i][0] - ((y1 - y0) / l) * ww * s, pts[i][1] + ((x1 - x0) / l) * ww * s];
    };
    for (let i = 0; i < n; i++) ctx.lineTo(...side(i, 1));
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(...side(i, -1));
    ctx.closePath();
    ctx.fill();
  };
  band(1, c.deep);
  band(0.7, c.main);
  band(0.3, '#ffffff');
}

// An arrow (or bolt) along angle `a` with its head at (0, 0) after translating: shaft, head,
// fletching. `bolt` makes it short and thick with fins.
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

// A hard streak behind a bolt: a straight wedge from nothing to full at the head.
function streak(ctx, len, w, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(0, -w / 2);
  ctx.lineTo(0, w / 2);
  ctx.closePath();
  ctx.fill();
}

// ---------- Shots ----------

export function drawArcheryShot(ctx, f, x, y, dir, time) {
  const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
  const u = f.dur ? Math.min(1, f.t / f.dur) : 0;
  switch (f.shot) {
    case 'windarrow': {
      // An arrow riding two curling ribbons of wind.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      for (const s of [1, -1]) {
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const k = i / 8;
          pts.push([-34 + k * 30, s * Math.sin(k * 5 + time * 30 + (s > 0 ? 0 : Math.PI)) * 4 * (1 - k * 0.6)]);
        }
        ribbon(ctx, pts, 2.6, WIND);
      }
      shaft(ctx, 16, 1.4, '#e8fff4', WIND.main);
      ctx.restore();
      return true;
    }
    case 'galearrow': {
      // A bigger arrow in a spiral of wind, shedding leaves.
      ctx.save();
      glow(ctx, x, y, 14, WIND.light, 0.7);
      ctx.translate(x, y);
      ctx.rotate(ang);
      for (let s = 0; s < 3; s++) {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const k = i / 10;
          pts.push([-50 + k * 46, Math.sin(k * 8 + time * 36 + (s * TAU) / 3) * 6.5 * (1 - k * 0.5)]);
        }
        ribbon(ctx, pts, 3.4, WIND);
      }
      for (let i = 0; i < 3; i++) {
        const k = (time * 3 + i / 3) % 1;
        leaf(ctx, -20 - k * 30, Math.sin(i * 2.1 + time * 9) * 9, 2.4 * (1 - k) + 0.8, time * 10 + i, i % 2 ? WIND.main : '#c4f5b4');
      }
      shaft(ctx, 22, 2, '#ffffff', WIND.deep);
      ctx.restore();
      return true;
    }
    case 'cyclone': {
      // A whirlwind tearing along the ground line with an arrow at its heart: rings of wind
      // stacked into a funnel, spinning, with leaves caught in it.
      ctx.save();
      const grow = easeOut(Math.min(1, u * 4));
      for (let i = 0; i < 6; i++) {
        const k = i / 5;
        const ry = (3 + k * 3) * grow;
        const rx = (7 + k * 13) * grow;
        const cy = y + 14 - k * 30;
        const spin = time * 22 + i * 0.9;
        ctx.globalAlpha = 0.85;
        crescent(ctx, x + Math.sin(spin * 0.3) * 2, cy, rx, spin, spin + 3.6, 2.4 + k * 1.6, i % 2 ? WIND.main : WIND.light, '#ffffff');
        ctx.globalAlpha = 1;
        shock(ctx, x, cy, rx, ry, 1, i % 2 ? WIND.deep : WIND.main);
      }
      for (let i = 0; i < 5; i++) {
        const a = time * 14 + (i / 5) * TAU;
        const h = (i / 5) * 28;
        leaf(ctx, x + Math.cos(a) * (8 + h * 0.4) * grow, y + 12 - h + Math.sin(a) * 3, 2.2, a * 2, i % 2 ? '#c4f5b4' : WIND.main);
      }
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 14, 1.6, '#ffffff', WIND.main);
      ctx.restore();
      return true;
    }
    case 'heavybolt': {
      // A short, heavy bolt on a hard straight streak.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      streak(ctx, 40, 4, FOCUS.deep);
      streak(ctx, 30, 2.4, FOCUS.main);
      streak(ctx, 18, 1, '#ffffff');
      shaft(ctx, 12, 2, '#dfe9ff', FOCUS.main, true);
      ctx.restore();
      return true;
    }
    case 'blastbolt': {
      // A bolt with a glowing charge in its head, spitting sparks behind it.
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const k = ((time * 6 + i / 5) % 1);
        ctx.fillStyle = i % 2 ? BLAST.main : BLAST.light;
        ctx.fillRect(Math.round(x - dir * (8 + k * 30)), Math.round(y + (rand(i + Math.floor(time * 20)) - 0.5) * 8 * k), 2, 2);
      }
      ctx.translate(x, y);
      ctx.rotate(ang);
      streak(ctx, 34, 3.4, BLAST.deep);
      streak(ctx, 22, 1.6, BLAST.light);
      shaft(ctx, 13, 2.2, BLAST.main, FOCUS.main, true);
      ctx.restore();
      glow(ctx, x + dir * 4, y, 9 + Math.sin(time * 40), BLAST.light, 0.9);
      return true;
    }
    case 'frostbolt': {
      // A bolt with a head of ice crystal, trailing frost.
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const k = (time * 4 + i / 6) % 1;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = i % 2 ? '#ffffff' : ICE.main;
        const px = x - dir * (6 + k * 34);
        const py = y + Math.sin(i * 2.7) * 6 * k;
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.globalAlpha = 1;
      glow(ctx, x, y, 12, ICE.light, 0.8);
      ctx.translate(x, y);
      ctx.rotate(ang);
      streak(ctx, 30, 3.4, ICE.deep);
      streak(ctx, 20, 1.6, ICE.light);
      shaft(ctx, 12, 2, ICE.main, ICE.deep, true);
      // The crystal: three shards fanned around the head.
      for (const [a, l] of [[0, 9], [0.7, 5.5], [-0.7, 5.5]]) needle(ctx, 4 + Math.cos(a) * l, Math.sin(a) * l, a, l + 2, 2.4, ICE.main, '#ffffff');
      ctx.restore();
      return true;
    }
    case 'ballista': {
      // A huge bolt pushing a shock cone ahead of it, on a long hard streak.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      streak(ctx, 90, 9, FOCUS.deep);
      streak(ctx, 70, 5.5, FOCUS.main);
      streak(ctx, 46, 2, '#ffffff');
      shaft(ctx, 22, 3.4, '#ffffff', SIGHT, true);
      for (let i = 0; i < 2; i++) {
        const k = (time * 8 + i / 2) % 1;
        ctx.globalAlpha = 1 - k;
        shock(ctx, 6 - k * 26, 0, 2 + k * 3, 6 + k * 10, 1.6 * (1 - k) + 0.4, i ? '#ffffff' : FOCUS.main);
      }
      ctx.restore();
      return true;
    }
    case 'heartbolt': {
      // Heartseeker: a giant bolt of light, a white core on a blue beam, with the sight's rose
      // rings strung along it.
      ctx.save();
      glow(ctx, x, y, 34, FOCUS.light, 0.9);
      ctx.translate(x, y);
      ctx.rotate(ang);
      streak(ctx, 220, 18, FOCUS.deep);
      streak(ctx, 180, 12, FOCUS.main);
      streak(ctx, 140, 5, '#ffffff');
      for (let i = 0; i < 4; i++) {
        const k = (time * 5 + i / 4) % 1;
        ctx.globalAlpha = 1 - k * 0.8;
        shock(ctx, -k * 150, 0, 3 + k * 2, 9 + 8 * (1 - k), 2 * (1 - k) + 0.6, i % 2 ? SIGHT : '#ffffff');
      }
      ctx.globalAlpha = 1;
      shaft(ctx, 30, 4.4, '#ffffff', SIGHT, true);
      starFlash(ctx, 10, 0, 14, 4, time * 6, FOCUS.main, '#ffffff', 4);
      ctx.restore();
      return true;
    }
    default:
      return false;
  }
}

// One falling arrow of a wind rain (Storm Volley).
export function windRainPiece(ctx, x, y, s, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(2.6, 1));
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push([-34 * s + i * 5 * s, Math.sin(i + time * 30) * 3 * s]);
  ribbon(ctx, pts, 2.6 * s, WIND);
  shaft(ctx, 16 * s, 1.4 * s, '#e8fff4', WIND.main);
  ctx.restore();
}

// ---------- Hits, bursts, and sights ----------

export function drawArchery(ctx, f, x, y, p, cam, time) {
  switch (f.kind) {
    case 'galehit': {
      // A Ranger's arrow landing: a curl of wind wrapping the target, a soft ring, and leaves
      // flung on along the shot.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big ? 1.45 : 1;
      const dir = f.dir || 1;
      const k = easeOut(p);
      const a0 = (dir > 0 ? -2.4 : -0.7) + k * 1.5 * dir;
      if (p < 0.75) crescent(ctx, x, cy, (9 + 9 * k) * big, a0, a0 + 3.4 * dir * (1 - p * 0.5), 4.2 * big * (1 - p), WIND.main, '#ffffff');
      shock(ctx, x, cy, (5 + 16 * k) * big, (5 + 16 * k) * big * 0.7, 2 * (1 - p), WIND.light);
      for (let i = 0; i < (f.big ? 5 : 3); i++) {
        const a = (dir > 0 ? 0 : Math.PI) + (rand(i * 3.1 + f.seed * 7) - 0.5) * 2;
        const d = k * (12 + rand(i * 1.7) * 16) * big;
        leaf(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d + p * p * 8, 2.6 * (1 - p) + 0.6, a + time * 8 + i, i % 2 ? WIND.main : '#c4f5b4');
      }
      return true;
    }
    case 'focushit': {
      // A Sniper's bolt landing: a hard four-point glint turned on its corner, a rose sight tick,
      // and shrapnel kicked on along the shot (fx research D: three needles on every hit).
      const cy = y - (f.h ?? 24) / 2;
      // Each monster a bolt passes through lands a little bigger than the last (Piercing Arrow).
      const big = (f.big || f.crit ? 1.5 : 1) * (1 + 0.12 * Math.min(6, f.rank ?? 0));
      const dir = f.dir || 1;
      if (p < 0.35) starFlash(ctx, x, cy, 16 * big * (1 - p / 0.35 * 0.5), 4, Math.PI / 4, FOCUS.main, '#ffffff', 3 * big * (1 - p / 0.35));
      if (p < 0.5) {
        ctx.save();
        ctx.globalAlpha = 1 - p / 0.5;
        ctx.strokeStyle = SIGHT;
        ctx.lineWidth = 1.4;
        const r = (7 + 10 * easeOut(p)) * big;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(x + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4));
          ctx.stroke();
        }
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        const a = (dir > 0 ? 0 : Math.PI) + (rand(i * 2.3 + f.seed * 5) - 0.5) * 1.4;
        const d = easeOut(p) * (10 + i * 7) * big;
        needle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d, a, 8 * (1 - p) + 1, 2 * (1 - p) + 0.5, i % 2 ? FOCUS.main : '#ffffff', '#ffffff');
      }
      return true;
    }
    case 'blast': {
      // A blast bolt bursting: a white flash, a fireball that swells and breaks up into smoke,
      // a ring of shards, and a shockwave along the ground.
      const cy = y - (f.h ?? 24) / 2;
      const R = 46;
      if (p < 0.1) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, cy, R * 0.55, 0, TAU);
        ctx.fill();
        return true;
      }
      const k = (p - 0.1) / 0.9;
      shock(ctx, x, y - 1, 14 + R * 1.2 * easeOut(k), (14 + R * 1.2 * easeOut(k)) * 0.22, 4 * (1 - k), BLAST.main);
      // The fireball: lumps that burst outward from the heart and tear open as they go, so it
      // never sits as one flat disc.
      if (k < 0.5) {
        const s = easeOut(k / 0.5);
        glow(ctx, x, cy, R * (0.6 + 0.6 * s), BLAST.light, 0.8 * (1 - s));
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + f.seed * 3;
          const d = R * (0.12 + 0.5 * s) * (0.8 + 0.4 * rand(i + f.seed));
          puff(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.75, R * (0.24 - 0.1 * s) * (0.8 + 0.4 * rand(i * 3.1)), i % 2 ? BLAST.light : BLAST.main, BLAST.deep, Math.max(0, s * 1.4 - 0.3), f.seed + i);
        }
        puff(ctx, x, cy, R * 0.22 * (1 - s), '#ffffff', BLAST.light);
      }
      // Then smoke: the puffs drift up and tear apart.
      if (k > 0.25) {
        const s = (k - 0.25) / 0.75;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + f.seed * 5;
          puff(ctx, x + Math.cos(a) * R * (0.4 + 0.3 * s), cy + Math.sin(a) * R * 0.3 - s * 22, R * 0.3 * (1 - s * 0.7), BLAST.smoke, BLAST.shadow, s, f.seed + i);
        }
      }
      shardRing(ctx, x, cy, 12 + R * easeOut(k), 6 * (1 - k), 9, f.seed, f.seed * 4, k < 0.5 ? BLAST.main : BLAST.deep);
      for (let i = 0; i < 9; i++) {
        if (k > 0.8) continue;
        const a = -Math.PI * (0.05 + 0.9 * rand(i * 2.9 + f.seed * 13));
        const d = easeOut(k) * (20 + rand(i * 7.1) * R);
        needle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d + k * k * 26, a, 9 * (1 - k) + 1, 2.4 * (1 - k) + 0.5, i % 3 ? BLAST.main : BLAST.light, '#ffffff');
      }
      return true;
    }
    case 'frostburst': {
      // A frost bolt shattering, in the order ice breaks (CyberConnect2; research/archery.md
      // 34-35): cracks race across the ground and up the target first, then a white flash at the
      // instant it breaks, then a crown of spikes, a ring of shards with navy among the blue, and
      // frost and a low mist that linger.
      const cy = y - (f.h ?? 24) / 2;
      if (p < 0.3) {
        const c = easeOut(p / 0.3);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU + f.seed * 4;
          const len = 30 * c * (0.6 + 0.4 * rand(i + f.seed));
          ctx.beginPath();
          ctx.moveTo(x, cy);
          ctx.lineTo(x + Math.cos(a) * len * 0.5 + 3, cy + Math.sin(a) * len * 0.4);
          ctx.lineTo(x + Math.cos(a) * len, cy + Math.sin(a) * len * 0.8);
          ctx.stroke();
        }
        return true;
      }
      const q = (p - 0.3) / 0.7;
      const k = easeOut(q);
      if (q < 0.12) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, cy, 30 * (1 - q * 3), 0, TAU);
        ctx.fill();
      }
      const up = q < 0.25 ? easeOut(q / 0.25) : 1 - easeIn(Math.max(0, (q - 0.55) / 0.45));
      crown(ctx, x, y + 1, 34 * up, 34, 7, ICE.main, '#ffffff');
      shardRing(ctx, x, cy, 10 + 56 * k, 7 * (1 - q), 10, f.seed, f.seed * 3, q < 0.5 ? ICE.main : ICE.deep);
      shardRing(ctx, x, cy, 6 + 44 * k, 5 * (1 - q), 6, f.seed + 3, f.seed * 5, '#1c3a8c');
      shock(ctx, x, y - 1, 16 + 70 * k, (16 + 70 * k) * 0.22, 3 * (1 - q), ICE.light);
      if (q > 0.3) puff(ctx, x, y - 4, 26 * (1 - q * 0.6), '#eef8ff', '#a8d8ff', q, f.seed);
      for (let i = 0; i < 10; i++) {
        const u = Math.max(0, p - rand(i) * 0.3);
        ctx.globalAlpha = 1 - u;
        ctx.fillStyle = i % 2 ? '#ffffff' : ICE.main;
        ctx.fillRect(Math.round(x + (rand(i * 3.3 + f.seed) - 0.5) * 90), Math.round(cy - 30 + u * 50), 2, 2);
      }
      ctx.globalAlpha = 1;
      return true;
    }
    case 'frostshard': {
      // Frost catching a monster beside the burst: three ice shards and a cold flash.
      const cy = y - (f.h ?? 24) / 2;
      if (p < 0.3) starFlash(ctx, x, cy, 12 * (1 - p), 4, f.seed, ICE.main, '#ffffff', 2.4);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.9;
        const d = easeOut(p) * 14;
        needle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d, a, 8 * (1 - p) + 1, 2.6 * (1 - p) + 0.4, ICE.main, '#ffffff');
      }
      return true;
    }
    case 'gust': {
      // A gust off the bow as a big arrow goes: a ring of wind opening forward and three streaks.
      const dir = f.dir || 1;
      const k = easeOut(p);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      shock(ctx, 6 + 18 * k, 0, 3 + 4 * k, 8 + 12 * k, 2.4 * (1 - p), WIND.main);
      for (let i = 0; i < 3; i++) {
        const yy = (i - 1) * 8;
        const len = 26 * (1 - p);
        if (len > 1) ribbon(ctx, [[10 + 30 * k - len, yy], [10 + 30 * k - len / 2, yy + Math.sin(i + p * 6) * 2], [10 + 30 * k, yy]], 2.4 * (1 - p) + 0.6, WIND);
      }
      ctx.restore();
      return true;
    }
    case 'boltshock': {
      // A heavy bolt's kick: a white muzzle flash, a cone of shock rings forward, and dust off
      // her heels.
      const dir = f.dir || 1;
      if (p < 0.1) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + dir * 6, y, 8, 0, TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      for (let i = 0; i < 2; i++) {
        const k = easeOut(Math.max(0, p - i * 0.08));
        shock(ctx, 8 + 30 * k + i * 10, 0, 2 + 5 * k, 8 + 14 * k, 2.6 * (1 - k), i ? '#ffffff' : FOCUS.main);
      }
      ctx.restore();
      wisp(ctx, x - dir * 16, y + 15, 24 * (1 - p), 6 * (1 - p), -dir, '#f3ecf7', '#c9b8dc');
      return true;
    }
    case 'heartshock': {
      // Heartseeker's release: a burst of white, rings of force thrown down the line one after
      // another, the sight's rose ring blowing out, and a skid of dust as she's shoved back.
      const dir = f.dir || 1;
      if (p < 0.08) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + dir * 8, y, 22, 0, TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      for (let i = 0; i < 4; i++) {
        const k = easeOut(Math.max(0, Math.min(1, (p - i * 0.07) / 0.6)));
        if (k <= 0) continue;
        shock(ctx, 14 + 90 * k + i * 22, 0, 3 + 8 * k, 12 + 26 * (1 - i * 0.15) * k, 4 * (1 - k), i % 2 ? SIGHT : '#ffffff');
      }
      shock(ctx, 0, 0, 12 + 50 * easeOut(p), 12 + 50 * easeOut(p), 3 * (1 - p), SIGHT);
      ctx.restore();
      glow(ctx, x, y, 50 * (1 - p), FOCUS.light, 1 - p);
      wisp(ctx, x - dir * 18, y + 15, 46 * (1 - p * 0.7), 9 * (1 - p), -dir, '#f3ecf7', '#c9b8dc');
      return true;
    }
    case 'galeburst': {
      // Storm Volley's lift-off: wind spiralling up around her from the ground, leaves pulled up
      // in it.
      for (let i = 0; i < 4; i++) {
        const k = Math.max(0, Math.min(1, (p - i * 0.08) / 0.7));
        if (k <= 0 || k >= 1) continue;
        const r = 18 + 28 * easeOut(k);
        const cy = y - 4 - k * 50 - i * 6;
        ctx.save();
        ctx.translate(x, cy);
        ctx.scale(1, 0.32);
        const a = k * 7 + i * 1.7;
        crescent(ctx, 0, 0, r, a, a + 3.2, 7 * (1 - k), i % 2 ? WIND.main : WIND.light, '#ffffff');
        ctx.restore();
      }
      shock(ctx, x, y - 1, 16 + 46 * easeOut(p), (16 + 46 * easeOut(p)) * 0.25, 3 * (1 - p), WIND.main);
      for (let i = 0; i < 8; i++) {
        const u = Math.max(0, p - rand(i) * 0.3);
        const a = u * 9 + i;
        leaf(ctx, x + Math.cos(a) * (16 + 10 * u), y - 4 - u * 70, 2.6 * (1 - u) + 0.6, a * 2, i % 2 ? WIND.main : '#c4f5b4');
      }
      return true;
    }
    case 'stormburst': {
      // The dive landing: a white-green flash, rings of wind blasting out along the ground,
      // crescents of wind whirling wide, and leaves and broken arrows thrown everywhere.
      const R = Math.max(90, (f.r ?? 170) * 0.9);
      const cy = y - 16;
      if (p < 0.22) starFlash(ctx, x, cy, R * 0.6 * (1 - p * 2), 8, f.seed * 6, WIND.main, '#ffffff', 12 * (1 - p / 0.22));
      for (let i = 0; i < 3; i++) {
        const k = easeOut(Math.max(0, Math.min(1, (p - i * 0.06) / 0.8)));
        shock(ctx, x, y - 1, 20 + R * k, (20 + R * k) * 0.2, 5 * (1 - k), i % 2 ? WIND.light : WIND.main);
      }
      ctx.save();
      ctx.translate(x, cy);
      ctx.scale(1, 0.42);
      for (let i = 0; i < 3; i++) {
        const k = easeOut(Math.min(1, p / 0.7));
        const a = p * 6 + (i / 3) * TAU;
        if (p < 0.8) crescent(ctx, 0, 0, 20 + R * 0.7 * k, a, a + 2.4, 12 * (1 - p), i % 2 ? WIND.main : WIND.light, '#ffffff');
      }
      ctx.restore();
      for (let i = 0; i < 16; i++) {
        if (p > 0.9) continue;
        const a = -Math.PI * (0.04 + 0.92 * rand(i * 2.9 + f.seed * 13));
        const d = easeOut(p) * (30 + rand(i * 7.1 + f.seed) * R);
        const px = x + Math.cos(a) * d;
        const py = cy + Math.sin(a) * d * 0.7 + p * p * 30;
        if (i % 3) leaf(ctx, px, py, 3.2 * (1 - p) + 0.8, a + time * 6, i % 2 ? WIND.main : '#c4f5b4');
        else needle(ctx, px, py, a, 12 * (1 - p) + 1, 2.6 * (1 - p) + 0.5, WIND.main, '#ffffff');
      }
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
    case 'tracer': {
      // A Sniper's tracer: one thin bright line from the bow to where the bolt is headed, there in
      // full on the release, then shrinking from the bow end toward the hit (research/archery.md 30).
      const tx = f.tx - cam.x;
      const ty = f.ty - cam.y;
      const k = easeOut(p);
      const sx0 = x + (tx - x) * k;
      const sy0 = y + (ty - y) * k;
      ctx.lineCap = 'round';
      ctx.strokeStyle = f.big ? SIGHT : FOCUS.main;
      ctx.lineWidth = (f.big ? 3 : 2) * (1 - p * 0.5);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = f.big ? 1.4 : 0.9;
      ctx.globalAlpha = 1;
      ctx.stroke();
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
      // A bolt charging as the crank winds: a ring closing in on the bolt's tip, which glows in
      // three steps (none, steel blue, then white with a rose rim), with a flash at each step.
      const tipx = x + (f.dir || 1) * 6;
      const lv = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
      const since = p - [0, 0.33, 0.66][lv];
      const r = 4 + 22 * (1 - easeIn(p));
      shock(ctx, tipx, y, r, r, 1 + 1.6 * p, lv < 2 ? FOCUS.main : SIGHT);
      if (lv > 0) {
        glow(ctx, tipx, y, 8 + 4 * lv, lv === 2 ? '#ffffff' : FOCUS.main, 0.9);
        ctx.fillStyle = lv === 2 ? '#ffffff' : FOCUS.light;
        ctx.beginPath();
        ctx.arc(tipx, y, 1.6 + lv, 0, TAU);
        ctx.fill();
        if (lv === 2) shock(ctx, tipx, y, 3.6 + lv, 3.6 + lv, 1.2, SIGHT);
      }
      if (lv > 0 && since < 0.06) starFlash(ctx, tipx, y, 10 + 4 * lv, 4, 0, FOCUS.main, '#ffffff', 2.5);
      return true;
    }
    case 'deadeye': {
      // A Deadeye: the sight flashes round the bow, rose and white, with four long glints.
      const k = easeOut(p);
      if (p < 0.4) starFlash(ctx, x, y, 26 * (1 - p), 4, 0, SIGHT, '#ffffff', 4 * (1 - p / 0.4));
      shock(ctx, x, y, 8 + 22 * k, 8 + 22 * k, 2.4 * (1 - p), SIGHT);
      shock(ctx, x, y, 4 + 30 * k, 4 + 30 * k, 1.4 * (1 - p), '#ffffff');
      return true;
    }
    default:
      return false;
  }
}
