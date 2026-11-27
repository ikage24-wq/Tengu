// Lady Abyssia's cast looks (2026-11-26, her new fight, world/aquarium.js): each telegraph drawn whole in
// her own soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its
// cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold, e eased, fade). Her colours: glossy violet-indigo ink, her plum, the warm
// gold of the light in her lanterns; every shape rounded, outlined in a deeper shade of its own colour,
// eased. render/dreamfx.js hands each zone with one of these looks to them. (x, y) is the zone's spot
// on the 640 x 360 screen.
//   abKiss      Kiss Goodnight (the tank's marker): a big plum lipstick kiss swelling over them, little
//               hearts circling in; landing, "Mwah!" and the kiss bursts into hearts and ink drops
//   abBlot      Ink Blots (a marker on each of you: spread): a glossy drop of ink gathering in the dark
//               over each of you, spinning slowly, its splash ring on the floor; landing, it drops and
//               splats in a round glossy blot with sparkles
//   abDark      Lights Out! (the whole room): the dark coming down over everything (ink curling in from
//               the edges) but for the beams of warm light under her lanterns, each lantern hanging in
//               the water (a darling's own lantern held up where it trembles); landing, the dark
//               squeezes in one deep violet pulse on everyone outside the light, then lifts
//   abDarkPart  (the dark's stretches between the beams, for dodging: drawn by abDark)
//   abEmbrace   Eight-Arm Embrace (a ring round her: get in): ghostly octopus arms reaching along the
//               floor from both sides, curling in, a warm glow in the safe middle; landing, they sweep
//               shut in a splash of ink
//   abFlounce   Ink Flounce (round her: get out): a swirl of ink spinning round her on the floor, drops
//               riding it; landing, flung out in a ring
//   abCackle    Ohohoho! (everyone): violet bubbles rising all over the floor, a plum haze, "ohoho"s
//               floating up; landing, the bubbles pop in a soft violet flash
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { INKY, LIP, LIGHT, GLASS, CAP, TEAL, ARM } from './palette.js';

const SW = 640;
const SH = 360;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
// A glossy drop of ink (never a speck).
function drop(ctx, x, y, s, ang = 0, al = 1) {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.5);
  ctx.quadraticCurveTo(s * 1.05, -s * 0.1, s * 0.9, s * 0.45);
  ctx.quadraticCurveTo(0, s * 1.35, -s * 0.9, s * 0.45);
  ctx.quadraticCurveTo(-s * 1.05, -s * 0.1, 0, -s * 1.5);
  pen(ctx, INKY.deep, Math.max(0.5, s * 0.2));
  ctx.stroke();
  ctx.fillStyle = INKY.base;
  ctx.fill();
  ell(ctx, -s * 0.3, -s * 0.05, s * 0.28, s * 0.2, -0.5);
  ctx.fillStyle = INKY.gloss;
  ctx.fill();
  ctx.restore();
}
function heart(ctx, x, y, s, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  pen(ctx, LIP.base, Math.max(0.6, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = LIP.lt;
  ctx.fill();
  ell(ctx, x - s * 0.4, y - s * 0.25, s * 0.22, s * 0.14, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
}
function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(236,228,255,0.3)';
  ctx.fill();
  pen(ctx, 'rgba(176,150,236,0.95)', Math.max(0.5, r * 0.18));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, Math.PI * 1.1, Math.PI * 1.5);
  pen(ctx, 'rgba(255,255,255,0.9)', Math.max(0.4, r * 0.2));
  ctx.stroke();
  ctx.restore();
}
// A soft ring on the floor (seen from a little above), in a colour, with its own deeper rim.
function floorRing(ctx, x, y, r, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.22);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function word(ctx, text, x, y, size, al, col = INKY.sh) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff6ff';
  ctx.lineWidth = size * 0.38;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ---------- Kiss Goodnight ----------
// The kiss: two plump rounded lips, plum, a shine on the lower one.
function lips(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.bezierCurveTo(-4, -2.6, -1.6, -3.2, 0, -1.6);
  ctx.bezierCurveTo(1.6, -3.2, 4, -2.6, 5, 0);
  ctx.bezierCurveTo(3.4, 3.6, -3.4, 3.6, -5, 0);
  ctx.closePath();
  pen(ctx, LIP.sh, 0.9);
  ctx.stroke();
  ctx.fillStyle = LIP.base;
  ctx.fill();
  pen(ctx, LIP.in, 0.6);
  ctx.beginPath();
  ctx.moveTo(-4.6, 0);
  ctx.quadraticCurveTo(0, 0.9, 4.6, 0);
  ctx.stroke();
  ell(ctx, 1, 1.6, 1.3, 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fill();
  ctx.restore();
}
function kissWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(LIP.lt, 0.16 + 0.16 * p), rgba(LIP.base, 0.85), 1, 1.6);
  // hearts circling in, faster as it comes
  for (let i = 0; i < 6; i++) {
    const an = time * (1.4 + p * 2) + (i / 6) * TAU;
    const rr = r * (1 - 0.45 * p);
    heart(ctx, x + Math.cos(an) * rr, y - 26 + Math.sin(an) * rr * 0.3, 3.2, 0.6 + 0.25 * Math.sin(an));
  }
  lips(ctx, x, y - 42 - Math.sin(time * 4) * 1.5, 1.6 + 1.6 * sstep(p), 0.5 + 0.5 * sstep(p / 0.4));
}
function kissHit(ctx, z, x, y, u, e, fade) {
  lips(ctx, x, y - 38, 3.2 + e * 1.6, 1 - sstep(u / 0.4));
  for (let i = 0; i < 9; i++) {
    const an = (i / 9) * TAU + 0.3;
    const d = 6 + e * 34;
    if (i % 3) heart(ctx, x + Math.cos(an) * d, y - 34 + Math.sin(an) * d * 0.7, 3.4, fade);
    else drop(ctx, x + Math.cos(an) * d, y - 34 + Math.sin(an) * d * 0.7, 2.6, an + Math.PI / 2, fade);
  }
  word(ctx, 'Mwah!', x, y - 64 - e * 6, 13, fade);
  floorRing(ctx, x, y, z.w / 2 * (1 + e * 0.2), rgba(LIP.lt, 0.25 * fade), rgba(LIP.base, fade), 1, 1.6);
}

// ---------- Ink Blots ----------
function blotWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (0.7 + 0.3 * p), rgba(INKY.base, 0.22 + 0.25 * p), rgba(INKY.sh, 0.95), 1, 1.8);
  // the drop gathering up over them, spinning slowly, swelling; a dotted fall-line under it
  const s = 3.4 + 4.6 * sstep(p);
  const hy = y - 70 + Math.sin(time * 3 + z.x) * 2;
  glow(ctx, x, hy, s * 3.6, INKY.lt, 0.35 * p + 0.1);
  for (let i = 1; i < 6; i++) drop(ctx, x, hy + s * 1.4 + i * ((y - hy - s * 1.4) / 6), 0.9, 0, (0.25 + 0.35 * p) * (1 - i * 0.1));
  drop(ctx, x, hy, s, Math.sin(time * 2 + z.x) * 0.2, 0.6 + 0.4 * sstep(p / 0.3));
  for (let i = 0; i < 3; i++) {
    const an = time * 2.4 + (i / 3) * TAU;
    drop(ctx, x + Math.cos(an) * (s * 2.2), hy + Math.sin(an) * s * 0.8, 1.6, an, 0.7 * p);
  }
}
function blotHit(ctx, z, x, y, u, e, fade) {
  // falls, then splats: a glossy round blot on the floor, drops thrown up, sparkles
  const fall = sstep(u / 0.18);
  if (u < 0.2) drop(ctx, x, y - 70 + fall * 64, 8, 0, 1);
  const k = sstep((u - 0.15) / 0.25);
  if (k > 0) {
    ctx.save();
    ctx.globalAlpha *= fade;
    ell(ctx, x, y, z.w / 2 * 0.85 * (0.4 + 0.6 * k), z.w / 2 * 0.2 * (0.4 + 0.6 * k));
    ctx.fillStyle = INKY.sh;
    ctx.fill();
    pen(ctx, INKY.deep, 1.2);
    ctx.stroke();
    ell(ctx, x - 8, y - 2, 8, 1.6);
    ctx.fillStyle = INKY.gloss;
    ctx.globalAlpha *= 0.7;
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const an = -Math.PI + (i / 5) * Math.PI;
      drop(ctx, x + Math.cos(an) * k * 30, y - 4 + Math.sin(an) * k * 24 + k * k * 8, 2.4, an + Math.PI / 2, fade);
    }
    sparkle(ctx, x + 12, y - 16 * k, 3.6 * fade, fade, '#e8dcff');
    sparkle(ctx, x - 14, y - 10 * k, 2.6 * fade, fade, '#e8dcff');
  }
}

// ---------- Lights Out! ----------
// A lantern hanging in the water: a ring, the cap with its teal band, the violet glass with the light.
function hungLantern(ctx, x, y, s, k, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  pen(ctx, CAP.base, 0.8);
  ctx.beginPath();
  ctx.arc(0, -3, 1.4, 0, TAU);
  ctx.stroke();
  ell(ctx, 0, 5.4, 4.6, 4.5);
  pen(ctx, GLASS.ink, 1.4);
  ctx.stroke();
  ctx.fillStyle = GLASS.base;
  ctx.fill();
  const g = ctx.createRadialGradient(0, 5.6, 0, 0, 5.6, 5);
  g.addColorStop(0, rgba(LIGHT.core, k));
  g.addColorStop(0.45, rgba(LIGHT.mid, 0.9 * k));
  g.addColorStop(1, rgba(LIGHT.edge, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-5, 0, 10, 11);
  ctx.beginPath();
  ctx.arc(0, 5.4, 3.8, Math.PI * 1.05, Math.PI * 1.48);
  pen(ctx, 'rgba(255,255,255,0.85)', 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3.2, 1.2);
  ctx.quadraticCurveTo(0, -2.2, 3.2, 1.2);
  ctx.lineTo(2.6, 2.6);
  ctx.lineTo(-2.6, 2.6);
  ctx.closePath();
  pen(ctx, CAP.ink, 1);
  ctx.stroke();
  ctx.fillStyle = CAP.base;
  ctx.fill();
  ctx.fillStyle = TEAL.base;
  ctx.fillRect(-2.9, 1.6, 5.8, 0.9);
  sparkle(ctx, Math.sin(time * 1.3) * 1.4, 5 + Math.cos(time) * 1, 0.9 * k, k);
  ctx.restore();
}
// Where each beam is on screen: the zone carries the beams in the world; its own spot gives the camera.
const beamsOf = (z, x) => (z.beams ?? []).map((b) => ({ ...b, sx: b.x - (z.x - x) }));
const LAMP_UP = 132;
// (each beam: a cone of light under its lantern, narrow at the lantern, its full width at the floor)
const lampOf = (b, y, time) => (b.own ? y - (b.h ?? 40) : y - LAMP_UP + Math.sin(time * 1.4 + b.x * 0.01) * 3);
function beamPath(ctx, b, y, hw, time) {
  const top = lampOf(b, y, time);
  ctx.moveTo(b.sx - hw * 0.3, top);
  ctx.lineTo(b.sx + hw * 0.3, top);
  ctx.lineTo(b.sx + hw, y + 6);
  ctx.quadraticCurveTo(b.sx, y + 14, b.sx - hw, y + 6);
  ctx.closePath();
}
// (the dark over the room down to the floor's edge, the beams cut out of it)
function darkPath(ctx, z, x, y, hw, time) {
  ctx.beginPath();
  ctx.rect(-20, -20, SW + 40, y + 30);
  for (const b of beamsOf(z, x)) beamPath(ctx, b, y, hw, time);
}
function darkWarn(ctx, z, x, y, p, time) {
  const hw = (z.bw ?? 84) / 2;
  const dark = sstep(p / 0.45);
  // the dark: everything but the beams, a deep violet-indigo, ink curling in at the edges
  ctx.save();
  darkPath(ctx, z, x, y, hw, time);
  ctx.fillStyle = rgba('#100828', 0.84 * dark);
  ctx.fill('evenodd');
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    const v = (time * 0.25 + hash(i * 3.1)) % 1;
    const yy = 40 + hash(i * 1.7) * 280;
    const xx = side < 0 ? -10 + v * 60 * dark : SW + 10 - v * 60 * dark;
    ctx.save();
    ctx.globalAlpha = 0.55 * dark * Math.sin(Math.PI * v);
    ell(ctx, xx, yy, 18 + hash(i) * 14, 10 + hash(i * 2) * 8, Math.sin(time + i));
    ctx.fillStyle = INKY.deep;
    ctx.fill();
    ctx.restore();
  }
  // the beams: warm light falling from each lantern, motes drifting in it
  for (const b of beamsOf(z, x)) {
    const lampY = lampOf(b, y, time);
    const g = ctx.createLinearGradient(0, lampY, 0, y + 10);
    g.addColorStop(0, rgba(LIGHT.halo, 0.4 * dark + 0.05));
    g.addColorStop(1, rgba(LIGHT.halo, 0.14 * dark + 0.04));
    ctx.fillStyle = g;
    ctx.beginPath();
    beamPath(ctx, b, y, hw, time);
    ctx.fill();
    floorRing(ctx, b.sx, y, hw, rgba(LIGHT.halo, 0.3 * dark + 0.1), rgba(LIGHT.edge, 0.7), 1, 1.2);
    for (let i = 0; i < 4; i++) {
      const v = (time * 0.4 + i / 4 + hash(b.x)) % 1;
      sparkle(ctx, b.sx + Math.sin(i * 2.1 + time) * hw * 0.5, lampY + 10 + v * (y - lampY - 10), 1.2, Math.sin(Math.PI * v) * (0.4 + 0.6 * dark), LIGHT.halo);
    }
    if (!b.own) {
      // the lantern itself, swinging gently in the water (it drifts, in the last part of the fight)
      hungLantern(ctx, b.sx, lampY - 8, 1.7, 0.6 + 0.4 * dark, time);
      glow(ctx, b.sx, lampY + 2, 22, LIGHT.halo, 0.35 * dark + 0.15);
    } else glow(ctx, b.sx, lampY, 20, LIGHT.halo, 0.4 * dark + 0.2);
  }
}
function darkHit(ctx, z, x, y, u, e, fade, time) {
  const hw = (z.bw ?? 84) / 2;
  // the squeeze: the dark pulses deep violet once, then lifts
  const k = u < 0.25 ? 1 : 1 - sstep((u - 0.25) / 0.75);
  ctx.save();
  darkPath(ctx, z, x, y, hw, time);
  ctx.fillStyle = rgba('#2a1260', 0.72 * k);
  ctx.fill('evenodd');
  ctx.restore();
  // ink splashing up along the floor outside the light
  const bs = beamsOf(z, x);
  for (let i = 0; i < 16; i++) {
    const px = (i + 0.5) * (SW / 16) + (hash(i) - 0.5) * 20;
    if (bs.some((b) => Math.abs(b.sx - px) < hw)) continue;
    const v = sstep(u / 0.5);
    drop(ctx, px, y - 4 - Math.sin(Math.PI * v) * 22, 1.8, (hash(i) - 0.5), fade);
  }
  for (const b of bs) {
    // the beams held safe, bright a moment longer
    const lampY = lampOf(b, y, time);
    const g = ctx.createLinearGradient(0, lampY, 0, y + 10);
    g.addColorStop(0, rgba(LIGHT.halo, 0.5 * k));
    g.addColorStop(1, rgba(LIGHT.halo, 0.2 * k));
    ctx.fillStyle = g;
    ctx.beginPath();
    beamPath(ctx, b, y, hw, time);
    ctx.fill();
    if (!b.own) hungLantern(ctx, b.sx, lampY - 8, 1.7, fade, time);
  }
}

// ---------- Eight-Arm Embrace ----------
// A ghostly octopus arm on the floor: from off at `x0`, reaching in along the floor and curling at `x1`.
function ghostArm(ctx, x0, x1, y, w, curl, al, time, i) {
  if (al <= 0.01) return;
  const dir = Math.sign(x1 - x0) || 1;
  const n = 12;
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    pts.push([x0 + (x1 - x0) * u, y - 3 - Math.sin(u * Math.PI) * 6 - Math.sin(u * Math.PI * 2 + time * 3 + i) * 2 * (1 - u)]);
  }
  // the curl at its tip, rolling up
  const tip = pts[n];
  for (let k = 1; k <= 5; k++) {
    pts.push([tip[0] + dir * Math.sin((k / 5) * Math.PI * curl) * 8, tip[1] - (1 - Math.cos((k / 5) * Math.PI * curl)) * 8]);
  }
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // (tapering: each piece a touch thinner than the last; its outline, itself, its blush underside)
  const N = pts.length - 1;
  for (const [col, add, k0] of [[ARM.ink, 2, 1], [ARM.base, 0, 1], [rgba(ARM.under, 0.85), 0, 0.38]]) {
    ctx.strokeStyle = col;
    for (let k = 0; k < N; k++) {
      const dy = k0 < 1 ? w * 0.2 : 0;
      ctx.lineWidth = (w * (1 - (k / N) * 0.7) + add) * k0;
      ctx.beginPath();
      ctx.moveTo(pts[k][0], pts[k][1] + dy);
      ctx.lineTo(pts[k + 1][0], pts[k + 1][1] + dy);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function embraceWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const inner = z.inner ?? 70;
  // the danger: the floor beyond her reach-in, a soft violet; the safe middle warm
  floorRing(ctx, x, y, r, rgba(ARM.base, 0.12 + 0.14 * p), rgba(ARM.ink, 0.6), 1, 1.2);
  floorRing(ctx, x, y, inner, rgba(LIGHT.halo, 0.25 + 0.2 * p), rgba(LIGHT.edge, 0.8), 1, 1.4);
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const reach = inner + 8 + (r - inner - 8) * (1 - sstep(p)) * 0.6;
    ghostArm(ctx, x + side * (r + 10), x + side * reach, y + (i < 2 ? -2 : 3), 10 - (i >> 1) * 2, 0.9, 0.45 + 0.45 * p, time, i);
  }
  for (let i = 0; i < 3; i++) heart(ctx, x + Math.cos(time * 2 + i * 2.1) * inner * 0.5, y - 10 - i * 4, 1.6, 0.5 * p);
}
function embraceHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  const inner = z.inner ?? 70;
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    ghostArm(ctx, x + side * (r + 10), x + side * (inner + 4 - e * 6), y + (i < 2 ? -2 : 3), 11 - (i >> 1) * 2, 1.2, fade, time, i);
  }
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const px = x + side * (inner + 10 + hash(i) * (r - inner));
    drop(ctx, px, y - 4 - Math.sin(Math.PI * sstep(u / 0.6)) * (12 + hash(i * 2) * 18), 2.4, hash(i), fade);
  }
}

// ---------- Ink Flounce ----------
function flounceWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(INKY.base, 0.22 + 0.25 * p), rgba(INKY.sh, 0.95), 1, 1.8);
  // a swirl of ink round her on the floor, drops riding it, faster as it comes
  ctx.save();
  pen(ctx, rgba(INKY.lt, 0.75 * (0.4 + 0.6 * p)), 3);
  for (let k = 0; k < 3; k++) {
    const a0 = time * (2 + p * 4) + (k / 3) * TAU;
    ctx.beginPath();
    ctx.ellipse(x, y - 1, r * (0.55 + k * 0.15), r * (0.12 + k * 0.03), 0, a0, a0 + 1.6);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const an = time * (2 + p * 4) + (i / 8) * TAU;
    drop(ctx, x + Math.cos(an) * r * 0.85, y - 4 + Math.sin(an) * r * 0.2, 2.4, an, (Math.sin(an) > 0 ? 1 : 0.5) * (0.4 + 0.6 * p));
  }
}
function flounceHit(ctx, z, x, y, u, e, fade) {
  const r = z.w / 2;
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * TAU;
    drop(ctx, x + Math.cos(an) * r * (0.5 + e * 0.8), y - 4 + Math.sin(an) * r * 0.2 - Math.sin(Math.PI * e) * 16, 2.8, an + Math.PI / 2, fade);
  }
  floorRing(ctx, x, y, r * (0.8 + e * 0.5), rgba(INKY.lt, 0.2 * fade), rgba(INKY.sh, fade), 1, 1.6);
}

// ---------- Ohohoho! ----------
function cackleWarn(ctx, z, x, y, p, time) {
  ctx.save();
  ctx.globalAlpha = 0.1 + 0.14 * p;
  ctx.fillStyle = LIP.lt;
  ctx.fillRect(-20, y - 14, SW + 40, 22);
  ctx.restore();
  for (let i = 0; i < 24; i++) {
    const v = (time * (0.3 + hash(i) * 0.25) + hash(i * 4.7)) % 1;
    const px = hash(i * 2.3) * SW;
    const py = y - 8 - v * 140;
    bubble(ctx, px + Math.sin(v * 6 + i) * 4, py, 2.4 + hash(i) * 3.4, Math.sin(Math.PI * v) * (0.4 + 0.6 * p));
  }
  for (let i = 0; i < 3; i++) {
    const v = (time * 0.35 + i / 3) % 1;
    word(ctx, 'ohoho~', 120 + i * 200 + Math.sin(v * 5) * 10, y - 30 - v * 90, 12, Math.sin(Math.PI * v) * (0.3 + 0.7 * p));
  }
}
function cackleHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.globalAlpha = 0.2 * (1 - e);
  ctx.fillStyle = '#e8d6ff';
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();
  for (let i = 0; i < 26; i++) {
    const px = hash(i * 3.3) * SW;
    const py = y - 10 - hash(i * 5.1) * 120;
    if (u < 0.3) bubble(ctx, px, py, (2 + hash(i) * 2.4) * (1 + u * 2), 1 - u / 0.3);
    else sparkle(ctx, px, py, 2.2 * fade, fade, '#e8dcff');
  }
}

export const ABYSSIA_FX = {
  abKiss: { warn: kissWarn, hit: kissHit },
  abBlot: { warn: blotWarn, hit: blotHit },
  abDark: { warn: darkWarn, hit: darkHit },
  abDarkPart: { warn: () => {}, hit: () => {} },
  abEmbrace: { warn: embraceWarn, hit: embraceHit },
  abFlounce: { warn: flounceWarn, hit: flounceHit },
  abCackle: { warn: cackleWarn, hit: cackleHit },
};
// How long each landing plays (s).
export const ABYSSIA_HOLD = { abKiss: 0.8, abBlot: 0.7, abDark: 1.1, abDarkPart: 0.1, abEmbrace: 0.8, abFlounce: 0.7, abCackle: 1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const ABYSSIA_OWN_WARN = Object.keys(ABYSSIA_FX);
