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

// A torii gate of light, `h` tall, standing at (x, y) and risen `rise` (0-1) out of the ground:
// two vermilion pillars, the black-capped lintel curving up at the ends, a crossbeam, all glowing
// warm gold; see-through, so what's under it (the guardian, the monsters) still shows.
function toriiGate(ctx, x, y, h, rise, alpha) {
  if (alpha <= 0 || rise <= 0) return;
  const w = h * 0.66;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha *= alpha * 0.8;
  // Rising out of the ground: drawn only above the ground line, pushed up as it rises.
  ctx.beginPath();
  ctx.rect(-w, -h * 1.3, w * 2, h * 1.3);
  ctx.clip();
  ctx.translate(0, h * (1 - rise));
  ctx.shadowColor = 'rgba(255, 214, 120, 0.9)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#e8453a';
  ctx.fillRect(-w * 0.36, -h * 0.82, w * 0.1, h * 0.82);
  ctx.fillRect(w * 0.26, -h * 0.82, w * 0.1, h * 0.82);
  ctx.fillRect(-w * 0.44, -h * 0.66, w * 0.88, h * 0.07);
  ctx.beginPath();
  ctx.moveTo(-w * 0.56, -h * 0.98);
  ctx.quadraticCurveTo(0, -h * 0.84, w * 0.56, -h * 0.98);
  ctx.lineTo(w * 0.5, -h * 0.84);
  ctx.quadraticCurveTo(0, -h * 0.76, -w * 0.5, -h * 0.84);
  ctx.closePath();
  ctx.fillStyle = '#2a1e22';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8453a';
  ctx.fillRect(-w * 0.48, -h * 0.84, w * 0.96, h * 0.06);
  // The light in the gate.
  ctx.globalAlpha *= 0.22;
  ctx.fillStyle = '#fff3c8';
  ctx.fillRect(-w * 0.26, -h * 0.6, w * 0.52, h * 0.6);
  ctx.restore();
}

// A soft round glow of cold light (the yuki-onna's soul-wisps and mist).
function glow(ctx, x, y, r, a, c = '#bfe0ff') {
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, a);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, c);
  g.addColorStop(1, 'rgba(160, 200, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
// Shards of ice flying out from (x, y) and falling (`p` 0-1 through it).
function shards(ctx, x, y, p, n, reach, seed = 0.5, c = '#d8ecff') {
  if (p <= 0 || p >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - p;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (0.1 + 0.8 * ((i + seed * 3) % n) / n) + Math.sin(i * 7.3 + seed * 10) * 0.2;
    const d = reach * p * (0.6 + 0.4 * ((i * 37) % 10) / 10);
    const sx = x + Math.cos(a) * d;
    const sy = y + Math.sin(a) * d + 60 * p * p;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a + p * 8 * (i % 2 ? 1 : -1));
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(2.6, 0);
    ctx.lineTo(-1.6, -1.2);
    ctx.lineTo(-1.6, 1.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
const soft = (t) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));

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
    case 'kitsunejab': {
      // One of Hundred Thrusts' jabs: a quick straight streak of light along the blade's line.
      fxSprite(ctx, 'celstreak', x, y, { p, flip, scale: 0.42 });
      return true;
    }
    case 'grandblessing': {
      // Grand Blessing: a great pillar of warm light on her, a wide gold ring racing out over the
      // whole party, and a glow lingering.
      fxSprite(ctx, 'celpillarholy', x, y + 4, { p: Math.min(1, p * 1.15), scale: 1.2 });
      fxSprite(ctx, 'celblessing', x, y + 2, { p, scale: 1.35 });
      groundRing(ctx, 'celringholy', x, y, Math.min(1, p * 1.3), 300);
      groundRing(ctx, 'celringspirit', x, y, Math.min(1, p * 1.8), 160);
      return true;
    }
    case 'purifycircle': {
      // Purification: a circle of sacred light on the ground where she struck it, its ring of gold
      // turning slowly, a magic circle inside it, and motes of light rising from it; it fades as it
      // runs out.
      const Z = f.zone;
      const fade = Math.min(1, f.t * 4, Math.max(0, f.dur - f.t) * 2.5);
      if (fade <= 0) return true;
      fxSprite(ctx, 'celcircle', x, y, { frame: 0, scale: f.r / 46, sy: 0.3, rot: 0, alpha: 0.65 * fade });
      groundRing(ctx, 'celringholy', x, y, 0.62, f.r, { alpha: 0.42 * fade });
      groundRing(ctx, 'celringholy', x, y, 0.3 + 0.5 * ((f.t * 0.8) % 1), f.r * 0.7, { alpha: 0.22 * fade });
      for (let i = 0; i < 4; i++) fxSprite(ctx, 'celmotes', x + (i - 1.5) * f.r * 0.45, y, { t: f.t + i * 0.4, scale: 0.55, alpha: 0.7 * fade });
      if (Z && Z.until <= f.t) return true;
      return true;
    }
    case 'purifyburn': {
      // A monster burning in the sacred light.
      fxSprite(ctx, 'celholyhit', x, y - (f.h ?? 24) * 0.5, { p, scale: 0.42 });
      return true;
    }
    case 'reviveflash': {
      // Someone raised (or saved by Last Rite): a pillar of gold light on them and a flash.
      fxSprite(ctx, 'celpillarholy', x, y + 4, { p, scale: 0.8 });
      fxSprite(ctx, 'celholyhit', x, y - 26, { p: Math.min(1, p * 1.5), scale: 0.7 });
      return true;
    }
    case 'resurrection': {
      // Resurrection Dance: a ring of gold light going out over everyone nearby, and light falling
      // on her.
      groundRing(ctx, 'celringholy', x, y, Math.min(1, p * 1.2), 320);
      fxSprite(ctx, 'celblessing', x, y + 2, { p, scale: 1.1 });
      return true;
    }
    case 'thousandtorii': {
      // Thousand Torii: the corridor of gates, each rising out of the ground at its moment with a
      // flash and a ring, a band of light along the ground joining them, all fading together.
      const T = f.torii;
      if (!T) return true;
      const ox = x - f.x;
      const oy = y - f.y;
      const end = T.n * T.gap + T.hold;
      const fade = Math.min(1, Math.max(0, end + 0.6 - f.t) / 0.6);
      const up = T.gates.filter((g) => f.t >= g.at - T.t0);
      if (up.length > 1) {
        const a = up[0];
        const b = up[up.length - 1];
        ctx.save();
        ctx.globalAlpha *= 0.45 * fade;
        ctx.fillStyle = '#fff1c0';
        ctx.fillRect(Math.min(a.x, b.x) + ox - 20, Math.min(a.y, b.y) + oy - 3, Math.abs(b.x - a.x) + 40, 4);
        ctx.restore();
      }
      for (const g of up) {
        const age = f.t - (g.at - T.t0);
        toriiGate(ctx, g.x + ox, g.y + oy, 84, Math.min(1, age / 0.2), fade);
        if (age < 0.5) {
          groundRing(ctx, 'celringholy', g.x + ox, g.y + oy, age / 0.5, 70);
          fxSprite(ctx, 'celholyhit', g.x + ox, g.y + oy - 40, { p: age / 0.5, scale: 0.6 });
        }
      }
      return true;
    }
    // The Onmyoji's oni: her club landing (a red impact flash), her Ground Pound's shock racing out
    // both ways, and the puff of red smoke she stomps out of when she catches up.
    case 'onihit': {
      fxSprite(ctx, 'celhitred', x, y - (f.h ?? 24) * 0.5, { p, flip, scale: f.big ? 0.8 : 0.6 });
      return true;
    }
    case 'oniimpact': {
      // Where her club strikes: a red blast punched out of the ground.
      fxSprite(ctx, 'celhitred', x, y - 14, { p, flip, scale: f.big ? 1.3 : 0.8 });
      if (f.big) fxSprite(ctx, 'celblast', x, y + 4, { p, scale: 0.75 });
      return true;
    }
    // The Onmyoji's yuki-onna: the frost she leaves where she drifts, her breath, needles,
    // icicles, blizzard, snow step and the sparkle of cold where she hits.
    case 'yukiprint': {
      // A patch of frost on the ground: a little cluster of ice crystals that whitens and melts away.
      const fade = Math.min(1, f.t * 6) * (1 - Math.max(0, (p - 0.55) / 0.45));
      if (fade <= 0) return true;
      ctx.save();
      ctx.globalAlpha *= fade;
      ctx.fillStyle = 'rgba(225, 240, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160, 200, 245, 0.9)';
      ctx.lineWidth = 0.7;
      const r = f.seed ?? 0.5;
      for (let i = 0; i < 4; i++) {
        const cx = x + (i - 1.5) * 3.2 + (r - 0.5) * 2;
        const cy = y - 0.4 + ((i * 7 + r * 10) % 3) * 0.4 - 0.6;
        for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(a) * 1.3, cy - Math.sin(a) * 0.5);
          ctx.lineTo(cx + Math.cos(a) * 1.3, cy + Math.sin(a) * 0.5);
          ctx.stroke();
        }
      }
      ctx.restore();
      return true;
    }
    case 'yukistream': {
      // White Breath: a long stream of bright white smoke from her lips, sloping down onto what she
      // bends over, billowing as it goes, snowflakes tumbling in it.
      const dir = f.dir || 1;
      // (From her lips, wherever her bending and swaying put them.)
      if (f.yuki?.mouth) [x, y] = [f.yuki.mouth[0] - f.x + x, f.yuki.mouth[1] - f.y + y];
      const k = Math.min(1, p * 5) * (1 - Math.max(0, (p - 0.8) / 0.2));
      const r = f.r ?? 118;
      ctx.save();
      for (let i = 0; i < 20; i++) {
        const u = (f.t * 1.4 + i / 20) % 1;
        const d = u * r;
        const wob = Math.sin(f.t * 7 + i * 1.9) * (1 + u * 4);
        const cy = y + d * 0.2 + wob * Math.min(1, u * 4);
        const rr = 1.2 + u * 13;
        ctx.globalAlpha = k * (1 - 0.45 * u);
        const g = ctx.createRadialGradient(x + dir * d, cy, 0, x + dir * d, cy, rr);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.6, 'rgba(236, 246, 255, 0.85)');
        g.addColorStop(1, 'rgba(200, 225, 250, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x + dir * d, cy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      fxSprite(ctx, 'celsmoke', x + dir * r * 0.85, y + r * 0.2 + 8, { t: f.t, scale: 0.3, flip: dir < 0, alpha: 0.45 * k });
      for (let i = 0; i < 5; i++) {
        const u = (f.t * 1.1 + i / 5) % 1;
        fxSprite(ctx, 'celsnowflake', x + dir * u * r, y + u * r * 0.2 + Math.sin(f.t * 5 + i) * u * 10, { t: f.t + i, scale: 0.07 + 0.05 * u, alpha: k });
      }
      return true;
    }
    case 'yukineedle': {
      // An ice needle flying straight at its mark, a glint down its length.
      if (f.t < 0) return true;
      const ox = x - f.x;
      const oy = y - f.y;
      const m = f.mob;
      const tx = (m && m.hp > 0 ? m.x : f.tx) + ox;
      const ty = (m && m.hp > 0 ? m.y - m.def.h * 0.6 : f.ty) + oy;
      const u = Math.min(1, f.t / f.fly);
      if (u >= 1) return true;
      const cx = x + (tx - x) * u;
      const cy = y + (ty - y) * u;
      const ang = Math.atan2(ty - y, tx - x);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.fillStyle = '#d8ecff';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-6, -1.3);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-6, 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(6, -0.2);
      ctx.lineTo(-5, -0.6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-20, 0);
      ctx.stroke();
      ctx.restore();
      return true;
    }
    case 'yukiicicle': {
      // Icicle Fall: a great icicle dropping out of the sky onto the monster, shattering on it.
      const ox = x - f.x;
      const m = f.mob;
      const mx = (m && m.hp > 0 ? m.x : f.x) + ox;
      if (f.t < f.fall) {
        const u = f.t / f.fall;
        const ty = y - 160 * (1 - u * u) - (m?.def.h ?? 24);
        ctx.save();
        ctx.translate(mx, ty);
        ctx.fillStyle = '#cfe4fb';
        ctx.beginPath();
        ctx.moveTo(-6, -22);
        ctx.lineTo(6, -22);
        ctx.lineTo(0, 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-3, -22);
        ctx.lineTo(0, -22);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8ab4e8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-6, -22);
        ctx.lineTo(0, 16);
        ctx.lineTo(6, -22);
        ctx.stroke();
        ctx.restore();
        return true;
      }
      const q = (f.t - f.fall) / (f.dur - f.fall);
      fxSprite(ctx, 'celfrostburst', mx, y - (m?.def.h ?? 24) * 0.5, { p: q, scale: f.shatter ? 0.9 : 0.6 });
      if (f.shatter) shards(ctx, mx, y - (m?.def.h ?? 24) * 0.5, q, 10, 46);
      return true;
    }
    case 'yukiwhiteout': {
      // Whiteout: the world goes white round her (a haze, thickest at her), snow driving sideways
      // through it, flakes whirling, frost on the ground.
      const k = Math.min(1, p * 5) * (1 - Math.max(0, (p - 0.82) / 0.18));
      const r = f.r ?? 170;
      ctx.save();
      ctx.globalAlpha *= 0.38 * k;
      const g = ctx.createRadialGradient(x, y - 30, 10, x, y - 30, r * 1.2);
      g.addColorStop(0, 'rgba(250, 252, 255, 0.95)');
      g.addColorStop(0.6, 'rgba(232, 242, 255, 0.6)');
      g.addColorStop(1, 'rgba(220, 235, 252, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y - 30, r * 1.2, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      groundRing(ctx, 'celringice', x, y, 0.5, r * 0.8, { alpha: 0.3 * k });
      // Driving snow.
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const sp = 180 + (i % 5) * 40;
        const sx = x - r * 1.3 + ((((i * 97) % 260) / 260) * r * 2.6 + f.t * sp) % (r * 2.6);
        const sy = y - 100 + ((i * 53) % 110) + Math.sin(f.t * 3 + i) * 4;
        const edge = 1 - Math.abs(sx - x) / (r * 1.3);
        ctx.globalAlpha = k * Math.max(0, edge) * 0.9;
        ctx.lineWidth = 0.8 + (i % 3) * 0.4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 5 - (i % 4) * 2, sy - 1.2);
        ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 14; i++) {
        const a = f.t * (2 + (i % 3) * 0.5) + (i / 14) * Math.PI * 2;
        const rr = r * (0.3 + 0.6 * ((i * 37) % 10) / 10);
        fxSprite(ctx, 'celsnowflake', x + Math.cos(a) * rr, y - 20 - 50 * ((i * 13) % 10) / 10 + Math.sin(a) * rr * 0.2, { t: f.t + i, scale: 0.1 + 0.04 * (i % 3), alpha: k });
      }
      return true;
    }
    case 'yukiask': {
      // Answer Me: her question, a whisper hanging cold in the air by her lips.
      const k = Math.min(1, p * 6) * (1 - Math.max(0, (p - 0.7) / 0.3));
      if (f.yuki?.mouth) [x, y] = [f.yuki.mouth[0] - f.x + x, f.yuki.mouth[1] - f.y + y - 12];
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(60, 90, 150, 0.9)';
      const ty = y - 6 * p;
      ctx.strokeText('…?', x + (f.dir || 1) * 8, ty);
      ctx.fillStyle = '#eef6ff';
      ctx.fillText('…?', x + (f.dir || 1) * 8, ty);
      ctx.restore();
      fxSprite(ctx, 'celsnowflake', x + (f.dir || 1) * 18, ty - 4, { t: f.t, scale: 0.07, alpha: k });
      return true;
    }
    case 'yukisoul': {
      // Answer Me: its soul drawn out of it, a pale blue thread of light flowing from the monster
      // into her cupped hands, where it gathers as an orb.
      const m = f.mob;
      const ox = x - f.x;
      const k = Math.min(1, p * 5) * (1 - Math.max(0, (p - 0.9) / 0.1));
      const mx = (m ? m.x : f.x) + ox;
      const my = (m ? m.y - m.def.h * 0.6 : f.y) + (y - f.y);
      for (let i = 0; i < 9; i++) {
        const u = (f.t * 1.2 + i / 9) % 1;
        const px = mx + (x - mx) * u;
        const py = my + (y - my) * u + Math.sin(u * Math.PI * 2 + f.t * 4) * 5 * (1 - u);
        glow(ctx, px, py, 3.4 - 1.4 * u, k * (0.4 + 0.6 * Math.sin(u * Math.PI)));
      }
      glow(ctx, x, y, 3 + 3 * Math.min(1, p * 1.5) + 0.6 * Math.sin(f.t * 9), k);
      return true;
    }
    case 'yukisoulfly': {
      // Answer Me: let go, the soul drifts to the Onmyoji in a slow arc, trailing light.
      const tx = f.tx + (x - f.x);
      const ty = f.ty + (y - f.y);
      for (let i = 4; i >= 0; i--) {
        const u = Math.max(0, p - i * 0.05);
        const px = x + (tx - x) * soft(u);
        const py = y + (ty - y) * soft(u) - Math.sin(u * Math.PI) * 30;
        glow(ctx, px, py, 5 - i * 0.8, 1 - i * 0.18);
      }
      return true;
    }
    case 'yukispike': {
      // Ice Spikes: a cluster of jagged ice crystals bursting up out of the ground (the middle one
      // tallest), holding a moment, then cracking apart.
      if (f.t < 0) return true;
      const rise = soft(f.t / 0.1);
      const crack = Math.max(0, (f.t - 0.55) / 0.35);
      const H = f.big ? 40 : 30;
      const r = f.seed ?? 0.5;
      ctx.save();
      ctx.globalAlpha *= 1 - crack;
      ctx.beginPath();
      ctx.rect(x - 30, y - H * 1.4, 60, H * 1.4 + 1);
      ctx.clip();
      for (const [dx, hh, w, lean] of [[-7 - r * 2, 0.55, 5, -0.35], [7 + r * 2, 0.62, 5, 0.3], [-2.5, 0.85, 5.5, -0.12], [2 + r, 1, 6.5, 0.08]]) {
        const h = H * hh * rise;
        const bx = x + dx;
        const tx = bx + lean * h;
        ctx.fillStyle = '#9cc4ee';
        ctx.beginPath();
        ctx.moveTo(bx - w, y + 1);
        ctx.lineTo(tx, y - h);
        ctx.lineTo(bx + w, y + 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e4f2ff';
        ctx.beginPath();
        ctx.moveTo(bx - w, y + 1);
        ctx.lineTo(tx, y - h);
        ctx.lineTo(bx + w * 0.15, y + 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx - w * 0.4, y - 2);
        ctx.lineTo(tx - lean * 3, y - h + 4);
        ctx.stroke();
        if (crack > 0) {
          ctx.strokeStyle = 'rgba(70, 110, 170, 0.8)';
          ctx.beginPath();
          ctx.moveTo(bx - w * 0.6, y - h * 0.3);
          ctx.lineTo(bx + w * 0.2, y - h * 0.45);
          ctx.lineTo(bx - w * 0.1, y - h * 0.6);
          ctx.stroke();
        }
      }
      ctx.restore();
      if (f.t < 0.35) fxSprite(ctx, 'celfrostburst', x, y - 8, { p: f.t / 0.35, scale: f.big ? 0.42 : 0.32 });
      if (crack > 0) shards(ctx, x, y - H * 0.5, crack, 7, 22, r);
      // Frost left on the ground where it stood.
      ctx.save();
      ctx.globalAlpha *= 0.8 * (1 - Math.max(0, (f.t - 0.6) / 0.3));
      ctx.fillStyle = '#eef6ff';
      ctx.beginPath();
      ctx.ellipse(x, y, 13, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    }
    case 'yukisnowball': {
      // A snowball tossed underhand, arcing over to its mark.
      const tx = (f.mob && f.mob.hp > 0 ? f.mob.x : f.tx) + (x - f.x);
      const ty = (f.mob && f.mob.hp > 0 ? f.mob.y - f.mob.def.h * 0.5 : f.ty) + (y - f.y);
      const u = Math.min(1, f.t / f.fly);
      if (u >= 1) return true;
      const bx = x + (tx - x) * u;
      const by = y + (ty - y) * u - Math.sin(u * Math.PI) * 28;
      ctx.save();
      ctx.fillStyle = '#b8d0ee';
      ctx.beginPath();
      ctx.arc(bx, by, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx - 0.6, by - 0.6, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      fxSprite(ctx, 'celsnowflake', bx - (tx - x) * 0.04, by + 2, { t: f.t, scale: 0.05, alpha: 0.8 });
      return true;
    }
    case 'yukipuff': {
      // The snowball bursting on the monster: a puff of snow.
      if (f.t < 0) return true;
      const m = f.mob;
      const px = (m && m.hp > 0 ? m.x : f.x) + (x - f.x);
      const q = Math.min(1, f.t / 0.5);
      fxSprite(ctx, 'celfrostburst', px, y, { p: q, scale: 0.3 });
      shards(ctx, px, y, q, 6, 14, 0.3, '#ffffff');
      return true;
    }
    case 'yukimist': {
      // Into the Mist: a drift of white mist carrying her off from where she was to where she
      // gathers again.
      const tx = f.tx + (x - f.x);
      const ty = f.ty + (y - f.y);
      const lead = soft(Math.min(1, p / 0.75));
      for (let i = 0; i < 6; i++) {
        const u = Math.max(0, lead - i * 0.09);
        const k = (1 - i / 6) * (1 - Math.max(0, (p - 0.75) / 0.25));
        const px = x + (tx - x) * u;
        const py = y + (ty - y) * u - 22 - Math.sin(u * Math.PI) * 10 + Math.sin(f.t * 5 + i) * 3;
        fxSprite(ctx, 'celsmoke', px, py + 14, { t: f.t + i * 0.1, scale: 0.26 - i * 0.02, alpha: 0.55 * k });
        glow(ctx, px, py, 7 - i * 0.6, 0.45 * k, '#ffffff');
        fxSprite(ctx, 'celsnowflake', px + Math.sin(i * 3.1) * 10, py + Math.cos(i * 2.3) * 8, { t: f.t + i, scale: 0.07, alpha: k });
      }
      return true;
    }
    case 'yukifrost': {
      // Her cold on a monster: frost creeping over it, more crystals and a paler coat the colder it
      // gets, a rim of frost at its feet.
      const m = f.mob;
      const n = m?.yukiChill?.n ?? 0;
      if (!m || m.hp <= 0 || n <= 0) return true;
      const k = 1 - Math.max(0, (p - 0.8) / 0.2);
      const mx = m.x + (x - f.x);
      const my = m.y + (y - f.y);
      const w = m.def.w;
      const h = m.def.h;
      ctx.save();
      ctx.globalAlpha *= k * Math.min(0.42, 0.09 * n);
      ctx.fillStyle = '#dcecff';
      ctx.beginPath();
      ctx.ellipse(mx, my - h * 0.5, w * 0.55, h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < n * 3; i++) {
        const cx = mx + (((i * 37 + (m.uid ?? 0) * 11) % 100) / 100 - 0.5) * w * 0.9;
        const cy = my - (((i * 61 + (m.uid ?? 0) * 7) % 100) / 100) * h * 0.95;
        const r = 1.2 + (i % 3) * 0.5;
        for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) {
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(235, 245, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(mx, my, w * 0.5 + n, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    }
    case 'yukistep': {
      // Snow Step: she comes apart into a flurry of snow (or gathers out of one).
      fxSprite(ctx, 'celfrostburst', x, y - 26, { p, scale: 0.55 });
      fxSprite(ctx, 'celmotes', x, y, { t: f.t, scale: 0.7, alpha: 1 - p });
      return true;
    }
    case 'yukihit': {
      // Her cold landing: a burst of frost on the monster.
      fxSprite(ctx, 'celfrostburst', x, y - (f.h ?? 24) * 0.55, { p, flip, scale: f.big ? 0.55 : 0.35 });
      return true;
    }
    case 'yukishatter': {
      // A frozen monster shattering: a big burst of frost and shards of ice flying off it.
      fxSprite(ctx, 'celfrostburst', x, y - (f.h ?? 24) * 0.55, { p, flip, scale: 0.85 });
      shards(ctx, x, y - (f.h ?? 24) * 0.55, p, 12, 50);
      return true;
    }
    case 'onipound': {
      groundRing(ctx, 'celshockred', x, y, Math.min(1, p * 1.3), f.r ?? 120);
      return true;
    }
    case 'oniaura': {
      // Her charge winding up: red fire flaring up round her.
      fxSprite(ctx, 'celragefire', x, y + 2, { t: f.t, scale: 1.2, alpha: 1 - p });
      return true;
    }
    case 'oniroar': {
      // Her roar: a red shout bursting from her and a shockwave racing out round her.
      fxSprite(ctx, 'celshoutred', x + (f.dir || 1) * 10, y - 70, { p, flip, scale: 1.1 });
      groundRing(ctx, 'celshockred', x, y, Math.min(1, p * 1.3), 170);
      return true;
    }
    case 'onipuff': {
      fxSprite(ctx, 'celsmokebomb', x, y, { p, scale: 0.7 });
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
