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

// A black crow feather at (x, y) turned to `ang`, `len` long (the tengu's), a blue sheen down it;
// `sharp` makes it a flying blade of a feather with a pale streak behind.
function feather(ctx, x, y, ang, len, a = 1, sharp = false) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, a);
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (sharp) {
    ctx.strokeStyle = 'rgba(200, 215, 255, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-len * 2.6, 0);
    ctx.stroke();
  }
  ctx.fillStyle = '#17151f';
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.quadraticCurveTo(len * 0.2, -len * 0.32, -len, -0.2);
  ctx.lineTo(-len, 0.2);
  ctx.quadraticCurveTo(len * 0.2, len * 0.32, len, 0);
  ctx.fill();
  ctx.strokeStyle = '#4a5a8a';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-len * 1.1, 0);
  ctx.lineTo(len * 0.8, 0);
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
      ctx.globalAlpha *= 0.24 * k;
      const g = ctx.createRadialGradient(x, y - 30, 10, x, y - 30, r);
      g.addColorStop(0, 'rgba(250, 252, 255, 0.95)');
      g.addColorStop(0.6, 'rgba(232, 242, 255, 0.6)');
      g.addColorStop(1, 'rgba(220, 235, 252, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y - 30, r, r * 0.42, 0, 0, Math.PI * 2);
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
      ctx.globalAlpha *= k * Math.min(0.26, 0.055 * n);
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
    case 'yukifrostfan': {
      // Frost Fan: a short cone of whirling snow thrown off her sleeve, flakes tumbling out and a
      // white swirl through them.
      const dir = f.dir || 1;
      const r = f.r ?? 120;
      const k = 1 - Math.max(0, (p - 0.6) / 0.4);
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const d = r * Math.min(1, p * 1.6) * (0.5 + 0.2 * i);
        ctx.globalAlpha = 0.7 * k;
        ctx.lineWidth = 2 - 0.5 * i;
        ctx.beginPath();
        ctx.ellipse(x + dir * d * 0.5, y + 4, d * 0.5, 10 + 6 * i, 0, dir > 0 ? -1.2 : Math.PI - 0.4, dir > 0 ? 0.4 : Math.PI + 1.2);
        ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 12; i++) {
        const a = -0.5 + (i / 11) * 0.8;
        const d = r * Math.min(1, p * 1.5) * (0.4 + 0.6 * ((i * 37) % 10) / 10);
        fxSprite(ctx, 'celsnowflake', x + dir * Math.cos(a) * d, y + Math.sin(a) * d * 0.6 + 6, { t: f.t * 2 + i, scale: 0.06 + 0.04 * (i % 3), alpha: k });
      }
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
    // The Onmyoji's tengu: his sword cuts, the dash through, the fan's gust and whirlwind, his
    // feathers, the stones out of the sky, his take-offs and his vanishing in feathers.
    case 'tengucut': {
      // A cut of his sword: a thin bright crescent (rising, across or down), or for a dash through
      // a long slit of light along the way he went, opening and fading.
      if (f.t < 0) return true;
      const dir = f.dir || 1;
      const k = 1 - p;
      ctx.save();
      ctx.lineCap = 'round';
      if (f.cut === 'through') {
        const w = Math.max(40, f.w ?? 70) * 0.6 + 20;
        const open = Math.min(1, p * 5);
        ctx.globalAlpha *= k;
        ctx.shadowColor = 'rgba(190, 215, 255, 0.9)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (f.big ? 2.6 : 1.8) * (1 - p * 0.6);
        ctx.beginPath();
        ctx.moveTo(x - w * open, y);
        ctx.lineTo(x + w * open, y - 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(160, 190, 255, 0.6)';
        ctx.lineWidth = 6 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(x - w * open * 0.8, y);
        ctx.lineTo(x + w * open * 0.8, y - 1.6);
        ctx.stroke();
      } else {
        const [a0, a1] = { up: [2.2, 4.4], across: [3.6, 5.6], down: [4.2, 6.4] }[f.cut] ?? [3.6, 5.6];
        const r = f.big ? 30 : 24;
        const sweep = Math.min(1, p * 4);
        ctx.translate(x, y);
        if (dir < 0) ctx.scale(-1, 1);
        ctx.globalAlpha *= k;
        ctx.shadowColor = 'rgba(190, 215, 255, 0.9)';
        ctx.shadowBlur = 8;
        for (const [w, c] of [[5, 'rgba(160, 190, 255, 0.45)'], [1.8, '#ffffff']]) {
          ctx.strokeStyle = c;
          ctx.lineWidth = w * (1 - p * 0.5);
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.55, 0, a0, a0 + (a1 - a0) * sweep);
          ctx.stroke();
        }
      }
      ctx.restore();
      return true;
    }
    case 'tengudash': {
      // His dash: a streak of shadow along the way he went, black feathers left drifting in it.
      const tx = f.tx + (x - f.x);
      const k = 1 - p;
      ctx.save();
      const g = ctx.createLinearGradient(x, 0, tx, 0);
      g.addColorStop(0, 'rgba(30, 26, 40, 0)');
      g.addColorStop(1, `rgba(30, 26, 40, ${0.5 * k})`);
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(x, tx), y - 40, Math.abs(tx - x), 36);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * k})`;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        const yy = y - 8 - i * 7;
        ctx.beginPath();
        ctx.moveTo(x + (tx - x) * (0.1 + 0.1 * i), yy);
        ctx.lineTo(tx - (tx - x) * 0.1, yy);
        ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 4; i++) feather(ctx, x + (tx - x) * (0.2 + 0.2 * i), y - 30 + i * 4 + p * 14, 1 + i + p * 3, 5, k);
      return true;
    }
    case 'tengugust': {
      // Fan Gust: a wall of wind rolling out ahead of him, streaks curling through it and leaves
      // tumbling along.
      const dir = f.dir || 1;
      const r = f.r ?? 190;
      const k = 1 - Math.max(0, (p - 0.6) / 0.4);
      const front = r * Math.min(1, p * 1.6);
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 11; i++) {
        const lag = (i % 4) * 0.08;
        const d = Math.max(0, front - lag * r);
        const yy = y - 26 + i * 5.4;
        const len = 26 + (i % 3) * 10;
        ctx.globalAlpha = k * (0.4 + 0.5 * ((i * 7) % 5) / 5);
        ctx.strokeStyle = i % 2 ? '#ffffff' : '#d4ecf0';
        ctx.lineWidth = 1 + (i % 3) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + dir * (d - len), yy + 2);
        ctx.quadraticCurveTo(x + dir * (d - len * 0.4), yy - 3, x + dir * d, yy);
        ctx.stroke();
      }
      ctx.restore();
      fxSprite(ctx, 'celwindspin', x + dir * front * 0.9, y + 6, { t: f.t, scale: 0.4, alpha: 0.7 * k, flip: dir < 0 });
      fxSprite(ctx, 'celleaves', x + dir * front * 0.8, y - 4, { t: f.t, scale: 0.4, alpha: k, flip: dir < 0 });
      return true;
    }
    case 'tenguwhirl': {
      // Tengu Wind: a whirlwind standing on the ground, leaves and black feathers whirling up it.
      const k = Math.min(1, p * 6) * (1 - Math.max(0, (p - 0.82) / 0.18));
      fxSprite(ctx, 'celtornado', x, y + 4, { t: f.t, scale: 0.7, alpha: 0.85 * k });
      // Bands of wind spiralling up it, widening as they rise.
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const h = ((f.t * 90 + i * 14) % 96);
        const rr = 8 + h * 0.32;
        const a0 = f.t * 10 + i * 1.7;
        ctx.globalAlpha = k * (0.85 - h / 140);
        ctx.strokeStyle = i % 2 ? '#ffffff' : '#c8eef0';
        ctx.lineWidth = 1.6 - h / 120;
        ctx.beginPath();
        ctx.ellipse(x, y - h, rr, rr * 0.28, 0, a0, a0 + 2.4);
        ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 8; i++) {
        const a = f.t * 7 + (i / 8) * Math.PI * 2;
        const h = ((f.t * 60 + i * 13) % 70);
        const rr = 8 + h * 0.25;
        if (i % 2) feather(ctx, x + Math.cos(a) * rr, y - h, a, 4, k);
        else fxSprite(ctx, 'celleaves', x + Math.cos(a) * rr, y - h, { t: f.t + i, scale: 0.18, alpha: k });
      }
      return true;
    }
    case 'tengufeather': {
      // One of his feathers, flying straight and fast at its mark like a thrown knife.
      if (f.t < 0) return true;
      const m = f.mob;
      const tx = (m && m.hp > 0 ? m.x : f.tx) + (x - f.x);
      const ty = (m && m.hp > 0 ? m.y - m.def.h * 0.55 : f.ty) + (y - f.y);
      const u = Math.min(1, f.t / f.fly);
      if (u >= 1) return true;
      const ang = Math.atan2(ty - y, tx - x);
      feather(ctx, x + (tx - x) * u, y + (ty - y) * u, ang, 7, 1, true);
      return true;
    }
    case 'tengufeatherburst': {
      // Black feathers bursting out and drifting down, turning as they fall.
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (f.seed ?? 0.3) * 3;
        const d = 28 * Math.sqrt(p) * (0.6 + 0.4 * ((i * 37) % 10) / 10);
        feather(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 + 26 * p * p, a + p * 6 * (i % 2 ? 1 : -1), 4.5, 1 - p);
      }
      return true;
    }
    case 'tengustone': {
      // A stone out of a clear sky: dropping fast onto the spot, then a puff of dust and chips.
      if (f.t < 0) return true;
      const fall = 0.3;
      const r = f.big ? 6 : 4.2;
      if (f.t < fall) {
        const u = f.t / fall;
        const sy = y - 150 * (1 - u * u) - r;
        ctx.save();
        ctx.translate(x, sy);
        ctx.rotate(f.t * 9 + (f.seed ?? 0) * 6);
        ctx.fillStyle = '#7a7486';
        ctx.beginPath();
        ctx.moveTo(-r, -r * 0.4);
        ctx.lineTo(-r * 0.3, -r);
        ctx.lineTo(r * 0.8, -r * 0.7);
        ctx.lineTo(r, r * 0.3);
        ctx.lineTo(r * 0.2, r);
        ctx.lineTo(-r * 0.8, r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a3646';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = '#a8a2b4';
        ctx.fillRect(-r * 0.4, -r * 0.6, r * 0.6, r * 0.4);
        ctx.restore();
        return true;
      }
      const q = (f.t - fall) / (f.dur - fall);
      fxSprite(ctx, 'celdust', x, y, { p: q, scale: f.big ? 0.4 : 0.28 });
      return true;
    }
    case 'tengutakeoff': {
      // A beat of his wings: dust blown out along the ground both ways and a few feathers loose.
      fxSprite(ctx, 'celdust', x, y, { p, scale: f.land ? 0.4 : 0.5 });
      for (let i = 0; i < 3; i++) feather(ctx, x + (i - 1) * 10 * (1 + p), y - 10 - 18 * p + i * 3, i + p * 4, 4, 1 - p);
      return true;
    }
    case 'tenguvanish': {
      // Gone in a whirl of black feathers (or stepping out of one).
      fxSprite(ctx, 'celsmoke', x, y, { p, scale: 0.4, alpha: 0.5 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + p * 4;
        const d = 6 + 22 * p;
        feather(ctx, x + Math.cos(a) * d, y - 24 + Math.sin(a) * d * 0.9, a + p * 5, 4.5, 1 - p);
      }
      return true;
    }
    // The Onmyoji's: her talismans, the star seal, her rally, her Troupe Combo, and the doll fusing
    // into the tengu.
    case 'ofuda': {
      // A paper talisman: flies spinning to its mark, sticks fast, glows red, and bursts.
      if (f.t < 0) return true;
      const m = f.mob;
      const ox = x - f.x;
      const oy = y - f.y;
      let px;
      let py;
      let spin;
      let glow = 0;
      if (f.t < f.fly) {
        const u = f.t / f.fly;
        const tx = (m && m.hp > 0 ? m.x + f.dx : f.tx) + ox;
        const ty = (m && m.hp > 0 ? m.y + f.dy : f.ty) + oy;
        px = x + (tx - x) * u;
        py = y + (ty - y) * u - Math.sin(u * Math.PI) * (10 + f.arc * 0.6);
        spin = f.t * 18 + (f.seed ?? 0) * 6;
      } else {
        if (!m || m.hp <= 0) return true;
        px = m.x + f.dx + ox;
        py = m.y + f.dy + oy - (m.air ?? 0);
        spin = 0.3 * Math.sin((f.seed ?? 0) * 9);
        glow = Math.min(1, (f.t - f.fly) / f.stick);
      }
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(spin);
      ctx.scale(1.7, 1.7);
      if (glow > 0) {
        ctx.shadowColor = `rgba(255, 60, 60, ${glow})`;
        ctx.shadowBlur = 4 + 6 * glow;
      }
      ctx.fillStyle = '#fbf8ef';
      ctx.fillRect(-1.8, -3.6, 3.6, 7.2);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#d8323e';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let k = 0; k <= 5; k++) {
        const a = (-90 + k * 144) * (Math.PI / 180);
        const [sx, sy] = [Math.cos(a) * 1.3, Math.sin(a) * 1.3 - 0.6];
        if (k) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      ctx.stroke();
      ctx.fillStyle = '#2a2440';
      ctx.fillRect(-0.3, 1.2, 0.6, 1.8);
      if (glow > 0.6) {
        ctx.globalAlpha = (glow - 0.6) * 2.5;
        ctx.fillStyle = '#ff5a5a';
        ctx.fillRect(-1.8, -3.6, 3.6, 7.2);
      }
      ctx.restore();
      return true;
    }
    case 'ofudahit': {
      // A talisman striking home: a small flash.
      fxSprite(ctx, 'celhit', x, y - (f.h ?? 24) * 0.55, { p, flip, scale: 0.22 });
      return true;
    }
    case 'ofudaburst':
    case 'seimanburn': {
      // A red star seal bursting on a monster (a talisman's, or the seal's burning).
      const cy = y - (f.h ?? 24) * 0.55;
      const r = (f.kind === 'ofudaburst' ? 10 : 7) * (0.5 + p);
      ctx.save();
      ctx.globalAlpha *= 1 - p;
      ctx.strokeStyle = '#ff3a46';
      ctx.shadowColor = 'rgba(255, 60, 60, 0.9)';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let k = 0; k <= 5; k++) {
        const a = (-90 + k * 144) * (Math.PI / 180) + p * 0.6;
        const [sx, sy] = [x + Math.cos(a) * r, cy + Math.sin(a) * r];
        if (k) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, cy, r * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (f.kind === 'ofudaburst') fxSprite(ctx, 'celhitred', x, cy, { p, flip, scale: 0.36 });
      return true;
    }
    case 'seimanseal': {
      // Seiman Seal: the five-pointed star of onmyodo glowing on the ground in a double ring, turning
      // slowly, with characters of light round its rim and red sparks rising off it.
      const r = f.r ?? 110;
      const k = Math.min(1, p * 8) * (1 - Math.max(0, (p - 0.9) / 0.1));
      const draw = Math.min(1, f.t / 0.5);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.3);
      ctx.globalAlpha *= k;
      ctx.fillStyle = 'rgba(60, 20, 80, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'rgba(255, 50, 70, 0.9)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ff3a46';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2 * draw);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2 * draw);
      ctx.stroke();
      ctx.rotate(f.t * 0.4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      const pts = 5 * draw;
      for (let i = 0; i <= Math.floor(pts); i++) {
        const a = (-90 + i * 144) * (Math.PI / 180);
        if (i) ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
        else ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffd6da';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.fillRect(Math.cos(a) * r * 0.93 - 2, Math.sin(a) * r * 0.93 - 1, 4, 2 + (i % 3));
      }
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const u = (f.t * 0.8 + i / 6) % 1;
        const a = i * 2.3 + f.t * 0.4;
        ctx.save();
        ctx.globalAlpha *= k * Math.sin(u * Math.PI);
        ctx.fillStyle = i % 2 ? '#ff5a5a' : '#ffd0d4';
        ctx.fillRect(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.2 - u * 40, 1.6, 1.6);
        ctx.restore();
      }
      return true;
    }
    case 'yokairally': {
      // Yokai Rally: her raised talisman flares, and rings of red light go out from her.
      fxSprite(ctx, 'celhitred', x, y - 56, { p, scale: 0.5 });
      ctx.save();
      ctx.strokeStyle = '#ff3a46';
      for (let i = 0; i < 3; i++) {
        const u = Math.max(0, p * 1.4 - i * 0.2);
        if (u <= 0 || u >= 1) continue;
        ctx.globalAlpha = 1 - u;
        ctx.lineWidth = 2 * (1 - u);
        ctx.beginPath();
        ctx.ellipse(x, y, 20 + u * 140, (20 + u * 140) * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      return true;
    }
    case 'rallied': {
      // One of her troupe, rallied: a red star seal turning over its head while it lasts.
      const w = f.who;
      if (!w?.body) return true;
      const k = Math.min(1, p * 10) * (1 - Math.max(0, (p - 0.92) / 0.08));
      const wx = w.x + (x - f.x);
      const wy = w.y + (y - f.y) - (w.air ?? 0) - (f.over ?? 66);
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.translate(wx, wy);
      ctx.rotate(f.t * 1.5);
      ctx.strokeStyle = '#ff3a46';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = (-90 + i * 144) * (Math.PI / 180);
        if (i) ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
        else ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 8.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return true;
    }
    case 'troupecombo': {
      // Troupe Combo: her seal under the monsters while her troupe works (a red ring and star
      // turning on the ground), brightening as each part lands.
      const k = Math.min(1, f.t / 0.3) * (1 - Math.max(0, (p - 0.88) / 0.12));
      const r = 120;
      ctx.save();
      ctx.translate(x, y + 1);
      ctx.scale(1, 0.28);
      ctx.globalAlpha *= 0.75 * k;
      ctx.strokeStyle = '#ff3a46';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(f.t * 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = (-90 + i * 144) * (Math.PI / 180);
        if (i) ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
        else ctx.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      }
      ctx.stroke();
      ctx.restore();
      return true;
    }
    case 'combosnap': {
      // Her fan snapping shut: a sharp red flash and a ring going out from her.
      fxSprite(ctx, 'celhitred', x + (f.dir || 1) * 12, y - 40, { p, scale: 0.45, flip });
      ctx.save();
      ctx.globalAlpha *= 1 - p;
      ctx.strokeStyle = '#ff3a46';
      ctx.lineWidth = 2 * (1 - p) + 0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 20 + 200 * p, (20 + 200 * p) * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return true;
    }
    case 'dollfusion': {
      // The doll fusing into the tengu: her little spirit flies in from the Onmyoji's side in a
      // spiral of light and red ribbon, and bursts into black feathers as she becomes part of him.
      const k = f.who;
      const tx = (k ? k.x : f.x) + (x - f.x);
      const ty = (k ? k.y - 40 : f.y - 40) + (y - f.y);
      const u = Math.min(1, p / 0.6);
      const a = u * Math.PI * 4;
      const px = x + (tx - x) * u + Math.cos(a) * 20 * (1 - u);
      const py = y - 40 + (ty - (y - 40)) * u + Math.sin(a) * 12 * (1 - u);
      if (p < 0.6) {
        for (let i = 6; i >= 1; i--) {
          const v = Math.max(0, u - i * 0.035);
          const b2 = v * Math.PI * 4;
          glow(ctx, x + (tx - x) * v + Math.cos(b2) * 20 * (1 - v), y - 40 + (ty - (y - 40)) * v + Math.sin(b2) * 12 * (1 - v), 3 - i * 0.3, 0.5 - i * 0.06, '#ffc0d8');
        }
        glow(ctx, px, py, 7, 1, '#ffe0f0');
        ctx.save();
        ctx.strokeStyle = '#e8343a';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px - 10, py + 8, px - 20, py + 3 + Math.sin(f.t * 12) * 4);
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px - 8, py + 2, px - 16, py - 4 + Math.sin(f.t * 10 + 1) * 4);
        ctx.stroke();
        ctx.restore();
      } else {
        const q = (p - 0.6) / 0.4;
        glow(ctx, tx, ty, 10 * (1 - q) + 2, 1 - q, '#ffd0e0');
        for (let i = 0; i < 12; i++) {
          const b = (i / 12) * Math.PI * 2;
          feather(ctx, tx + Math.cos(b) * 26 * q, ty + Math.sin(b) * 20 * q + 10 * q * q, b + q * 4, 4, 1 - q);
        }
      }
      return true;
    }
    case 'tengumark': {
      // Leader's Mark: a crimson seal turning over the marked monster's head (a ring of script, a
      // crow feather across it) with a point aimed down at it, following it till it falls.
      const m = f.mob;
      if (!m || m.hp <= 0) return true;
      const k = Math.min(1, p * 12) * (1 - Math.max(0, (p - 0.9) / 0.1));
      const mx = m.x + (x - f.x);
      const my = m.y + (y - f.y) - m.def.h - 14 - (m.air ?? 0) + Math.sin(f.t * 3) * 1.5;
      const pop = 1 + 0.4 * Math.max(0, 1 - f.t * 5);
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.translate(mx, my);
      ctx.scale(pop, pop);
      ctx.shadowColor = 'rgba(255, 60, 60, 0.9)';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#e8343a';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 0.6;
      ctx.save();
      ctx.rotate(f.t * 1.4);
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(4.6, -0.8);
        ctx.lineTo(5.8, 0);
        ctx.lineTo(4.6, 0.8);
        ctx.stroke();
      }
      ctx.restore();
      ctx.shadowBlur = 0;
      // The feather across it.
      ctx.rotate(-0.7);
      ctx.fillStyle = '#17151f';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.quadraticCurveTo(1, -2, -5, -0.2);
      ctx.lineTo(-5, 0.2);
      ctx.quadraticCurveTo(1, 2, 5, 0);
      ctx.fill();
      ctx.strokeStyle = '#e8343a';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(-5.4, 0);
      ctx.lineTo(4.4, 0);
      ctx.stroke();
      ctx.restore();
      // The point aimed down at it.
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.fillStyle = '#e8343a';
      const by = my + 10 + Math.sin(f.t * 6) * 1.2;
      ctx.beginPath();
      ctx.moveTo(mx - 2.4, by);
      ctx.lineTo(mx + 2.4, by);
      ctx.lineTo(mx, by + 3);
      ctx.fill();
      ctx.restore();
      return true;
    }
    case 'tengucommand': {
      // The snap of his fan as he marks it: a crimson flash and a few feathers.
      fxSprite(ctx, 'celhitred', x, y, { p, scale: 0.3, flip });
      for (let i = 0; i < 4; i++) feather(ctx, x + (i - 1.5) * 6 * (1 + p), y - 4 - 12 * p + i * 2, i + p * 3, 3.6, 1 - p);
      return true;
    }
    case 'tenguhit': {
      // His blow landing: a sharp flash.
      fxSprite(ctx, 'celhit', x, y - (f.h ?? 24) * 0.55, { p, flip, scale: f.big ? 0.5 : 0.34 });
      return true;
    }
    case 'tenguwind': {
      // The wind catching a monster.
      fxSprite(ctx, 'celwindspin', x, y - (f.h ?? 24) * 0.5, { p, flip, scale: 0.3 });
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
