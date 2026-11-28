// The Mirror Twins' effect pieces, drawn at full detail (2026-11-28, the player: "effects needs to be
// extremely detailed"). Each piece is built in layers the way the bosses' painted art is: a soft glow, a
// body with its own gradient, an inner rim, engraving or pattern, a lit edge, a crisp highlight, a few
// sparkles; everything rounded and outlined in a deeper shade of its own colour. Used by looks.js.

import { glow, pen, sparkle, ell, hash, clamp, mix, TAU } from '../marigold/fx.js';

export const RUBY = ['#ffe2dc', '#ff7a86', '#d8283c', '#7a0c1e', '#3e0610'];
export const NIGHT = ['#9aa2d8', '#4a4c7e', '#26264a', '#141428', '#0a0a16'];
export const SILVER = ['#ffffff', '#eef1fc', '#c4cbe8', '#8a94c4', '#5a6494'];
export const LILAC = ['#fdf9ff', '#e8dafa', '#c0a8ea', '#8a6ac8', '#5a3e94'];
export const PINK = ['#fff0f6', '#ffb0d2', '#ff7ab2', '#c84a86'];
export const GOLD = ['#fff6d4', '#f6d27a', '#d6a440', '#9a6c1e', '#5e3e0c'];

// A metal fill: a slanted gradient from its light to its dark, a bright band across it.
export function metal(ctx, x, y, r, tone) {
  const c = tone === 'gold' ? GOLD : SILVER;
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, c[0]);
  g.addColorStop(0.3, c[1]);
  g.addColorStop(0.48, c[0]);
  g.addColorStop(0.62, c[2]);
  g.addColorStop(1, c[3]);
  return g;
}

// ---------- A cog: teeth round its rim, four spokes, a hub; turning by `rot` ----------
export function cog(ctx, x, y, r, teeth, rot, tone, al) {
  if (al <= 0.01 || r < 1.5) return;
  const c = tone === 'gold' ? GOLD : SILVER;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const an = (i / n) * TAU;
    const q = i % 4;
    const rr = q === 1 || q === 2 ? r : r * 0.84;
    if (i) ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
    else ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
  }
  ctx.closePath();
  // (the spokes' windows cut out)
  for (let k = 0; k < 4; k++) {
    const a0 = (k / 4) * TAU + 0.22;
    const a1 = ((k + 1) / 4) * TAU - 0.22;
    ctx.moveTo(Math.cos(a0) * r * 0.66, Math.sin(a0) * r * 0.66);
    ctx.arc(0, 0, r * 0.66, a0, a1);
    ctx.arc(0, 0, r * 0.3, a1, a0, true);
    ctx.closePath();
  }
  ctx.fillStyle = metal(ctx, 0, 0, r, tone);
  ctx.fill('evenodd');
  pen(ctx, c[4], Math.max(0.5, r * 0.06));
  ctx.stroke();
  ell(ctx, 0, 0, r * 0.18, r * 0.18);
  ctx.fillStyle = c[3];
  ctx.fill();
  ell(ctx, -r * 0.05, -r * 0.05, r * 0.07, r * 0.07);
  ctx.fillStyle = c[0];
  ctx.fill();
  ctx.restore();
}

// ---------- An ornate clock ----------
// `tone` 'ruby' (Minuet's red eye: gold bezel, ruby enamel) or 'silver' (Rondo's: silver bezel, night
// enamel). `hand` the minute hand's turn (radians); the hour hand a twelfth as fast; a fine second hand
// at `sec`. Behind it, two cogs turning; round it, four little gold scrolls.
export function ornateClock(ctx, x, y, r, hand, al, tone = 'ruby', time = 0, o = {}) {
  if (al <= 0.01 || r < 2) return;
  const ruby = tone === 'ruby';
  const bez = ruby ? 'gold' : 'silver';
  const ink = ruby ? RUBY[3] : NIGHT[3];
  const sec = o.sec ?? time * 1.2;
  ctx.save();
  ctx.globalAlpha *= al;
  // the glow and the cogs behind
  glow(ctx, x, y, r * 2.1, ruby ? RUBY[1] : SILVER[2], 0.38);
  if (o.cogs !== false) {
    cog(ctx, x + r * 0.86, y - r * 0.62, r * 0.46, 10, time * 0.8, bez, 0.9);
    cog(ctx, x - r * 0.92, y + r * 0.5, r * 0.36, 8, -time * 1.05, bez, 0.9);
  }
  // the four scrolls (C-curls) at the quarters, outside the bezel
  ctx.save();
  for (let k = 0; k < 4; k++) {
    const an = (k / 4) * TAU - Math.PI / 2;
    const px = x + Math.cos(an) * r * 1.12;
    const py = y + Math.sin(an) * r * 1.12;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(an + Math.PI / 2);
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(sd * r * 0.12, -r * 0.1, sd * r * 0.3, -r * 0.02, sd * r * 0.26, r * 0.1);
      ctx.bezierCurveTo(sd * r * 0.22, r * 0.18, sd * r * 0.12, r * 0.12, sd * r * 0.16, r * 0.06);
      pen(ctx, GOLD[3], Math.max(0.9, r * 0.075));
      ctx.stroke();
      pen(ctx, GOLD[1], Math.max(0.5, r * 0.035));
      ctx.stroke();
    }
    ell(ctx, 0, -r * 0.04, r * 0.06, r * 0.06);
    ctx.fillStyle = ruby ? RUBY[2] : NIGHT[1];
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // the bezel: a thick metal ring, its inner step, a fine rope of light round it
  ell(ctx, x, y, r, r);
  ctx.fillStyle = metal(ctx, x, y, r, bez);
  ctx.fill();
  pen(ctx, bez === 'gold' ? GOLD[4] : SILVER[4], Math.max(0.8, r * 0.05));
  ctx.stroke();
  ell(ctx, x, y, r * 0.86, r * 0.86);
  pen(ctx, bez === 'gold' ? GOLD[3] : SILVER[3], Math.max(0.6, r * 0.03));
  ctx.stroke();
  // the enamel dial
  const dg = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.05, x, y, r * 0.84);
  if (ruby) {
    dg.addColorStop(0, '#fff6f2');
    dg.addColorStop(0.6, '#ffdcd4');
    dg.addColorStop(1, '#f4a8a8');
  } else {
    dg.addColorStop(0, '#ffffff');
    dg.addColorStop(0.6, '#eef0fb');
    dg.addColorStop(1, '#c8cfe8');
  }
  ell(ctx, x, y, r * 0.82, r * 0.82);
  ctx.fillStyle = dg;
  ctx.fill();
  // engraving: a sunburst of fine rays and three fine rings
  ctx.save();
  ell(ctx, x, y, r * 0.82, r * 0.82);
  ctx.clip();
  ctx.strokeStyle = ruby ? 'rgba(200,60,80,0.12)' : 'rgba(90,100,150,0.12)';
  ctx.lineWidth = Math.max(0.3, r * 0.012);
  for (let i = 0; i < 48; i++) {
    const an = (i / 48) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r * 0.12, y + Math.sin(an) * r * 0.12);
    ctx.lineTo(x + Math.cos(an) * r * 0.56, y + Math.sin(an) * r * 0.56);
    ctx.stroke();
  }
  for (const k of [0.2, 0.42, 0.58]) {
    ell(ctx, x, y, r * k, r * k);
    ctx.strokeStyle = ruby ? 'rgba(200,60,80,0.22)' : 'rgba(90,100,150,0.22)';
    ctx.stroke();
  }
  ctx.restore();
  // the chapter ring: sixty fine minute ticks, a gold lozenge at each hour, a crown at twelve
  ctx.strokeStyle = ink;
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const an = (i / 60) * TAU - Math.PI / 2;
    ctx.lineWidth = Math.max(0.3, r * 0.014);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r * 0.74, y + Math.sin(an) * r * 0.74);
    ctx.lineTo(x + Math.cos(an) * r * 0.79, y + Math.sin(an) * r * 0.79);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU - Math.PI / 2;
    const cx = x + Math.cos(an) * r * 0.69;
    const cy = y + Math.sin(an) * r * 0.69;
    const s = r * (i % 3 ? 0.055 : 0.085);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(an);
    ctx.beginPath();
    ctx.moveTo(-s * 1.6, 0);
    ctx.quadraticCurveTo(0, -s * 0.2, s * 1.6, 0);
    ctx.quadraticCurveTo(0, s * 0.2, -s * 1.6, 0);
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.2, 0, 0, s);
    ctx.quadraticCurveTo(-s * 0.2, 0, 0, -s);
    ctx.fillStyle = i % 3 ? GOLD[2] : GOLD[1];
    ctx.fill();
    ctx.restore();
  }
  // (the crown at twelve: three little points)
  ctx.save();
  ctx.translate(x, y - r * 0.55);
  ctx.beginPath();
  const cs = r * 0.07;
  ctx.moveTo(-cs * 1.6, cs * 0.6);
  ctx.lineTo(-cs * 1.4, -cs * 0.4);
  ctx.lineTo(-cs * 0.6, cs * 0.1);
  ctx.lineTo(0, -cs * 0.9);
  ctx.lineTo(cs * 0.6, cs * 0.1);
  ctx.lineTo(cs * 1.4, -cs * 0.4);
  ctx.lineTo(cs * 1.6, cs * 0.6);
  ctx.closePath();
  ctx.fillStyle = GOLD[2];
  ctx.fill();
  pen(ctx, GOLD[4], Math.max(0.3, r * 0.012));
  ctx.stroke();
  ctx.restore();
  // the hands: the hour hand with a heart-shaped spade, the minute hand long with an arrow tip and a round
  // counterweight, the fine second hand in ruby
  const handAt = (an, len, w, kind) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, r * 0.08);
    ctx.lineTo(-w * 0.35, -len * 0.62);
    if (kind === 'spade') {
      ctx.bezierCurveTo(-w * 2.4, -len * 0.62, -w * 1.6, -len * 0.96, 0, -len);
      ctx.bezierCurveTo(w * 1.6, -len * 0.96, w * 2.4, -len * 0.62, w * 0.35, -len * 0.62);
    } else {
      ctx.lineTo(-w * 1.1, -len * 0.86);
      ctx.lineTo(0, -len);
      ctx.lineTo(w * 1.1, -len * 0.86);
      ctx.lineTo(w * 0.35, -len * 0.62);
    }
    ctx.lineTo(w * 0.5, r * 0.08);
    ctx.closePath();
    ctx.fillStyle = ink;
    ctx.fill();
    ell(ctx, 0, r * 0.14, w * 1.3, w * 1.3);
    ctx.fill();
    ctx.restore();
  };
  handAt(hand / 12, r * 0.44, Math.max(0.6, r * 0.05), 'spade');
  handAt(hand, r * 0.66, Math.max(0.5, r * 0.04), 'arrow');
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sec);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.16);
  ctx.lineTo(0, -r * 0.72);
  pen(ctx, RUBY[2], Math.max(0.4, r * 0.016));
  ctx.stroke();
  ell(ctx, 0, r * 0.14, r * 0.035, r * 0.035);
  ctx.fillStyle = RUBY[2];
  ctx.fill();
  ctx.restore();
  // the gem at its middle
  const gg = ctx.createRadialGradient(x - r * 0.03, y - r * 0.03, 0, x, y, r * 0.09);
  gg.addColorStop(0, ruby ? '#ffd0d4' : '#e8ecff');
  gg.addColorStop(0.5, ruby ? RUBY[2] : NIGHT[1]);
  gg.addColorStop(1, ruby ? RUBY[4] : NIGHT[4]);
  ell(ctx, x, y, r * 0.085, r * 0.085);
  ctx.fillStyle = gg;
  ctx.fill();
  pen(ctx, GOLD[3], Math.max(0.3, r * 0.015));
  ctx.stroke();
  // the glass over it: a crescent of light, a softer one opposite, a glint
  ctx.save();
  ell(ctx, x, y, r * 0.82, r * 0.82);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.26, y - r * 0.34, r * 0.5, r * 0.2, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + r * 0.36, y + r * 0.42, r * 0.3, r * 0.08, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  ctx.restore();
  sparkle(ctx, x - r * 0.46, y - r * 0.5, Math.max(1.2, r * 0.1), 0.9, '#ffffff');
  ctx.restore();
}

// ---------- A satin ribbon along a curve, twisting: its face and its back show in turn where it turns over,
// narrowing at each turn; a lit edge along it ----------
export function satin(ctx, pts, w, face, back, rim, al, twist = 3, phase = 0) {
  if (al <= 0.01 || pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const n = pts.length;
  const nrm = (i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  const half = (i) => {
    const u = i / (n - 1);
    const tw = Math.cos(u * Math.PI * twist + phase);
    return { h: w * 0.5 * (0.18 + 0.82 * Math.abs(tw)) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.02))), side: tw >= 0 };
  };
  for (let i = 0; i < n - 1; i++) {
    const a = half(i);
    const b = half(i + 1);
    const [nx0, ny0] = nrm(i);
    const [nx1, ny1] = nrm(i + 1);
    const p0 = pts[i];
    const p1 = pts[i + 1];
    ctx.beginPath();
    ctx.moveTo(p0[0] + nx0 * a.h, p0[1] + ny0 * a.h);
    ctx.lineTo(p1[0] + nx1 * b.h, p1[1] + ny1 * b.h);
    ctx.lineTo(p1[0] - nx1 * b.h, p1[1] - ny1 * b.h);
    ctx.lineTo(p0[0] - nx0 * a.h, p0[1] - ny0 * a.h);
    ctx.closePath();
    const side = a.side;
    const g = ctx.createLinearGradient(p0[0] + nx0 * a.h, p0[1] + ny0 * a.h, p0[0] - nx0 * a.h, p0[1] - ny0 * a.h);
    const c = side ? face : back;
    g.addColorStop(0, c[0]);
    g.addColorStop(0.45, c[1]);
    g.addColorStop(1, c[2]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = g;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // its edges, outlined; a fine light down one edge
  const L = [];
  const R = [];
  for (let i = 0; i < n; i++) {
    const { h } = half(i);
    const [nx, ny] = nrm(i);
    L.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
    R.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
  }
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
  ctx.moveTo(...R[0]);
  for (const p of R.slice(1)) ctx.lineTo(...p);
  pen(ctx, rim, 0.8);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const q = [L[i][0] * 0.85 + pts[i][0] * 0.15, L[i][1] * 0.85 + pts[i][1] * 0.15];
    if (i) ctx.lineTo(...q);
    else ctx.moveTo(...q);
  }
  pen(ctx, 'rgba(255,255,255,0.75)', 0.6);
  ctx.stroke();
  ctx.restore();
}
export const NIGHT_SATIN = [['#6a70a8', '#3a3c6a', '#1c1c36'], ['#2c2c50', '#1a1a32', '#0c0c18']];
export const WHITE_SATIN = [['#ffffff', '#f2ecfc', '#d2c2ee'], ['#e4d8f6', '#cbb8ec', '#a088d0']];
export const RUBY_SATIN = [['#ffb4b8', '#e23a4c', '#8a1024'], ['#b0202e', '#7a0c1e', '#4a0612']];

// ---------- Drifting sparkles (never specks, never in a row): `n` of them over a box, each its own size and
// drift, twinkling ----------
export function motes(ctx, x, y, w, h, n, time, cols, al, seed = 0, speed = 0.25) {
  if (al <= 0.01) return;
  for (let i = 0; i < n; i++) {
    const s = seed + i * 1.37;
    const v = (time * speed * (0.6 + hash(s * 2.1) * 0.8) + hash(s)) % 1;
    const px = x + hash(s * 3.3) * w + Math.sin(time * 1.3 + s) * 4;
    const py = y + h - v * h;
    const tw = 0.5 + 0.5 * Math.sin(time * 6 + s * 5);
    sparkle(ctx, px, py, (1.1 + hash(s * 7.1) * 2.2) * Math.sin(Math.PI * v) * (0.6 + 0.4 * tw), al, cols[i % cols.length]);
  }
}

// ---------- A rose petal, tumbling: a cupped heart-shape with a fold down its middle, deeper at its base ----------
export function petal(ctx, x, y, s, ang, al, tone = 'ruby', flip = 1) {
  if (al <= 0.01 || s < 0.3) return;
  const c = tone === 'ruby' ? RUBY : tone === 'lilac' ? LILAC : SILVER;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(1, flip);
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.bezierCurveTo(-s * 1.1, s * 0.3, -s * 0.9, -s * 0.9, -s * 0.2, -s * 0.8);
  ctx.quadraticCurveTo(0, -s * 0.55, s * 0.2, -s * 0.8);
  ctx.bezierCurveTo(s * 0.9, -s * 0.9, s * 1.1, s * 0.3, 0, s);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, c[1]);
  g.addColorStop(0.6, c[2]);
  g.addColorStop(1, c[3]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, c[3], Math.max(0.4, s * 0.12));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.8);
  ctx.quadraticCurveTo(-s * 0.1, 0, 0, -s * 0.55);
  pen(ctx, 'rgba(255,255,255,0.35)', Math.max(0.3, s * 0.1));
  ctx.stroke();
  ell(ctx, -s * 0.35, -s * 0.35, s * 0.2, s * 0.12, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.restore();
}

// ---------- Music ----------
// A note with a lit head, a stem, a curled flag (kind 1), a beamed pair (2), or a crotchet (0).
export function richNote(ctx, x, y, s, al, tone = 'silver', kind = 1, rot = 0) {
  if (al <= 0.01 || s <= 0.2) return;
  const c = tone === 'silver' ? [SILVER[1], SILVER[3], NIGHT[3]] : tone === 'lilac' ? [LILAC[1], LILAC[3], LILAC[4]] : [RUBY[1], RUBY[2], RUBY[4]];
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  glow(ctx, 0, -s, s * 3, c[0], 0.35);
  const head = (hx, hy) => {
    const g = ctx.createRadialGradient(hx - s * 0.4, hy - s * 0.3, 0, hx, hy, s * 1.2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, c[0]);
    g.addColorStop(1, c[1]);
    ctx.beginPath();
    ctx.ellipse(hx, hy, s * 1.05, s * 0.76, -0.42, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    pen(ctx, c[2], Math.max(0.5, s * 0.26));
    ctx.stroke();
  };
  pen(ctx, c[2], Math.max(0.6, s * 0.3));
  if (kind === 2) {
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.2);
    ctx.lineTo(s * 0.9, -s * 3.6);
    ctx.moveTo(s * 3.9, -s * 0.7);
    ctx.lineTo(s * 3.9, -s * 4.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 3.6);
    ctx.lineTo(s * 3.9, -s * 4.1);
    ctx.lineTo(s * 3.9, -s * 3.4);
    ctx.lineTo(s * 0.9, -s * 2.9);
    ctx.closePath();
    ctx.fillStyle = c[2];
    ctx.fill();
    head(0, 0);
    head(s * 3, -s * 0.5);
  } else {
    ctx.beginPath();
    ctx.moveTo(s * 0.9, -s * 0.2);
    ctx.lineTo(s * 0.9, -s * 3.8);
    ctx.stroke();
    if (kind === 1) {
      ctx.beginPath();
      ctx.moveTo(s * 0.9, -s * 3.8);
      ctx.bezierCurveTo(s * 1.4, -s * 2.8, s * 2.8, -s * 2.8, s * 2.2, -s * 1.3);
      ctx.bezierCurveTo(s * 2.4, -s * 2.4, s * 1.6, -s * 2.6, s * 0.9, -s * 2.9);
      ctx.closePath();
      ctx.fillStyle = c[2];
      ctx.fill();
    }
    head(0, 0);
  }
  ctx.restore();
}
// A treble clef, curling round, in metal with a dark rim.
export function clef(ctx, x, y, s, al, tone = 'silver') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(s * 0.3, s * 2.6);
  ctx.bezierCurveTo(s * 1.2, s * 2.8, s * 1.1, s * 3.8, s * 0.2, s * 3.6);
  ctx.moveTo(s * 0.4, s * 3.2);
  ctx.lineTo(s * 0.1, -s * 3.4);
  ctx.bezierCurveTo(s * 0.2, -s * 4.4, s * 1.4, -s * 4, s * 0.8, -s * 2.6);
  ctx.bezierCurveTo(s * 0.2, -s * 1.4, -s * 1.4, -s * 0.6, -s * 1.2, s * 0.8);
  ctx.bezierCurveTo(-s * 1, s * 2, s * 1.4, s * 2, s * 1.4, s * 0.6);
  ctx.bezierCurveTo(s * 1.4, -s * 0.4, s * 0.1, -s * 0.6, -s * 0.1, s * 0.4);
  ctx.strokeStyle = tone === 'silver' ? NIGHT[3] : LILAC[4];
  ctx.lineWidth = Math.max(1, s * 0.6);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = tone === 'silver' ? SILVER[1] : LILAC[1];
  ctx.lineWidth = Math.max(0.5, s * 0.3);
  ctx.stroke();
  ctx.restore();
}

// ---------- A ghost puff: a soft white blob with a wavy hem and a wisp of a tail, gently shaded inside, a
// lilac rim of light; no face ----------
export function puff(ctx, x, y, s, al, tilt = 0, tail = 1) {
  if (al <= 0.01 || s <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  glow(ctx, 0, 0, s * 2, LILAC[1], 0.35);
  // the wisp trailing behind it
  if (tail > 0) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.5);
    ctx.bezierCurveTo(-s * 0.4, s * 1.4, s * 0.6, s * 1.2, s * 0.3, s * (1.4 + tail));
    ctx.bezierCurveTo(s * 0.9, s * 1.2, s * 0.6, s * 0.7, s * 0.5, s * 0.5);
    ctx.fillStyle = 'rgba(240,232,255,0.6)';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.2);
  ctx.bezierCurveTo(-s * 1.05, -s * 1.35, s * 1.05, -s * 1.35, s, s * 0.2);
  for (let k = 0; k < 3; k++) {
    const x0 = s - (k * 2 * s) / 3;
    const x1 = s - ((k + 1) * 2 * s) / 3;
    ctx.quadraticCurveTo((x0 + x1) / 2, s * (k % 2 ? 0.45 : 0.85), x1, s * 0.38);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-s * 0.3, -s * 0.5, s * 0.1, 0, 0, s * 1.3);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, '#f6f0ff');
  g.addColorStop(1, '#d8c8f2');
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, LILAC[3], Math.max(0.6, s * 0.14));
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-s * 0.34, -s * 0.52, s * 0.34, s * 0.2, -0.5, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.5, s * 0.1, s * 0.18, s * 0.42, 0.2, 0, TAU);
  ctx.fillStyle = 'rgba(180,150,230,0.22)';
  ctx.fill();
  ctx.restore();
}

// Minuet's little bat bow, as an accent: two wing loops with ribs, a knot with a pink gem.
export function batBow(ctx, x, y, s, al, flap = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.scale(sd, 1);
    ctx.rotate(-flap * 0.4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 1.2, -s * 1.3, s * 2.5, -s * 0.7);
    ctx.quadraticCurveTo(s * 2.1, -s * 0.15, s * 2.2, s * 0.4);
    ctx.quadraticCurveTo(s * 1.7, s * 0.05, s * 1.4, s * 0.5);
    ctx.quadraticCurveTo(s * 1.0, s * 0.1, s * 0.7, s * 0.45);
    ctx.quadraticCurveTo(s * 0.5, s * 0.1, 0, 0);
    const g = ctx.createLinearGradient(0, -s, 0, s * 0.5);
    g.addColorStop(0, NIGHT[1]);
    g.addColorStop(1, NIGHT[3]);
    ctx.fillStyle = g;
    ctx.fill();
    pen(ctx, NIGHT[4], Math.max(0.5, s * 0.14));
    ctx.stroke();
    for (const [ex, ey] of [[2.2, -0.15], [1.4, 0.25]]) {
      ctx.beginPath();
      ctx.moveTo(s * 0.3, -s * 0.1);
      ctx.quadraticCurveTo(s * ex * 0.6, -s * 0.6, s * ex, s * ey);
      pen(ctx, 'rgba(170,160,230,0.6)', Math.max(0.3, s * 0.08));
      ctx.stroke();
    }
    ctx.restore();
  }
  ell(ctx, 0, 0, s * 0.5, s * 0.5);
  ctx.fillStyle = NIGHT[2];
  ctx.fill();
  pen(ctx, NIGHT[4], Math.max(0.4, s * 0.1));
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.26, s * 0.26);
  ctx.fillStyle = PINK[2];
  ctx.fill();
  ell(ctx, -s * 0.08, -s * 0.08, s * 0.09, s * 0.09);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// ---------- Mirror glass ----------
// A shard: a slim faceted sliver with a light edge, a rainbow tint where it catches the light.
export function shard(ctx, x, y, s, ang, al, tint = SILVER[1]) {
  if (al <= 0.01 || s < 0.3) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.42, -s * 0.1);
  ctx.lineTo(s * 0.26, s * 0.72);
  ctx.lineTo(-s * 0.3, s * 0.6);
  ctx.lineTo(-s * 0.44, -s * 0.2);
  ctx.closePath();
  const g = ctx.createLinearGradient(-s * 0.4, -s, s * 0.4, s);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, tint);
  g.addColorStop(0.55, 'rgba(255,214,240,0.9)');
  g.addColorStop(0.7, 'rgba(206,234,255,0.9)');
  g.addColorStop(1, tint);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, SILVER[4], Math.max(0.4, s * 0.1));
  ctx.stroke();
  // a facet line and its bright edge
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(-s * 0.05, s * 0.66);
  pen(ctx, 'rgba(255,255,255,0.7)', Math.max(0.3, s * 0.07));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.44, -s * 0.2);
  ctx.lineTo(0, -s);
  pen(ctx, '#ffffff', Math.max(0.3, s * 0.1));
  ctx.stroke();
  ctx.restore();
}
// A strip of framed mirror lying along the floor (or hanging from the ceiling, `up`): a silver frame with a
// bevel and little scrolls at its ends, the glass reflecting the room in cool tints, light gliding across
// it, cracks spreading from points as it is about to break (`crack` 0..1).
export function mirrorStrip(ctx, x, y, w, h, al, gleam, up = false, crack = 0, time = 0) {
  if (al <= 0.01 || w < 4) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const y0 = up ? y : y - h;
  // the frame
  ctx.beginPath();
  ctx.roundRect(x - 3, y0 - 3, w + 6, h + 6, 4);
  ctx.fillStyle = metal(ctx, x + w / 2, y0 + h / 2, Math.max(w, h) / 2, 'silver');
  ctx.fill();
  pen(ctx, SILVER[4], 1);
  ctx.stroke();
  // little scrolls at its ends
  for (const ex of [x - 3, x + w + 3]) {
    const sd = ex < x ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(ex, y0 + h / 2 - 4);
    ctx.bezierCurveTo(ex + sd * 6, y0 + h / 2 - 8, ex + sd * 8, y0 + h / 2 + 2, ex + sd * 3, y0 + h / 2 + 3);
    ctx.bezierCurveTo(ex + sd * 1, y0 + h / 2 + 3, ex + sd * 1, y0 + h / 2, ex + sd * 3, y0 + h / 2);
    pen(ctx, SILVER[4], 2.2);
    ctx.stroke();
    pen(ctx, SILVER[1], 1);
    ctx.stroke();
  }
  // the glass
  ctx.beginPath();
  ctx.roundRect(x, y0, w, h, 2);
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, 'rgba(214,224,255,0.92)');
  g.addColorStop(0.45, 'rgba(160,170,226,0.85)');
  g.addColorStop(0.55, 'rgba(200,184,240,0.85)');
  g.addColorStop(1, 'rgba(226,232,255,0.92)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // reflections: soft bands of the room's colours drifting, a mirrored floor line
  for (let i = 0; i < 4; i++) {
    const bx = x + ((time * 12 + i * w * 0.31) % (w + 40)) - 20;
    ctx.fillStyle = i % 2 ? 'rgba(255,200,230,0.22)' : 'rgba(180,210,255,0.22)';
    ctx.fillRect(bx, y0, 10 + i * 3, h);
  }
  ctx.fillStyle = 'rgba(110,100,170,0.25)';
  ctx.fillRect(x, up ? y0 + h * 0.62 : y0 + h * 0.3, w, h * 0.08);
  // the gleam gliding across: a broad soft band and a sharp line in it
  const gx = x + gleam * (w + 60) - 30;
  const lg = ctx.createLinearGradient(gx - 26, 0, gx + 26, 0);
  lg.addColorStop(0, 'rgba(255,255,255,0)');
  lg.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  lg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(gx - 16, y0 + h);
  ctx.lineTo(gx + 6, y0);
  ctx.lineTo(gx + 20, y0);
  ctx.lineTo(gx - 2, y0 + h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(gx + 10, y0 + h);
  ctx.lineTo(gx + 22, y0);
  pen(ctx, 'rgba(255,255,255,0.9)', 1);
  ctx.stroke();
  // cracks, branching out from three points
  if (crack > 0.01) {
    for (let k = 0; k < 3; k++) {
      const cx = x + w * (0.2 + k * 0.3 + hash(k * 3.1) * 0.1);
      const cy = y0 + h * 0.5;
      for (let b = 0; b < 5; b++) {
        const an = (b / 5) * TAU + hash(k * 7 + b) * 0.6;
        const len = crack * (8 + hash(k * 11 + b) * 16);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = cx + Math.cos(an) * len * 0.5 + (hash(b * 3 + k) - 0.5) * 4;
        const my = cy + Math.sin(an) * len * 0.5 * 0.6;
        ctx.lineTo(mx, my);
        ctx.lineTo(cx + Math.cos(an + 0.3) * len, cy + Math.sin(an + 0.3) * len * 0.6);
        pen(ctx, 'rgba(255,255,255,0.95)', 0.8);
        ctx.stroke();
        pen(ctx, 'rgba(90,100,150,0.5)', 0.4);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(x, y0, w, h, 2);
  pen(ctx, SILVER[3], 0.8);
  ctx.stroke();
  ctx.restore();
}

// ---------- A heart locket: a padded heart in gold-rimmed pink enamel, a ruby set in it, a shine ----------
export function locket(ctx, x, y, s, al, beat = 0) {
  if (al <= 0.01) return;
  const k = s * (1 + beat * 0.08);
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, k * 3, PINK[1], 0.45);
  const heart = (r) => {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.95);
    ctx.bezierCurveTo(x - r * 1.35, y + r * 0.12, x - r * 1.15, y - r * 1.1, x, y - r * 0.42);
    ctx.bezierCurveTo(x + r * 1.15, y - r * 1.1, x + r * 1.35, y + r * 0.12, x, y + r * 0.95);
    ctx.closePath();
  };
  heart(k * 1.18);
  ctx.fillStyle = metal(ctx, x, y, k, 'gold');
  ctx.fill();
  pen(ctx, GOLD[4], Math.max(0.6, k * 0.12));
  ctx.stroke();
  heart(k);
  const g = ctx.createRadialGradient(x - k * 0.3, y - k * 0.3, 0, x, y, k * 1.2);
  g.addColorStop(0, '#ffe2f0');
  g.addColorStop(0.5, PINK[1]);
  g.addColorStop(1, PINK[3]);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, x, y + k * 0.05, k * 0.26, k * 0.3);
  const rg = ctx.createRadialGradient(x - k * 0.08, y - k * 0.05, 0, x, y + k * 0.05, k * 0.3);
  rg.addColorStop(0, '#ffd0d4');
  rg.addColorStop(0.5, RUBY[2]);
  rg.addColorStop(1, RUBY[4]);
  ctx.fillStyle = rg;
  ctx.fill();
  pen(ctx, GOLD[3], Math.max(0.4, k * 0.06));
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - k * 0.46, y - k * 0.34, k * 0.24, k * 0.14, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}

// ---------- Text in their style: a fat rounded word, a dark rim, a lit top, a soft shadow under it ----------
export function bubbleText(ctx, str, x, y, size, top, mid, rim, al, rot = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.font = `900 ${size}px Nunito, "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(40,20,70,0.35)';
  ctx.fillText(str, size * 0.06, size * 0.1);
  ctx.lineWidth = size * 0.34;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(str, 0, 0);
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = rim;
  ctx.strokeText(str, 0, 0);
  const g = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, rim);
  ctx.fillStyle = g;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

// ---------- A floor ring with depth: a soft fill, an outer rim, an inner rim, an engraved band of fine
// marks between (`marks`), a lit front edge ----------
export function floorDisc(ctx, x, y, rx, fill, rim, al, o = {}) {
  if (al <= 0.01 || rx < 2) return;
  const ry = rx * 0.26;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.26);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, fill[0]);
  g.addColorStop(0.75, fill[1]);
  g.addColorStop(1, fill[2] ?? fill[1]);
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ell(ctx, x, y, rx, ry);
  pen(ctx, rim, o.w ?? 1.8);
  ctx.stroke();
  ell(ctx, x, y, rx * 0.82, ry * 0.82);
  pen(ctx, rim, (o.w ?? 1.8) * 0.5);
  ctx.stroke();
  if (o.marks) {
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.6;
    const n = o.marks;
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + (o.turn ?? 0);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(an) * rx * 0.85, y + Math.sin(an) * ry * 0.85);
      ctx.lineTo(x + Math.cos(an) * rx * 0.96, y + Math.sin(an) * ry * 0.96);
      ctx.stroke();
    }
  }
  // the lit front edge
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0.15 * Math.PI, 0.85 * Math.PI);
  pen(ctx, 'rgba(255,255,255,0.7)', 0.9);
  ctx.stroke();
  ctx.restore();
}

// ---------- A beam of light (a stage spotlight) from (x0, y0) toward angle `ang`, `len` long, `spread`
// half-angle: layered soft cones, rays drifting through it, motes in it, a pool of light where it meets
// the floor (`floorY`) ----------
export function beam(ctx, x0, y0, ang, len, spread, cols, al, time, floorY = null) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [k, a] of [[1, 0.18], [0.75, 0.22], [0.45, 0.3]]) {
    const sp = spread * k;
    const g = ctx.createRadialGradient(x0, y0, 2, x0, y0, len);
    g.addColorStop(0, cols[0]);
    g.addColorStop(0.5, cols[1]);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = al * a * 2.2;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.arc(x0, y0, len, ang - sp, ang + sp);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = al;
  // rays drifting across it
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.arc(x0, y0, len, ang - spread, ang + spread);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const a2 = ang + Math.sin(time * 0.7 + i * 1.7) * spread * 0.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(a2) * len, y0 + Math.sin(a2) * len);
    ctx.strokeStyle = 'rgba(255,240,240,0.18)';
    ctx.lineWidth = 3 + i;
    ctx.stroke();
  }
  // motes floating in the light
  for (let i = 0; i < 12; i++) {
    const d = (hash(i * 2.3) * 0.9 + 0.08) * len;
    const a2 = ang + (hash(i * 5.1) - 0.5) * spread * 1.6 + Math.sin(time + i) * 0.02;
    const tw = 0.5 + 0.5 * Math.sin(time * 5 + i * 3);
    sparkle(ctx, x0 + Math.cos(a2) * d, y0 + Math.sin(a2) * d, (1 + hash(i) * 1.6) * tw, 0.9, i % 2 ? '#ffffff' : cols[2] ?? '#ffe0e0');
  }
  ctx.restore();
  if (floorY != null) {
    const t = (floorY - y0) / Math.max(0.01, Math.sin(ang));
    if (t > 0) {
      const fx = x0 + Math.cos(ang) * t;
      const half = t * Math.tan(spread) * 1.1;
      const pg = ctx.createRadialGradient(fx, floorY, 0, fx, floorY, half);
      pg.addColorStop(0, cols[1]);
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(fx, floorY);
      ctx.scale(1, 0.25);
      ctx.translate(-fx, -floorY);
      ctx.fillStyle = pg;
      ctx.fillRect(fx - half, floorY - half, half * 2, half * 2);
      ctx.restore();
    }
  }
  // the lamp: a bright core with a soft flare and four long rays
  glow(ctx, x0, y0, 22, cols[2] ?? '#ffffff', 0.6);
  sparkle(ctx, x0, y0, 7, 1, '#ffffff');
  ctx.restore();
}

// ---------- An oval mirror standing in the air (the twins' way through to each other): a silver frame with a
// bevel, scrolls either side, a little gold crown at its top and a ruby at its foot; glass in cool tints
// with reflections drifting and light gliding across it; ripples spreading in the glass (`ripple` 0..1);
// `open` 0..1 how far it has opened (it grows from a sliver). Upright, or upside down (`flip`) under the
// ceiling. ----------
export function mirrorPortal(ctx, x, y, rx, ry, open, al, time, ripple = 0, flip = false) {
  if (al <= 0.01 || open <= 0.01) return;
  const RX = rx * open;
  const RY = ry * (0.4 + 0.6 * open);
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  if (flip) ctx.scale(1, -1);
  glow(ctx, 0, 0, Math.max(RX, RY) * 2, LILAC[1], 0.35);
  // the frame: a fat silver oval, its bevel, a fine inner line
  ctx.beginPath();
  ctx.ellipse(0, 0, RX + 4, RY + 4, 0, 0, TAU);
  ctx.fillStyle = metal(ctx, 0, 0, Math.max(RX, RY), 'silver');
  ctx.fill();
  pen(ctx, SILVER[4], 1.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, RX + 1.6, RY + 1.6, 0, 0, TAU);
  pen(ctx, SILVER[3], 0.7);
  ctx.stroke();
  // scrolls either side, a crown on top, a ruby at the foot
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * (RX + 3), -RY * 0.25);
    ctx.bezierCurveTo(sd * (RX + 10), -RY * 0.45, sd * (RX + 12), RY * 0.05, sd * (RX + 6), RY * 0.1);
    ctx.bezierCurveTo(sd * (RX + 3), RY * 0.12, sd * (RX + 3), -RY * 0.02, sd * (RX + 6), -RY * 0.02);
    pen(ctx, SILVER[4], 2.4);
    ctx.stroke();
    pen(ctx, SILVER[1], 1.1);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(0, -RY - 4);
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(-5, -3);
  ctx.lineTo(-2, 0);
  ctx.lineTo(0, -5);
  ctx.lineTo(2, 0);
  ctx.lineTo(5, -3);
  ctx.lineTo(6, 2);
  ctx.closePath();
  ctx.fillStyle = metal(ctx, 0, 0, 6, 'gold');
  ctx.fill();
  pen(ctx, GOLD[4], 0.6);
  ctx.stroke();
  ctx.restore();
  const gy = RY + 4;
  const rg = ctx.createRadialGradient(-0.8, gy - 0.8, 0, 0, gy, 3);
  rg.addColorStop(0, '#ffd0d4');
  rg.addColorStop(0.5, RUBY[2]);
  rg.addColorStop(1, RUBY[4]);
  ell(ctx, 0, gy, 2.8, 2.8);
  ctx.fillStyle = rg;
  ctx.fill();
  pen(ctx, GOLD[3], 0.6);
  ctx.stroke();
  // the glass
  ctx.beginPath();
  ctx.ellipse(0, 0, RX, RY, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, -RY, 0, RY);
  g.addColorStop(0, 'rgba(226,232,255,0.95)');
  g.addColorStop(0.45, 'rgba(176,170,232,0.9)');
  g.addColorStop(0.55, 'rgba(206,186,240,0.9)');
  g.addColorStop(1, 'rgba(232,236,255,0.95)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 3; i++) {
    const bx = ((time * 30 + i * 37) % (RX * 2 + 30)) - RX - 15;
    ctx.fillStyle = i % 2 ? 'rgba(255,200,230,0.25)' : 'rgba(180,210,255,0.25)';
    ctx.fillRect(bx, -RY, 6 + i * 3, RY * 2);
  }
  const lx = ((time * 0.8) % 1) * (RX * 2 + 40) - RX - 20;
  ctx.beginPath();
  ctx.moveTo(lx - 8, RY);
  ctx.lineTo(lx + 6, -RY);
  ctx.lineTo(lx + 14, -RY);
  ctx.lineTo(lx, RY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
  if (ripple > 0.01) {
    for (let i = 0; i < 3; i++) {
      const q = clamp(ripple * 1.4 - i * 0.18, 0, 1);
      if (q <= 0 || q >= 1) continue;
      ctx.beginPath();
      ctx.ellipse(0, 0, RX * q * 1.1, RY * q * 1.1, 0, 0, TAU);
      pen(ctx, `rgba(255,255,255,${0.9 * (1 - q)})`, 1.4 * (1 - q) + 0.4);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(0, 0, RX, RY, 0, 0, TAU);
  pen(ctx, SILVER[3], 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-RX * 0.35, -RY * 0.45, RX * 0.35, RY * 0.12, -0.5, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
  ctx.restore();
}

export { glow, pen, sparkle, ell, hash, clamp, mix, TAU };
