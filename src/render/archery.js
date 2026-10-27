// The archer paths' effects, built from hand-drawn effect sprites (fx-sprites.js; the packs and
// their credits are in assets/fx/), not drawn shapes (CLAUDE.md). The Ranger's are wind: a gust
// full of leaves, spinning wind (a swirl recoloured from the packs), rings of wind, dust. The
// Sniper's are steel and frost: bolt bursts, sparks, shrapnel, a charging core, a lattice beam,
// frost novas, ice stars, a real explosion, and a rose star for the Deadeye. Code draws only the
// small supporting parts: the arrow and bolt shafts and the sight's ticks.
//
// Shots draw at their head (x, y) flying along `dir`; the rest are drawn from progress `p` (0-1)
// and a seed, at a monster's feet for per-target effects and the bow hand for muzzle bursts.

import { SCHOOL_COLORS } from './spells.js';
import { shock, wash, easeOut, deep, inked } from './fxkit.js';
import { fxSprite } from './fx-sprites.js';

const TAU = Math.PI * 2;
const FOCUS = SCHOOL_COLORS.focus;
const GALE = SCHOOL_COLORS.wind;
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


// ---------- Shots ----------


// ---------- Shots ----------

export function drawArcheryShot(ctx, f, x, y, dir, time) {
  const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
  const u = f.dur ? Math.min(1, f.t / f.dur) : 0;
  const along = (d) => [x - Math.cos(ang) * d, y - Math.sin(ang) * d];
  switch (f.shot) {
    case 'windarrow': {
      // An arrow riding a spin of wind: the swirl turns round its tail as it flies.
      const [tx, ty] = along(12);
      fxSprite(ctx, 'windspin', tx, ty, { t: time + (f.seed ?? 0), rot: ang, scale: 0.9, sy: 0.7 });
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
        fxSprite(ctx, 'windspin', tx, ty, { t: time * (1 + i * 0.2) + i * 0.3, rot: ang, scale: 1.7 - i * 0.35, sy: 0.75 });
      }
      const [gx, gy] = along(30);
      fxSprite(ctx, 'leafgust', gx, gy + 6, { t: (time * 1.5) % 0.7, flip: dir < 0, scale: 1.1 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 32, 3, '#ffffff', GALE.deep);
      ctx.restore();
      return true;
    }
    case 'cyclone': {
      // A tornado on the ground line, built of spinning wind stacked into a funnel twice her
      // height (narrow at the foot, wide at the top, each band on its own phase and swaying), with
      // a gust of leaves whirling at its foot and dust kicked up, and the arrow at its heart.
      const grow = easeOut(Math.min(1, u * 4));
      const foot = y + 22;
      for (let i = 0; i < 7; i++) {
        const k = i / 6;
        const sway = Math.sin(time * 6 + k * 3) * 4 * k;
        fxSprite(ctx, 'windspin', x + sway, foot - k * 70 * grow, { t: time * (1.2 + k * 0.5) + i * 0.17, scale: (0.8 + k * 1.9) * grow, sy: 0.55, flip: i % 2 === 1 });
      }
      fxSprite(ctx, 'dust', x - dir * 6, foot + 2, { t: (time * 1.2) % 0.6, scale: 1.2 * grow, flip: dir < 0 });
      fxSprite(ctx, 'leafgust', x, foot - 18, { t: (time * 1.4) % 0.7, scale: 1.3 * grow, flip: Math.floor(time * 3) % 2 === 0 });
      ctx.save();
      ctx.translate(x, y - 20);
      ctx.rotate(ang);
      shaft(ctx, 20, 2.2, '#ffffff', GALE.main);
      ctx.restore();
      return true;
    }
    case 'wisp': {
      // A wind spirit from a full Gale: the pack's flying wind orb, swooping out on a curve and
      // homing in (Wind Archer's Trifling Wind; archery.md 23), a little spin of wind behind it.
      const bend = (f.bend ?? 30) * Math.sin(Math.PI * u);
      const hx = x - Math.sin(ang) * bend;
      const hy = y + Math.cos(ang) * bend;
      fxSprite(ctx, 'windspin', hx - Math.cos(ang) * 8, hy - Math.sin(ang) * 8, { t: time, rot: ang, scale: 0.7, sy: 0.6 });
      fxSprite(ctx, 'windwisp', hx, hy, { frame: 1 + (Math.floor(time * 20) % 3), rot: ang, scale: 1.1 });
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
      // A bolt with a charge in its head: the pack's charging core, held at its brightest.
      fxSprite(ctx, 'charge', x + dir * 6, y, { frame: 3 + (Math.floor(time * 20) % 2), scale: 0.7 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 26, 2.8, '#ffd27a', FOCUS.main, true);
      ctx.restore();
      return true;
    }
    case 'frostbolt': {
      // A bolt with an ice star spinning at its head.
      fxSprite(ctx, 'icestar', x + dir * 6, y, { t: time, scale: 0.6 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 24, 2.6, '#bff0ff', '#3f9fd8', true);
      ctx.restore();
      return true;
    }
    case 'ballista': {
      // A huge bolt pushing rings of force ahead of it.
      fxSprite(ctx, 'hitring', x + dir * 12, y, { t: time * 2, scale: 1.4, sx: 0.4 });
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      shaft(ctx, 36, 4, '#ffffff', SIGHT, true);
      ctx.restore();
      return true;
    }
    case 'heartbolt': {
      // Heartseeker: one giant bolt (twice a ballista's size), a rose star turning at its head and
      // rings of force pushed ahead of it; no beam (it should read as a bolt, not a laser).
      fxSprite(ctx, 'hitring', x + dir * 18, y, { t: time * 2.5, scale: 2, sx: 0.4 });
      fxSprite(ctx, 'deadstar', x + dir * 8, y, { t: time, scale: 0.8 });
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
export function windRainPiece(ctx, x, y, s, time) {
  const a = Math.atan2(2.6, 1);
  fxSprite(ctx, 'windspin', x - Math.cos(a) * 12 * s, y - Math.sin(a) * 12 * s, { t: time, rot: a, scale: 0.8 * s, sy: 0.7 });
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
    case 'galehit': {
      // A Ranger's arrow landing: a wind slash cut across the target and a gust of leaves blown on
      // along the shot; heavy shots and crits add a ring of wind bursting out.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'windslash', x, cy + 4, { p, flip, scale: big ? 1.4 : 1.05 });
      fxSprite(ctx, 'leafgust', x - (f.dir || 1) * 6, cy + 8, { p, flip, scale: big ? 1.5 : 1.1 });
      if (big) fxSprite(ctx, 'windring', x, y, { p, scale: 1.3 });
      return true;
    }
    case 'focushit': {
      // A Sniper's bolt landing: the pack's bolt burst, and shrapnel on heavy hits and crits. Each
      // monster a bolt passes through lands a little bigger than the last (Piercing Arrow).
      const cy = y - (f.h ?? 24) / 2;
      const grow = 1 + 0.12 * Math.min(6, f.rank ?? 0);
      fxSprite(ctx, 'boltburst', x, cy, { p, flip, scale: 0.9 * grow });
      if (f.big || f.crit) fxSprite(ctx, 'shrapnel', x, cy + 6, { p, scale: 1.1 * grow });
      return true;
    }
    case 'blast': {
      // A blast bolt bursting: the pack's explosion, a burst of light at its heart, then smoke.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'sunburst', x, cy, { p: Math.min(1, p * 2), scale: 1.3, alpha: p < 0.5 ? 1 : 0 });
      fxSprite(ctx, 'explosion', x, y + 4, { p, scale: 1.8 });
      if (p > 0.4) fxSprite(ctx, 'smoke', x, y - 6, { p: (p - 0.4) / 0.6, scale: 1.6 });
      return true;
    }
    case 'frostburst': {
      // A frost bolt shattering: the pack's frost nova on the ground and a swirl of snowflakes
      // freezing everything around.
      fxSprite(ctx, 'frostnova', x, y + 4, { p, scale: 2 });
      fxSprite(ctx, 'freezing', x, y - (f.h ?? 24) / 2, { p, scale: 1.3 });
      return true;
    }
    case 'frostshard': {
      fxSprite(ctx, 'icestar', x, y - (f.h ?? 24) / 2, { p, scale: 0.8 });
      return true;
    }
    case 'gust': {
      // A gust off the bow as a big arrow goes.
      fxSprite(ctx, 'leafgust', x + (f.dir || 1) * 14, y + 6, { p, flip, scale: 1 });
      return true;
    }
    case 'boltshock': {
      // A heavy bolt's kick: sparks off the bow and dust off her heels.
      fxSprite(ctx, 'boltspark', x + (f.dir || 1) * 8, y, { p, flip, scale: f.small ? 0.55 : 0.9 });
      if (!f.small) fxSprite(ctx, 'dust', x - (f.dir || 1) * 14, y + 16, { p, flip: !flip, scale: 0.9 });
      return true;
    }
    case 'heartshock': {
      // Heartseeker's release: a ring of force breaking out from the bow, shrapnel, and a skid of
      // dust as she's shoved back.
      fxSprite(ctx, 'breakring', x + (f.dir || 1) * 10, y, { p, scale: 1.6 });
      fxSprite(ctx, 'shrapnel', x + (f.dir || 1) * 10, y + 6, { p, scale: 1.6 });
      fxSprite(ctx, 'dust', x - (f.dir || 1) * 18, y + 16, { p, flip: !flip, scale: 1.4 });
      return true;
    }
    case 'galeburst': {
      // Storm Volley's lift-off: a ring of wind bursting from her feet, gusts of leaves blown up
      // either side, and wind spinning up around her.
      fxSprite(ctx, 'windring', x, y, { p, scale: 2 });
      fxSprite(ctx, 'leafgust', x - 10, y - 10, { p, flip: true, scale: 1.4 });
      fxSprite(ctx, 'leafgust', x + 10, y - 10, { p, scale: 1.4 });
      for (let i = 0; i < 3; i++) fxSprite(ctx, 'windspin', x, y - 8 - p * 40 - i * 14, { t: time + i * 0.2, scale: 1.4 + i * 0.5, sy: 0.5, alpha: 1 - p });
      return true;
    }
    case 'stormburst': {
      // The dive landing: rings of wind blasting out along the ground, gusts of leaves thrown both
      // ways, dust kicked up, and wind spinning out wide.
      fxSprite(ctx, 'windring', x, y, { p, scale: 3.6 });
      fxSprite(ctx, 'windring', x, y, { p: Math.min(1, p * 1.4), scale: 2.2 });
      for (const sd of [-1, 1]) {
        fxSprite(ctx, 'leafgust', x + sd * 30, y - 12, { p, flip: sd < 0, scale: 2 });
        fxSprite(ctx, 'dust', x + sd * 40, y + 6, { p, flip: sd < 0, scale: 1.8 });
      }
      fxSprite(ctx, 'windspin', x, y - 16, { t: time, scale: 4 * (0.6 + 0.4 * p), sy: 0.35, alpha: 1 - p });
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
      // A bolt charging as the crank winds: the pack's focus charge closing in on the bolt's tip.
      fxSprite(ctx, 'charge', x + (f.dir || 1) * 6, y, { p, scale: 0.9 });
      return true;
    }
    case 'windtrail': {
      // The path a gale shot tore through the air: spins of wind left hanging along it, fading,
      // and a gust of leaves drifting out of the middle.
      const tx = f.tx - cam.x;
      const ty = f.ty - cam.y;
      const ang = Math.atan2(ty - y, tx - x);
      const n = Math.max(2, Math.round(Math.hypot(tx - x, ty - y) / 40));
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n;
        if (k > Math.min(1, p / 0.15)) break;
        fxSprite(ctx, 'windspin', x + (tx - x) * k, y + (ty - y) * k - p * 10, { t: time + i * 0.13, rot: ang, scale: f.big ? 1.3 : 1, sy: 0.6, alpha: 1 - p });
      }
      fxSprite(ctx, 'leafgust', (x + tx) / 2, (y + ty) / 2 + 6, { p, flip: tx < x, scale: 1.2 });
      return true;
    }
    case 'windstep': {
      // Tailwind at her heels: a puff of dust and a gust of leaves peeling off behind her.
      fxSprite(ctx, 'dust', x - (f.dir || 1) * 10, y + 2, { p, flip: !flip, scale: 0.8 });
      fxSprite(ctx, 'leafgust', x - (f.dir || 1) * 14, y - 6, { p, flip: !flip, scale: 0.8 });
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
        fxSprite(ctx, 'leafgust', -60 + u * 760, 40 + rand(i * 5.3) * 220, { p: (u * 1.3) % 1, scale: 1.6, alpha: a });
      }
      return true;
    }
    case 'deadeye': {
      // A Deadeye: the rose star flashing round the bow, and a sight ring blowing out.
      fxSprite(ctx, 'deadstar', x, y, { p, scale: 1.1 });
      fxSprite(ctx, 'hitring', x, y, { p, scale: 2 });
      return true;
    }
    default:
      return false;
  }
}
