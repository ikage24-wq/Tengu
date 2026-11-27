// Queen Bonbon on screen (2026-11-25, remade on the queen base, the player's pick "A, the Strawberry
// Shortcake Queen"; redrawn the same day: Velvet eyes in pink, the player's hair technique, a big
// Victorian gown, and a boss's act: "animated with cake and stuff, more expression"). She moves on her
// own copy of the queen rig (queenrig.js: its bones, gait, sway, moves and springs; her pieces from
// art.js), drawn big for a boss; this adds what glows, floats and flies:
//   - the four birthday candles on her crown, their flames flickering (blown out with a wish in her
//     act, lit again one by one with a sparkle), a shine on the cherry;
//   - her act's props: a great three-tier strawberry celebration cake on a gold stand (see the cake
//     below) rising out of the floor beside her in a burst of confetti (a slice chopped out of it with a splash of cream, then sinking
//     away); the slice on her palm; cream and hearts as she gobbles it; sparkles and little hearts
//     bubbling up as she laughs; sprinkles flung off her hem as she twirls; her breath on the wish;
//     a shimmer as she curtsies;
//   - her attacks: the spoon's BONK, a splash of cream; the sweep, cream flung off the bowl;
//   - her fight: the Sugar Bomb (a great dollop of frosting with a cherry flung up off her spoon), and
//     Sprinkle Rain (sprinkles bursting up from her hands to the sky).
import { bonbonRig } from './queenrig.js';
import { bonbonDesign, SKIN_COLORS, SHEET_ROOT, DRILL_F, DRILL_N, SIDE_F, SIDE_N, CROWN_ROOT, FLAMES, SKIRT_ROOT, TIER_MID, TIER_LOW, SPOON_GRIP, SPOON_BOWL, MOUTH } from './art.js';
import { clamp } from '../mobs/rig.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u) => 1 - (1 - u) ** 2;
function glow(ctx, x, y, r, al, rgb = '255,214,120') {
  if (al <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${al})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function twinkle(ctx, x, y, r, al, c = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A candle flame: an outer warm teardrop, a yellow core, a white heart, swaying.
function flame(ctx, x, y, s, t, ph) {
  const sw = Math.sin(t * 9 + ph) * 0.5 + Math.sin(t * 14.3 + ph * 2) * 0.3;
  const h = s * (3.4 + Math.sin(t * 11 + ph) * 0.4);
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y - h * 0.4, s * 4.4, 0.35);
  ctx.globalCompositeOperation = 'source-over';
  for (const [c, k] of [['#ff9a3a', 1], ['#ffd84a', 0.66], ['#fff8d8', 0.34]]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + sw * s * k, y - h * k - (1 - k) * s * 0.4);
    ctx.quadraticCurveTo(x + s * 1.1 * k, y - h * 0.3 * k, x, y);
    ctx.quadraticCurveTo(x - s * 1.1 * k, y - h * 0.3 * k, x + sw * s * k, y - h * k - (1 - k) * s * 0.4);
    ctx.fill();
  }
}
// A soft swirl of cream: a white round with a curl of light and a shade.
function cream(ctx, x, y, r, al = 1) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#e8dcc8';
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y + r * 0.15, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#f0e4d0';
  ctx.lineWidth = r * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0.4, 3.6);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
function berry(ctx, x, y, r) {
  ctx.fillStyle = '#d81a3a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8a9a';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#5a8a3a';
  ctx.lineWidth = r * 0.25;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.4, y - r * 2, x + r * 1.2, y - r * 2.4);
  ctx.stroke();
}
// A little floating heart.
function heartFx(ctx, x, y, r, al, c = '#ff7aa8') {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
  ctx.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.45, y - r * 0.4, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A slice of strawberry shortcake: sponge, a cream layer, pink, cream on top, a strawberry.
function cakeSlice(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  const layer = (y0, h, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - 5 * s, y0);
    ctx.lineTo(x + 5 * s, y0 - 2 * s);
    ctx.lineTo(x + 5 * s, y0 - 2 * s - h);
    ctx.lineTo(x - 5 * s, y0 - h);
    ctx.closePath();
    ctx.fill();
  };
  ctx.strokeStyle = '#d07a96';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 5.4 * s, y + 0.4);
  ctx.lineTo(x + 5.4 * s, y - 2 * s + 0.2);
  ctx.lineTo(x + 5.4 * s, y - 9.4 * s);
  ctx.lineTo(x - 5.4 * s, y - 7.4 * s);
  ctx.closePath();
  ctx.stroke();
  layer(y, 2.4 * s, '#f6d488');
  layer(y - 2.4 * s, 1.4 * s, '#fff8ee');
  layer(y - 3.8 * s, 1.6 * s, '#ff9ab4');
  layer(y - 5.4 * s, 2 * s, '#fff8ee');
  ctx.globalAlpha = al;
  cream(ctx, x, y - 8.4 * s, 1.6 * s, al);
  berry(ctx, x + 0.6 * s, y - 10.6 * s, 1.3 * s);
  ctx.globalAlpha = 1;
}
const SPRINKLES = ['#ff6a9a', '#7ad8e8', '#ffe066', '#a8e87a', '#c8a8ff', '#ffffff'];
function sprinkle(ctx, x, y, an, len, c, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(an) * len, y - Math.sin(an) * len);
  ctx.lineTo(x + Math.cos(an) * len, y + Math.sin(an) * len);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ---------- Her great birthday cake ----------
// (2026-11-25, redrawn: the player, "cake looks so simple and not detailed".) A three-tier strawberry
// celebration cake in the queen's own style, drawn as real round tiers seen a little from above,
// in units of a hundredth of her height, standing on the floor at (x, gy):
//   - a gold cake stand with a lace doily, its shadow on the floor;
//   - each tier a pink sponge drum, lit round its curve, its top frosted in cream that runs down its
//     front in glossy drips of different lengths, swirled rosettes round its top edge (smaller ones
//     round the back), a shell border piped round its foot;
//   - the bottom tier hung with cream garland swags caught up with pink bows and pearls, like her
//     gown; the middle tier in pink and cream candy stripes with a string of pearls; the top tier
//     dotted with piped hearts;
//   - real strawberries (seeded, glossy, a green calyx and stem) perched round each tier's rim;
//   - on top, a little gold crown with gems, three spiral birthday candles round it, their flames;
//   - glints sliding over the frosting.
// Outlines soft, each in its part's own deeper colour, never a dark ink line (the player: "the black
// outlines make it look ugly").
// `rise` lifts it out of the floor (cut off at the floor line); `cut`: a slice gone from the top
// tier, its layers of sponge, cream and strawberry showing.
const smooth = (u) => u * u * (3 - 2 * u);
// A point on the rim of a tier (cx, y the rim's centre, rx, ry its radii), at angle a (0 right, PI/2
// the front, PI left).
const rim = (cx, y, rx, ry, a) => [cx + rx * Math.cos(a), y + ry * Math.sin(a)];
function strawberryFx(ctx, x, y, s, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createLinearGradient(-s, -s, s, s * 1.4);
  g.addColorStop(0, '#ff5a6a');
  g.addColorStop(0.5, '#e8203c');
  g.addColorStop(1, '#a8102a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#b01834';
  ctx.lineWidth = s * 0.14;
  ctx.beginPath();
  ctx.moveTo(0, s * 1.5);
  ctx.bezierCurveTo(-s * 0.9, s * 1.1, -s * 1.25, -s * 0.2, -s * 0.9, -s * 0.7);
  ctx.quadraticCurveTo(0, -s * 1.05, s * 0.9, -s * 0.7);
  ctx.bezierCurveTo(s * 1.25, -s * 0.2, s * 0.9, s * 1.1, 0, s * 1.5);
  ctx.fill();
  ctx.stroke();
  // seeds in rows
  ctx.fillStyle = '#ffe27a';
  for (const [u, v] of [[-0.5, -0.2], [0, -0.3], [0.5, -0.2], [-0.62, 0.3], [-0.2, 0.25], [0.22, 0.25], [0.62, 0.3], [-0.38, 0.75], [0.05, 0.75], [0.42, 0.75], [-0.12, 1.15], [0.2, 1.15]]) {
    ctx.beginPath();
    ctx.ellipse(u * s, v * s, s * 0.09, s * 0.14, 0, 0, TAU);
    ctx.fill();
  }
  // the gloss
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.45, -s * 0.15, s * 0.18, s * 0.42, 0.3, 0, TAU);
  ctx.fill();
  // the calyx: a green star of leaves, a stem
  ctx.fillStyle = '#4caa48';
  ctx.strokeStyle = '#2a6a2a';
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const an = Math.PI + (i / 4) * Math.PI;
    const r0 = s * 0.25;
    ctx.lineTo(Math.cos(an - 0.3) * r0, -s * 0.72 + Math.sin(an - 0.3) * r0 * 0.5);
    ctx.lineTo(Math.cos(an) * s * 0.95, -s * 0.72 + Math.sin(an) * s * 0.35 + s * 0.12);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#3a8a3a';
  ctx.lineWidth = s * 0.18;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.quadraticCurveTo(s * 0.1, -s * 1.2, s * 0.35, -s * 1.35);
  ctx.stroke();
  ctx.restore();
}
// A swirled rosette of piped cream: a round with a spiral of shade and a glint.
function rosette(ctx, x, y, r, dim = 0) {
  ctx.fillStyle = dim ? '#f6e8e2' : '#fffaf4';
  ctx.strokeStyle = '#d8aab8';
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.86, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#f0c8d4';
  ctx.lineWidth = r * 0.2;
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const an = (i / 18) * TAU * 1.6;
    const rr = r * (0.75 - i * 0.035);
    ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.8);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.2, 0, TAU);
  ctx.fill();
}
function pearl(ctx, x, y, r) {
  ctx.fillStyle = '#fff6fa';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f0d4e0';
  ctx.beginPath();
  ctx.arc(x + r * 0.2, y + r * 0.25, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU);
  ctx.fill();
}
function bowFx(ctx, x, y, s) {
  ctx.fillStyle = '#ff6a9a';
  ctx.strokeStyle = '#d0507e';
  ctx.lineWidth = s * 0.18;
  for (const o of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + o * s * 1.4, y - s * 1.2, x + o * s * 1.7, y - s * 0.1);
    ctx.quadraticCurveTo(x + o * s * 1.2, y + s * 0.6, x, y);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + o * s * 0.7, y + s * 1.5);
    ctx.lineTo(x + o * s * 0.3, y + s * 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#ff94b8';
  ctx.beginPath();
  ctx.arc(x, y, s * 0.42, 0, TAU);
  ctx.fill();
  ctx.stroke();
}
// One tier: k 0 the bottom, 1 the middle, 2 the top; (cx, by) the middle of its foot.
function tier(ctx, cx, by, rx, h, u, k, t, cut = false) {
  const ry = rx * 0.2;
  const ty = by - h;
  // the drum: its side lit round its curve
  const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, '#d8628c');
  g.addColorStop(0.16, '#ffa8c6');
  g.addColorStop(0.36, '#ffd4e4');
  g.addColorStop(0.62, '#ffb2cc');
  g.addColorStop(1, '#c8507c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#d0608c';
  ctx.lineWidth = u * 0.45;
  ctx.beginPath();
  ctx.moveTo(cx - rx, ty);
  ctx.lineTo(cx - rx, by);
  ctx.ellipse(cx, by, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx, ty);
  ctx.ellipse(cx, ty, rx, ry, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // its decoration, following the curve of the drum
  ctx.save();
  ctx.clip();
  if (k === 1) {
    // candy stripes, narrowing toward the sides as they turn away
    for (let i = 0; i < 14; i++) {
      const a0 = Math.PI * (i / 14);
      const a1 = Math.PI * ((i + 0.5) / 14);
      const [x0] = rim(cx, 0, rx, ry, a0);
      const [x1] = rim(cx, 0, rx, ry, a1);
      ctx.fillStyle = 'rgba(255,248,240,0.55)';
      ctx.fillRect(Math.min(x0, x1), ty - ry, Math.abs(x1 - x0), h + ry * 2);
    }
  }
  ctx.restore();
  if (k === 0) {
    // garland swags caught up with bows and pearls, as on her gown
    const n = 4;
    const pts = Array.from({ length: n + 1 }, (_, i) => rim(cx, ty + h * 0.32, rx * 0.98, ry, Math.PI * (1 - (i + 0.25) / (n + 0.5))));
    for (let i = 0; i < n; i++) {
      const [ax, ay] = pts[i];
      const [bx, bby] = pts[i + 1];
      const mx = (ax + bx) / 2;
      const my = Math.max(ay, bby) + h * 0.28;
      ctx.fillStyle = '#fff6ec';
      ctx.strokeStyle = '#e6c4c8';
      ctx.lineWidth = u * 0.35;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, my - h * 0.12, bx, bby);
      ctx.quadraticCurveTo(mx, my + h * 0.16, ax, ay);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ecd8c8';
      ctx.lineWidth = u * 0.35;
      ctx.beginPath();
      ctx.moveTo(ax + u, ay + u * 0.6);
      ctx.quadraticCurveTo(mx, my + h * 0.02, bx - u, bby + u * 0.6);
      ctx.stroke();
      for (let j = 1; j < 6; j++) {
        const v = j / 6;
        const px = (1 - v) * (1 - v) * ax + 2 * v * (1 - v) * mx + v * v * bx;
        const py = (1 - v) * (1 - v) * ay + 2 * v * (1 - v) * (my + h * 0.16) + v * v * bby;
        pearl(ctx, px, py, u * 0.55);
      }
    }
    for (const [px, py] of pts) bowFx(ctx, px, py, u * 1.5);
  }
  if (k === 1) {
    // a string of pearls round its waist
    for (let i = 1; i < 16; i++) {
      const [px, py] = rim(cx, by - h * 0.38, rx, ry, Math.PI * (1 - i / 16));
      pearl(ctx, px, py, u * 0.6);
    }
  }
  if (k === 2) {
    // piped hearts round it
    for (let i = 0; i < 5; i++) {
      const [px, py] = rim(cx, by - h * 0.4, rx * 0.92, ry, Math.PI * (0.9 - i * 0.2));
      heartFx(ctx, px, py, u * 1.1, 1, '#ff7aa8');
    }
  }
  // the shell border round its foot
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (1 - i / 14);
    const [px, py] = rim(cx, by, rx, ry, a);
    ctx.fillStyle = '#fffaf4';
    ctx.strokeStyle = '#d8aab8';
    ctx.lineWidth = u * 0.3;
    ctx.beginPath();
    ctx.ellipse(px, py - u * 0.3, u * 1.5, u * 1.1, -0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f0c8d4';
    ctx.beginPath();
    ctx.moveTo(px - u * 0.9, py - u * 0.2);
    ctx.quadraticCurveTo(px, py - u * 1, px + u * 0.9, py - u * 0.6);
    ctx.stroke();
  }
  // the frosted top: its cap, rosettes round its back edge
  const cg = ctx.createLinearGradient(0, ty - ry, 0, ty + ry);
  cg.addColorStop(0, '#fff4ea');
  cg.addColorStop(1, '#ffffff');
  ctx.fillStyle = cg;
  ctx.strokeStyle = '#e8ccc6';
  ctx.lineWidth = u * 0.4;
  ctx.beginPath();
  ctx.ellipse(cx, ty, rx + u * 0.4, ry + u * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const nr = Math.max(5, Math.round(rx / (u * 3.2)));
  for (let i = 1; i < nr; i += 2) {
    const [px, py] = rim(cx, ty, rx * 0.92, ry * 0.9, Math.PI + (Math.PI * i) / nr);
    rosette(ctx, px, py, u * 1.1, 1);
  }
  // the drips down its front: the cream collar, its lower edge running down in drips
  const N = 180;
  const drips = [];
  // (each drip a rounded finger of cream: straight sides, a round end; between them the cream
  // scallops gently)
  for (let i = 0; i < 8; i++) drips.push({ a: Math.PI * (0.08 + i * 0.12 + (hash(i + k * 7) - 0.5) * 0.03), len: u * (2.4 + hash(i + k * 11) * (i % 2 ? 5.6 : 2.8)), w: 0.085 + hash(i + k * 5) * 0.02 });
  const lower = (a) => {
    let d = u * 1.4 + u * 0.35 * (1 + Math.cos(a * 22)) * 0.5;
    for (const dr of drips) {
      const q = Math.abs(a - dr.a) / dr.w;
      if (q < 1) d = Math.max(d, u * 1.4 + dr.len * Math.sqrt(1 - q ** 4) * smooth(Math.min(1, (1 - q) * 2.4)));
    }
    return d;
  };
  ctx.fillStyle = '#fffaf4';
  ctx.strokeStyle = '#e8ccc6';
  ctx.lineWidth = u * 0.4;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (Math.PI * i) / N;
    const [px, py] = rim(cx, ty, rx + u * 0.4, ry + u * 0.3, a);
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  for (let i = N; i >= 0; i--) {
    const a = (Math.PI * i) / N;
    const [px, py] = rim(cx, ty, rx + u * 0.2, ry, a);
    ctx.lineTo(px, py + lower(a) * (0.35 + 0.65 * Math.sin(a)));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // a gloss down each long drip, and a glint sliding along the rim
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  for (const dr of drips) {
    if (dr.len < u * 4) continue;
    const [px, py] = rim(cx, ty, rx, ry, dr.a);
    ctx.beginPath();
    ctx.ellipse(px - u * 0.4, py + dr.len * 0.55 * Math.sin(dr.a), u * 0.35, dr.len * 0.25, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#f2e2d6';
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.2, ty - ry * 0.1, rx * 0.5, ry * 0.4, 0, 0, TAU);
  ctx.fill();
  const ga = ((t * 0.35 + k * 0.3) % 1.6) * Math.PI;
  if (ga < Math.PI) {
    const [gx, gy] = rim(cx, ty, rx, ry, ga);
    twinkle(ctx, gx, gy + u, u * 1.4 * Math.sin(ga), 0.9, '#ffffff');
  }
  // the slice gone (the top tier, in her act): a wedge cut out of its front-right, the two cut faces
  // showing their layers of sponge, cream and strawberry, the far face in shade
  if (cut) {
    const a0 = 1.18;
    const a1 = 1.98;
    const C = [cx, ty - ry * 0.45];
    const Cb = [C[0], C[1] + h];
    const A = rim(cx, ty, rx, ry, a0);
    const Ab = rim(cx, by, rx, ry, a0);
    const B = rim(cx, ty, rx, ry, a1);
    const Bb = rim(cx, by, rx, ry, a1);
    const layers = [['#fff8ee', 0.14], ['#f6d488', 0.22], ['#ff7a9a', 0.08], ['#fff8ee', 0.14], ['#f6d488', 0.22], ['#ff7a9a', 0.06], ['#f6d488', 0.14]];
    const face = (P0, P1, P1b, P0b, dark) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(...P0);
      ctx.lineTo(...P1);
      ctx.lineTo(...P1b);
      ctx.lineTo(...P0b);
      ctx.closePath();
      ctx.clip();
      let f0 = 0;
      for (const [c, f] of layers) {
        ctx.fillStyle = c;
        ctx.beginPath();
        const y0 = (P) => P[1] + (h + u) * f0;
        ctx.moveTo(P0[0], y0(P0));
        ctx.lineTo(P1[0], y0(P1));
        ctx.lineTo(P1[0], y0(P1) + (h + u) * f + 0.5);
        ctx.lineTo(P0[0], y0(P0) + (h + u) * f + 0.5);
        ctx.closePath();
        ctx.fill();
        f0 += f;
      }
      for (const v of [0.35, 0.7]) {
        const px = P0[0] + (P1[0] - P0[0]) * v;
        const py = P0[1] + (P1[1] - P0[1]) * v + (h + u) * 0.42;
        ctx.fillStyle = '#e8203c';
        ctx.beginPath();
        ctx.ellipse(px, py, u * 0.9, u * 0.55, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffb0bc';
        ctx.beginPath();
        ctx.ellipse(px, py, u * 0.45, u * 0.25, 0, 0, TAU);
        ctx.fill();
      }
      if (dark) {
        ctx.fillStyle = 'rgba(120,40,80,0.22)';
        ctx.fillRect(Math.min(P0[0], P1[0]) - 2, ty - ry - 2, Math.abs(P1[0] - P0[0]) + 4, h + ry * 3);
      }
      ctx.restore();
    };
    face(C, B, Bb, Cb, true);
    face(C, A, Ab, Cb, false);
    ctx.strokeStyle = '#c87a92';
    ctx.lineWidth = u * 0.4;
    ctx.beginPath();
    ctx.moveTo(...A);
    ctx.lineTo(...C);
    ctx.lineTo(...B);
    ctx.moveTo(...C);
    ctx.lineTo(...Cb);
    ctx.moveTo(...Ab);
    ctx.lineTo(...A);
    ctx.moveTo(...Bb);
    ctx.lineTo(...B);
    ctx.stroke();
    // (a lip of frosting along the cut's top edges)
    ctx.strokeStyle = '#fffaf4';
    ctx.lineWidth = u * 0.8;
    ctx.beginPath();
    ctx.moveTo(A[0], A[1] + u * 0.5);
    ctx.lineTo(C[0], C[1] + u * 0.5);
    ctx.lineTo(B[0], B[1] + u * 0.5);
    ctx.stroke();
  }
  // the rosettes round its front edge, every third a strawberry instead
  for (let i = 0; i < nr; i++) {
    const a = (Math.PI * (i + 0.5)) / nr;
    if (cut && a > 1.05 && a < 2.1) continue;
    const [px, py] = rim(cx, ty, rx * 0.96, ry, a);
    if (i % 3 === 1) strawberryFx(ctx, px, py - u * 1.4, u * 1.9, (hash(i + k) - 0.5) * 0.5);
    else rosette(ctx, px, py, u * 1.6);
  }
}
function drawCake(ctx, x, gy, H, rise, cut, t) {
  if (rise <= 0.01) return;
  const u = H / 100;
  const rxs = [21, 16, 11].map((v) => v * u);
  const hs = [14, 12, 10].map((v) => v * u);
  const stand = 5 * u;
  const total = stand + hs[0] + hs[1] + hs[2] + 18 * u;
  ctx.save();
  // (its shadow on the floor, growing as it rises)
  ctx.globalAlpha = 0.25 * ease(rise);
  ctx.fillStyle = '#5a2440';
  ctx.beginPath();
  ctx.ellipse(x, gy, 26 * u, 3 * u, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.rect(x - 40 * u, gy - total - 30 * u, 80 * u, total + 30 * u + 0.5);
  ctx.clip();
  ctx.translate(0, (1 - ease(rise)) * total);
  glow(ctx, x, gy - total * 0.5, total * 0.8, 0.25 * (1 - rise * 0.6), '255,180,210');
  // the gold stand: a foot, a stem, a plate with a lace doily
  const gold = ctx.createLinearGradient(x - 24 * u, 0, x + 24 * u, 0);
  gold.addColorStop(0, '#c8902a');
  gold.addColorStop(0.35, '#ffe48a');
  gold.addColorStop(1, '#b8802a');
  ctx.fillStyle = gold;
  ctx.strokeStyle = '#b8862a';
  ctx.lineWidth = u * 0.45;
  ctx.beginPath();
  ctx.ellipse(x, gy - u, 10 * u, 2 * u, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 3 * u, gy - u);
  ctx.quadraticCurveTo(x - 1.5 * u, gy - stand * 0.6, x - 3.4 * u, gy - stand);
  ctx.lineTo(x + 3.4 * u, gy - stand);
  ctx.quadraticCurveTo(x + 1.5 * u, gy - stand * 0.6, x + 3 * u, gy - u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const py0 = gy - stand;
  for (let i = 0; i <= 22; i++) {
    const [px, py] = rim(x, py0 + u * 0.6, 25 * u, 4.4 * u, Math.PI * (i / 22));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e8ccd6';
    ctx.lineWidth = u * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, u * 1.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f0dce6';
    ctx.beginPath();
    ctx.arc(px, py, u * 0.4, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = gold;
  ctx.strokeStyle = '#b8862a';
  ctx.lineWidth = u * 0.45;
  ctx.beginPath();
  ctx.ellipse(x, py0, 24 * u, 4 * u, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,250,220,0.7)';
  ctx.beginPath();
  ctx.ellipse(x - 8 * u, py0 - u * 0.8, 8 * u, 1.2 * u, 0, 0, TAU);
  ctx.fill();
  // the tiers
  let by = py0 + u * 0.6;
  const tops = [];
  for (let k = 0; k < 3; k++) {
    tier(ctx, x, by, rxs[k], hs[k], u, k, t, k === 2 && cut);
    by -= hs[k];
    tops.push(by);
  }
  // on top: the little gold crown, three spiral candles round it
  const ty = tops[2];
  for (const [dx, dy] of [[-6, -0.6], [6, -0.6], [0, -2.2]]) {
    const cx2 = x + dx * u;
    const cy2 = ty + dy * u;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f0b4c8';
    ctx.lineWidth = u * 0.3;
    ctx.fillRect(cx2 - u * 0.8, cy2 - u * 9, u * 1.6, u * 9);
    ctx.strokeRect(cx2 - u * 0.8, cy2 - u * 9, u * 1.6, u * 9);
    ctx.strokeStyle = '#ff7aa8';
    ctx.lineWidth = u * 0.6;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(cx2 - u * 0.8, cy2 - u * (1.4 + i * 2.2));
      ctx.lineTo(cx2 + u * 0.8, cy2 - u * (2.6 + i * 2.2));
    }
    ctx.stroke();
    flame(ctx, cx2, cy2 - u * 9.4, u * 0.85, t, dx);
  }
  {
    const cy2 = ty + u * 0.4;
    const cg = ctx.createLinearGradient(x - 5 * u, 0, x + 5 * u, 0);
    cg.addColorStop(0, '#d8a03a');
    cg.addColorStop(0.4, '#fff0a0');
    cg.addColorStop(1, '#c8902a');
    ctx.fillStyle = cg;
    ctx.strokeStyle = '#b07a20';
    ctx.lineWidth = u * 0.35;
    ctx.beginPath();
    ctx.moveTo(x - 5 * u, cy2);
    ctx.lineTo(x - 5.4 * u, cy2 - 5 * u);
    ctx.lineTo(x - 2.8 * u, cy2 - 2.6 * u);
    ctx.lineTo(x, cy2 - 6.4 * u);
    ctx.lineTo(x + 2.8 * u, cy2 - 2.6 * u);
    ctx.lineTo(x + 5.4 * u, cy2 - 5 * u);
    ctx.lineTo(x + 5 * u, cy2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const [gx, gy2, c] of [[-5.4, -5, '#fff6fa'], [0, -6.4, '#fff6fa'], [5.4, -5, '#fff6fa'], [0, -1.6, '#ff4a7a'], [-3, -1.4, '#7ad8e8'], [3, -1.4, '#7ad8e8']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + gx * u, cy2 + gy2 * u, u * 0.75, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    const gl = (t * 0.5) % 2;
    if (gl < 1) twinkle(ctx, x - 2 * u, cy2 - 4 * u, u * 2 * Math.sin(Math.PI * gl), 1, '#fffbe0');
  }
  ctx.restore();
}
// Confetti bursting up out of the floor as the cake rises.
function confetti(ctx, x, gy, H, u0) {
  for (let i = 0; i < 28; i++) {
    const v = clamp(u0 * 1.3 - hash(i + 40) * 0.3, 0, 1);
    if (v <= 0 || v >= 1) continue;
    const an = -Math.PI / 2 + (hash(i + 7) - 0.5) * 2.2;
    const d = ease(v) * H * (0.3 + hash(i + 11) * 0.4);
    ctx.save();
    ctx.translate(x + Math.cos(an) * d, gy - H * 0.2 + Math.sin(an) * d + v * v * H * 0.35);
    ctx.rotate(v * 12 + i);
    ctx.globalAlpha = 1 - v * v;
    ctx.fillStyle = SPRINKLES[i % 6];
    ctx.fillRect(-1.6, -0.9, 3.2, 1.8);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Under her: the cake (behind her, so her spoon and hands pass in front of it), and its confetti.
function bonbonUnder(ctx, m, a, S, matOf, K, H) {
  if ((a.bbCake ?? 0) > 0.01) drawCake(ctx, H * 0.6, 0, H, a.bbCake, a.bbCut, a.t);
  if ((a.bbConfetti ?? -1) >= 0) confetti(ctx, H * 0.6, 0, H, a.bbConfetti);
}

function bonbonFx(ctx, m, a, S, matOf, K, H) {
  if (m?.hp <= 0) return;
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const crownM = matOf('crown');
  ctx.save();
  // the candles' flames (blown out on her wish, lit again one by one, each with a sparkle)
  const lit = a.bbCandles ?? 4;
  for (let i = 0; i < 4; i++) {
    const [x, y] = K.through(crownM, `flame${i}`, 'crownJ');
    if (i >= lit) {
      // a curl of smoke rising
      const u = (a.t * 0.8 + i * 0.3) % 1;
      ctx.globalAlpha = 0.5 * (1 - u);
      ctx.strokeStyle = '#c8c4d4';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 2, y - 3 - u * 4, x - 1, y - 6 - u * 6);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }
    flame(ctx, x, y, 0.9, a.t, i * 1.7);
    const rl = a.bbRelight ?? -1;
    if (i === lit - 1 && rl >= 0 && rl < 0.6) twinkle(ctx, x, y - 3, 4 * (1 - rl / 0.6), 1 - rl / 0.6, '#fff6c8');
  }
  const [mx, my] = K.through(matOf('headJ'), 'mouthB', 'neck');
  // her wish: soft puffs of breath rising toward the candles
  if ((a.bbBlow ?? 0) > 0.05) {
    for (let i = 0; i < 3; i++) {
      const u = (a.t * 2.4 + i / 3) % 1;
      ctx.globalAlpha = a.bbBlow * (1 - u) * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(mx + 2 + u * 3, my - 3 - u * 10, 1 + u * 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // a shine on the cherry now and then
  {
    const [cx, cy] = K.through(crownM, 'cherryJ', 'crownJ');
    const u = ((a.t + (m.uid % 5) * 0.7) % 3.6) / 0.5;
    if (u < 1) twinkle(ctx, cx - 1.2, cy - 1.4, 2.4 * Math.sin(Math.PI * u), 1);
  }
  // her laugh: sparkles and little hearts bubbling up beside her face
  if ((a.bbLaugh ?? 0) > 0.05) {
    for (let i = 0; i < 4; i++) {
      const u = (a.t * 0.9 + i / 4) % 1;
      const x = mx - 10 - hash(i) * 6 + Math.sin(u * 5 + i) * 2;
      const y = my - 4 - u * 18;
      if (i % 2) heartFx(ctx, x, y, 1.4, a.bbLaugh * Math.sin(Math.PI * u));
      else twinkle(ctx, x, y, 2.2 * Math.sin(Math.PI * u), a.bbLaugh, '#fff6c8');
    }
  }
  // her taste: a dab of cream at her lips, hearts floating up
  if ((a.bbTaste ?? 0) > 0.3) {
    cream(ctx, mx + 2, my - 0.4, 0.9, a.bbTaste);
    twinkle(ctx, mx + 4, my - 3, 1.6 * a.bbTaste, a.bbTaste, '#fff6c8');
    for (let i = 0; i < 3; i++) {
      const u = (a.t * 0.7 + i / 3) % 1;
      heartFx(ctx, mx + 6 + Math.sin(u * 6 + i) * 2, my - 8 - u * 14, 1.6 * (0.6 + u * 0.4), a.bbTaste * Math.sin(Math.PI * u));
    }
  }
  // the slice of cake on her palm
  if ((a.bbSlice ?? 0) > 0.05) {
    const [hx, hy] = K.through(matOf('handF'), 'handF', 'wrF');
    cakeSlice(ctx, hx + 1, hy - 1, 0.9, Math.min(1, a.bbSlice * 1.6));
  }
  // her curtsy: a shimmer of sparkles round her
  if ((a.bbCurtsy ?? 0) > 0.05) {
    for (let i = 0; i < 6; i++) {
      const u = (a.t * 0.8 + i / 6) % 1;
      twinkle(ctx, (hash(i + 20) - 0.5) * H * 0.8, -H * (0.2 + hash(i + 30) * 0.7) - u * 6, 2 * Math.sin(Math.PI * u), a.bbCurtsy, '#ffe4f0');
    }
  }
  // her twirl: sprinkles flung off her hem all round
  if ((a.bbTwirl ?? 0) > 0.05) {
    for (let i = 0; i < 16; i++) {
      const u = (a.t * 1.3 + hash(i)) % 1;
      const side = i % 2 ? 1 : -1;
      const x = side * (H * 0.32 + ease(u) * H * 0.22);
      const y = -H * 0.06 - Math.sin(Math.PI * u) * H * 0.16 + u * H * 0.04;
      sprinkle(ctx, x, y, a.t * 6 + i, 1.4, SPRINKLES[i % 6], a.bbTwirl * (1 - u));
    }
  }
  const bowl = K.through(matOf('spoon'), 'bowlJ', 'spoonJ');
  // the chop: a splash of cream where the spoon bites into the cake
  const ch = a.bbChop ?? -1;
  if (ch >= 0 && ch < 1) {
    for (let i = 0; i < 8; i++) {
      const an = -Math.PI * 0.95 + (i / 7) * Math.PI * 0.9;
      const d = 3 + ease(ch) * (9 + hash(i + 3) * 8);
      cream(ctx, bowl[0] + Math.cos(an) * d, bowl[1] + Math.sin(an) * d + ch * ch * 10, 1.5 * (1 - ch * 0.5), 1 - ch);
    }
    twinkle(ctx, bowl[0], bowl[1] - 5, 5 * (1 - ch), 1 - ch, '#fff6c8');
  }
  // the BONK: a splash of cream off the bowl as it lands
  if (mv?.bonk) {
    const u = (t - mv.bonk[0]) / 0.45;
    if (u >= 0 && u < 1) {
      for (let i = 0; i < 7; i++) {
        const an = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9;
        const d = 3 + ease(u) * (8 + hash(i) * 7);
        cream(ctx, bowl[0] + Math.cos(an) * d, bowl[1] + Math.sin(an) * d + u * u * 8, 1.4 * (1 - u * 0.5), 1 - u);
      }
      twinkle(ctx, bowl[0], bowl[1] - 4, 4 * (1 - u), 1 - u, '#fff6c8');
    }
  }
  // the sweep: cream flung off the bowl along its arc
  if (mv?.fling) {
    const [t0, t1] = mv.fling;
    if (t >= t0 && t < t1 + 0.4) {
      for (let i = 0; i < 5; i++) {
        const v = clamp((t - t0 - i * 0.05) / 0.5, 0, 1);
        if (v <= 0 || v >= 1) continue;
        cream(ctx, bowl[0] + v * 16 + i * 2, bowl[1] - 4 + v * v * 14 - i, 1.2, 1 - v);
      }
    }
  }
  // the Sugar Bomb: a great dollop of frosting with a cherry, flung up off the spoon and away
  const sc = a.bbScoop ?? -1;
  if (sc >= 0 && sc < 1) {
    const x = bowl[0] + ease(sc) * H * 0.5;
    const y = bowl[1] - Math.sin(Math.PI * Math.min(1, sc * 1.1)) * H * 0.9 - sc * H * 0.3;
    cream(ctx, x, y, 4.4, 1);
    cream(ctx, x - 2.4, y + 1.6, 3, 1);
    cream(ctx, x + 2.6, y + 1.4, 2.8, 1);
    berry(ctx, x, y - 4.4, 2);
    for (let i = 0; i < 4; i++) sprinkle(ctx, x + (hash(i) - 0.5) * 8, y + (hash(i + 4) - 0.5) * 6, i, 1.2, SPRINKLES[i], 1);
  }
  // Sprinkle Rain: sprinkles bursting up from her hands to the sky
  const bs = a.bbBurst ?? -1;
  if (bs >= 0) {
    for (const hand of ['handN', 'handF']) {
      const [hx, hy] = K.through(matOf(hand), hand, hand === 'handN' ? 'wrN' : 'wrF');
      for (let i = 0; i < 10; i++) {
        const v = clamp(bs * 1.4 - (i % 3) * 0.1, 0, 1);
        if (v <= 0) continue;
        const an = -Math.PI / 2 + (hash(i + (hand === 'handN' ? 0 : 9)) - 0.5) * 1.4;
        const d = ease(v) * H * (0.6 + hash(i) * 0.6);
        sprinkle(ctx, hx + Math.cos(an) * d, hy + Math.sin(an) * d, an + i, 1.3, SPRINKLES[i % 6], 1 - v * 0.7);
      }
    }
  }
  ctx.restore();
}

const R = bonbonRig({
  design: bonbonDesign,
  skin: SKIN_COLORS,
  J: {
    sheetJ: SHEET_ROOT, drillFJ: DRILL_F, drillNJ: DRILL_N, sideFJ: SIDE_F, sideNJ: SIDE_N, crownJ: CROWN_ROOT, skirtJ: SKIRT_ROOT, tierMidJ: TIER_MID, tierLowJ: TIER_LOW,
    spoonJ: SPOON_GRIP, bowlJ: SPOON_BOWL, mouthB: MOUTH, cherryJ: [CROWN_ROOT[0], CROWN_ROOT[1] - 9],
    flame0: FLAMES[0], flame1: FLAMES[1], flame2: FLAMES[2], flame3: FLAMES[3],
  },
  fx: bonbonFx,
  under: bonbonUnder,
});
// (drawn big, for a boss: about the old Walking Cake's height)
const BIG = 118 / R.H;
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
export const BONBON_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true };
export const BONBON_SIZE = { w: Math.round(46 * BIG), h: Math.round(R.H * 0.92 * BIG) };
