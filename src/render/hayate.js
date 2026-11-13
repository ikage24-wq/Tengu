// Hayate, the great guardian who keeps the island's wind (data/story.js), as she speaks in
// cutscenes (ui/cutscene.js). The player's call (2026-11-05): a sleepy princess. She is drawn on
// the player-character base: a big puffy cloud of white hair, droopy sleepy eyes, the Starlight
// Princess Gown and a crystal crown. Asleep (the default) she yawns and nods, breathing slowly;
// on her happy lines she is awake and smiling.

import { drawHero } from './hero.js';
import { ITEMS } from '../data/items.js';
import '../data/cash.js';

export const HAYATE_LOOK = { hairStyle: 'cloud', hairColor: '#ffffff', hairTip: '#d8e8ff', skinTone: '#fff0e6', eyeColor: '#7a96e0', eyeStyle: 'droopy', outfitColor: '#c9b8ff' };

// The princess gown, piece by piece (a costume is worn as a look on each slot it covers), and the
// crystal crown. Built once, on first use.
let gear = null;
export function hayateGear() {
  if (gear) return gear;
  const gown = ITEMS.cash_costume_ballgown;
  gear = Object.fromEntries(Object.entries(gown?.covers ?? {}).map(([slot, id]) => [slot, { id }]));
  if (gown) gear[gown.slot] = { id: gown.skin };
  gear.hat = { id: 'crystal_crown' };
  return gear;
}

// The Mochi Queen's sprout: a little gold one on her head, the Mochi mark she wears instead of
// theirs, with a shine behind it and a slow star of light crossing it. (The player's call,
// 2026-11-13: the island's Tengu are gone, the Mochi take their place, and Hayate is their queen -
// drawn on the player-character base she has always had, with the gold sprout to say what she is.)
const SHINE = new Map();
function goldSprout(ctx, x, y, s, t) {
  // The shine behind it, made once for each size it is drawn at.
  const r = Math.max(6, Math.round(s * 9));
  let halo = SHINE.get(r);
  if (!halo) {
    halo = document.createElement('canvas');
    halo.width = halo.height = r * 2;
    const g = halo.getContext('2d');
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, 'rgba(255,228,140,0.6)');
    grad.addColorStop(0.45, 'rgba(255,214,110,0.24)');
    grad.addColorStop(1, 'rgba(255,214,110,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, r * 2, r * 2);
    SHINE.set(r, halo);
  }
  ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 1.6);
  ctx.drawImage(halo, x - r, y - r);
  ctx.globalAlpha = 1;
  // The sprout itself, shaped exactly as a Mochi's is (render/hair.js sproutAt): a tapered stem
  // bending a beat behind her, two round leaves opening from its tip, and the gold sprout's
  // sparkle. Hers is grander - a longer stem, bigger leaves - and gold all through.
  const deg = (a) => (a * Math.PI) / 180;
  const LEAN = -4 + Math.sin(t * 0.9) * 5;
  const LEN = s * 6.4;
  const L = s * 5.2;
  const OPEN = 52;
  const a0 = deg(LEAN);
  const mid = [x + Math.sin(a0 * 0.5) * LEN * 0.5, y - Math.cos(a0 * 0.5) * LEN * 0.5];
  const tip = [mid[0] + Math.sin(a0) * LEN * 0.5, mid[1] - Math.cos(a0) * LEN * 0.5];
  // The stem: wide at the root, narrowing to the tip, as a Mochi's is.
  const side = (p, q, w) => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [(-(q[1] - p[1]) / l) * w, ((q[0] - p[0]) / l) * w];
  };
  const [ax, ay] = side([x, y], mid, s * 0.62);
  const [bx, by] = side(mid, tip, s * 0.44);
  ctx.fillStyle = '#b88a22';
  ctx.beginPath();
  ctx.moveTo(x + ax, y + ay);
  ctx.lineTo(mid[0] + bx, mid[1] + by);
  ctx.lineTo(tip[0] + bx * 0.6, tip[1] + by * 0.6);
  ctx.lineTo(tip[0] - bx * 0.6, tip[1] - by * 0.6);
  ctx.lineTo(mid[0] - bx, mid[1] - by);
  ctx.lineTo(x - ax, y - ay);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8bd3e';
  ctx.beginPath();
  ctx.moveTo(x + ax * 0.4, y + ay * 0.4);
  ctx.lineTo(mid[0] + bx * 0.4, mid[1] + by * 0.4);
  ctx.lineTo(tip[0], tip[1]);
  ctx.lineTo(mid[0] - bx * 0.2, mid[1] - by * 0.2);
  ctx.closePath();
  ctx.fill();
  // A leaf: the Mochi's round leaf, its outline rounded off, with a midrib and a gold shine.
  const ROUND = [[0, 0], [0.28, 0.42], [0.72, 0.4], [1, 0], [0.72, -0.4], [0.28, -0.42]];
  const leaf = (ang, len, c, dk, lit) => {
    const dx = Math.sin(deg(ang));
    const dy = -Math.cos(deg(ang));
    const at = (l, o) => [tip[0] + dx * l * len - dy * o * len, tip[1] + dy * l * len + dx * o * len];
    const pts = ROUND.map(([l, o]) => at(l, o));
    ctx.fillStyle = c;
    ctx.beginPath();
    const mid0 = [(pts[pts.length - 1][0] + pts[0][0]) / 2, (pts[pts.length - 1][1] + pts[0][1]) / 2];
    ctx.moveTo(mid0[0], mid0[1]);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
    ctx.fill();
    // Its midrib.
    ctx.fillStyle = dk;
    ctx.beginPath();
    [at(0.08, 0.05), at(0.78, 0.02), at(0.78, -0.02), at(0.08, -0.05)].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    // The shine along its upper edge: gold that has been polished.
    ctx.fillStyle = lit;
    ctx.beginPath();
    [at(0.22, 0.3), at(0.56, 0.3), at(0.74, 0.14), at(0.46, 0.18), at(0.26, 0.2)].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  };
  leaf(LEAN + OPEN, L, '#f6cf52', '#b88a22', '#fff0ae');
  leaf(LEAN - OPEN, L * 0.9, '#e8bd3e', '#a87c1c', '#ffe79a');
  // The gold sprout's own little sparkle, up off the tip.
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  ctx.arc(tip[0] + s * 1.3, tip[1] - s * 3.2, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // A star of light crossing it, every few seconds.
  const u = (t * 0.26) % 1;
  if (u < 0.3) {
    const k = Math.sin((u / 0.3) * Math.PI);
    ctx.globalAlpha = k * 0.9;
    ctx.fillStyle = '#fffbe8';
    const w = Math.max(0.8, s * 0.22);
    ctx.fillRect(tip[0] - w, tip[1] - s * 2.4, w * 2, s * 4.8);
    ctx.fillRect(tip[0] - s * 2.4, tip[1] - w, s * 4.8, w * 2);
    ctx.globalAlpha = 1;
  }
}
// Hayate at (x, y) (her feet), `s` the hero's scale (2 in the cutscene window), `t` seconds,
// `awake` once she has woken, `talking` while her words type out.
export function drawHayate(ctx, x, y, t, { s = 2, awake = false, talking = false } = {}) {
  // She breathes slowly; asleep, she nods off now and then and catches herself.
  const breath = 0.5 + 0.5 * Math.sin(t * 1.3);
  const nod = awake ? 0 : Math.max(0, Math.sin(t * 0.7)) ** 6 * 1.2 * s;
  const dy = y - breath * 0.6 * s + nod * 0.3;
  drawHero(ctx, { ...HAYATE_LOOK, face: awake ? 'smile' : 'sleepy' }, hayateGear(), x, dy, { pose: 'idle', time: t, seed: 7, scale: s, talking, facing: 1 });
  // Her gold sprout, up out of the cloud of her hair. (She stands about 46 units tall, crown and
  // all, so its stem starts just at the top of her.)
  goldSprout(ctx, x - s * 1.2, dy - s * 44, s, t);
}
