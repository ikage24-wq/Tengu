// Moonlit Manor's rooms (world/manor.js runs them), in the scenery's outlined chibi style: garden
// lanterns to light, the gallery's turning portraits and the family crest, the lost books
// fluttering along the shelves, door levers and the doors they open, the garden fountains, the
// ballroom chandelier, the hallway's tea trolley, page storms, and the bosses' tells (the Armours'
// guard, the hostess floating out of reach). (x, y) is the bottom center on the floor; `time`
// (seconds) animates.

import { R, E, T, F, sprite, blit, mix } from './pixel.js';
import { art, place } from './scenery.js';
import { trolleyArt } from './mobs/manorboss.js';
import { CREST, doorOpen } from '../world/manor.js';

const TAU = Math.PI * 2;
const GOLD = '#ffd36b';
const GOLD_DK = '#c8902a';
const PLUM = '#5a3e86';

function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
function shadow(ctx, x, y, rx) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#3a2d4f';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.25, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------- The crest's four pictures, small, for portraits and the crest ----------

function emblem(kind, cx, cy, s, c) {
  if (kind === 'moon') return [T([[cx - 3 * s, cy - 3 * s], [cx + 1 * s, cy - 4 * s], [cx + 4 * s, cy - 1 * s], [cx + 3 * s, cy + 3 * s], [cx - 1 * s, cy + 4 * s], [cx + 1 * s, cy + 1 * s], [cx, cy - 2 * s]], c)];
  if (kind === 'rose') return [E(cx, cy - 0.6 * s, 3 * s, 2.8 * s, c), F(E(cx, cy - 0.6 * s, 1.6 * s, 1.4 * s, mix(c, '#ffffff', 0.4))), F(R(cx - 0.4 * s, cy + 2 * s, 0.8 * s, 3 * s, '#6ab07a'))];
  if (kind === 'key') return [E(cx - 2 * s, cy, 2 * s, 2 * s, c), F(E(cx - 2 * s, cy, 0.8 * s, 0.8 * s, '#ffffff')), R(cx - 0.4 * s, cy - 0.6 * s, 5 * s, 1.2 * s, c), R(cx + 2.6 * s, cy, 1 * s, 2 * s, c)];
  return [T([[cx - 3 * s, cy - 2 * s], [cx + 3 * s, cy - 2 * s], [cx + 2.2 * s, cy + 2.4 * s], [cx - 2.2 * s, cy + 2.4 * s]], c), F(E(cx + 3.4 * s, cy, 1.2 * s, 1.4 * s, c)), F(E(cx, cy - 2 * s, 3 * s, 0.6 * s, mix(c, '#ffffff', 0.4)))];
}
const EMBLEM_C = { moon: '#ffe9a0', rose: '#ff7aa0', key: GOLD, cup: '#bfe2ff' };

// ---------- Garden lantern ----------

function lanternArt(lit) {
  return art(`mn-lantern|${lit}`, 22, 52, () => [
    R(9.6, 20, 2.8, 30, '#4a3a6a'), E(11, 50, 6, 1.6, '#4a3a6a'), R(5, 46, 12, 4, '#5a4a7a'),
    T([[3, 20], [19, 20], [16, 8], [6, 8]], '#4a3a6a'),
    R(5, 9, 12, 11, lit ? '#ffe2a0' : '#8a7aa8'), F(R(6, 10, 4, 9, lit ? '#fff6dc' : '#a89ac4')),
    F(R(10.4, 9, 1.2, 11, '#4a3a6a')), T([[2, 8], [20, 8], [11, 1]], '#5a4a7a'), F(E(11, 1.6, 1.4, 1.4, GOLD)),
    ...(lit ? [F(E(11, 15, 2, 3, '#ffb35a')), F(E(11, 15.6, 1, 1.6, '#ffffff'))] : []),
  ]);
}
function drawLantern(ctx, x, y, lit, time, id) {
  shadow(ctx, x, y, 8);
  if (lit) {
    const p = 0.5 + 0.5 * Math.sin(time * 3 + id);
    glow(ctx, x, y - 38, 34 + p * 6, '#ffd27a', 0.5);
  }
  place(ctx, lanternArt(lit), x, y);
  // Moths round a lit lantern; a ghostly wisp curls from a dark one.
  if (lit) {
    for (let k = 0; k < 2; k++) {
      const a = time * (2.4 + k) + id + k * 3;
      ctx.fillStyle = '#fff6dc';
      ctx.fillRect(Math.round(x + Math.cos(a) * 12), Math.round(y - 40 + Math.sin(a * 1.3) * 6), 2, 1);
    }
  } else {
    ctx.save();
    ctx.globalAlpha = 0.5;
    sparkle(ctx, x + Math.sin(time * 1.5 + id) * 3, y - 54 - ((time * 6 + id * 3) % 10), 1.4, '#c9b6ff');
    ctx.restore();
  }
}

// ---------- Portraits and the crest ----------

// A puzzle portrait (redrawn 2026-11-07 to match the family's paintings): a carved gold frame with
// corner rosettes, a painted canvas shaded dark at its edges, the crest picture painted large in the
// middle with a halo of light, and a brass plaque with the slot's number in dots (1 to 4). Set
// right, the canvas warms to violet and the frame shines.
function portraitArt(face, done, slot) {
  return art(`mn-portrait2|${face}|${done}|${slot}`, 44, 56, () => {
    const kind = CREST[face];
    const bg = done ? '#7a62c0' : '#4a3a6a';
    const out = [R(0, 0, 44, 50, done ? '#ffe28a' : GOLD), F(R(1, 1, 42, 2.4, '#fff2b0')), F(R(1, 46.6, 42, 2.4, GOLD_DK)), F(R(1, 1, 2.4, 48, '#ffe9a0')), F(R(40.6, 1, 2.4, 48, GOLD_DK))];
    out.push(F(R(4, 4, 36, 42, GOLD_DK)), F(R(5, 5, 34, 40, '#ffe28a')));
    for (const [cx, cy] of [[3.4, 3.4], [40.6, 3.4], [3.4, 46.6], [40.6, 46.6]]) out.push(E(cx, cy, 3, 3, GOLD), F(E(cx - 0.6, cy - 0.6, 1.3, 1.3, '#fff6c8')));
    out.push(R(7, 7, 30, 36, mix(bg, '#000000', 0.25)), F(R(9, 9, 26, 32, bg)), F(E(22, 25, 11, 12, mix(bg, '#ffffff', done ? 0.3 : 0.16))));
    out.push(...emblem(kind, 22, 25, 2.8, EMBLEM_C[kind]));
    out.push(R(12, 50, 20, 6, GOLD), F(R(13, 51, 18, 1.4, '#fff2b0')));
    for (let k = 0; k <= slot; k++) out.push(F(E(22 - slot * 1.8 + k * 3.6, 53.4, 1, 1, PLUM)));
    return out;
  });
}
function drawPortrait(ctx, x, y, o, time) {
  // It hangs on the wall above the floor; turning it spins it round on its nail.
  const since = time - (o.turnSeen ?? -9);
  if (o.turnedAt && o.turnedAt !== o.turnMark) {
    o.turnMark = o.turnedAt;
    o.turnSeen = time;
  }
  const spin = since < 0.35 ? since / 0.35 : 1;
  const k = Math.abs(Math.cos(spin * Math.PI));
  if (o.done) glow(ctx, x, y - 48, 30, '#ffe9a0', 0.4 + 0.1 * Math.sin(time * 2));
  ctx.save();
  ctx.translate(x, y - 26);
  // (The turn is the picture itself swapping as it swings past edge-on, a mirror flip, never a squash.)
  if (spin < 1 && spin > 0.5) ctx.scale(-1, 1);
  ctx.globalAlpha = 0.6 + 0.4 * k;
  place(ctx, portraitArt(o.face ?? 0, o.done, o.slot ?? 0), 0, 0);
  ctx.restore();
  ctx.fillStyle = GOLD_DK;
  ctx.fillRect(Math.round(x) - 1, Math.round(y - 74), 2, 4);
}
function crestArt(crest) {
  return art(`mn-crest|${crest.join('')}`, 76, 54, () => {
    const out = [T([[4, 4], [72, 4], [72, 30], [38, 52], [4, 30]], '#6a4aa8'), F(T([[8, 8], [68, 8], [68, 28], [38, 47], [8, 28]], '#8a6ac8')), F(R(4, 3, 68, 3, GOLD))];
    crest.forEach((c, i) => out.push(...emblem(CREST[c], 14 + i * 16, 20, 1.5, EMBLEM_C[CREST[c]])));
    return out;
  });
}
function drawCrest(ctx, x, y, crest, time) {
  glow(ctx, x, y - 70, 50, '#c9b6ff', 0.3 + 0.08 * Math.sin(time * 1.6));
  place(ctx, crestArt(crest), x, y - 46);
  // Candles under it, one per picture, flickering.
  for (let i = 0; i < 4; i++) {
    const cx = x - 24 + i * 16;
    ctx.fillStyle = '#fff6dc';
    ctx.fillRect(cx - 1.5, y - 42, 3, 6);
    const f = Math.sin(time * 9 + i * 2) * 0.6;
    ctx.fillStyle = '#ffb35a';
    ctx.beginPath();
    ctx.ellipse(cx + f * 0.4, y - 45, 1.6, 2.6 + f * 0.4, 0, 0, TAU);
    ctx.fill();
  }
}

// ---------- Lost books ----------

function bookArt(open, c) {
  return art(`mn-book|${open}|${c}`, 24, 18, () => {
    const cover = c;
    const page = '#fff8ec';
    // The covers flap like wings: open (pages fanning) or near-closed.
    const k = open / 2;
    return [
      T([[12, 14], [1, 6 + k * 8], [3, 2 + k * 8], [12, 9]], cover), T([[12, 14], [23, 6 + k * 8], [21, 2 + k * 8], [12, 9]], cover),
      F(T([[12, 13], [3, 6 + k * 7], [4.4, 3.4 + k * 7], [12, 9.6]], page)), F(T([[12, 13], [21, 6 + k * 7], [19.6, 3.4 + k * 7], [12, 9.6]], page)),
      F(R(11.4, 8, 1.2, 7, mix(cover, '#000000', 0.25))),
      F(E(8, 7 + k * 6, 0.8, 0.8, '#3a2d4f')), F(E(16, 7 + k * 6, 0.8, 0.8, '#3a2d4f')),
    ];
  });
}
function drawBook(ctx, x, y, o, time) {
  const c = ['#ff8fb8', '#7fb8ff', '#9ad8a0'][o.id % 3];
  if (o.done) return;
  const bob = Math.sin(time * 3 + o.id) * 3;
  const flap = Math.round((Math.sin(time * 10 + o.id) + 1));
  shadow(ctx, x, y, 7);
  glow(ctx, x, y - 30 + bob, 20, '#fff6dc', 0.35);
  place(ctx, bookArt(flap, c), x, y - 22 + bob);
  // Loose pages trailing behind it.
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#fff8ec';
  for (let k = 0; k < 2; k++) {
    const u = (time * 0.8 + k * 0.5 + o.id) % 1;
    ctx.fillRect(Math.round(x - 10 - u * 16), Math.round(y - 30 + bob + Math.sin(u * 8) * 4 + u * 10), 3, 2);
  }
  ctx.restore();
}

// ---------- Levers and doors ----------

function leverArt(on) {
  return art(`mn-lever|${on}`, 20, 34, () => [
    R(4, 26, 12, 8, '#5a4a7a'), F(R(4, 26, 12, 2, '#8a7aa8')),
    T(on ? [[9, 28], [11, 28], [18, 12], [16, 11]] : [[9, 28], [11, 28], [4, 12], [2, 13]], '#c8b4e6'),
    E(on ? 17 : 3, 11, 3, 3, on ? '#7fe0a0' : '#ff8fa8'), F(E(on ? 16 : 2, 10, 1, 1, '#ffffff')),
  ]);
}
function drawLever(ctx, x, y, on, time) {
  shadow(ctx, x, y, 8);
  if (!on) glow(ctx, x - 7, y - 24, 14, '#ffb3cf', 0.3 + 0.2 * Math.sin(time * 5));
  place(ctx, leverArt(on), x, y);
}
function doorArt(open) {
  return art(`mn-door|${open}`, 48, 110, () => {
    const wood = '#7a4a8a';
    const out = [R(0, 0, 48, 6, '#5a3e6a'), R(0, 0, 6, 110, '#5a3e6a'), R(42, 0, 6, 110, '#5a3e6a'), T([[0, 6], [24, -8], [48, 6]], '#5a3e6a')];
    if (!open) {
      out.push(R(6, 6, 18, 104, wood), R(24, 6, 18, 104, mix(wood, '#000000', 0.1)));
      for (const yy of [20, 56, 88]) out.push(F(R(9, yy, 12, 18, mix(wood, '#ffffff', 0.15))), F(R(27, yy, 12, 18, mix(wood, '#ffffff', 0.08))));
      out.push(E(21, 64, 1.6, 1.6, GOLD), E(27, 64, 1.6, 1.6, GOLD));
    } else {
      out.push(T([[6, 6], [12, 10], [12, 106], [6, 110]], wood), T([[42, 6], [36, 10], [36, 106], [42, 110]], mix(wood, '#000000', 0.1)));
    }
    return out;
  });
}

// ---------- Fountains ----------

function fountainArt() {
  return art('mn-fountain', 60, 40, () => [
    E(30, 34, 28, 6, '#c4b4e6'), E(30, 31, 24, 4, '#8fd8e8'), F(E(24, 30, 10, 1.6, '#dff6ff')),
    R(26, 14, 8, 18, '#c4b4e6'), F(R(26, 14, 3, 18, '#e6dcfa')), E(30, 14, 10, 3, '#c4b4e6'), F(E(30, 13, 8, 1.6, '#8fd8e8')),
    E(30, 6, 4, 5, '#c4b4e6'), F(E(29, 4.6, 1.4, 1.6, '#ffffff')),
  ]);
}
function drawFountain(ctx, f, x, y, time) {
  place(ctx, fountainArt(), x, y + 2);
  const water = (h, a) => {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#bfeeff';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 30);
    ctx.quadraticCurveTo(x - 6 + Math.sin(time * 12) * 1.5, y - 30 - h * 0.6, x - 2, y - 30 - h);
    ctx.lineTo(x + 2, y - 30 - h);
    ctx.quadraticCurveTo(x + 6 + Math.sin(time * 11) * 1.5, y - 30 - h * 0.6, x + 4, y - 30);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - 30 - h, 2, h * 0.8);
    ctx.restore();
    for (let k = 0; k < 5; k++) {
      const u = (time * 1.6 + k * 0.2) % 1;
      const s = k % 2 ? 1 : -1;
      ctx.fillStyle = '#dff6ff';
      ctx.fillRect(Math.round(x + s * u * 18), Math.round(y - 30 - h + u * u * (h + 10)), 2, 2);
    }
  };
  // A trickle while calm, bubbling as it builds, then the spout.
  if (f.state === 'calm') water(6 + Math.sin(time * 3) * 2, 0.8);
  else if (f.state === 'bubbling') {
    water(10 + f.since * 10, 0.9);
    for (let k = 0; k < 4; k++) {
      const u = (time * 3 + k * 0.25) % 1;
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.arc(x - 14 + k * 9, y - 4 - u * 6, 1.5 + u * 1.5, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  } else {
    const h = 150 * Math.min(1, f.since / 0.15) * (f.t < 0.2 ? f.t / 0.2 : 1);
    glow(ctx, x, y - 40 - h * 0.5, 30, '#bfeeff', 0.35);
    water(h, 0.95);
  }
}

// ---------- The chandelier ----------

function chandelierArt(lit) {
  return art(`mn-chand|${lit}`, 90, 54, () => {
    const out = [R(44, 0, 2, 14, GOLD_DK), E(45, 18, 30, 7, GOLD), F(E(45, 16, 26, 4, '#fff2b0')), E(45, 30, 18, 5, GOLD), T([[30, 32], [60, 32], [45, 50]], GOLD)];
    for (let i = 0; i < 7; i++) {
      const cx = 18 + i * 9;
      out.push(R(cx - 1.2, 8, 2.4, 8, '#fff6dc'));
      if (lit) out.push(F(E(cx, 6, 1.6, 2.6, '#ffb35a')), F(E(cx, 6.6, 0.7, 1.2, '#ffffff')));
    }
    for (let i = 0; i < 9; i++) out.push(F(E(20 + i * 6.2, 24 + (i % 2) * 3, 1.2, 2, '#dff0ff')));
    return out;
  });
}

// ---------- Behind the group ----------

export function drawManorBack(ctx, world, cam, time) {
  const run = world.dungeon;
  const room = run.room;
  const map = world.map;
  if (map.dungeon !== 'manor') return;
  for (const f of room.fountains ?? []) drawFountain(ctx, f, f.x - cam.x, f.y - cam.y, time);
  if (map.crest && room.crest) drawCrest(ctx, map.crest.x - cam.x, map.crest.y - cam.y, room.crest, time);
  for (const d of map.doors ?? []) {
    const x = d.x - cam.x;
    if (x < -60 || x > 700) continue;
    place(ctx, doorArt(doorOpen(room, d)), x - 4, map.groundY - cam.y);
  }
  // The chandelier: hanging and lit over the floor, then plunging, then a heap of crystal.
  const ch = room.chandelier;
  if (ch) {
    const x = ch.x - cam.x;
    // It hangs just under the ceiling (which stays at the top of the view), on a long chain.
    const hang = 96;
    ctx.fillStyle = GOLD_DK;
    if (ch.state === 'up') ctx.fillRect(Math.round(x) - 1, 0, 2, hang - 50);
    if (ch.state === 'up') {
      glow(ctx, x, hang - 14, 60, '#ffe2a0', 0.35 + 0.05 * Math.sin(time * 3));
      ctx.save();
      ctx.translate(x, hang);
      ctx.rotate(Math.sin(time * 0.9) * 0.03);
      place(ctx, chandelierArt(true), 0, 0);
      ctx.restore();
    } else {
      const u = Math.min(1, (world.now - ch.at) / 2.4);
      // It shakes on its chain, then drops the last fraction of a second.
      const fall = u < 0.8 ? 0 : ((u - 0.8) / 0.2) ** 2;
      const y = hang + fall * (map.groundY - cam.y - hang);
      ctx.save();
      ctx.translate(x + (u < 0.8 ? Math.sin(time * 40) * 2 * u : 0), y);
      place(ctx, chandelierArt(u < 1), 0, 0);
      ctx.restore();
    }
  }
}

// ---------- In front of the group ----------

export function drawManorFront(ctx, world, cam, time) {
  const run = world.dungeon;
  const room = run.room;
  const map = world.map;
  if (map.dungeon !== 'manor') return;
  // The trolley, rattling along the hallway.
  const c = room.chase;
  if (c && c.state !== 'waiting') {
    const x = c.x - cam.x;
    const y = map.groundY - cam.y;
    const f = Math.floor(time * 10) % 4;
    const s = sprite(`mn-trolley|${f}`, () => ({ soft: 'cel', crisp: true, selout: true, pad: 4, ...trolleyArt(f) }));
    blit(ctx, s, x - s.w / 2, y - s.h + 2 + (c.state === 'rolling' ? (f % 2) : 0));
    if (c.state === 'rolling') {
      // Dust kicked up behind, and rattling teacups.
      for (let k = 0; k < 3; k++) {
        const u = (time * 2 + k / 3) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - u) * 0.5;
        ctx.fillStyle = '#e6dcf0';
        ctx.beginPath();
        ctx.arc(x - 30 - u * 30, y - 4 - u * 6, 3 + u * 4, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }
  // Page storm: pages streaming across the floor the wind blows through.
  const st = room.storm?.on;
  if (st) {
    const y = st.y - cam.y;
    const on = st.t > st.warn;
    ctx.save();
    for (let k = 0; k < (on ? 26 : 8); k++) {
      const u = (time * (on ? 1.4 : 0.5) + k * 0.137) % 1;
      const px = st.dir > 0 ? u * 680 - 20 : 660 - u * 680;
      ctx.globalAlpha = on ? 0.85 : 0.4;
      ctx.fillStyle = k % 3 ? '#fff8ec' : '#e6dcfa';
      ctx.save();
      ctx.translate(px, y - 10 - ((k * 37) % 50) + Math.sin(time * 6 + k) * 4);
      ctx.rotate(time * 4 + k);
      ctx.fillRect(-3, -2, 6, 4);
      ctx.restore();
    }
    ctx.restore();
  }
  for (const m of world.mobs) {
    if (m.hp <= 0) continue;
    const x = m.x - cam.x;
    const y = m.y - cam.y;
    // The Armours' guard: a ring of light linking the pair while they hold each other.
    if (m.def.mech === 'waltz' && m.holdUntil > world.now) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 6);
      ctx.strokeStyle = '#ffe9a0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 4, m.def.w * 0.7, 8, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
      if (world.now - (m.guardAt ?? -9) < 0.3) sparkle(ctx, x, y - m.def.h * 0.6, 8, '#fff6c8');
    }
    // The hostess floating out of reach above her guests: a bubble of moonlight.
    if (m.def.mech === 'marigold' && m.mech?.aloft) {
      glow(ctx, x, y - m.def.h * 0.55, m.def.h * 0.7, '#fff6d8', 0.35 + 0.1 * Math.sin(time * 2));
      for (let k = 0; k < 5; k++) {
        const a = time * 1.2 + (k / 5) * TAU;
        sparkle(ctx, x + Math.cos(a) * 46, y - m.def.h * 0.55 + Math.sin(a) * 60, 2.4, '#ffe9a0');
      }
    }
  }
}

// ---------- The room's things, drawn with the other dungeon objects ----------

// Draws a manor object; returns false for kinds it doesn't know.
export function drawManorObject(ctx, o, x, y, time) {
  if (o.kind === 'lantern') drawLantern(ctx, x, y, o.done, time, o.id);
  else if (o.kind === 'portrait') drawPortrait(ctx, x, y, o, time);
  else if (o.kind === 'book') drawBook(ctx, x, y, o, time);
  else if (o.kind === 'lever') drawLever(ctx, x, y, o.done, time);
  else return false;
  return true;
}
// The hint over a manor object you can use.
export const MANOR_HINT = { lantern: '▲ Light', portrait: '▲ Turn', book: '▲ Catch', lever: '▲ Pull' };
