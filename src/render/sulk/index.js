// The Blanket Sulk on screen (2026-11-25, The Sulk remade on the spirit base, the player's pick "C"):
// the storm cloud of the Sky Whale's sadness, a sulky little spirit who won't come out from under his
// storm-cloud duvet. He moves on his own copy of the spirit rig (sulkrig.js: its bones, hover, glide,
// moves and springs, his pieces from art.js), drawn big for a boss; this adds his weather:
//   - rain always falling from the duvet's hem (none once the storm has cleared);
//   - a tear rolling off his cheek now and then;
//   - the lightning curl on his hood crackling;
//   - his act's sniffles, "hmph" steam and the jolt of his own lightning waking him.
// His fight (rebuilt 2026-11-27, world/skywhale.js) adds, round him:
//   - each cast's own weather: wallop (drops shaken off the duvet held up over him), clouds (little
//     sulky clouds puffing off his hood with each side-eye), pile (the pillow held over his head), tantrum
//     (rumble puffs and soft little flickers off his hood), sob (tears streaming, the rain thick), huff
//     (steam off his hood, a little cross cloud), pillow (a pillow in each hand as it's raised to throw),
//     sun (a small rainbow over his hood, the rain thinning, sparkles);
//   - Mood Swing: his mood over his head (a little raincloud for sad, a little thundercloud for cross),
//     flipping while his mood swings and popping up big once it settles; the next one waiting beside it;
//   - his swings: the duvet slap's splash, the plush bop's squeak, the tantrum flail's flung rain;
//   - his phase moments: "five more MINUTES!" (2), a rainbow popping out over his hood (3);
//   - cleared: white and fluffy, sparkles, a rainbow arching over him.
// His marks are all his own (`ownEmotes`): a "!" and a "?" in a raindrop, "Hmph!" after landing a hit, a
// tear-drop of sweat sliding down his hood when he's low, a few drops flicked off as he's hit, little
// clouds and twinkles circling when he's beaten. Every shape soft and rounded, outlined in a deeper shade
// of its own colour; sparkles are soft four-point stars, never specks.
import { sulkRig } from './sulkrig.js';
import { sulkDesign, SKIN_COLORS, MOUTH, BOLT, HEM, PLUSH_C } from './art.js';
import { clamp } from '../mobs/rig.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// His colours: the storm duvet, its outline, the pale trim, the rain, the lightning.
const CS = ['#b4c0ec', '#8693cf', '#6874b2', '#4c5890'];
const INK = '#3e4880';
const TRIM = '#eef2ff';
const RAIN = ['#e6f6ff', '#bfe4ff', '#8ac4f0', '#5a8ec8'];
const BOLTC = ['#fff6c8', '#ffe27a', '#e8b84a'];
const RAINBOW = ['#ffb4c8', '#ffd2a8', '#fff0a8', '#c4f0c4', '#b4dcff', '#d4c4ff'];
function twinkle(ctx, x, y, r, al, col = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function drop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#bfe4ff';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.6);
  ctx.quadraticCurveTo(x + r, y - r * 0.2, x, y + r);
  ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.6);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A raindrop with a soft outline and a glint (his marks' and tears' shape), point up.
function dropShape(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.7);
  ctx.bezierCurveTo(x + r * 0.5, y - r * 0.9, x + r, y - r * 0.3, x + r, y + r * 0.25);
  ctx.arc(x, y + r * 0.25, r, 0, Math.PI);
  ctx.bezierCurveTo(x - r, y - r * 0.3, x - r * 0.5, y - r * 0.9, x, y - r * 1.7);
  ctx.closePath();
}
// A soft little forked flicker of lightning between two points (rounded, slim: never a hard starburst).
function zap(ctx, x0, y0, x1, y1, seed, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pts = [[x0, y0]];
  for (let i = 1; i < 4; i++) {
    const u = i / 4;
    pts.push([x0 + (x1 - x0) * u + (hash(seed + i) - 0.5) * 3, y0 + (y1 - y0) * u + (hash(seed + i + 9) - 0.5) * 3]);
  }
  pts.push([x1, y1]);
  for (const [c, w] of [[BOLTC[2], 1.9], [BOLTC[0], 0.9]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// A little puffy cloud in his duvet's colours: lumps merged into one soft shape, outlined outside only,
// a light along its top, a shade along its bottom. `dark` for a cross little thundercloud.
function puffCloud(ctx, x, y, r, al, dark = false) {
  if (al <= 0.01 || r <= 0.2) return;
  // (dark: a cross thundercloud; 'white': a fair-weather puff, under a rainbow)
  const c = dark === 'white' ? ['#ffffff', '#f4f6ff', '#dde2f4', '#aeb6d8'] : dark ? ['#a4aede', '#7480bc', '#5a66a2', '#3e4880'] : CS;
  const lumps = [[-0.62, 0.18, 0.5], [-0.2, -0.22, 0.62], [0.32, -0.12, 0.55], [0.7, 0.2, 0.42], [0.05, 0.28, 0.55]];
  const path = () => {
    ctx.beginPath();
    for (const [dx, dy, rr] of lumps) {
      ctx.moveTo(x + dx * r + rr * r, y + dy * r);
      ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
    }
  };
  ctx.save();
  ctx.globalAlpha *= al;
  path();
  ctx.strokeStyle = c[3];
  ctx.lineWidth = Math.max(0.7, r * 0.22);
  ctx.stroke();
  ctx.fillStyle = c[1];
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = c[2];
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y + r * 0.62, r * 1.3, r * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c[0];
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.5, r * 0.7, r * 0.3, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
// A pillow: a soft quilted square with puffed corners, his duvet blue with a pale piped edge, a little
// raindrop printed on it.
function pillowAt(ctx, x, y, s, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const w = 9 * s;
  const h = 6.4 * s;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.7);
    ctx.quadraticCurveTo(-w * 1.12, -h * 1.12, -w * 0.7, -h);
    ctx.quadraticCurveTo(0, -h * 0.82, w * 0.7, -h);
    ctx.quadraticCurveTo(w * 1.12, -h * 1.12, w, -h * 0.7);
    ctx.quadraticCurveTo(w * 0.86, 0, w, h * 0.7);
    ctx.quadraticCurveTo(w * 1.12, h * 1.12, w * 0.7, h);
    ctx.quadraticCurveTo(0, h * 0.82, -w * 0.7, h);
    ctx.quadraticCurveTo(-w * 1.12, h * 1.12, -w, h * 0.7);
    ctx.quadraticCurveTo(-w * 0.86, 0, -w, -h * 0.7);
    ctx.closePath();
  };
  shape();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.6, s * 1.1);
  ctx.stroke();
  ctx.fillStyle = CS[0];
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = CS[1];
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.7, w * 1.2, h * 0.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha *= 0.6;
  ctx.beginPath();
  ctx.ellipse(-w * 0.35, -h * 0.45, w * 0.4, h * 0.2, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  shape();
  ctx.strokeStyle = TRIM;
  ctx.lineWidth = Math.max(0.4, s * 0.6);
  ctx.stroke();
  ctx.fillStyle = RAIN[2];
  dropShape(ctx, w * 0.25, h * 0.05, 1.4 * s);
  ctx.fill();
  ctx.restore();
}
// A small pastel rainbow arching over (x, y), radius r, grown in by `k` (0..1), a puff of cloud at each
// foot.
function rainbow(ctx, x, y, r, k, al = 1) {
  if (k <= 0.01 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  const bw = r * 0.07;
  const a0 = Math.PI;
  const a1 = Math.PI + Math.PI * sstep(k);
  for (const [i, c] of RAINBOW.entries()) {
    ctx.strokeStyle = c;
    ctx.lineWidth = bw * 1.1;
    ctx.beginPath();
    ctx.arc(x, y, r - i * bw, a0, a1);
    ctx.stroke();
  }
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = bw * 0.4;
  ctx.beginPath();
  ctx.arc(x, y, r + bw * 0.1, a0 + 0.2, Math.min(a1, a0 + Math.PI * 0.55));
  ctx.stroke();
  ctx.restore();
  const footR = r * 0.2;
  puffCloud(ctx, x - r + bw * 2.4, y + footR * 0.2, footR, al * sstep(k * 3), 'white');
  if (k > 0.7) puffCloud(ctx, x + r - bw * 2.4, y + footR * 0.2, footR, al * sstep((k - 0.7) / 0.3), 'white');
}
// A word of his own (a little cue), never mirrored when he faces left.
function word(ctx, text, x, y, size, fl, al, col = INK, tilt = -0.08) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl, 1);
  ctx.rotate(tilt);
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.34;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = col;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
// His "!" and "?": in a pale raindrop, popping in with a little bounce and fading.
function dropMark(ctx, x, y, mark, e, len, fl) {
  const inn = e < 0.22 ? sstep(e / 0.22) * (1 + 0.22 * Math.sin(Math.PI * clamp(e / 0.22, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(fl * k, k);
  dropShape(ctx, 0, 0.6, 4.4);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = CS[3];
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = '#eef8ff';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-2, -1.6, 1, 1.6, -0.3, 0, TAU);
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0.4, -1.4);
    ctx.lineTo(0.4, 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0.4, 3, 0.65, 0.65, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.moveTo(-0.8, -0.6);
    ctx.quadraticCurveTo(-0.6, -2, 0.6, -1.9);
    ctx.quadraticCurveTo(1.8, -1.6, 1.2, -0.4);
    ctx.quadraticCurveTo(0.4, 0.3, 0.45, 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0.45, 3, 0.65, 0.65, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// His mood over his head in a Mood Swing: a little raincloud with drops falling (sad: get close), or a
// little cross thundercloud with a soft lightning curl and steam (cross: get away).
function moodMark(ctx, x, y, mood, s, al, t) {
  if (al <= 0.01 || s <= 0.05) return;
  if (mood === 'sob') {
    puffCloud(ctx, x, y, 7 * s, al);
    for (let i = 0; i < 3; i++) {
      const v = (t * 1.6 + i / 3) % 1;
      ctx.save();
      ctx.globalAlpha = al * (1 - v);
      ctx.fillStyle = RAIN[1];
      ctx.strokeStyle = RAIN[3];
      ctx.lineWidth = 0.5;
      dropShape(ctx, x + (i - 1) * 4.6 * s, y + 6 * s + v * 8 * s, 1.1 * s);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else {
    puffCloud(ctx, x, y, 7 * s, al, true);
    // the soft lightning curl under it
    ctx.save();
    ctx.globalAlpha = al;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const bx = x + 1 * s;
    const by = y + 4 * s;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 2.6 * s, by);
    ctx.lineTo(bx + 0.8 * s, by + 3 * s);
    ctx.lineTo(bx + 2.8 * s, by + 3 * s);
    ctx.lineTo(bx - 1.2 * s, by + 7.6 * s);
    ctx.lineTo(bx + 0 * s, by + 4.2 * s);
    ctx.lineTo(bx - 1.8 * s, by + 4.2 * s);
    ctx.closePath();
    ctx.strokeStyle = BOLTC[2];
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.fillStyle = BOLTC[1];
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 2; i++) {
      const v = (t * 1.3 + i / 2) % 1;
      ctx.save();
      ctx.globalAlpha = al * 0.8 * Math.sin(Math.PI * v);
      ctx.fillStyle = '#f2f4ff';
      ctx.beginPath();
      ctx.ellipse(x + (i ? 6 : -6) * s + (i ? 1 : -1) * v * 3, y - 6 * s - v * 7, 1.8 + v * 1.4, 1.5 + v, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

// Under him: the rain falling from the duvet's hem down to the ground (thicker in the rainy casts,
// thinner once the sun peeks through).
function under(ctx, m, a, S, matOf, K, H) {
  if (a.sulkClear || m?.hp <= 0) return;
  const hm = K.through(matOf('torso'), 'hemJ', 'hip');
  const kind = a.mo?.rig?.sulkKind;
  const heavy = kind === 'sob' || kind === 'clouds' || kind === 'tantrum' ? 2 : kind === 'sun' ? 0.6 : 1;
  ctx.save();
  ctx.strokeStyle = '#b4dcff';
  ctx.lineWidth = 0.55;
  ctx.lineCap = 'round';
  const n = Math.round(10 * heavy);
  for (let k = 0; k < n; k++) {
    const u = (a.t * (1.4 + heavy * 0.3) + k * (0.61 / heavy) + hash(k) * 0.3) % 1;
    const x = hm[0] - H * 0.28 + (k / (n - 1)) * H * 0.56 - u * 2.4;
    const y = hm[1] + u * (-hm[1]);
    ctx.globalAlpha = (a.alpha ?? 1) * 0.75 * Math.min(1, (1 - u) * 4, u * 8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 0.6, y + 2.6);
    ctx.stroke();
  }
  ctx.restore();
}

function sulkFx(ctx, m, a, S, matOf, K, H) {
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const fl = a.flip ? -1 : 1;
  const b = K.through(matOf('headJ'), 'boltJ', 'neck');
  const crown = [b[0] - 8, b[1] - 6];
  const now = a.now ?? 0;
  ctx.save();
  if (m?.hp <= 0) {
    // beaten: little clouds and twinkles circling over his head
    if (!m.cine) {
      const c = K.through(matOf('headJ'), 'mouthS', 'neck');
      for (let i = 0; i < 3; i++) {
        const an = a.t * 2.4 + (i * TAU) / 3;
        const x = c[0] + Math.cos(an) * H * 0.2;
        const y = b[1] - 2 + Math.sin(an) * H * 0.05;
        if (i === 1) twinkle(ctx, x, y, 2.4, 0.9, '#fff6c8');
        else puffCloud(ctx, x, y, 2.6, 0.9);
      }
    }
    ctx.restore();
    return;
  }
  if (a.sulkClear) {
    // cleared: a rainbow arching over him, sparkles round him
    const c = K.through(matOf('chest'), 'ribs', 'ribs');
    const since = now - (a.mo.rig.sulkClearAt ??= now);
    rainbow(ctx, c[0], c[1] - H * 0.16, H * 0.5, clamp(since / 1.4, 0, 1), 0.85 * (a.alpha ?? 1));
    for (let i = 0; i < 4; i++) {
      const u = ((a.t * 0.6 + i / 4) % 1);
      const an = hash(i + Math.floor(a.t * 0.6)) * TAU;
      twinkle(ctx, c[0] + Math.cos(an) * H * 0.4, c[1] - H * 0.2 + Math.sin(an) * H * 0.3 - u * 4, 2 * Math.sin(Math.PI * u), Math.sin(Math.PI * u), i % 2 ? '#fff6c8' : '#ffffff');
    }
    ctx.restore();
    return;
  }
  a.mo.rig.sulkClearAt = undefined;
  // a tear rolling off his cheek now and then
  const mo = K.through(matOf('headJ'), 'mouthS', 'neck');
  const u = (a.t * 0.35 + (m.uid % 5) * 0.2) % 1;
  if (u < 0.6) drop(ctx, mo[0] - H * 0.06, mo[1] - H * 0.04 + u * H * 0.3, 1, Math.min(1, (0.6 - u) * 4));
  // the lightning curl crackles
  if (Math.sin(a.t * 7 + 1) > 0.85) twinkle(ctx, b[0] + 2, b[1] - 6, 2.2, 1, '#fff6a8');
  // sniffles: extra tears dripping off his chin
  if ((a.sulkSniff ?? 0) > 0.3) {
    for (let i = 0; i < 2; i++) {
      const v = ((a.t * 1.2 + i * 0.5) % 1);
      drop(ctx, mo[0] + (i ? 5 : -5), mo[1] + 2 + v * H * 0.25, 0.9, a.sulkSniff * (1 - v));
    }
  }
  // "hmph": little puffs of steam off the top of his hood
  const steam = (k) => {
    for (let i = 0; i < 3; i++) {
      const v = ((a.t * 1.5 + i / 3) % 1);
      ctx.globalAlpha = k * Math.sin(Math.PI * v) * 0.85;
      ctx.fillStyle = '#f2f4ff';
      ctx.beginPath();
      ctx.ellipse(b[0] - 10 + (i - 1) * 6 + v * 3, b[1] - 4 - v * 12, 2.4 + v * 2, 2 + v * 1.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  if ((a.sulkHmph ?? 0) > 0.3) steam(a.sulkHmph);
  // jolted awake: his lightning crackles all round his hood
  if ((a.sulkJolt ?? -1) >= 0) {
    const v = a.sulkJolt;
    const seed = Math.floor(a.t * 20);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI * 0.85 + i * 0.6;
      zap(ctx, b[0] - 4, b[1] + 4, b[0] - 4 + Math.cos(an) * (10 + v * 6), b[1] + 4 + Math.sin(an) * (10 + v * 6), seed + i * 5, 1 - v);
    }
  }
  const st = a.mo.rig;
  const kind = st?.sulkKind;
  const cast = m.cast;
  const ct = cast ? now - cast.t0 : m.cine?.act ? now - m.cine.act.at : 0;
  const hN = K.through(matOf('handN'), 'handN', 'wrN');
  const hF = K.through(matOf('handF'), 'handF', 'wrF');
  const c = K.through(matOf('chest'), 'ribs', 'ribs');
  if (kind === 'wallop') {
    // drops shaken off the duvet held up over him, more as it builds
    for (let i = 0; i < 4; i++) {
      const v = (a.t * 1.8 + i / 4) % 1;
      const hx = (hN[0] + hF[0]) / 2 + (i - 1.5) * 6;
      drop(ctx, hx + Math.sin(a.t * 26 + i) * 0.8, Math.min(hN[1], hF[1]) + 2 + v * H * 0.3, 1, 0.9 * (1 - v) * clamp(ct / 1.2, 0.3, 1));
    }
  } else if (kind === 'clouds') {
    // a little sulky cloud puffed off his hood with each look, drifting up and away
    for (let i = 0; i < 2; i++) {
      const v = ((ct * 0.75 + i * 0.5) % 1);
      puffCloud(ctx, b[0] - 8 + (i ? 1 : -1) * (6 + v * 14), b[1] - 6 - v * 18, 2.4 + v * 2.2, Math.sin(Math.PI * v) * 0.9);
    }
  } else if (kind === 'pile') {
    // the pillow held up over his head in both hands, wobbling
    const px = (hN[0] + hF[0]) / 2;
    const py = Math.min(hN[1], hF[1]) - 5;
    pillowAt(ctx, px, py, 1.15, Math.sin(a.t * 4.4) * 0.12, clamp(ct / 0.4, 0, 1));
  } else if (kind === 'tantrum') {
    // rumble puffs round him, trembling, and soft little flickers off his hood
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + a.t * 0.8;
      const r = H * (0.32 + 0.025 * Math.sin(a.t * 30 + i));
      puffCloud(ctx, c[0] + Math.cos(an) * r, c[1] + Math.sin(an) * r * 0.55, 2.8, 0.75, true);
    }
    const seed = Math.floor(a.t * 12);
    if (hash(seed) > 0.45) zap(ctx, b[0] - 2, b[1] - 2, b[0] - 2 + (hash(seed + 5) - 0.5) * 16, b[1] - 12 - hash(seed + 2) * 4, seed + 7, 0.85);
  } else if (kind === 'sob') {
    // tears streaming down from his hands
    for (let i = 0; i < 4; i++) {
      const v = ((a.t * 1.6 + i / 4) % 1);
      drop(ctx, mo[0] + (i % 2 ? 7 : -7) + (i > 1 ? 3 : -3), mo[1] + 4 + v * H * 0.32, 1, 1 - v);
    }
  } else if (kind === 'huff') {
    steam(0.9);
  } else if (kind === 'pillow') {
    // a pillow in each hand as it's raised behind his head to throw (gone the moment it's flung)
    // (on his throws' own clock, sulkrig.js CASTS.pillow: raised over 0.35 of a throw, flung at 0.42)
    const u2 = (ct * 1.6) % 2;
    // (flung, it flies on out of his hand and fades as the floor's own pillow takes over)
    const raised = (v) => (v < 0.35 ? sstep(v / 0.35) : v < 0.42 ? 1 : 1 - sstep((v - 0.42) / 0.12));
    for (const [h, v, d] of [[hN, u2, 1], [hF, (u2 + 1) % 2, -1]]) {
      const up = raised(v);
      const fly = v > 0.42 ? sstep((v - 0.42) / 0.12) : 0;
      if (up > 0.05) pillowAt(ctx, h[0] - 3 + fly * 16, h[1] - 8 - fly * 8, 0.9, 0.3 * d + fly * 1.5, up);
    }
  } else if (kind === 'sun') {
    rainbow(ctx, b[0] - 8, b[1] + 6, H * 0.3, clamp((ct - 0.8) / 1, 0, 1), 0.9);
    for (let i = 0; i < 3; i++) {
      const v = (a.t * 0.8 + i / 3) % 1;
      twinkle(ctx, c[0] + (i - 1) * H * 0.22, c[1] - H * 0.36 - v * 6, 2 * Math.sin(Math.PI * v), Math.sin(Math.PI * v), '#fff6c8');
    }
  }
  // Mood Swing: his mood over his head, flipping while it swings, big once it settles; the next waiting
  const sw = m.castPose === 'swing' && cast ? m.sulkSwing : null;
  if (sw?.show) {
    const pop = sw.settledAt != null ? now - sw.settledAt : -1;
    const s = pop >= 0 ? 1.25 + 0.25 * Math.sin(Math.PI * clamp(pop / 0.25, 0, 1)) : 0.85;
    const fk = sw.flipAt != null ? sstep((now - sw.flipAt) / 0.12) : 1;
    moodMark(ctx, crown[0], crown[1] - 16, sw.show, s * (0.6 + 0.4 * fk), 1, a.t);
    if (pop >= 0 && pop < 0.5) for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + 0.4;
      twinkle(ctx, crown[0] + Math.cos(an) * (8 + pop * 20), crown[1] - 16 + Math.sin(an) * (6 + pop * 14), 2.2 * (1 - pop * 2), 1 - pop * 2, '#fff6c8');
    }
    if (sw.next) moodMark(ctx, crown[0] + 16 * (sw.nextSide ?? 1), crown[1] - 10, sw.next, 0.55, 0.8, a.t);
  }
  // a phase moment: "five more MINUTES!" (2), a rainbow popping out over his hood (3)
  const pu = now - (m.phaseAt ?? -9);
  if (pu >= 0 && pu < 1.8 && !cast) {
    const k = clamp(pu / 0.2, 0, 1) * clamp((1.8 - pu) / 0.3, 0, 1);
    if (m.mech?.phase === 2) {
      if (pu > 0.9) word(ctx, 'five more MINUTES!', crown[0] + 14, crown[1] - 18, 6.4, fl, k);
      else word(ctx, 'zzz...', crown[0] + 10, crown[1] - 14 - pu * 4, 5.6, fl, k, CS[2]);
    } else if (m.mech?.phase === 3) {
      rainbow(ctx, b[0] - 8, b[1] + 4, H * 0.32, clamp((pu - 0.4) / 0.8, 0, 1), k);
      if (pu < 0.6) word(ctx, '...hic!', crown[0] + 12, crown[1] - 14, 5.6, fl, k, CS[3]);
    }
  }
  // his swings: the duvet slap's splash, the plush bop's squeak, the tantrum's flung rain
  if (mv?.slap) {
    const v = (t - mv.slap[0]) / 0.4;
    if (v >= 0 && v < 1) {
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8;
        const d = 3 + v * (8 + hash(i) * 6);
        drop(ctx, hN[0] + Math.cos(an) * d + 4, hN[1] + Math.sin(an) * d + v * v * 8, 1.1, 1 - v);
      }
    }
  }
  if (mv?.bop) {
    const v = (t - mv.bop[0]) / 0.45;
    if (v >= 0 && v < 1) {
      const p = K.through(matOf('handN'), 'plushC', 'wrN');
      for (let i = 0; i < 4; i++) {
        const an = -Math.PI * 0.75 + (i / 3) * Math.PI * 0.7;
        twinkle(ctx, p[0] + 4 + Math.cos(an) * (4 + v * 12), p[1] + Math.sin(an) * (4 + v * 10), 2 * (1 - v), 1 - v, i % 2 ? '#e6f6ff' : '#fff6c8');
      }
      word(ctx, 'squeak!', p[0] + 12, p[1] - 12 - v * 4, 5, fl, 1 - sstep((v - 0.6) / 0.4), RAIN[3]);
    }
  }
  if (mv?.flail) {
    mv.flail.forEach((f0, i) => {
      const v = (t - f0) / 0.35;
      if (v < 0 || v >= 1) return;
      const h = i % 2 ? hF : hN;
      for (let j = 0; j < 4; j++) {
        const an = -Math.PI * 0.85 + (j / 3) * Math.PI * 0.7;
        const d = 2 + v * (7 + hash(i * 4 + j) * 5);
        drop(ctx, h[0] + Math.cos(an) * d, h[1] + Math.sin(an) * d + v * v * 7, 1, 1 - v);
      }
    });
  }
  // ---------- His marks ----------
  // "!" in a raindrop as he starts fighting you, "?" when you get away
  const fighting = (m.aggroUntil ?? 0) > now || Boolean(m.engaged);
  if (fighting && !st.sulkHunt) st.sulkBangAt = now;
  if (!fighting && st.sulkHunt) st.sulkLostAt = now;
  st.sulkHunt = fighting;
  const bang = now - (st.sulkBangAt ?? -9);
  const huh = now - (st.sulkLostAt ?? -9);
  if (!m.cine && !sw?.show) {
    if (bang >= 0 && bang < 1.1) dropMark(ctx, crown[0] + 4, crown[1] - 12, '!', bang, 1.1, fl);
    else if (huh >= 0 && huh < 1.4) dropMark(ctx, crown[0] + 4, crown[1] - 12, '?', huh, 1.4, fl);
  }
  // "Hmph!" after landing a hit
  const gl = now - (m.gloatAt ?? -9);
  if (gl >= 0 && gl < 1.2 && !cast) {
    word(ctx, 'Hmph!', crown[0] + 14, crown[1] - 10 - gl * 5, 6.4, fl, 1 - sstep((gl - 0.8) / 0.4));
    steam(0.7 * (1 - gl / 1.2));
  }
  // a few drops flicked off his hood as he's hit
  const hu = a.hurtAgo ?? 9;
  if (hu >= 0 && hu < 0.4) for (let i = 0; i < 3; i++) drop(ctx, b[0] - 14 + i * 8 + (i - 1) * hu * 20, b[1] - hu * 16 + hu * hu * 40 + i * 2, 1, 1 - hu / 0.4);
  // low: a tear-drop of sweat sliding down his hood
  if (m.hp < m.def.hp * 0.25 && !cast) {
    const v = (a.t * 0.8) % 1;
    ctx.save();
    ctx.globalAlpha = v < 0.8 ? 1 : (1 - v) * 5;
    ctx.fillStyle = RAIN[1];
    ctx.strokeStyle = RAIN[3];
    ctx.lineWidth = 0.6;
    dropShape(ctx, b[0] - 22, b[1] + 12 + v * 8, 1.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// (drawn big, for a boss: the whole rig scaled, as The Sulk always was)
const BIG = 1.9;
const R = sulkRig({ design: sulkDesign, skin: SKIN_COLORS, mouth: MOUTH, bolt: BOLT, hem: HEM, plush: PLUSH_C, fx: sulkFx, under });
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  // (drawn BIG: its steps measured in its own units, so its planted feet keep still on the ground)
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG);
rig.h = Math.round(rig.h * BIG);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: his marks over his head his own)
export const SULK_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const SULK_SIZE = { w: Math.round(36 * BIG), h: Math.round(R.H * 0.92 * BIG) };
