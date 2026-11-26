// The Myconid Queen (2026-11-26, the player's pick "B"): Hazel Hoardwell, the Pantry Hamster. A big
// golden hamster who keeps Capper's Garden as her pantry: every sleeping glowcap, every seed and
// every spore in it is counted, stored and HERS. Fussy, bossy and thrifty, forever stuffing her
// cheek pouches. She moves on her own copy of the rodent base (rodentbase.js, its hamster: bones,
// scurry, springs and moves), dressed here; her face drawn here from scratch.
//   look    apricot-gold and cream fur, small round ears with pink insides; a mint gingham apron
//           (its scalloped hem and its seed pocket on springs, the apron rooted round her middle), a
//           clover sprig behind her ear (on its own spring, rooted inside her head); her cheek
//           pouches are their own drawn shapes, growing out of her cheeks as she stuffs them (her
//           head and body never change shape); her own soft apricot outline, her face bare.
//   eyes    big glossy "button" eyes: a chestnut iris filling the eye with an amber glow low in it,
//           a big round glint and a little one, a thick upper lid with two rounded lashes at the
//           back, a soft lower lid; tiny floating brows that do all the bossing.
//   moves   (in turn) Nibble, Hoard Toss (flings her prize acorn), Seed Spit, Bowl Roll (curls into a
//           ball and bowls into you); hurt: a seed pops out of her cheek; low on health: her pocket
//           spills, her fur frazzles, her eyes water; beaten: flopped on her back, dizzy.
//   fight   (world/dungeon.js, world/hollow.js) Seed Spit (m.castAt: she stuffs her cheeks and spits
//           three seeds high), Pocket Pests (m.callAt: shakes out her apron pocket), Hoarder's Whirl
//           (m.move 'spin': curled into a ball, whirling), Lights Out (m.hideUntil: she stuffs the
//           garden's big glowcap lamp into her cheek, then curls into a ball and sneaks about, her
//           cheek glowing pink; render/hollow.js lets it shine through the dark), Pouch Burst
//           (m.tideAt: she stuffs both pouches until her eyes water, "mmmff!", then "PFFFT!").
//   scenes  her acts (m.cine.act, world/director.js): dive (into her hoard), burst (up out of it,
//           cheeks stuffed), ptoo (a stream of seeds); the scene moods as faces.
//   idle    a 30 s act, only when she's calm: counting seeds into her pouch; dusting her apron; a
//           suspicious look both ways, then hiding a seed in her pocket; washing her face; patting
//           her full cheeks.
import { dressedRodent } from './rodentbase.js';
import { TAU, clamp, mix, sstep, hash, light, twinkle, fluff, sweat, dizzy, streak, cue, seed, acorn, glowcap, heap } from './fx.js';

const C = { lt: '#fff3dc', base: '#f2b866', sh: '#d8944a', deep: '#bf7a3a', guide: '#e9c08a', nose: '#e88a96', inner: '#ffc8cc', tooth: '#fffaf0', mouth: '#a8505a' };
// (her own soft outline: a deep apricot, never near-black)
const INK = '#bb6f36';
const APRON = { base: '#bfe8d2', sh: '#94cfb2', check: 'rgba(120,196,160,0.42)', edge: '#5f9e80', frill: '#ecfaf2' };
const PINK = '#ff9ec8';
// (the hamster's own shape over the base's: legs long enough to read and step, her cheeks her own
// pouch shapes, not the base's growing cheek)
const SCALE = 0.84 * 4.1;
const P = {
  scale: SCALE,
  head: { pouch: 0 },
  fore: { top: [5.6, 4.6], bones: [[-0.4, 2.7], [0.4, 2.6], [0.8, 1.3]], w: [4.6, 3.3, 2.7, 2.5] },
  hind: { top: [-5.4, 4.2], bones: [[2.9, 2.9], [-2.9, 3.5], [4.6, 0.5]], w: [7.6, 4.8, 3.7, 2.8] },
};
const HD = { skull: [8.2, 7.4], muzzle: [5.6, 2.4, 3.1, 2.7], nose: [8.4, 1.6, 0.85], cheek: [0.8, 3.4, 6.4, 4.8], teeth: [7.5, 4.3, 1.3] };

// (a value following its goal on a damped spring kept in the rig's state)
function spring(st, key, goal, k, c, dt, kick = 0) {
  const s = (st[key] ??= { x: goal, v: 0 });
  s.v += kick;
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      s.v += (-(s.x - goal) * k - s.v * c) * (dt / n);
      s.x += s.v * (dt / n);
    }
  }
  return s.x;
}
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};

// ---------- Her face (in the head's frame, facing right) ----------
// moods: busy (calm), bossy, content (^ ^), cross, teary, stuffed (eyes wide, watering), blow
// (squeezed tight), hurt (> <), dizzy (swirls), sneaky (sidelong), smug, shut (asleep), sad, talk.
const BROW = { bossy: [-0.55, -0.55], cross: [0.5, -0.1], teary: [-0.45, -0.4], sad: [-0.4, -0.25], stuffed: [-0.3, -0.6], smug: [0.15, -0.2], sneaky: [0.3, 0.05], blow: [0.35, 0.3], hurt: [-0.3, 0.3], content: [-0.1, -0.45], busy: [-0.05, -0.15], talk: [-0.1, -0.2] };
function face(ctx, a, sk, K) {
  const sc = K.sc;
  const rx = HD.skull[0] * SCALE;
  const ry = HD.skull[1] * SCALE;
  const mood = a.mcFace ?? 'busy';
  const t = a.t;
  const ex = rx * 0.36;
  const ey = -ry * 0.1;
  const ew = sc(1.75);
  const eh = sc(2.1);
  const col = (c) => K.colour(a, c);
  const ink = '#4a2a1a';
  const line = (pts, w = 0.55, c = ink) => {
    ctx.strokeStyle = col(c);
    ctx.lineWidth = sc(w);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    ctx.stroke();
  };
  // the blush on her cheek, rosier stuffed, cross or crying
  const bl = { stuffed: 0.8, cross: 0.75, teary: 0.7, hurt: 0.6, blow: 0.8, content: 0.65 }[mood] ?? 0.5;
  K.glow(ctx, [sc(1.6), sc(3.6) + sk.cheeks * sc(1.6)], sc(3.2), bl, '#ff8aa4');
  // the brow: a tiny floating rounded dash, its tilt and height the mood
  if (mood !== 'dizzy') {
    const [tilt, up] = BROW[mood] ?? [0, 0];
    const bob = mood === 'talk' ? Math.sin(t * 9) * sc(0.15) : 0;
    ctx.save();
    ctx.translate(ex + sc(0.2), ey - eh - sc(1.25) + up * sc(0.7) + bob);
    ctx.rotate(tilt);
    ctx.fillStyle = col(C.deep);
    ctx.beginPath();
    ctx.ellipse(0, 0, sc(1.2), sc(0.36), 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  const tear = (x, y, k = 1) => {
    ctx.fillStyle = 'rgba(190,232,255,0.92)';
    ctx.strokeStyle = 'rgba(110,170,210,0.7)';
    ctx.lineWidth = sc(0.18);
    ctx.beginPath();
    ctx.moveTo(x, y - sc(0.7) * k);
    ctx.quadraticCurveTo(x + sc(0.55) * k, y + sc(0.2) * k, x, y + sc(0.55) * k);
    ctx.quadraticCurveTo(x - sc(0.55) * k, y + sc(0.2) * k, x, y - sc(0.7) * k);
    ctx.fill();
    ctx.stroke();
  };
  if (mood === 'content' || mood === 'shut' || mood === 'blow' || mood === 'hurt') {
    if (mood === 'content') line([[ex - ew, ey + sc(0.4)], [ex, ey - eh * 0.95], [ex + ew, ey + sc(0.4)]], 0.66);
    else if (mood === 'shut') line([[ex - ew, ey], [ex, ey + eh * 0.55], [ex + ew, ey]], 0.62);
    else {
      line([[ex - ew * 0.95, ey - eh * 0.55], [ex + ew * 0.2, ey - eh * 0.1], [ex + ew * 0.8, ey + sc(0.1)]], 0.66);
      line([[ex + ew * 0.8, ey + sc(0.1)], [ex + ew * 0.1, ey + eh * 0.3], [ex - ew * 0.95, ey + eh * 0.55]], 0.66);
      tear(ex - ew * 1.1, ey + eh * 0.3 + ((t * 0.9) % 1) * sc(2), 0.8);
    }
    // the lashes at the back corner
    for (const [dy, an] of [[0, -2.5], [0.35, -2.85]]) {
      const b = [ex - ew * 0.98, ey + dy * sc(1) - (mood === 'content' ? sc(0.2) : 0)];
      line([b, [b[0] + Math.cos(an) * sc(0.7), b[1] + Math.sin(an) * sc(0.5)], [b[0] + Math.cos(an) * sc(1.05), b[1] + Math.sin(an) * sc(0.95)]], 0.42);
    }
    mouth(ctx, a, mood, K, line);
    return;
  }
  if (mood === 'dizzy') {
    ctx.strokeStyle = col(ink);
    ctx.lineWidth = sc(0.45);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const an = (i / 30) * TAU * 2.2 + t * 6;
      const r = (i / 30) * ew * 0.95;
      const p = [ex + Math.cos(an) * r, ey + Math.sin(an) * r * 1.15];
      i ? ctx.lineTo(...p) : ctx.moveTo(...p);
    }
    ctx.stroke();
    mouth(ctx, a, mood, K, line);
    return;
  }
  // open eyes: the white, the iris, the lid coming down, the glints, the lid lines
  const wide = mood === 'stuffed' ? 1.12 : mood === 'teary' ? 1.06 : 1;
  const lid = { bossy: 0.34, smug: 0.42, sneaky: 0.38, cross: 0.3, sad: 0.24, teary: 0.08, busy: 0.08, talk: 0.08 }[mood] ?? 0.05;
  const look = mood === 'sneaky' ? -0.4 : mood === 'sad' ? 0 : 0.14;
  const lookY = mood === 'sad' ? 0.18 : 0;
  // (a blink now and then, open-eyed moods only)
  const blink = mood === 'busy' || mood === 'talk' || mood === 'bossy' ? win(t % 4.3, 3.9, 3.98, 4.06, 4.16) : 0;
  const L = Math.max(lid, blink);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ex, ey, ew * wide, eh * wide, 0, 0, TAU);
  ctx.fillStyle = col('#fffaf2');
  ctx.fill();
  ctx.clip();
  const ix = ex + look * ew;
  const iy = ey + lookY * eh;
  const ir = ew * (mood === 'cross' ? 0.84 : 0.94);
  const g = ctx.createRadialGradient(ix, iy + eh * 0.35, ir * 0.1, ix, iy, eh * 1.05);
  g.addColorStop(0, '#d0923e');
  g.addColorStop(0.45, '#6a3a1e');
  g.addColorStop(1, '#2e160c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(ix, iy + eh * 0.04, ir, eh * 0.98 * wide, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,12,6,0.55)';
  ctx.beginPath();
  ctx.ellipse(ix + ew * 0.08, iy - eh * 0.06, ir * 0.5, eh * 0.52, 0, 0, TAU);
  ctx.fill();
  if (mood === 'teary' || mood === 'stuffed') {
    // a pool of tears along the bottom, wobbling
    ctx.fillStyle = 'rgba(190,232,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(ex, ey + eh * 0.86 + Math.sin(t * 7) * sc(0.08), ew * 1.1, eh * 0.32, 0, 0, TAU);
    ctx.fill();
  }
  if (L > 0.01) {
    ctx.fillStyle = col(C.base);
    const ly = ey - eh * wide + eh * 2 * L;
    const tilt = mood === 'cross' ? eh * 0.5 : mood === 'sad' || mood === 'teary' ? -eh * 0.3 : 0;
    ctx.beginPath();
    ctx.moveTo(ex - ew * 1.3, ey - eh * 1.4);
    ctx.lineTo(ex + ew * 1.3, ey - eh * 1.4);
    ctx.lineTo(ex + ew * 1.3, ly + tilt);
    ctx.quadraticCurveTo(ex, ly + eh * 0.15 + tilt * 0.5, ex - ew * 1.3, ly - tilt * 0.2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const ly = ey - eh * wide + eh * 2 * L;
  if (L < 0.8) {
    // the glints: a big round one up front, a little one low at the back (more in teary eyes)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ix + ew * 0.32, Math.max(ly + eh * 0.35, iy - eh * 0.42), ew * 0.3, eh * 0.26, -0.3, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(ix - ew * 0.34, iy + eh * 0.42, ew * 0.13, 0, TAU);
    ctx.fill();
    if (mood === 'teary' || mood === 'stuffed') {
      ctx.beginPath();
      ctx.arc(ix + ew * 0.05, iy + eh * 0.1, ew * 0.1, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // the lids: a thick upper line with two rounded lashes at the back, a soft lower lid
  line([[ex - ew * 1.02, ly + eh * 0.42 * (1 - L)], [ex - ew * 0.2, ly - sc(0.12)], [ex + ew * 0.95, ly + eh * 0.34 * (1 - L)]], 0.68);
  for (const [dx, an] of [[-0.84, -2.4], [-0.52, -2.05]]) {
    const b = [ex + ew * dx, ly + eh * (dx < -0.7 ? 0.3 : 0.1) * (1 - L)];
    line([b, [b[0] + Math.cos(an) * sc(0.7), b[1] + Math.sin(an) * sc(0.5)], [b[0] + Math.cos(an) * sc(1.05), b[1] + Math.sin(an) * sc(1.0)]], 0.42);
  }
  ctx.globalAlpha = 0.75;
  const low = mood === 'smug' || mood === 'bossy' || mood === 'sneaky' ? 0.95 : 1.3;
  line([[ex - ew * 0.75, ey + eh * 1.12], [ex + ew * 0.1, ey + eh * low], [ex + ew * 0.85, ey + eh * 0.98]], 0.34, C.deep);
  ctx.globalAlpha = 1;
  if (mood === 'teary') tear(ex - ew * 0.9, ey + eh * 1.2 + ((t * 0.7) % 1) * sc(3.2), 1);
  if (mood === 'stuffed') tear(ex - ew * 1.05, ey + eh * 0.9, 0.8);
  mouth(ctx, a, mood, K, line);
}
// Her mouth's mood, under the base's buck teeth: a smile, a frown, a wobble, a pout.
function mouth(ctx, a, mood, K, line) {
  const sc = K.sc;
  const tx = HD.teeth[0] * SCALE;
  const ty = HD.teeth[1] * SCALE;
  if (a.bk.jaw > 0.3) return;
  const c = C.mouth;
  if (mood === 'content' || mood === 'smug' || mood === 'bossy' || mood === 'busy' || mood === 'talk') {
    const k = mood === 'content' ? 1 : mood === 'busy' || mood === 'talk' ? 0.55 : 0.75;
    line([[tx - sc(1.0), ty + sc(0.9)], [tx - sc(2.1), ty + sc(0.9) + sc(0.7) * k], [tx - sc(3.1), ty + sc(0.1) - sc(0.3) * k]], 0.36, c);
  } else if (mood === 'cross' || mood === 'sad') {
    line([[tx - sc(1.0), ty + sc(1.0)], [tx - sc(2.1), ty + sc(0.4)], [tx - sc(3.1), ty + sc(1.1)]], 0.36, c);
  } else if (mood === 'teary' || mood === 'hurt' || mood === 'dizzy') {
    const w = Math.sin(a.t * 12) * sc(0.18);
    line([[tx - sc(0.9), ty + sc(1.0)], [tx - sc(1.5), ty + sc(0.6) + w], [tx - sc(2.1), ty + sc(1.0)], [tx - sc(2.7), ty + sc(1.4) - w], [tx - sc(3.2), ty + sc(0.9)]], 0.34, c);
  }
}

// ---------- Her cheek pouches (their own shapes, growing out of her cheeks) ----------
// k: how full (the base's `cheeks`); a pink glow through them while she has the lamp in one.
function pouchPath(ctx, k, grow, far, sc) {
  const c = [sc(0.7 - 0.9 * k - (far ? 1.2 : 0)), sc(4.0 + 2.5 * k - (far ? 0.4 : 0))];
  const rx = sc(3.0 + 3.1 * k) * (far ? 0.9 : 1) + grow;
  const ry = sc(2.6 + 3.0 * k) * (far ? 0.9 : 1) + grow;
  ctx.beginPath();
  ctx.ellipse(c[0], c[1], rx, ry, -0.12, 0, TAU);
  return { c, rx, ry };
}
function pouch(far) {
  return (ctx, a, mode, K) => {
    const sk = a.bk;
    const k = clamp(sk.cheeks, 0, 1.1);
    if (k < 0.03) return;
    const sc = K.sc;
    K.headFrame(ctx, a);
    if (mode === 'line') {
      pouchPath(ctx, k, 0, far, sc);
      return K.edge(ctx);
    }
    const { c, rx, ry } = pouchPath(ctx, k, 0, far, sc);
    ctx.fillStyle = K.colour(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.save();
    pouchPath(ctx, k, 0, far, sc);
    ctx.clip();
    if (!far) {
      K.glow(ctx, [c[0] - rx * 0.2, c[1] - ry * 0.5], rx * 1.1, 0.9, C.lt);
      K.glow(ctx, [c[0] + rx * 0.1, c[1] + ry * 0.5], rx * 0.9, 0.8, '#ffffff');
      K.glow(ctx, [c[0] - rx * 0.8, c[1] + ry * 0.2], rx * 0.7, 0.35, C.sh);
      K.glow(ctx, [c[0] + rx * 0.3, c[1] - ry * 0.1], rx * 0.7, 0.45 * Math.min(1, k * 1.5), '#ff9aaa');
    }
    const gk = a.mcGlowCheek ?? 0;
    if (gk > 0.01) {
      const pu = 0.75 + 0.25 * Math.sin(a.t * 3.2);
      K.glow(ctx, [c[0] + rx * 0.1, c[1]], rx * 1.4, 0.85 * gk * pu, PINK);
      K.glow(ctx, [c[0] + rx * 0.1, c[1]], rx * 0.6, 0.7 * gk * pu, '#fff0f8');
    }
    ctx.restore();
    if (!far) {
      // the soft crease where the pouch swells out of her cheek
      ctx.strokeStyle = K.colour(a, C.sh);
      ctx.globalAlpha = 0.55 * Math.min(1, k * 2);
      ctx.lineWidth = sc(0.3);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(c[0], c[1], Math.min(rx, ry) * 0.82, -2.4, -1.2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
}

// ---------- Her apron (over the body, both passes), on springs ----------
// (in the body's own units, x toward her chest, y toward her belly: a bib on the chest, the panel
// over the tummy and a scalloped hem across it low by her seat, one wavy edge; the pocket on it)
function apronPts() {
  const pts = [[6.2, -0.4], [9.0, -0.6], [10.6, 1.6], [10.0, 5.0], [7.6, 7.8], [3.6, 9.5], [-1.0, 9.8]];
  const h0 = [-4.6, 9.4];
  const h1 = [-3.8, 1.6];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    pts.push([mix(h0[0], h1[0], u) - (i % 2 ? 1.05 : 0), mix(h0[1], h1[1], u), u]);
  }
  pts.push([0.4, 0.6], [3.4, -0.1]);
  return pts;
}
const APRON_PTS = apronPts();
// The springs: the hem swings after her (its free edge most, nothing at the bib where it's tied),
// the pocket bobs, both kicked by her body's moves.
function apronSprings(a, K) {
  const sk = a.bk;
  const st = a.mo.rig;
  const dt = Math.min(0.05, a.dt ?? 0);
  const p = sk.pivot;
  const last = (st.mcApLast ??= { p, v: [0, 0], th: sk.th });
  const v = dt > 0 ? [(p[0] - last.p[0]) / dt, (p[1] - last.p[1]) / dt] : last.v;
  const acc = dt > 0 ? [(v[0] - last.v[0]) / dt, (v[1] - last.v[1]) / dt] : [0, 0];
  const om = dt > 0 ? (sk.th - last.th) / dt : 0;
  st.mcApLast = { p, v, th: sk.th };
  const ax = clamp(acc[0], -900, 900);
  const ay = clamp(acc[1], -900, 900);
  a.mcHem = spring(st, 'mcHem', 0, 110, 8, dt, (-ax * 0.0016 - om * 0.05) * dt * 60);
  a.mcHemY = spring(st, 'mcHemY', 0, 130, 9, dt, -ay * 0.0012 * dt * 60);
  a.mcPocket = spring(st, 'mcPocket', 0, 170, 10, dt, -ay * 0.0018 * dt * 60);
  a.mcHem = clamp(a.mcHem, -1.6, 1.6);
  a.mcHemY = clamp(a.mcHemY, -1.2, 1.2);
  a.mcPocket = clamp(a.mcPocket, -1, 1);
}
function apron(ctx, a, mode, K) {
  const sk = a.bk;
  const show = 1 - sstep((sk.ball - 0.35) / 0.3);
  if (show <= 0.01) return;
  if (mode === 'line') apronSprings(a, K);
  // (a point of it, swung by the springs as far as it's free: the hem most)
  const sw = (p) => {
    const free = p[2] ?? (p[0] < 0 ? 0.6 : 0);
    return sk.at([p[0] + (a.mcHemY ?? 0) * free, p[1] + (a.mcHem ?? 0) * free]);
  };
  const pts = APRON_PTS.map((p, i) => sw(i >= 7 && i <= 15 ? [p[0], p[1], 1] : p));
  ctx.globalAlpha *= show;
  const path = () => {
    ctx.beginPath();
    const sm = K.smoothLoop(pts, 4);
    sm.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
  };
  if (mode === 'line') {
    path();
    return K.edge(ctx);
  }
  path();
  ctx.fillStyle = K.colour(a, APRON.base);
  ctx.fill('nonzero');
  ctx.save();
  path();
  ctx.clip('nonzero');
  const c0 = sk.at([2, 4]);
  ctx.translate(...c0);
  ctx.rotate(sk.th);
  ctx.fillStyle = APRON.check;
  const st = K.sc(1.3);
  for (let i = -12; i <= 12; i++) {
    ctx.fillRect(i * st * 2 - st / 2, -80, st, 160);
    ctx.fillRect(-80, i * st * 2 - st / 2, 160, st);
  }
  ctx.rotate(-sk.th);
  ctx.translate(-c0[0], -c0[1]);
  K.glow(ctx, sk.at([0, 1.5]), K.sc(6), 0.5, APRON.sh);
  K.glow(ctx, sk.at([5, 7]), K.sc(6), 0.6, '#f2fff6');
  // the hem's lighter frill band, just inside its wavy edge
  ctx.strokeStyle = K.colour(a, APRON.frill);
  ctx.lineWidth = K.sc(1.1);
  ctx.beginPath();
  K.smoothChain(pts.slice(7, 16), 4).forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.stroke();
  ctx.restore();
  // the pocket (bobbing), seeds peeking out of it (fewer as they spill)
  const pb = (a.mcPocket ?? 0) * 0.8;
  const pk = (p) => sk.at([p[0] + pb * 0.3, p[1] + pb]);
  const left = a.mcSpilled ? 1 : 3;
  for (let i = 0; i < left; i++) seed(ctx, ...pk([2.6 + i * 1.4, 4.6 - (i % 2) * 0.5]), K.sc(1.0), sk.th + 1.6 + (i - 1) * 0.5);
  ctx.beginPath();
  ctx.moveTo(...pk([6.6, 4.9]));
  ctx.lineTo(...pk([1.6, 4.9]));
  ctx.quadraticCurveTo(...pk([1.2, 9.2]), ...pk([1.4, 8.6]));
  ctx.quadraticCurveTo(...pk([4, 9.6]), ...pk([6.4, 8.3]));
  ctx.closePath();
  ctx.fillStyle = K.colour(a, APRON.sh);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, APRON.edge);
  ctx.lineWidth = K.sc(0.3);
  ctx.setLineDash([K.sc(0.7), K.sc(0.5)]);
  ctx.stroke();
  ctx.setLineDash([]);
  // the strap round her neck
  ctx.strokeStyle = K.colour(a, APRON.sh);
  ctx.lineWidth = K.sc(1.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...sk.at([8.4, -0.2]));
  ctx.quadraticCurveTo(...sk.at([8.6, -6.4]), ...sk.at([4.4, -8.2]));
  ctx.stroke();
}
// Frazzled fur (low on health): soft rounded wisps standing up off her back.
function tufts(ctx, a, mode, K) {
  const k = a.mcFrazzle ?? 0;
  if (k < 0.05) return;
  const sk = a.bk;
  for (const [x, y, an] of [[-2, -8.6, -1.9], [-5.6, -7, -2.3], [1.8, -8.4, -1.5], [-8.4, -4.6, -2.6]]) {
    const b = sk.at([x, y + 1.3]);
    const L = K.sc(2.3) * k * (1 + 0.1 * Math.sin(a.t * 6 + x));
    const r = sk.th + an;
    const tip = [b[0] + Math.cos(r) * L, b[1] + Math.sin(r) * L];
    ctx.lineCap = 'round';
    ctx.strokeStyle = mode === 'line' ? INK : K.colour(a, C.base);
    ctx.lineWidth = K.sc(1.5) + (mode === 'line' ? 2 : 0);
    ctx.beginPath();
    ctx.moveTo(...b);
    ctx.quadraticCurveTo(b[0] + Math.cos(r + 0.6) * L * 0.6, b[1] + Math.sin(r + 0.6) * L * 0.6, ...tip);
    ctx.stroke();
  }
}
// The clover sprig behind her ear: a stem rooted inside her head, on its own spring.
function clover(ctx, a, mode, K) {
  const sk = a.bk;
  const st = a.mo.rig;
  const dt = Math.min(0.05, a.dt ?? 0);
  if (mode === 'line') {
    const last = (st.mcCloL ??= { ha: sk.ha, p: sk.hp, v: [0, 0] });
    const om = dt > 0 ? (sk.ha - last.ha) / dt : 0;
    const v = dt > 0 ? [(sk.hp[0] - last.p[0]) / dt, (sk.hp[1] - last.p[1]) / dt] : last.v;
    const acc = dt > 0 ? (v[0] - last.v[0]) / dt : 0;
    st.mcCloL = { ha: sk.ha, p: sk.hp, v };
    a.mcClo = clamp(spring(st, 'mcClo', 0, 150, 8, dt, (-om * 0.04 - clamp(acc, -900, 900) * 0.0012) * dt * 60), -0.8, 0.8);
  }
  K.headFrame(ctx, a);
  const sc = K.sc;
  const root = [-sc(2.4), -sc(4.4)];
  const an = -2.2 + (a.mcClo ?? 0);
  const tip = [root[0] + Math.cos(an) * sc(5), root[1] + Math.sin(an) * sc(5)];
  const leaves = (grow) => {
    for (let i = 0; i < 3; i++) {
      const la = an + (i - 1) * 1.25;
      const c = [tip[0] + Math.cos(la) * sc(1.2), tip[1] + Math.sin(la) * sc(1.2)];
      ctx.moveTo(c[0] + sc(1.15) + grow, c[1]);
      ctx.arc(...c, sc(1.15) + grow, 0, TAU);
    }
  };
  ctx.lineCap = 'round';
  if (mode === 'line') {
    ctx.strokeStyle = '#3e7a48';
    ctx.lineWidth = sc(0.9) + 2;
    ctx.beginPath();
    ctx.moveTo(...root);
    ctx.quadraticCurveTo(root[0] - sc(0.8), root[1] - sc(2.6), ...tip);
    ctx.stroke();
    ctx.fillStyle = '#3e7a48';
    ctx.beginPath();
    leaves(1);
    ctx.fill();
    return;
  }
  ctx.strokeStyle = K.colour(a, '#6fb468');
  ctx.lineWidth = sc(0.9);
  ctx.beginPath();
  ctx.moveTo(...root);
  ctx.quadraticCurveTo(root[0] - sc(0.8), root[1] - sc(2.6), ...tip);
  ctx.stroke();
  ctx.fillStyle = K.colour(a, '#8fd27e');
  ctx.beginPath();
  leaves(0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 3; i++) {
    const la = an + (i - 1) * 1.25;
    ctx.beginPath();
    ctx.arc(tip[0] + Math.cos(la) * sc(1.2) - sc(0.3), tip[1] + Math.sin(la) * sc(1.2) - sc(0.35), sc(0.42), 0, TAU);
    ctx.fill();
  }
}

// ---------- Her own moves (the base's form: x, hop in body heights) ----------
const STANCE = { sit: 1, hold: 0.42, pitch: 0, head: -4, ears: 0.45, curl: 0.1, cheeks: 0.12 };
const MOVES = {
  // Nibble: a quick lunge down off her haunches, two snapping nibbles, and back up.
  nibble: {
    anticT: 0.16,
    keys: [
      [0, { sit: 0.6, hold: 0.3, crouch: 0.3, pitch: -4, curl: 0.3, head: -8, reach: -0.3, ears: -0.4, jaw: 0.2 }],
      [0.06, { sit: 0.15, hold: 0, x: 0.1, pitch: 6, head: 10, reach: 1, jaw: 1, ears: -0.8 }, 'out'],
      [0.11, { sit: 0.15, x: 0.11, pitch: 7, head: 9, reach: 0.9, jaw: 0, ears: -0.8 }, 'in'],
      [0.16, { sit: 0.15, x: 0.12, pitch: 7, head: 12, reach: 1, jaw: 1, ears: -0.8 }, 'out'],
      [0.22, { sit: 0.2, x: 0.11, pitch: 6, head: 8, reach: 0.9, jaw: 0, ears: -0.7 }, 'in'],
      [0.45, { sit: 0.7, hold: 0.3, x: 0.04, pitch: 1, reach: 0.2, ears: 0.1 }, 'io'],
      [0.8, { ...STANCE }],
    ],
    spark: [0.06, 0.16],
    sparkAt: 'teeth',
    mcFace: 'cross',
  },
  // Hoard Toss: her prize acorn hefted back over her head, then flung (`acorn`: the moment it
  // leaves her paws).
  toss: {
    anticT: 0.3,
    keys: [
      [0, { sit: 1, hold: 0.6, throwArm: -1, pitch: -7, head: -12, ears: 0.5, cheeks: 0.25, tailUp: 8 }],
      [0.08, { sit: 0.9, hold: 0.6, throwArm: 1, pitch: 7, head: 9, x: 0.05, ears: 0.1, cheeks: 0.2, jaw: 0.5 }, 'out'],
      [0.26, { sit: 0.95, hold: 0.45, throwArm: 0.5, pitch: 3, head: 4, x: 0.03 }, 'io'],
      [0.7, { ...STANCE }, 'io'],
    ],
    acorn: 0.08,
    mcFace: 'cross',
  },
  // Seed Spit: her cheeks filled, a lean in, and two seeds spat hard at you (`spits`).
  spit: {
    anticT: 0.28,
    keys: [
      [0, { sit: 1, hold: 0.9, head: -10, pitch: -5, cheeks: 0.95, ears: 0.3, jaw: 0 }],
      [0.05, { sit: 1, hold: 0.3, head: 6, reach: 0.8, pitch: 4, jaw: 0.9, cheeks: 0.45 }, 'out'],
      [0.12, { sit: 1, hold: 0.3, head: 2, reach: 0.6, jaw: 0.1, cheeks: 0.5 }, 'io'],
      [0.18, { sit: 1, hold: 0.3, head: 7, reach: 0.85, jaw: 0.9, cheeks: 0.1 }, 'out'],
      [0.3, { sit: 1, hold: 0.35, head: 2, reach: 0.3, jaw: 0, cheeks: 0.1 }, 'io'],
      [0.7, { ...STANCE }, 'io'],
    ],
    spits: [0.05, 0.18],
    mcFace: 'cross',
  },
  // Bowl Roll: curled into a ball, bowling forward into you a body's length, then up again with a
  // little hop back to her spot.
  roll: {
    anticT: 0.24,
    keys: [
      [0, { ball: 0.55, curl: 1.3, crouch: 0.4, pitch: 6, head: 20, reach: -0.6, ears: -0.8, sit: 0 }],
      [0.08, { ball: 1, curl: 2.8, x: 0.05, hop: 0.05, reach: -1, head: 40, ears: -1, sit: 0 }, 'out'],
      [0.36, { ball: 1, curl: 2.8, x: 0.42, hop: 0, reach: -1, head: 40, ears: -1, sit: 0 }, 'lin'],
      [0.46, { ball: 0.35, curl: 0.7, x: 0.45, hop: 0.06, reach: -0.3, head: 10, ears: -0.4, sit: 0 }, 'out'],
      [0.58, { crouch: 0.35, curl: 0.2, x: 0.44, ears: 0.3, sit: 0.3 }, 'in'],
      [0.8, { x: 0.22, hop: 0.12, sit: 0.5, hold: 0.3, ears: 0.6 }, 'io'],
      [0.98, { x: 0.02, hop: 0, sit: 0.9, hold: 0.4, crouch: 0.15 }, 'in'],
      [1.3, { ...STANCE }, 'io'],
    ],
    spin: [[0.04, 0.46, 1]],
    spark: [0.36],
    sparkAt: 'front',
    dust: [[0.08, 'body'], [0.3, 'body'], [0.98, 'feet']],
    lines: [0.08, 0.4],
    mcFace: 'cross',
  },
};
const POOL = ['nibble', 'toss', 'spit', 'roll'];

// ---------- Her moments ----------
// (the base's set poses come after this; beaten, `after`)
function pose(m, a, out, K, mv, mt) {
  const st = a.mo.rig;
  const now = a.now;
  const t = a.t;
  const H = K.H;
  const go = (pose, w = 1) => {
    if (w <= 0.001) return;
    for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
  };
  // (her drawing centred over her spot: sat up, her bulk is behind her feet; on all fours, ahead)
  const sitNow = clamp(st.sit?.x ?? 1, 0, 1);
  const ballNow = clamp(st.ball?.x ?? 0, 0, 1);
  a.dressShift = (mix(-11, 17, sitNow) * (1 - ballNow)) * (m.hp > 0 ? 1 : 0.4);
  a.mcFace = null;
  a.mcGlowCheek = 0;
  a.mcFrazzle = 0;
  a.mcSpilled = false;
  a.dressSpin = 0;
  a.dressPaw = null;
  a.mcFx = null;
  if (m.hp <= 0) return;
  const frac = m.hp / m.def.hp;
  const low = frac < 0.3;
  a.mcFrazzle = low ? 1 : 0;
  a.mcSpilled = low;
  // (in a scene she sits up to talk, even if she was chasing someone when it began)
  const walkW = m.cine ? 0 : a.walkW ?? 0;
  const mood = m.cine?.mood;
  // (the lights going out: when it began, so she stuffs the lamp first, then curls up)
  const hide = (m.hideUntil ?? 0) > now;
  if (hide && !st.mcHiding) st.mcHideAt = now;
  st.mcHiding = hide;
  a.mcGlowCheek = hide ? 1 : 0;
  // A move of hers (an attack, a flinch, the wash after a win) owns the pose; only the face is hers.
  if (mv) {
    a.mcFace = mv.mcFace ?? (mv === K.moves.hurt ? 'hurt' : mv === K.moves.wash ? 'content' : 'cross');
    if (mv === K.moves.hurt) {
      go({ sit: 0.7, hold: 0.5 }, 0.6);
      a.mcFx = { kind: 'popseed', u: (a.hurtAgo ?? 9) / 0.6 };
    }
    if (low && a.mcFace !== 'hurt') a.mcFace = 'teary';
    return;
  }
  // ---- a scene: her acts and moods ----
  const act = m.cine?.act;
  // (out of her hoard once the scene moves on, or ends: a skipped scene plays every act at once)
  if (!act || (act.move !== 'dive' && act.move !== 'buried')) st.mcBuried = null;
  if (act) {
    const u = now - act.at;
    if (act.move === 'dive' || act.move === 'buried') st.mcBuried = { at: act.move === 'dive' ? act.at : act.at - 1 };
    if (act.move === 'burst' && st.mcBuried) st.mcBuried = null;
    if (act.move === 'burst' && u >= 0 && u < 1.6) {
      // up out of her hoard, arms flung up, cheeks stuffed
      const e = sstep(u / 0.35);
      go({ ...STANCE, sit: 1, ball: 0.9 * (1 - e), curl: 2.4 * (1 - e), hop: -0.4 + 0.62 * e - 0.22 * sstep((u - 0.35) / 0.4), hold: 0.9, throwArm: -0.55 * win(u, 0.1, 0.3, 0.9, 1.4), cheeks: 1, ears: 1, head: -10 });
      a.mcFace = 'stuffed';
      a.mcFx = { kind: 'burst', u };
      return;
    }
    if (act.move === 'ptoo' && u >= 0 && u < 1.6) {
      // a stream of seeds: PTOO! PTOO!
      const sp = pulse(u, 0.05, 0.25) + pulse(u, 0.55, 0.25) + pulse(u, 0.95, 0.22);
      go({ ...STANCE, hold: 0.35, head: 4 + sp * 5, reach: 0.3 + sp * 0.6, jaw: sp, cheeks: mix(1, 0.2, sstep(u / 1.2)), ears: 0.8, pitch: 2 + sp * 3 });
      a.mcFace = 'cross';
      a.mcFx = { kind: 'ptoo', u };
      return;
    }
  }
  if (st.mcBuried) {
    // in her hoard: a hop up and in, then curled up under it, the heap wobbling now and then
    const u = now - st.mcBuried.at;
    const dive = sstep(u / 0.5);
    go({ ...STANCE, hop: -0.4 * dive + 0.25 * pulse(u, 0, 0.5), ball: 0.9 * dive, curl: 2.4 * dive, head: 30 * dive, reach: -0.8 * dive, ears: -0.4 });
    a.mcFace = 'sneaky';
    a.mcFx = { kind: 'buried', u };
    return;
  }
  // ---- the fight's moves ----
  const tide = m.tideAt != null ? now - m.tideAt : -1;
  if (tide >= 0 && tide < 3.6) {
    if (tide < 2.4) {
      // the tell: scooping spores into both pouches until her eyes water
      const sc = (tide % 0.6) / 0.6;
      const scoop = Math.sin(Math.PI * sc);
      go({ ...STANCE, hold: 1, head: -8 - scoop * 4, pitch: -3, ears: -0.3, cheeks: mix(0.3, 1.05, sstep(tide / 2.1)), jaw: 0.2 * (1 - scoop) });
      a.dressPaw = () => [1.2 * scoop, 5.5 * scoop];
      a.mcFace = 'stuffed';
      a.mcFx = { kind: 'tell', u: tide };
    } else {
      const u = tide - 2.4;
      const e = sstep(u / 0.15);
      go({ ...STANCE, sit: 0.85, hold: 0.25, head: 16 * e, pitch: 6 * e, reach: e, jaw: e * (1 - sstep((u - 0.9) / 0.3)), cheeks: mix(1, 0, sstep(u / 0.5)), ears: -0.9, crouch: 0.2 });
      a.mcFace = u < 0.9 ? 'blow' : 'cross';
      a.mcFx = { kind: 'burst', u: u + 10 };
    }
    return;
  }
  if (m.move?.kind === 'spin') {
    // Hoarder's Whirl: curled into a ball, whirling on the spot
    const u = now - m.move.at;
    const e = sstep(u / 0.25);
    go({ ball: e, curl: 2.8 * e, sit: 0, hold: 0, head: 40 * e, reach: -e, ears: -1, hop: 0.06 * Math.abs(Math.sin(u * 9)) * e });
    a.dressSpin = Math.max(0, u - 0.15) * 2.4;
    a.mcFace = 'cross';
    a.mcFx = { kind: 'whirl', u };
    return;
  }
  if (hide) {
    const u = now - (st.mcHideAt ?? now);
    if (u < 1.4) {
      // the lamp, into her pouch: gulp
      const into = sstep((u - 0.2) / 0.9);
      go({ ...STANCE, hold: 1, head: -4 + into * 6, cheeks: mix(0.2, 0.9, into), jaw: 0.7 * (1 - into), ears: 0.6 });
      a.mcFace = into < 0.8 ? 'sneaky' : 'stuffed';
      a.mcFx = { kind: 'lamp', u: into };
    } else {
      // curled up, sneaking about in the dark, rolling as she goes; a peek now and then
      const peek = win(t % 5.2, 3.6, 3.9, 4.6, 5);
      go({ ball: 1 - 0.25 * peek, curl: 2.6 - 0.6 * peek, sit: 0, hold: 0, head: 36 - 16 * peek, reach: -0.9 + 0.4 * peek, ears: -0.6 + peek, cheeks: 0.9 });
      a.dressSpin = (m.odo ?? 0) / 190;
      a.mcFace = 'sneaky';
    }
    return;
  }
  const cast = m.castAt != null ? now - m.castAt : -1;
  if (cast >= 0 && cast < 1.9) {
    // Seed Spit: cheeks stuffed, then three seeds spat high into the air
    const fill = sstep(cast / 0.45);
    const sp = pulse(cast, 0.6, 0.22) + pulse(cast, 1.0, 0.22) + pulse(cast, 1.4, 0.22);
    go({ ...STANCE, hold: 1 - 0.6 * sstep((cast - 0.45) / 0.2), head: -14 - 14 * sstep((cast - 0.45) / 0.2) - sp * 4, pitch: -6, reach: 0.2 + sp * 0.4, jaw: sp, cheeks: mix(0.2, 0.95, fill) - 0.25 * sstep((cast - 0.6) / 1), ears: 0.4 });
    a.mcFace = 'cross';
    a.mcFx = { kind: 'rain', u: cast };
    return;
  }
  const call = m.callAt != null ? now - m.callAt : -1;
  if (call >= 0 && call < 1.5) {
    // Pocket Pests: her apron pocket shaken out, the mites tumbling free
    const sh = Math.sin(call * 26) * win(call, 0.1, 0.25, 1.0, 1.3);
    go({ ...STANCE, hold: 0.5, head: 10 - 14 * sstep((call - 0.9) / 0.3), ears: 0.8, curl: 0.2 });
    a.dressPaw = (side) => [-1.6 + sh * 0.6 * (side ? -1 : 1), 4.6 + sh * 0.4];
    a.mcFace = call < 0.9 ? 'bossy' : 'cross';
    a.mcFx = { kind: 'pests', u: call };
    return;
  }
  // ---- standing about ----
  // (sat up on her haunches whenever she isn't scurrying about on all fours)
  go(STANCE, 1 - walkW);
  a.mcFace = walkW > 0.5 ? (m.engaged ? 'cross' : 'busy') : m.engaged ? 'bossy' : 'busy';
  // (a cross line in a scene's portrait: ui/cutscene.js holds her anger up)
  if (m.aggroUntil === Infinity) a.mcFace = 'cross';
  // her idle act: only when she's calm
  const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.aggroUntil === Infinity ? 0 : 1) * (m.engaged ? 0 : 1);
  if (calmK > 0.02) idleAct(m, a, out, go, calmK, t);
  // a scene's mood as her face
  if (mood) {
    a.mcFace = { angry: 'cross', happy: 'content', sad: 'teary', talk: 'talk', sleep: 'shut', blink: 'shut', hurt: 'hurt' }[mood] ?? a.mcFace;
    if (mood === 'talk') out.jaw = 0.3 * Math.abs(Math.sin(t * 9));
    if (mood === 'angry') go({ ears: -0.4, head: -6 }, 1);
    if (mood === 'sad') go({ ears: -0.8, head: 10, hold: 0.8 }, 1);
  }
  if (low && !mood) a.mcFace = walkW > 0.5 ? 'teary' : 'teary';
}
// The 30 s act: counting seeds into her pouch; dusting her apron; a suspicious look both ways and a
// seed hidden in her pocket; washing her face; patting her full cheeks.
function idleAct(m, a, out, go, w, t) {
  const lu = (t + (m.uid % 7) * 3.1) % 30;
  // counting seeds into her pouch: one, two, three, each nibbled in, the pouch filling
  const count = win(lu, 0.3, 0.8, 5.4, 6);
  if (count > 0.01) {
    const n = Math.floor((lu - 0.8) / 1.5);
    const sub = ((lu - 0.8) % 1.5) / 1.5;
    const pop = pulse(sub, 0.4, 0.35);
    go({ hold: 1, head: 8 + pop * 4, jaw: pop * 0.6, cheeks: 0.15 + 0.22 * clamp(n + sstep((sub - 0.4) / 0.4), 0, 3), nose: 0.6 }, count * w);
    if (count * w > 0.5) {
      a.mcFace = pop > 0.3 ? 'content' : 'busy';
      a.mcFx = { kind: 'count', u: sub, n };
    }
  }
  // dusting her apron: both paws brushing down it, brisk
  const dust = win(lu, 6.4, 6.9, 10.6, 11.2);
  if (dust > 0.01) {
    const br = Math.sin(t * 11);
    go({ hold: 0.5, head: 16, ears: 0.3, cheeks: 0.45 }, dust * w);
    a.dressPaw = (side) => [-1.2 - br * 1.2 * (side ? -1 : 1), 3.6 + (side ? 0.6 : 0)];
    if (dust * w > 0.5) {
      a.mcFace = 'bossy';
      a.mcFx = { kind: 'dust', u: br };
    }
  }
  // a suspicious look: one way, the other (a beat held each way), then a seed hidden in her pocket
  const sus = win(lu, 11.6, 12, 17.2, 17.8);
  if (sus > 0.01) {
    const side = lu < 13.4 ? 1 : lu < 15 ? -1 : 0;
    const lookA = side === 1 ? -14 : side === -1 ? 8 : 12;
    const hideK = sstep((lu - 15) / 0.5) * (1 - sstep((lu - 16.8) / 0.4));
    go({ hold: 0.6 - hideK * 0.1, head: lookA, ears: 1, pitch: side === -1 ? -4 : 0, cheeks: 0.45 }, sus * w);
    if (hideK > 0.01) a.dressPaw = () => [-2.4 * hideK, 3.8 * hideK];
    if (sus * w > 0.5) {
      a.mcFace = hideK > 0.3 ? 'smug' : 'sneaky';
      a.mcLook = side;
      a.mcFx = { kind: 'hide', u: hideK };
    }
  }
  // washing her face (the base's own wash)
  const wash = win(lu, 18.2, 18.7, 22.6, 23.2);
  if (wash > 0.01) {
    go({ hold: 1, wash: 1, head: 6, ears: -0.2, cheeks: 0.45 }, wash * w);
    if (wash * w > 0.5) a.mcFace = 'shut';
  }
  // patting her full cheeks, pleased with herself
  const pat = win(lu, 23.6, 24.2, 29, 29.6);
  if (pat > 0.01) {
    const p = Math.abs(Math.sin(t * 7));
    go({ hold: 1, head: -6, ears: 0.7, cheeks: 0.85 + p * 0.05, tailUp: 6 }, pat * w);
    a.dressPaw = (side) => [-1.4 - p * 0.8, 0.6 + (side ? 0.3 : 0)];
    if (pat * w > 0.5) a.mcFace = 'content';
  }
}
// Beaten: flopped on her back, paws in the air, dizzy.
// (And every attack's wind-up eased in from the pose she was showing a moment before, not from the
// base's own bare pose: her body, arms and acorn jumped down in one frame as each began, 2026-11-26.)
function after(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  if (!mv) st.mcPre = { ...out };
  else if (mt < 0 && mv.anticT > 0 && st.mcPre && m.hp > 0) {
    // (a quick blend, about 0.12 s, so the jump is gone but the wind-up still reads as a wind-up)
    const w = 1 - sstep((mt + mv.anticT) / Math.min(0.12, mv.anticT * 0.5));
    for (const [k, v] of Object.entries(st.mcPre)) if (k in out) out[k] += (v - out[k]) * w;
  }
  // (the acorn's wind-up keeps her paw up the whole way: her base fades a held paw out as it comes
  // down, and a dip before the arm swings back showed it as a see-through ghost paw)
  if (mv?.acorn != null && mt < mv.acorn && m.hp > 0) out.hold = Math.max(out.hold ?? 0, 0.45);
  if (m.hp > 0) return;
  Object.assign(out, { sit: 0, ball: 0, hold: 0, free: 1, flop: 1, curl: 0.3, ears: -0.6, jaw: 0.3, head: -18, reach: -0.4, hop: 0.08, cheeks: 0, wash: 0, throwArm: 0 });
  a.dressSpin = -0.5;
  a.mcFace = 'dizzy';
  a.mcFrazzle = 0.8;
  a.mcSpilled = true;
  a.mcFx = { kind: 'beaten' };
}

// ---------- What she holds and what flies (the rig's space, facing right) ----------
function fx(ctx, m, a, K) {
  const sk = a.bk;
  if (!sk) return;
  const sc = K.sc;
  const t = a.t;
  const f = a.flip ? -1 : 1;
  const paw = sk.legs.foreN.P;
  const pawF = sk.legs.foreF.P;
  const mid = [(paw[0] + pawF[0]) / 2, (paw[1] + pawF[1]) / 2];
  const mo = sk.mouth;
  // (her stuffed pouch, glowing with the lamp in it: told to the room's dark, render/hollow.js)
  if (a.mcGlowCheek > 0) {
    const pc = sk.headPt([0.2, 5.4]);
    if (a.mcFx?.kind !== 'lamp') light(ctx, pc[0], pc[1], sc(9), 0.4, PINK);
    m.mcGlow = { x: (m.x ?? 0) + f * pc[0], y: (m.y ?? 0) + pc[1], at: a.now };
  }
  // her attacks (the base's moves' own sparks are drawn already)
  const mv = a.rdMove?.mv;
  const mt = a.rdMove?.t ?? 0;
  if (mv?.acorn != null) {
    if (mt < mv.acorn) {
      // (brought up over her head as the wind-up starts, growing in, not there all at once)
      // (solid at once, just small; it grows to full size as her paws come up, about 0.14 s)
      const k = mt < 0 && mv.anticT > 0 ? sstep((mt + mv.anticT) / Math.min(0.14, mv.anticT * 0.6)) : 1;
      acorn(ctx, sk.hp[0] - sc(6.5), sk.hp[1] - sc(8.5 - 3 * (1 - k)), sc(3) * (0.6 + 0.4 * k), -0.3);
    }
    else {
      const u = clamp((mt - mv.acorn) / 0.26, 0, 1);
      const from = [sk.hp[0] + sc(4), sk.hp[1] - sc(8)];
      const to = [sk.hp[0] + sc(18), sc(-14)];
      const p = [mix(from[0], to[0], u), mix(from[1], to[1], u) - Math.sin(Math.PI * u) * sc(7)];
      if (u < 1) {
        streak(ctx, [p[0] - sc(9), p[1] + sc(1)], p, sc(1.2), '#fff2d0', 0.8);
        acorn(ctx, ...p, sc(3), u * 10);
      } else if (mt - mv.acorn < 0.6) {
        const k = (mt - mv.acorn - 0.26) / 0.34;
        for (let i = 0; i < 4; i++) twinkle(ctx, to[0] + Math.cos(i * 1.6) * sc(4) * (1 + k), to[1] + Math.sin(i * 1.6) * sc(3) * (1 + k), sc(1.3), 1 - k, i % 2 ? '#fff3a0' : '#ffffff');
        acorn(ctx, to[0] - sc(2) * k, to[1] + sc(8) * k * k, sc(3), 2 + k * 4, 1 - k);
      }
    }
  }
  for (const s0 of mv?.spits ?? []) {
    const u = (mt - s0) / 0.3;
    if (u < 0 || u > 1) continue;
    const p = [mo[0] + sc(2) + u * sc(16), mo[1] + u * sc(2)];
    streak(ctx, [p[0] - sc(6), p[1]], p, sc(0.8), '#ffffff', 0.7 * (1 - u));
    seed(ctx, ...p, sc(1.15), u * 2, 1 - sstep((u - 0.8) / 0.2));
  }
  if (mv?.spin && mt > 0.1 && mt < 0.5) for (let i = 0; i < 3; i++) fluff(ctx, sk.pivot[0] - sc(8) - i * sc(5), -sc(1.5) - i * sc(0.8), sc(1.4 - i * 0.3), 0.8, '#fff0d8', '#d8b088');
  const X = a.mcFx;
  if (X) {
    const k = X.kind;
    if (k === 'popseed' && X.u < 1) {
      // hit: a seed pops out of her cheek and tumbles off
      const u = X.u;
      seed(ctx, mo[0] + sc(1) + u * sc(5), mo[1] - sc(1) - Math.sin(Math.PI * u) * sc(7) + u * u * sc(4), sc(1.1), u * 9);
    } else if (k === 'count') {
      // a seed held up in her paws, nibbled into her pouch
      if (X.u < 0.6) seed(ctx, mid[0] + sc(0.6), mid[1] - sc(1), sc(1.3), -0.6 + X.u);
    } else if (k === 'dust') {
      for (let i = 0; i < 2; i++) fluff(ctx, sk.at([3 + i * 2, 9.4])[0] + X.u * sc(1), sk.at([3, 9.4])[1] + sc(1) + i * sc(1), sc(0.7), 0.5, '#fff8ee', '#e0d0c0');
    } else if (k === 'hide') {
      if (X.u < 0.95) seed(ctx, mid[0] + sc(0.4), mid[1] - sc(0.4), sc(1.2), 0.8);
    } else if (k === 'tell') {
      // spores and fluff swirling up into her pouches from the floor
      for (let i = 0; i < 12; i++) {
        const u = (X.u * 0.8 + i / 12) % 1;
        const side = i % 2 ? 1 : -1;
        const r = sc(10) + sc(16) * (1 - u);
        const an = (side > 0 ? -0.3 : Math.PI + 0.3) + (1 - u) * 1.4 * side + hash(i) * 0.5;
        fluff(ctx, mo[0] + Math.cos(an) * r, mo[1] + Math.sin(an) * r * 0.7, sc(0.55) + hash(i * 3) * sc(0.4), 0.85 * Math.sin(Math.PI * u), i % 3 ? '#fff0b8' : '#ffd6ea', '#d8a860');
      }
      if (X.u > 1) cue(ctx, 'mmmff!', sk.hp[0] + sc(5), sk.hp[1] - sc(13.5), sc(3.4), f, -0.1);
    } else if (k === 'burst' && X.u >= 10) {
      // PFFFT! the spray of seed-fluff from her mouth (the floor's tide is the zone's own)
      const u = X.u - 10;
      if (u < 1.1) {
        for (let i = 0; i < 14; i++) {
          const v = (u * 1.6 + i / 14) % 1;
          const spread = (hash(i) - 0.5) * 0.9;
          const p = [mo[0] + sc(3) + v * sc(30), mo[1] + v * sc(10) + spread * v * sc(14)];
          if (i % 3) fluff(ctx, ...p, sc(0.9) + v * sc(1.4), (1 - v) * 0.9, '#fff2d0', '#d8a860');
          else seed(ctx, ...p, sc(1.1), v * 8 + i);
        }
        cue(ctx, 'PFFFT!', sk.hp[0] + sc(6), sk.hp[1] - sc(15), sc(4), f, 0.08);
      }
    } else if (k === 'whirl') {
      for (let i = 0; i < 8; i++) {
        const an = (i / 8) * TAU + X.u * 9;
        const r = sc(11) + sc(4) * Math.sin(X.u * 5 + i);
        seed(ctx, sk.pivot[0] + Math.cos(an) * r, sk.pivot[1] + Math.sin(an) * r * 0.6, sc(1), an + 1.6, clamp(X.u / 0.3, 0, 1));
      }
    } else if (k === 'lamp') {
      // the garden's big glowcap lamp, held up and stuffed into her pouch
      const p = [mix(mid[0] + sc(1.5), mo[0] + sc(0.5), X.u), mix(mid[1] - sc(3), mo[1], X.u)];
      glowcap(ctx, p[0], p[1], sc(3.4) * (1 - 0.55 * X.u), 0.3 * (1 - X.u), 0.55);
      if (X.u > 0.85) cue(ctx, 'gulp', sk.hp[0] + sc(5), sk.hp[1] - sc(13), sc(3), f, -0.1);
    } else if (k === 'rain') {
      // three seeds spat high into the air
      for (const s0 of [0.6, 1.0, 1.4]) {
        const u = (X.u - s0) / 0.5;
        if (u < 0 || u > 1) continue;
        const p = [mo[0] + sc(2) + u * sc(6), mo[1] - u * sc(40)];
        streak(ctx, [p[0], p[1] + sc(8)], p, sc(0.9), '#ffffff', 0.7);
        seed(ctx, ...p, sc(1.2), -1.5 + u * 6);
      }
    } else if (k === 'pests') {
      // her pocket shaken out: puffs and seeds tumbling off both ways
      const pk = sk.at([4, 6.8]);
      for (let i = 0; i < 6; i++) {
        const u = clamp((X.u - 0.15 - i * 0.07) / 0.7, 0, 1);
        if (u <= 0 || u >= 1) continue;
        const side = i % 2 ? 1 : -1;
        const p = [pk[0] + side * u * sc(22), pk[1] - Math.sin(Math.PI * u) * sc(8) + u * sc(6)];
        if (i % 3 === 0) seed(ctx, ...p, sc(1), u * 9);
        else fluff(ctx, ...p, sc(1.1) * (1 - u * 0.4), 0.8 * (1 - u), '#f4e6ff', '#c0a0d8');
      }
    } else if (k === 'buried' || (k === 'burst' && X.u < 10)) {
      // her hoard: a mound over her (wobbling as she shifts under it), bursting apart as she pops out
      const u = X.u;
      const bx = sk.pivot[0] - sc(1);
      if (k === 'buried') {
        const wob = Math.sin(t * 13) * win(t % 3.4, 2.4, 2.5, 2.9, 3.1) * 0.06;
        ctx.save();
        ctx.translate(bx, 0);
        ctx.rotate(wob);
        heap(ctx, 0, 0, sc(40) * Math.min(1, 0.3 + u * 1.4), sc(17) * Math.min(1, 0.3 + u * 1.4), t);
        ctx.restore();
      } else {
        const gone = sstep((u - 0.3) / 1.2);
        heap(ctx, bx, 0, sc(40) * (1 - gone * 0.4), sc(17) * (1 - gone * 0.75), t, 1 - gone);
        for (let i = 0; i < 12; i++) {
          const v = clamp(u / 0.9 - i * 0.02, 0, 1);
          if (v >= 1) continue;
          const an = -Math.PI / 2 + (hash(i) - 0.5) * 2.4;
          const r = sc(26) * v;
          const p = [bx + Math.cos(an) * r, -sc(12) + Math.sin(an) * r + v * v * sc(22)];
          if (i % 3) seed(ctx, ...p, sc(1.15), i + v * 8, 1 - sstep((v - 0.8) / 0.2));
          else fluff(ctx, ...p, sc(1.4), 0.8 * (1 - v), '#fff0d0', '#d8a860');
        }
      }
    } else if (k === 'ptoo') {
      for (const s0 of [0.05, 0.55, 0.95]) {
        for (let j = 0; j < 3; j++) {
          const u = (X.u - s0 - j * 0.06) / 0.4;
          if (u < 0 || u > 1) continue;
          const p = [mo[0] + sc(3) + u * sc(28), mo[1] + u * u * sc(6) + (j - 1) * sc(1.2)];
          streak(ctx, [p[0] - sc(6), p[1]], p, sc(0.8), '#ffffff', 0.6 * (1 - u));
          seed(ctx, ...p, sc(1.2), u * 3 + j);
        }
      }
      if (X.u > 0.05 && X.u < 0.5) cue(ctx, 'PTOO!', sk.hp[0] + sc(8), sk.hp[1] - sc(14), sc(3.6), f, -0.12);
      if (X.u > 0.55 && X.u < 1.3) cue(ctx, 'PTOO!', sk.hp[0] + sc(14), sk.hp[1] - sc(16), sc(3.6), f, 0.1);
    } else if (k === 'beaten') {
      dizzy(ctx, sk.hp[0], sk.hp[1] - sc(8), sc(6), t);
      for (let i = 0; i < 4; i++) seed(ctx, sk.pivot[0] - sc(14) + i * sc(9), -sc(1.1), sc(1.1), i * 1.7);
    }
  }
  // low on health: a seed spilling out of her pocket now and then, a sweat drop
  if (a.mcSpilled && m.hp > 0 && sk.ball < 0.5) {
    const u = (t * 0.7) % 1;
    const pk = sk.at([3.5, 8.6]);
    seed(ctx, pk[0] + u * sc(2), Math.min(-sc(1), pk[1] + u * u * (-pk[1])), sc(1), u * 6, 1 - sstep((u - 0.85) / 0.15));
    if (X?.kind !== 'popseed') sweat(ctx, sk.hp[0] - sc(5), sk.hp[1] - sc(7), sc(1.4), 0.6 + 0.4 * Math.sin(t * 2));
  }
}

const HAZEL_RIG = dressedRodent({
  kind: 'hamster',
  C,
  ink: INK,
  P,
  face,
  pose,
  after,
  moves: MOVES,
  // (her swings in turn; m.move only ever read as a move's name)
  pick: (m, a, st) => (typeof m.move === 'string' && MOVES[m.move] ? m.move : POOL[(st.rdN ?? 0) % POOL.length]),
  under: { head: pouch(true) },
  over: { body: (ctx, a, mode, K) => { apron(ctx, a, mode, K); tufts(ctx, a, mode, K); }, head: pouch(false), earN: clover },
  fx,
});
// Her art entry and her size as drawn (sat up: from her tail to her nose, her feet to her ears).
export const HAZEL_ART = { ...HAZEL_RIG.art, noHop: true };
// (measured on tools/zz-hazelcheck.html: sat up, 90 wide and 100 tall, centred over her spot)
export const HAZEL_SIZE = { w: 90, h: 100, speed: 44 };
