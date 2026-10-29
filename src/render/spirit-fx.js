// The Spirit Mage's effects, in Tengu's own effect art (tools/fx-art.js, the `cel*` strips): white
// spirit light with a warm gold heart, zigzag paper streamers, scarlet cords and gold bells. Her
// bolts are wisps of light trailing streamers; hits flash and fling paper scraps; Kami's Favour
// sends a little blessing of light down on whoever it mends. The Spirit Doll's tricks: a paper-fan
// smack, a twirl of streamers, a gold bell bonked on a head. Her skills: Spirit Wave's ring racing
// out both ways, Blessing's column of warm light, Heaven's Lantern with its rays and last blaze.
//
// Drawn from progress `p` (0-1); (x, y) is a monster's feet for per-target effects and the
// caster's feet otherwise (on screen, so world positions are offset by the same amount). Returns
// false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { groundRing } from './warrior-fx.js';

// Heaven's Lantern's size (its big strip, cellanternbig): about 85 px across, over the monsters.
const LANTERN_SCALE = 0.62;

// A crescent of moonlight (Crescent Moon), facing `dir`, about 90 px tall: a white blade of light
// with a vermilion rim and a soft glow.
function crescent(ctx, x, y, dir, alpha, s) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.globalAlpha *= alpha;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-6, -46);
    ctx.quadraticCurveTo(34, 0, -6, 46);
    ctx.quadraticCurveTo(14, 0, -6, -46);
    ctx.closePath();
  };
  ctx.shadowColor = '#ff9a8a';
  ctx.shadowBlur = 14;
  path();
  ctx.fillStyle = '#ffd8d0';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ff6a52';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, -36);
  ctx.quadraticCurveTo(26, 0, -2, 36);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

export function drawSpiritFx(ctx, f, x, y, p) {
  const flip = (f.dir || 1) < 0;
  switch (f.kind) {
    case 'spirithit': {
      // A spell landing: a flash of white light on the monster, rays, streamer scraps and bell
      // sparks; heavy ones and crits add a ring of light on the ground.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celspirithit', x, cy, { p, flip, scale: big ? 0.62 : 0.42 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.45 });
      if (big) groundRing(ctx, 'celringspirit', x, y, p, 44);
      return true;
    }
    case 'spiritmend': {
      // Kami's Favour: a little column of blessing light where a spell landed, mending who's near.
      fxSprite(ctx, 'celblessing', x, y, { p, scale: 0.4 });
      return true;
    }
    case 'fanslap': {
      // The doll's paper fan smacking a monster.
      fxSprite(ctx, 'celfanslap', x, y - (f.h ?? 24) * 0.55, { p, flip, scale: f.big ? 0.42 : 0.32 });
      return true;
    }
    case 'dolltwirl': {
      // The doll's streamer twirl, whipping round her middle.
      fxSprite(ctx, 'celdolltwirl', x, y - 14, { p, flip, scale: f.big ? 0.5 : 0.4 });
      return true;
    }
    case 'bellbonk': {
      // A gold bell bonked on a head, ringing and bouncing off.
      fxSprite(ctx, 'celbellbonk', x, y, { p, flip, scale: f.small ? 0.3 : 0.42 });
      return true;
    }
    case 'dollpop': {
      // The doll zipping off and popping back in: a flurry of streamers and light.
      fxSprite(ctx, 'celspiritstep', x, y + 22, { p, scale: 0.3 });
      return true;
    }
    case 'spitball': {
      // The doll's spitball, flying straight down its line with a little drop at the end.
      const ox = x - f.x;
      const oy = y - f.y;
      const m = f.mob;
      const tx = (m && m.hp > 0 ? m.x : f.tx) + ox;
      const ty = (m && m.hp > 0 ? m.y - m.def.h * 0.7 : f.ty) + oy;
      const u = Math.min(1, f.t / f.fly);
      fxSprite(ctx, 'celspitball', x + (tx - x) * u, y + (ty - y) * u + 6 * u * u, { t: f.t, flip: tx < x, rot: (tx < x ? -1 : 1) * 0.15 * u, scale: f.big ? 0.32 : 0.22 });
      return true;
    }
    case 'spitsplat': {
      // A spitball landing on a face: the wet paper splats flat and drips.
      fxSprite(ctx, 'celspitsplat', x, y - (f.h ?? 24) * 0.7, { p, flip, scale: f.big ? 0.36 : 0.22 });
      return true;
    }
    case 'dollcharm': {
      // The doll's Paper Charm: a little wisp of light flicked in an arc to the monster, then stuck
      // on it, pulsing faster and faster until it pops (the pop is the hit's own burst).
      const ox = x - f.x;
      const oy = y - f.y;
      const m = f.mob;
      const tx = (m && m.hp > 0 ? m.x : f.tx) + ox;
      const ty = (m && m.hp > 0 ? m.y - m.def.h * 0.6 : f.ty) + oy;
      const u = Math.min(1, f.t / f.fly);
      if (u < 1) {
        const cx = x + (tx - x) * u;
        const cy = y + (ty - y) * u - 26 * Math.sin(u * Math.PI);
        fxSprite(ctx, 'celspiritorb', cx, cy, { t: f.t, rot: Math.atan2(ty - y, tx - x), scale: 0.16 });
      } else {
        const k = (f.t - f.fly) / (f.dur - f.fly);
        fxSprite(ctx, 'celspiritorb', tx, ty, { t: f.t, scale: 0.13 + 0.05 * Math.abs(Math.sin(f.t * (10 + 30 * k))) });
      }
      return true;
    }
    case 'kitsunecall': {
      // The kitsune guardian's Fox-Fire Call: a ring of light racing out from the naginata's butt
      // and a flash where it struck the ground.
      groundRing(ctx, 'celringspirit', x, y, p, 120);
      fxSprite(ctx, 'celspirithit', x, y - 6, { p: Math.min(1, p * 1.5), scale: 0.7 });
      return true;
    }
    case 'kitsuneport': {
      // The guardian's teleport: vermilion fox fire springing up round her feet and licking up her body as she
      // goes (`out`), or out of which she steps (in), a ring on the ground and a flash of spirit light.
      const k = f.out ? p : 1 - p;
      const rise = Math.sin(Math.PI * Math.min(1, p * 1.25));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + f.t * 3;
        const dx = Math.cos(a) * 22 * (1 - 0.4 * k);
        const front = Math.sin(a) > 0;
        if (!front) fxSprite(ctx, 'celfire', x + dx, y + 2, { t: f.t * 2 + i * 0.17, scale: 0.2 + 0.12 * rise, alpha: 0.6 * rise });
      }
      fxSprite(ctx, 'celspiritstep', x, y, { p: Math.min(1, p * 1.3), scale: 0.9 });
      groundRing(ctx, 'celringrage', x, y, Math.min(1, p * 1.4), 44);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + f.t * 3;
        if (Math.sin(a) > 0) fxSprite(ctx, 'celfire', x + Math.cos(a) * 22 * (1 - 0.4 * k), y + 4, { t: f.t * 2 + i * 0.17, scale: 0.2 + 0.12 * rise, alpha: 0.85 * rise });
      }
      return true;
    }
    case 'kitsunegather': {
      // Moonfall's charge: a whirl of fox fire round her feet, wisps spiralling in to her from all
      // round, a ring on the ground drawing in, and motes rising.
      const k = Math.min(1, p * 4) * (1 - Math.max(0, (p - 0.9) * 10));
      fxSprite(ctx, 'celtornado', x, y + 4, { t: f.t, scale: 0.35 + 0.25 * p, alpha: 0.3 * k });
      for (let ring = 0; ring < 2; ring++) {
        const q = ((f.t * 1.6 + ring * 0.5) % 1);
        // (Thin and faint, shrinking in on her: the pull.)
        groundRing(ctx, 'celringrage', x, y, 0.62, (f.r ?? 260) * (1 - q) * 0.9, { alpha: 0.55 * k * Math.min(1, q * 4) });
      }
      for (let i = 0; i < 10; i++) {
        const q = ((f.t * 0.9 + i / 10) % 1);
        const side = i % 2 ? 1 : -1;
        const d = (f.r ?? 260) * 0.9 * (1 - q);
        const wx = x + side * d;
        const wy = y - 20 - 30 * Math.sin(q * Math.PI) * ((i % 3) / 2);
        fxSprite(ctx, 'celspiritorb', wx, wy, { t: f.t + i * 0.1, flip: side > 0, scale: 0.2 + 0.1 * q, alpha: k * Math.min(1, q * 3) });
        if (i % 3 === 0) fxSprite(ctx, 'celfire', wx, wy + 14, { t: f.t * 2 + i, scale: 0.12, alpha: 0.7 * k * Math.min(1, q * 3) });
      }
      fxSprite(ctx, 'celembers', x, y, { t: f.t, scale: 0.8, alpha: 0.8 * k });
      fxSprite(ctx, 'celmotes', x, y, { t: f.t, scale: 0.9, alpha: 0.5 * k });
      return true;
    }
    case 'kitsunemoonfall': {
      // Moonfall's blow: a great ring of spirit light and fox fire bursting out from where the blade
      // struck, a pillar of light up out of it, and fox fire flaring along the ground both ways.
      groundRing(ctx, 'celringspirit', x, y, Math.min(1, p * 1.2), 150);
      groundRing(ctx, 'celringrage', x, y, Math.min(1, p * 1.6), 100);
      fxSprite(ctx, 'celpillarspirit', x, y + 4, { p: Math.min(1, p * 1.3), scale: 0.75 });
      fxSprite(ctx, 'celspirithit', x, y - 10, { p: Math.min(1, p * 1.8), scale: 1.2 });
      const fade = 1 - Math.max(0, (p - 0.5) * 2);
      for (let i = 1; i <= 3; i++) {
        for (const side of [-1, 1]) fxSprite(ctx, 'celfire', x + side * i * 34 * Math.min(1, p * 2.5), y + 3, { t: f.t * 2 + i * 0.3, scale: 0.28 - 0.04 * i, alpha: fade });
      }
      return true;
    }
    case 'kitsunecrescent': {
      // Crescent Moon: a great crescent of moonlight left hanging in the air in front of her where the
      // blade passed (it stays at arm's length), swelling a little and fading, motes falling off it.
      const dir = f.dir || 1;
      const fade = 1 - Math.max(0, (p - 0.25) / 0.75);
      const grow = 0.9 + 0.35 * Math.min(1, p * 3);
      for (let i = 2; i >= 0; i--) crescent(ctx, x - dir * i * 6 * (1 - p), y + i * 4 * (1 - p), dir, (0.95 - i * 0.3) * fade, grow * (1 - i * 0.06));
      fxSprite(ctx, 'celmotes', x, y + 40, { t: f.t, scale: 0.6, alpha: 0.7 * fade });
      return true;
    }
    case 'kitsuneblock': {
      // The guardian taking a blow on the haft: a flash of light and paper scraps.
      fxSprite(ctx, 'celspirithit', x, y - 30, { p, flip, scale: 0.55 });
      return true;
    }
    case 'wardbreak': {
      // A Spirit Ward giving way: the sphere bursts in a flash of white light and paper scraps.
      fxSprite(ctx, 'celspirithit', x, y - 24, { p, scale: 0.9 });
      groundRing(ctx, 'celringspirit', x, y, p, 46);
      return true;
    }
    case 'spiritwave': {
      // Spirit Wave: the staff's foot strikes the floor and a ring of white light races out along
      // the ground both ways, streamers whipping off its edge; a second, fainter ring follows it.
      const r = f.r ?? 160;
      groundRing(ctx, 'celringspirit', x, y, p, r);
      if (p > 0.18) groundRing(ctx, 'celringspirit', x, y, (p - 0.18) / 0.82, r * 0.7);
      fxSprite(ctx, 'celspirithit', x, y - 6, { p: Math.min(1, p * 1.6), scale: 0.5 });
      return true;
    }
    case 'blessing': {
      // Blessing: a column of warm light falling on her, a ring of it spreading on the ground.
      fxSprite(ctx, 'celblessing', x, y + 2, { p, scale: 1.05 });
      groundRing(ctx, 'celringspirit', x, y, Math.min(1, p * 1.4), 70);
      return true;
    }
    case 'heavenslantern': {
      // Heaven's Lantern hanging over the monsters (it moves with world.lantern, so it's placed by
      // its own world position, offset to the screen as (x, y) is): it fades up as it rises, glows
      // and breathes while its rays fall, and is gone when it blazes.
      const L = f.lantern;
      if (!L) return true;
      const lx = L.x + (x - f.x);
      const ly = L.y + (y - f.y);
      const s = LANTERN_SCALE * (0.55 + 0.45 * (L.rise ?? 0));
      const a = Math.min(1, (L.rise ?? 0) * 1.6) * (L.gone ? 0 : 1);
      const glow = 0.5 + 0.5 * Math.sin(f.t * 5);
      fxSprite(ctx, 'cellanternbig', lx, ly + 90 * s, { frame: 3, scale: s, alpha: a });
      fxSprite(ctx, 'cellanternbig', lx, ly + 90 * s, { frame: 4, scale: s, alpha: a * glow });
      return true;
    }
    case 'lanternray': {
      // A ray from the lantern: a column of its light falling on a monster.
      fxSprite(ctx, 'celblessing', x, y + 2, { p, scale: 0.8 });
      return true;
    }
    case 'lanternblaze': {
      // The lantern's last blaze: it flares and bursts into motes over everything.
      fxSprite(ctx, 'cellanternbig', x, y + 90 * LANTERN_SCALE, { p: 0.6 + 0.4 * p, scale: LANTERN_SCALE * (1 + 0.25 * p) });
      fxSprite(ctx, 'celspirithit', x, y, { p, scale: 1.6 });
      return true;
    }
    default:
      return false;
  }
}

// Her bolts in flight: a wisp of white light trailing paper streamers and a scarlet cord, pointed
// along its flight; a great bolt drawn large.
export function drawSpiritShot(ctx, f, x, y, dir, time) {
  if (f.shot !== 'spiritorb' && f.shot !== 'spiritbig') return false;
  const big = f.shot === 'spiritbig';
  const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
  fxSprite(ctx, 'celspiritorb', x, y, { t: time, rot: ang, scale: big ? 0.42 : 0.28 });
  return true;
}
