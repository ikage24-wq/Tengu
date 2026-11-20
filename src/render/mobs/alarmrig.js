// The Alarm (Chapter 10's finale, 2026-11-19, the player's pick "A, the Big Ring"): the Queen's
// golden alarm clock grown huge and cross, ringing to call her back to Monday. Its dial is its face
// (the clock's two hands are its eyebrows), its bells are its ears, the hammer a quiff buzzing
// between them; stubby gold legs, little gold arms. Live rig, outer outline only, face bare; no
// squash: when it rings, its bells, hammer and arms shake instead.
//
// How it moves:
//   idle     a 9 s act: ticking (the eyebrows twitch on each tick); a cross tap of its foot; a little
//            test ring, bells jangling.
//   walk     a stomping waddle on its stubby legs.
//   fight    a bell-clang: leaning back as its bells start ringing, then a lunge.
//   ringing  (m.ringAt / a cast) bells and hammer rattle, arms up, rings of sound off it.
//   snooze   (m.snoozeUntil, world/story.js) knocked quiet: it sags, eyes shut, z's drift up; then
//            it comes back louder.
//   freed    (m.cine.mood 'happy', the finale's end) small and sheepish, ringing softly.

import { E, T, F, stroke } from './kit.js';
import { ramp } from './meadow.js';
import { makeRig, stateBlend, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, MOODS, sparkle, INK } from './rigkit.js';

const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const sized = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};
const K = 1.5;
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const GOLD = ramp('#ffc94a', { step: 10, turn: 10 });
const al = pairOf('alarm');

// The clock: a gold rim round a cream dial with twelve dots. Box 72 x 72; its middle at (36, 36).
const bodyP = () => [
  E(36, 36, 34, 34, GOLD.sh), E(36, 36, 32.4, 32.4, GOLD.base), F(E(28, 18, 12, 5, '#ffe48a')),
  E(36, 36, 27, 27, '#fffbe8'),
  ...Array.from({ length: 12 }, (_, i) => F(E(36 + Math.sin((i * Math.PI) / 6) * 23, 36 - Math.cos((i * Math.PI) / 6) * 23, 1, 1, '#c8a878'))),
  F(E(36, 36, 1.8, 1.8, '#d8304a')),
];
// A bell: domed gold, a highlight, a darker rim. Box 24 x 20; its foot at (12, 19).
const bellP = () => [E(12, 11, 11, 9, GOLD.base), F(E(12, 17, 9.4, 2, GOLD.sh)), F(E(8.6, 6.6, 3.4, 1.8, '#fff6c8')), E(12, 2, 2, 2, GOLD.sh)];
// The hammer, a quiff between the bells: a stem and a round knob. Box 10 x 18; its root at (5, 17).
const hammerP = () => [taper([[5, 17], [5, 6]], 2.6, 2.6, '#8a7a6a'), E(5, 4.6, 4, 3.6, '#8a7a6a'), F(E(4, 3.4, 1.4, 1, '#c8b8a8'))];
// A little gold arm with a round hand. Box 18 x 10; the shoulder at (3, 5).
const armP = (far) => () => [taper([[3, 5], [12, 5]], 5, 4.4, far ? GOLD.sh : GOLD.base), E(14, 5, 3.6, 3.6, far ? GOLD.sh : GOLD.base)];
// A stubby leg with a round gold foot. Box 12 x 16; the hip at (6, 1).
const legP = (far) => () => [taper([[6, 1], [6, 10]], 6, 6, far ? GOLD.sh : GOLD.base), E(7.4, 12.4, 6, 3.6, far ? '#c8901e' : GOLD.sh)];
const PARTS = {
  BODY: al('body', 72, 72, bodyP, 2), BELL: al('bell', 24, 20, bellP, 6), HAMMER: al('hammer', 10, 18, hammerP, 2),
  ARM: [false, true].map((f) => al(`arm${f ? 1 : 0}`, 18, 10, armP(f), 2)), LEG: [false, true].map((f) => al(`leg${f ? 1 : 0}`, 12, 16, legP(f), 6)),
};
// Its face on the dial: wide red-eyed eyes with bags under them (it never gets to sleep) under heavy
// lids, a grumpy frown that rings open to a bell-mouth with its clapper swinging inside, gritted teeth
// when cross; the clock's two hands are its eyebrows, angled with its mood. Box 72 x 72 (over the dial).
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const AL_EYES = [[43, 38, 1, 4.4, 5], [28.6, 38.4, -1, 3.8, 4.4]];
const AL_RED = '#d8304a';
const AL_MOUTH = '#8a2a3a';
const alOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of AL_EYES) {
    if (mood !== 'dead') out.push(...oLn(oArc(x, y + h * 0.5, w * 0.78, h * 0.8, 55, 125, 6), 0.6, '#c8a878'));
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.6, w, h * 0.32, 15, 165, 8), 1.1));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 1.1));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.75, 1.1));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w * 0.95, 0.85, AL_RED, s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 1));
    else {
      // Heavy grumpy lids; slammed down to glare; thrown wide when it rings.
      const lid = mood === 'angry' ? (px) => y - h * 0.4 + (px - x) * -s * 0.55 : mood === 'shout' ? () => -99 : () => y - h * 0.55;
      const ir = w * (mood === 'shout' ? 0.3 : mood === 'angry' ? 0.4 : 0.47);
      const [ix, iy] = [x, y + h * 0.12];
      out.push(F(T(oRing(x, y, w, h), '#f2e2b0')));
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y, w - 0.85, h - 0.85), lid), '#ffffff')));
      out.push(F(T(oCut(oRing(ix, iy, ir, ir * 1.08), lid), AL_RED)), F(T(oCut(oRing(ix, iy, ir * 0.42, ir * 0.46), lid), INK)));
      out.push(F(T(oCut(oRing(ix + ir * 0.4, iy - ir * 0.45, ir * 0.3, ir * 0.3, 0, 8), lid), '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w, h, 190, 350, 10), (px) => lid(px) - 0.3), 1.3));
    }
  }
  const [mx, my] = [36, 52];
  if (mood === 'shout') {
    // RING: a bell-mouth thrown open, its clapper swinging inside, shake marks either side.
    out.push(F(T(oRing(mx, my + 1, 5.4, 4.4), INK)), F(T(oRing(mx, my + 1.3, 4.6, 3.6), AL_MOUTH)), F(E(mx, my + 3.4, 2.8, 1.3, '#ff7a8a')));
    out.push(F(T(oRing(mx, my + 1.3, 4.5, 3.5).map(([px, py]) => [px, Math.min(py, my - 1)]), '#ffffff')));
    out.push(...oLn([[mx, my - 1.4], [mx + 0.6, my + 1]], 0.7, '#c8901e'), F(E(mx + 0.7, my + 1.6, 1.3, 1.3, '#ffc94a')), F(E(mx + 0.3, my + 1.2, 0.45, 0.45, '#fff6c8')));
    for (const k of [-1, 1]) out.push(...oLn([[mx + k * 7.4, my - 2.2], [mx + k * 8.6, my + 0.6], [mx + k * 7.4, my + 3.4]], 0.7), ...oLn([[mx + k * 9.6, my - 3], [mx + k * 11, my + 0.6], [mx + k * 9.6, my + 4.2]], 0.7));
  } else if (mood === 'happy') {
    out.push(F(T(oArc(mx, my - 1, 4.8, 4.2, 0, 180, 10), INK)), F(T(oArc(mx, my - 0.6, 4, 3.4, 0, 180, 10), AL_MOUTH)));
    out.push(F(T(oArc(mx, my - 0.6, 4, 3.4, 0, 180, 10).map(([px, py]) => [px, Math.min(py, my + 0.5)]), '#ffffff')), F(E(mx, my + 2, 2, 0.9, '#ff7a8a')));
  } else if (mood === 'angry') {
    // Gritted teeth.
    out.push(F(T(oRing(mx, my, 4.6, 2.1), INK)), F(T(oRing(mx, my, 3.9, 1.45), '#ffffff')), ...oLn([[mx - 3.6, my], [mx + 3.6, my]], 0.4, '#b8a898'));
    for (const k of [-2, -1, 0, 1, 2]) {
      const hh = 1.45 * Math.sqrt(1 - ((k * 1.4) / 3.9) ** 2) - 0.1;
      out.push(...oLn([[mx + k * 1.4, my - hh], [mx + k * 1.4, my + hh]], 0.35, '#b8a898'));
    }
  } else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 3.2, 0.9));
  else if (mood === 'dead') out.push(...oLn([[mx - 2.6, my], [mx + 2.6, my]], 0.9));
  else if (mood === 'sleep') out.push(F(E(mx, my + 0.6, 1.2, 1.5, INK)));
  else out.push(...oLn(oArc(mx, my + 2.6, 3.8, 2.4, 205, 335, 8), 1.05));
  if (mood === 'hurt') out.push(...oDrop(50.4, 33, 1.4));
  return out;
};
const BROWS = {
  angry: [[[32, 26], [40, 31]], [[47, 26], [38, 31]]],
  shout: [[[31, 25], [40, 30]], [[48, 25], [38, 30]]],
  idle: [[[31, 28], [40, 30]], [[47, 28], [38, 30]]],
  sleep: [[[30, 31], [39, 31]], [[47, 31], [38, 31]]],
  happy: [[[31, 29], [40, 27]], [[47, 29], [38, 27]]],
};
const alarmFace = (mood) => faceSprite(`alarm|face|${mood}`, 72, 72, () => {
  const b = BROWS[mood] ?? BROWS.idle;
  return [...alOwnFace(mood), ...line(b[0], 2.6, '#3a2a2a'), ...line(b[1], 2, '#3a2a2a')];
});

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => [
    { name: `leg${k}${tag}`, parent: 'trunk', s: PARTS.LEG[far ? 1 : 0][i], pivot: [6, 1], at: () => [far ? -12 : 12, 28], rot: (S) => (far ? S.lF : S.lN) * D2R },
  ];
  return [
    { name: `armF${tag}`, parent: 'trunk', s: PARTS.ARM[1][i], pivot: [3, 5], at: () => [-30, 4], rot: (S) => S.aF * D2R },
    ...leg(1, true),
    ...leg(0, false),
    { name: `hammer${tag}`, parent: 'trunk', s: PARTS.HAMMER[i], pivot: [5, 17], at: () => [0, -31], rot: (S) => S.hm * D2R },
    { name: `bellL${tag}`, parent: 'trunk', s: PARTS.BELL[i], pivot: [12, 19], at: () => [-20, -26], rot: (S) => (-24 + S.bl) * D2R },
    { name: `bellR${tag}`, parent: 'trunk', s: PARTS.BELL[i], pivot: [12, 19], at: () => [20, -26], rot: (S) => (24 + S.br) * D2R },
    { name: `body${tag}`, parent: 'trunk', s: PARTS.BODY[i], pivot: [36, 36] },
    { name: `armN${tag}`, parent: 'trunk', s: PARTS.ARM[0][i], pivot: [3, 5], at: () => [30, 4], rot: (S) => S.aN * D2R },
  ];
};

export const alarmRig = sized(makeRig({
  w: 110, h: 120, soft: true, stride: 8, recover: 0.6,
  springs: { x: [260, 18], lift: [220, 15], tilt: [180, 13], lN: [320, 18], lF: [320, 18], aN: [240, 13], aF: [240, 13], hm: [600, 20], bl: [500, 18], br: [500, 18] },
  fast: ['x', 'aN', 'aF', 'hm', 'bl', 'br'],
  kick: { tilt: -140, bl: 300, br: -300 },
  turnKick: { tilt: 90, bl: 200, br: -200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'alarm', 8);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const snooze = m.snoozeUntil > a.now && m.hp > 0;
    const freed = m.cine?.mood === 'happy';
    const lu = t % 9;
    const busy = active || walkW > 0.05 || m.cine || snooze;
    // Its act: ticking (the brows twitch on each tick); a cross tap of a foot; a little test ring.
    const tap = busy ? 0 : hold(lu, 3, 3.3, 4.6, 4.9);
    const test = busy ? 0 : hold(lu, 6.4, 6.6, 7.6, 7.9);
    // Ringing: a test ring, the cast of a big ring, or just after one (m.ringAt).
    const ring = Math.max(test, m.cast ? 1 : 0, Math.max(0, 1 - Math.abs(a.now - (m.ringAt ?? -9)) / 0.8), freed ? 0.35 : 0);
    const buzz = Math.sin(t * 46);
    const tick = Math.round(t) % 2 ? 1 : 0;
    const br = Math.sin(t * 1.8);
    a.alarmRing = snooze ? 0 : ring;
    a.alarmSnooze = snooze;
    const idle = { x: buzz * ring * 0.8, lift: br * 0.6 + ring * 1.5, tilt: br * 1.5 + tick * 0.6, lN: -tap * Math.max(0, Math.sin(t * 14)) * 12, lF: 0, aN: 70 - ring * 120 + br * 4, aF: 110 + ring * 120 - br * 4, hm: buzz * ring * 26, bl: buzz * ring * 14, br: -buzz * ring * 14 };
    // A stomping waddle.
    const s1 = Math.sin(u * TAU);
    const [dxN] = pawStep(u, 0, 8, 0.6, 2);
    const [dxF] = pawStep(u, 0.5, 8, 0.6, 2);
    const walk = { x: 0, lift: Math.abs(s1) * 2, tilt: s1 * 5, lN: -dxN * 4, lF: -dxF * 4, aN: 60 + s1 * 16, aF: 120 - s1 * 16, hm: s1 * 8, bl: s1 * 6, br: s1 * 6 };
    // A bell-clang: leaning back, bells starting to ring, then a lunge.
    const antic = { x: -4, lift: 3, tilt: -12, lN: 10, lF: -6, aN: -60, aF: 240, hm: 20, bl: 16, br: -16 };
    const strike = { x: 10, lift: 0, tilt: 16, lN: -20, lF: 10, aN: 20, aF: 150, hm: -26, bl: -20, br: 20 };
    const S = stateBlend(a, idle, walk, antic, strike);
    if (snooze) Object.assign(S, { x: 0, lift: -4, tilt: 10 + br * 2, lN: 20, lF: -20, aN: 120, aF: 70, hm: 30, bl: -10, br: 10 });
    if (m.hp <= 0 && !freed) Object.assign(S, { lift: -6, tilt: 24, lN: 40, lF: -30, aN: 140, aF: 60, hm: 50, bl: -20, br: 30 });
    a.alarmMood = freed ? 'happy' : m.hp <= 0 ? 'dizzy' : snooze ? 'sleep' : a.ph.strike > 0.25 || ring > 0.6 ? 'shout' : active || tap > 0.4 ? 'angry' : 'idle';
    return S;
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -44 - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
    { name: 'face', parent: 'trunk', s: (a) => alarmFace(MOODS.has(a.alarmMood) ? a.alarmMood : 'angry'), pivot: [36, 36] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 && m.cine?.mood !== 'happy') return;
    const B = mat('trunk');
    // Rings of sound off its bells while it rings.
    if (a.alarmRing > 0.05) {
      for (const [bx, s] of [[-24, -1], [24, 1]]) {
        const [x, y] = at2(B, bx, -36);
        for (let k = 0; k < 3; k++) {
          const u = (a.now * 2.4 + k / 3) % 1;
          ctx.globalAlpha = a.alpha * a.alarmRing * (1 - u) * 0.9;
          ctx.strokeStyle = k % 2 ? '#ffffff' : '#ffe066';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(x, y, 6 + u * 22, 5 + u * 18, 0, s > 0 ? -0.7 : Math.PI - 0.7, s > 0 ? 0.7 : Math.PI + 0.7);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    // Z's drifting up while it's snoozed.
    if (a.alarmSnooze) {
      const [x, y] = at2(B, 10, -40);
      for (let k = 0; k < 3; k++) {
        const u = (a.now * 0.5 + k / 3) % 1;
        ctx.globalAlpha = a.alpha * Math.sin(u * Math.PI);
        ctx.strokeStyle = '#8a7ac8';
        ctx.lineWidth = 1.4;
        const s = 3 + u * 3;
        const zx = x + u * 10 + Math.sin(u * 6 + k) * 3;
        const zy = y - u * 26;
        ctx.beginPath();
        ctx.moveTo(zx - s / 2, zy - s / 2);
        ctx.lineTo(zx + s / 2, zy - s / 2);
        ctx.lineTo(zx - s / 2, zy + s / 2);
        ctx.lineTo(zx + s / 2, zy + s / 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (a.ph.strike > 0.2) {
      const [x, y] = at2(mat('armN'), 14, 5);
      for (let k = 0; k < 3; k++) sparkle(ctx, a, x + 3 + k * 3, y - 2 + k * 3, 2.2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#fff3a6');
    }
  },
}), K);

export function alarmStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'angry';
  const ty = -44;
  const sc = (shapes, pv, x, y, deg = 0) => put(shapes, pv, x, y, deg).map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + 84, py * K + 176]) } : { ...s, x: s.x * K + 84, y: s.y * K + 176, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.w != null && s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) }));
  const b = BROWS[fm] ?? BROWS.angry;
  return { w: 168, h: 180, res: 2, shapes: [
    ...sc(armP(true)(), [3, 5], -30, ty + 4, 110), ...sc(legP(true)(), [6, 1], -12, ty + 28), ...sc(legP(false)(), [6, 1], 12, ty + 28),
    ...sc(hammerP(), [5, 17], 0, ty - 31), ...sc(bellP(), [12, 19], -20, ty - 26, -24), ...sc(bellP(), [12, 19], 20, ty - 26, 24),
    ...sc(bodyP(), [36, 36], 0, ty), ...sc([...alOwnFace(fm), ...line(b[0], 2.6, '#3a2a2a'), ...line(b[1], 2, '#3a2a2a')], [36, 36], 0, ty),
    ...sc(armP(false)(), [3, 5], 30, ty + 4, 70),
  ] };
}
