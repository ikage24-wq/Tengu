// The Mirror Twins, final art (2026-11-28; drawn from scratch after the concept, the player: "concept is
// just place holder"): Dame Rondo and Dame Minuet, twin ghost ladies who dance as each other's reflection,
// Rondo on the ballroom floor and Minuet upside down on the ceiling, step for step. Each on its own dressed
// copy of the blank bases' rig (rig.js) on the maiden's tall, graceful build (body.js); heads painted in
// head.js. One design in opposite colours:
//   Rondo   midnight black and white. A satin tailcoat bodice: wide satin lapels stitched along their
//           edges over a pleated white shirt front, a wing collar and a black bow, a folded pocket square,
//           a silver-blue sash with her badge, a little silver metronome. Long black sleeves with white
//           cuffs and silver links, white gloves. A black gown in soft gores that parts at the front over
//           a pleated white underskirt, its edges turned back in satin; behind her the two long tails of
//           her tailcoat. Pointed black dancing shoes.
//   Minuet  snow white and lilac with black. A lilac bodice laced criss-cross in black ribbon, white lace
//           standing up along a sweetheart neckline, a black ribbon at her throat with a little bat charm.
//           A short capelet over each shoulder cut like a bat's wing (ribs, scalloped hem). Long black opera
//           gloves. A gown of soft gores whose hem is cut in bat-wing scallops trimmed in black, under an
//           open overskirt parting at the front, scalloped again. Lilac slippers with bat-wing bows.
// m.ceiling: drawn upside down about the ceiling she stands on (Minuet in the fight).
import { dressRig } from './rig.js';
import { TWIN_ARTS } from './arts.js';
import { drawHeadBack, drawHeadFront, G as HG } from './head.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const ease = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
function smooth(ctx, pts) {
  ctx.beginPath();
  const n = pts.length;
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  ctx.moveTo(...mid(0));
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(...pts[i % n], ...mid(i));
  ctx.closePath();
}
const rgbaOf = (hex, al) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${al})`;
};
const flashed = (a, c) => {
  const f = clamp((a.flash ?? 0) * 6, 0, 0.85);
  if (f <= 0.01 || c[0] !== '#') return c;
  const n = parseInt(c.slice(1), 16);
  const m = (v) => Math.round(v + (255 - v) * f);
  return `rgb(${m((n >> 16) & 255)},${m((n >> 8) & 255)},${m(n & 255)})`;
};
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.01 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgbaOf(col, al));
  g.addColorStop(1, rgbaOf(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const line = (ctx, pts, col, w) => {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  if (pts.length === 3) ctx.quadraticCurveTo(...pts[1], ...pts[2]);
  else for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
};

const LOOK = {
  rondo: {
    ink: '#2e2a48',
    skin: ['#f6f8ff', '#e2e8f8', '#c6d0ec', '#a8b4dc'],
    satin: ['#55558a', '#33335a', '#22223c', '#14142a'],
    white: ['#ffffff', '#f3f4fb', '#dfe2f1', '#bec4e0'],
    sheen: '#9aa6e6',
    sash: ['#c8d4ff', '#8ea0e0', '#5e70b4'],
    silver: ['#ffffff', '#dfe4f4', '#9aa2c8'],
    shoe: ['#3c3c5e', '#1c1c30'],
    aura: '#c8d4ff',
  },
  minuet: {
    ink: '#4a3c70',
    skin: ['#fff8fe', '#f4e4f6', '#e0c8ea', '#c4a8da'],
    gown: ['#ffffff', '#efe6fc', '#d6c6f2', '#b09ce0'],
    lilac: ['#f2e2fc', '#d8b8f0', '#b48ade', '#8a62c0'],
    black: ['#5a4a82', '#3a2e5a', '#261e40', '#16122a'],
    sheen: '#ffffff',
    shoe: ['#ead2f6', '#bc9ad8'],
    aura: '#ffd6f2',
  },
};
// (the twins are drawn 1.7 times their base's size, BIG below; their lines are thinned to match, so
// their outlines are as fine on screen as the other bosses')
const BIGK = 1.7;
const LW = 2 / BIGK;
const paint = (ctx, a, mode, col, ink, w = LW) => {
  if (mode === 'line') {
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink;
    ctx.stroke();
  } else {
    ctx.fillStyle = typeof col === 'string' ? flashed(a, col) : col;
    ctx.fill();
  }
};
// A bone's frame in the base's kid-box units, and a kid-box point on a bone in the rig's own space.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
const bodyPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
};
function spring(st, key, goal, k, c, dt) {
  const v = (st[key + 'V'] ?? 0) + ((goal - (st[key] ?? goal)) * k - (st[key + 'V'] ?? 0) * c) * dt;
  st[key + 'V'] = v;
  st[key] = (st[key] ?? goal) + v * dt;
  return st[key];
}

function makeTwin(who) {
  const L = LOOK[who];
  const INK = L.ink;
  const R1 = who === 'rondo';

  // ---------- Head ----------
  const HCX = 80.7;
  const HCY = 47.8;
  const HS = 1.26;
  function head(ctx, a, mode, D, part) {
    ctx.save();
    enter(ctx, a, D, 'head');
    const n = D.J.neck;
    ctx.translate(n[0], n[1]);
    ctx.scale(HS, HS);
    ctx.translate(-n[0], -n[1]);
    ctx.translate(HCX, HCY);
    ctx.scale(HG, HG);
    const q = a.tw ?? {};
    const flash = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    if (part === 'back') drawHeadBack(ctx, who, a, mode, q, flash);
    else drawHeadFront(ctx, who, a, mode, q, flash);
    ctx.restore();
  }

  // ---------- The gown, in gores: each panel hangs from her waist to the floor, its hem point led by
  // the nearer leg and lagging on a spring, so the whole skirt swings and folds as she dances ----------
  const GORES = 8;
  function gown(a, D) {
    const st = a.mo?.rig ?? {};
    // (from the true waist, never the hips: no strip of bodice and no hip corner between them)
    const wl = ptOf(a, D, 'torso', [71.2, 86.8]);
    const wr = ptOf(a, D, 'torso', [90.2, 86.8]);
    const af = ptOf(a, D, 'shinF', [75.7, 140.3]);
    const an = ptOf(a, D, 'shinN', [84.3, 140.3]);
    const floorY = Math.max(af[1], an[1]) + 0.8;
    const cx = (af[0] + an[0]) / 2;
    const hw = 14 + Math.abs(af[0] - an[0]) * 0.3 + (a.twBell ?? 0) * 1.2;
    const waist = [];
    const hem = [];
    for (let i = 0; i <= GORES; i++) {
      const u = i / GORES;
      waist.push([mix(wl[0], wr[0], u), mix(wl[1], wr[1], u) + Math.sin(u * Math.PI) * 0.8]);
      // (each point leans after the nearer ankle, and swings on its own lagging spring)
      const lead = u < 0.5 ? af[0] - cx : an[0] - cx;
      const sw = st[`twG${i}`] ?? 0;
      hem.push([cx + (u - 0.5) * 2 * hw + lead * 0.35 * Math.sin(u * Math.PI) + sw, floorY + Math.sin(u * Math.PI) * 0.6]);
    }
    return { waist, hem, floorY, cx, hw, top: (wl[1] + wr[1]) / 2 };
  }
  // the gown's side edges: soft curves out over the hips and in a little toward the floor
  function sideEdge(ctx, w, h, sd) {
    ctx.bezierCurveTo(w[0] + sd * 7.4, mix(w[1], h[1], 0.22), h[0] - sd * 0.6, mix(w[1], h[1], 0.7), h[0], h[1]);
  }
  // a hem edge between two hem points: Rondo's a soft wave, Minuet's a bat-wing scallop
  function hemEdge(ctx, p0, p1, kind) {
    if (kind === 'bat') ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 2.6, p1[0], p1[1]);
    else ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 1.4, p1[0], p1[1]);
  }
  // one gore's own shape (for its fill and folds)
  function gorePath(ctx, g, i, drop = 0, kind = 'wave') {
    const a0 = g.waist[i];
    const a1 = g.waist[i + 1];
    const b0 = [g.hem[i][0], g.hem[i][1] + drop];
    const b1 = [g.hem[i + 1][0], g.hem[i + 1][1] + drop];
    ctx.beginPath();
    ctx.moveTo(...a0);
    ctx.quadraticCurveTo(mix(a0[0], b0[0], 0.5) + (i === 0 ? -7.4 : 0), mix(a0[1], b0[1], 0.5), b0[0], b0[1]);
    hemEdge(ctx, b0, b1, kind);
    ctx.quadraticCurveTo(mix(a1[0], b1[0], 0.5) + (i === GORES - 1 ? 7.4 : 0), mix(a1[1], b1[1], 0.5), a1[0], a1[1]);
    ctx.closePath();
  }
  // the whole silhouette of gores i0..i1 (for the outline)
  function spanPath(ctx, g, i0, i1, drop = 0, kind = 'wave') {
    ctx.beginPath();
    ctx.moveTo(...g.waist[i0]);
    const h0 = [g.hem[i0][0], g.hem[i0][1] + drop];
    if (i0 === 0) sideEdge(ctx, g.waist[0], h0, -1);
    else ctx.quadraticCurveTo(mix(g.waist[i0][0], h0[0], 0.5), mix(g.waist[i0][1], h0[1], 0.5), ...h0);
    for (let i = i0; i < i1; i++) hemEdge(ctx, [g.hem[i][0], g.hem[i][1] + drop], [g.hem[i + 1][0], g.hem[i + 1][1] + drop], kind);
    const h1 = [g.hem[i1][0], g.hem[i1][1] + drop];
    if (i1 === GORES) {
      ctx.bezierCurveTo(h1[0] - 0.6, mix(g.waist[i1][1], h1[1], 0.72), g.waist[i1][0] + 7.4, mix(g.waist[i1][1], h1[1], 0.22), ...g.waist[i1]);
    } else ctx.quadraticCurveTo(mix(g.waist[i1][0], h1[0], 0.5), mix(g.waist[i1][1], h1[1], 0.5), ...g.waist[i1]);
    for (let i = i1 - 1; i > i0; i--) ctx.lineTo(...g.waist[i]);
    ctx.closePath();
  }
  // a gore's fill: lit toward its middle (the fold's crest), deep along its seams; a satin highlight
  // running down the crest
  function fillGore(ctx, a, g, i, cols, kind) {
    gorePath(ctx, g, i, 0, kind);
    const x0 = (g.waist[i][0] + g.hem[i][0]) / 2;
    const x1 = (g.waist[i + 1][0] + g.hem[i + 1][0]) / 2;
    const side = (i + 0.5) / GORES;
    const lit = 1 - Math.abs(side - 0.4) * 1.6;
    const gr = ctx.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, flashed(a, cols[3]));
    gr.addColorStop(0.45, flashed(a, lit > 0.5 ? cols[0] : cols[1]));
    gr.addColorStop(0.62, flashed(a, cols[1]));
    gr.addColorStop(1, flashed(a, cols[2]));
    ctx.fillStyle = gr;
    ctx.fill();
    // the crest's sheen, brightest high on the hip and fading down
    const c0 = [mix(g.waist[i][0], g.waist[i + 1][0], 0.45), mix(g.waist[i][1], g.waist[i + 1][1], 0.45) + 3];
    const c1 = [mix(g.hem[i][0], g.hem[i + 1][0], 0.45), g.floorY - 2];
    const sg = ctx.createLinearGradient(0, c0[1], 0, c1[1]);
    sg.addColorStop(0, rgbaOf(R1 ? L.sheen : '#ffffff', 0.5 * Math.max(0.2, lit)));
    sg.addColorStop(1, rgbaOf(R1 ? L.sheen : '#ffffff', 0.05));
    line(ctx, [c0, [mix(c0[0], c1[0], 0.5) + 0.4, mix(c0[1], c1[1], 0.5)], c1], sg, 0.9);
  }
  // The waistband over the join of bodice and skirt (both passes): a band along the skirt's top edge.
  function waistband(ctx, a, mode, D) {
    const g = gown(a, D);
    const W = g.waist;
    const up = W.map(([x, y]) => [x, y - 0.7]);
    const dn = W.map(([x, y]) => [x, y + 0.75]);
    const band = () => {
      ctx.beginPath();
      ctx.moveTo(up[0][0] - 0.4, up[0][1]);
      for (const p of up.slice(1)) ctx.lineTo(...p);
      ctx.lineTo(up[up.length - 1][0] + 0.4, up[up.length - 1][1]);
      for (const p of dn.slice().reverse()) ctx.lineTo(...p);
      ctx.closePath();
    };
    band();
    paint(ctx, a, mode, R1 ? L.sash[1] : L.black[1], INK);
    if (mode !== 'fill') return;
    line(ctx, W.map(([x, y]) => [x, y - 0.35]), rgbaOf(R1 ? L.sash[0] : '#a890e0', 0.8), 0.25);
    line(ctx, W.map(([x, y]) => [x, y + 0.45]), rgbaOf(R1 ? L.sash[2] : L.black[3], 0.8), 0.25);
    const c = W[GORES / 2];
    if (R1) {
      // her badge: a little silver metronome, its pendulum ticking
      ctx.beginPath();
      ctx.moveTo(c[0] - 0.75, c[1] + 1.1);
      ctx.lineTo(c[0] + 0.75, c[1] + 1.1);
      ctx.lineTo(c[0] + 0.32, c[1] - 1.4);
      ctx.lineTo(c[0] - 0.32, c[1] - 1.4);
      ctx.closePath();
      const mg = ctx.createLinearGradient(c[0] - 0.8, 0, c[0] + 0.8, 0);
      mg.addColorStop(0, flashed(a, L.silver[2]));
      mg.addColorStop(0.4, flashed(a, L.silver[0]));
      mg.addColorStop(1, flashed(a, L.silver[1]));
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = flashed(a, '#6a74a8');
      ctx.lineWidth = 0.15;
      ctx.stroke();
      line(ctx, [[c[0], c[1] + 0.8], [c[0] + Math.sin((a.t ?? 0) * 3.3) * 0.45, c[1] - 1.1]], flashed(a, '#3a4278'), 0.16);
    } else {
      // its bow: two loops, two short tails, a round knot
      for (const sd of [-1, 1]) {
        ell(ctx, c[0] + sd * 0.95, c[1] - 0.1, 0.95, 0.6, sd * 0.4);
        ctx.fillStyle = flashed(a, L.black[1]);
        ctx.fill();
        line(ctx, [[c[0], c[1] + 0.2], [c[0] + sd * 0.7, c[1] + 1.7]], flashed(a, L.black[2]), 0.32);
      }
      ell(ctx, c[0], c[1], 0.42, 0.42);
      ctx.fillStyle = flashed(a, L.black[0]);
      ctx.fill();
    }
  }
  function skirt(ctx, a, mode, D) {
    const g = gown(a, D);
    if (R1) {
      // the pleated white underskirt, longer, showing where the black parts at the front
      spanPath(ctx, g, 3, 5, 1.4);
      paint(ctx, a, mode, L.white[1], INK);
      if (mode === 'fill') {
        ctx.save();
        spanPath(ctx, g, 3, 5, 1.4);
        ctx.clip();
        const ug = ctx.createLinearGradient(g.hem[3][0], 0, g.hem[5][0], 0);
        ug.addColorStop(0, flashed(a, L.white[3]));
        ug.addColorStop(0.5, flashed(a, L.white[0]));
        ug.addColorStop(1, flashed(a, L.white[2]));
        ctx.fillStyle = ug;
        ctx.fillRect(g.cx - g.hw, g.top - 2, g.hw * 2, g.floorY - g.top + 6);
        // knife pleats: a fine shade line and a lit edge beside each
        for (let k = 0; k <= 8; k++) {
          const u = k / 8;
          const x0 = mix(g.waist[3][0], g.waist[5][0], u);
          const x1 = mix(g.hem[3][0], g.hem[5][0], u);
          line(ctx, [[x0, g.top + 1], [x1, g.floorY + 1.4]], rgbaOf(L.white[3], 0.7), 0.4);
          line(ctx, [[x0 + 0.5, g.top + 1], [x1 + 0.6, g.floorY + 1.4]], 'rgba(255,255,255,0.9)', 0.25);
        }
        ctx.restore();
      }
      // the black satin gown in two halves, parting at the front, each edge turned back in satin
      for (const [i0, i1] of [[0, 3], [5, GORES]]) {
        spanPath(ctx, g, i0, i1, 0);
        paint(ctx, a, mode, L.satin[2], INK);
        if (mode !== 'fill') continue;
        ctx.save();
        spanPath(ctx, g, i0, i1, 0);
        ctx.clip();
        for (let i = i0; i < i1; i++) fillGore(ctx, a, g, i, L.satin, 'wave');
        // the turned-back edge at the parting: a strip of lighter satin catching the light
        const e = i0 === 0 ? 3 : 5;
        const sd = i0 === 0 ? -1 : 1;
        line(ctx, [[g.waist[e][0] + sd * 0.6, g.waist[e][1] + 1], [mix(g.waist[e][0], g.hem[e][0], 0.5) + sd * 0.9, mix(g.top, g.floorY, 0.5)], [g.hem[e][0] + sd * 1.2, g.floorY - 0.6]], flashed(a, L.satin[0]), 1.8);
        line(ctx, [[g.waist[e][0] + sd * 0.4, g.waist[e][1] + 2], [mix(g.waist[e][0], g.hem[e][0], 0.5) + sd * 0.6, mix(g.top, g.floorY, 0.5)], [g.hem[e][0] + sd * 0.8, g.floorY - 1]], rgbaOf(L.sheen, 0.6), 0.5);
        // the hem deepening, with a faint cool glow along it: a ghost's
        const hg = ctx.createLinearGradient(0, g.floorY - 9, 0, g.floorY + 2);
        hg.addColorStop(0, rgbaOf(L.satin[3], 0));
        hg.addColorStop(0.7, rgbaOf(L.satin[3], 0.5));
        hg.addColorStop(1, rgbaOf('#c8d4ff', 0.35));
        ctx.fillStyle = hg;
        ctx.fillRect(g.cx - g.hw - 6, g.floorY - 9, g.hw * 2 + 12, 12);
        ctx.restore();
      }
    } else {
      // the gown to the floor, its hem cut in bat-wing scallops trimmed in black ribbon, a white lace
      // frill peeking under it
      if (mode === 'fill') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(...g.hem[0]);
        for (let i = 0; i < GORES; i++) {
          const p0 = g.hem[i];
          const p1 = g.hem[i + 1];
          ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 1.2, p1[0], p1[1] + 0.4);
        }
        ctx.lineTo(g.hem[GORES][0], g.hem[GORES][1] - 4);
        ctx.lineTo(g.hem[0][0], g.hem[0][1] - 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
        ctx.strokeStyle = rgbaOf(L.gown[3], 0.55);
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.restore();
      }
      spanPath(ctx, g, 0, GORES, 0, 'bat');
      paint(ctx, a, mode, L.gown[1], INK);
      if (mode === 'fill') {
        ctx.save();
        spanPath(ctx, g, 0, GORES, 0, 'bat');
        ctx.clip();
        for (let i = 0; i < GORES; i++) fillGore(ctx, a, g, i, L.lilac, 'bat');
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(...g.hem[0]);
        for (let i = 0; i < GORES; i++) hemEdge(ctx, g.hem[i], g.hem[i + 1], 'bat');
        ctx.strokeStyle = flashed(a, L.black[1]);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      // the open overskirt: two white panels from her waist to mid-thigh, parting at the front, swept
      // back toward her hips; their hems scalloped like bat wings; a soft shadow under them
      const my = mix(g.top, g.floorY, 0.5);
      for (const sd of [-1, 1]) {
        const i0 = sd < 0 ? 0 : 5;
        const i1 = sd < 0 ? 3 : GORES;
        const panel = {
          waist: g.waist,
          hem: g.hem.map(([x, y], i) => {
            const u = i / GORES;
            const open = sd < 0 ? ease((u - 0.1) / 0.28) : ease((0.9 - u) / 0.28);
            return [mix(x, g.cx + (u - 0.5) * 2 * g.hw * 0.94, 0.4), my + 4 - open * 8 + (i % 2) * 0.6];
          }),
          floorY: my + 4,
          cx: g.cx,
          hw: g.hw,
          top: g.top,
        };
        if (mode === 'fill') {
          ctx.save();
          spanPath(ctx, g, 0, GORES, 0, 'bat');
          ctx.clip();
          const h0 = panel.hem[i0];
          const h1 = panel.hem[i1];
          glow(ctx, (h0[0] + h1[0]) / 2, (h0[1] + h1[1]) / 2 + 3, g.hw * 0.6, L.lilac[3], 0.4);
          ctx.restore();
        }
        spanPath(ctx, panel, i0, i1, 0, 'bat');
        paint(ctx, a, mode, L.gown[0], INK);
        if (mode !== 'fill') continue;
        ctx.save();
        spanPath(ctx, panel, i0, i1, 0, 'bat');
        ctx.clip();
        for (let i = i0; i < i1; i++) fillGore(ctx, a, panel, i, L.gown, 'bat');
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(...panel.hem[i0]);
        for (let i = i0; i < i1; i++) hemEdge(ctx, panel.hem[i], panel.hem[i + 1], 'bat');
        ctx.strokeStyle = flashed(a, L.black[1]);
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    }
  }
  // Rondo's tailcoat tails: two broad satin flaps hung from the back of her waist, their outer edges
  // flaring past the gown's back edge into two long points, lined in white, swinging after her steps.
  function tails(ctx, a, mode, D) {
    if (!R1) return;
    const g = gown(a, D);
    const swing = (a.twTails ?? 0) * 4;
    for (const sd of [1, -1]) {
      const root = [g.waist[0][0] + 3, g.top + 1];
      const out = sd > 0 ? 1.2 : 2.8;
      const tip = [g.hem[0][0] - out + swing, g.floorY - (sd > 0 ? 4 : 1)];
      const wide = [mix(root[0], tip[0], 0.55) - 0.8 + swing * 0.5, mix(root[1], tip[1], 0.55)];
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(...root);
        ctx.quadraticCurveTo(wide[0] - 1.6, wide[1] - 6, wide[0], wide[1]);
        ctx.quadraticCurveTo(tip[0] - 0.6, mix(wide[1], tip[1], 0.6), tip[0], tip[1]);
        ctx.quadraticCurveTo(tip[0] + 5, tip[1] - 6, wide[0] + 7, wide[1] + 2);
        ctx.quadraticCurveTo(root[0] + 5, mix(root[1], wide[1], 0.4), root[0] + 6, root[1]);
        ctx.closePath();
      };
      path();
      paint(ctx, a, mode, sd > 0 ? L.satin[2] : L.satin[3], INK);
      if (mode !== 'fill') continue;
      ctx.save();
      path();
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(...root);
      ctx.quadraticCurveTo(wide[0] - 1.6, wide[1] - 6, wide[0], wide[1]);
      ctx.quadraticCurveTo(tip[0] - 0.6, mix(wide[1], tip[1], 0.6), tip[0], tip[1]);
      ctx.strokeStyle = flashed(a, L.white[sd > 0 ? 0 : 2]);
      ctx.lineWidth = 2.4;
      ctx.stroke();
      line(ctx, [[root[0] + 2, root[1] + 2], [wide[0] + 3, wide[1]], [tip[0] + 1.6, tip[1] - 2]], rgbaOf(L.sheen, 0.45), 0.9);
      ctx.restore();
    }
  }
  // A ghost's faint glow round her, first in the outline pass, so it lies under every outline and fill.
  function aura(ctx, a, D) {
    const c = ptOf(a, D, 'chest', [80.7, 82]);
    const r = 42;
    const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    g.addColorStop(0, rgbaOf(L.aura, 0.32));
    g.addColorStop(0.6, rgbaOf(L.aura, 0.16));
    g.addColorStop(1, rgbaOf(L.aura, 0));
    ctx.fillStyle = g;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  }

  // ---------- The bodice (over the torso, locked to it: clipped to its outline this frame) ----------
  function bodice(ctx, a, mode, S, D) {
    if (mode === 'line' || !a.blTorsoPts) {
      skirt(ctx, a, mode, D);
      waistband(ctx, a, mode, D);
      return;
    }
    ctx.save();
    bodyPath(ctx, a);
    ctx.clip();
    ctx.fillStyle = flashed(a, R1 ? L.satin[2] : L.lilac[1]);
    ctx.fillRect(-500, -500, 1000, 1000);
    ctx.save();
    enter(ctx, a, D, 'chest');
    // (the light from the upper right: the bodice deepening toward her far side)
    const bg = ctx.createLinearGradient(62, 0, 100, 0);
    bg.addColorStop(0, rgbaOf(R1 ? L.satin[3] : L.lilac[3], 0.75));
    bg.addColorStop(0.45, rgbaOf(R1 ? L.satin[2] : L.lilac[1], 0));
    bg.addColorStop(0.8, rgbaOf(R1 ? L.satin[0] : '#ffffff', 0.35));
    bg.addColorStop(1, rgbaOf(R1 ? L.satin[3] : L.lilac[3], 0.4));
    ctx.fillStyle = bg;
    ctx.fillRect(50, 50, 62, 50);
    if (R1) rondoBodice(ctx, a);
    else minuetBodice(ctx, a);
    ctx.restore();
    ctx.restore();
    skirt(ctx, a, mode, D);
    waistband(ctx, a, mode, D);
  }
  // the figure under the bodice: the cloth rounding over the bust, light on its upper curve, a soft shade
  // where it turns under, a soft valley between
  function bust(ctx, a, cols, lightCol) {
    for (const sd of [-1, 1]) {
      const bx = 80.7 + sd * 4.4;
      ctx.save();
      ctx.translate(bx, 78.4);
      ctx.scale(1, 0.42);
      glow(ctx, 0, 0, 4.6, cols, 0.32);
      ctx.restore();
      ctx.save();
      ctx.translate(bx - sd * 0.4, 74.6);
      ctx.scale(1, 0.75);
      glow(ctx, 0, 0, 3.6, lightCol, 0.4);
      ctx.restore();
    }
  }
  function rondoBodice(ctx, a) {
    const cx = 80.7;
    // the shirt front, pleated, its pleats a fine shade with a lit edge
    ctx.beginPath();
    ctx.moveTo(cx - 5.2, 64);
    ctx.lineTo(cx + 5.2, 64);
    ctx.lineTo(cx + 0.6, 88);
    ctx.lineTo(cx - 0.6, 88);
    ctx.closePath();
    const sg = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
    sg.addColorStop(0, flashed(a, L.white[2]));
    sg.addColorStop(0.6, flashed(a, L.white[0]));
    sg.addColorStop(1, flashed(a, L.white[1]));
    ctx.fillStyle = sg;
    ctx.fill();
    for (const dx of [-2.6, -1.2, 0, 1.2, 2.6]) {
      line(ctx, [[cx + dx, 66], [cx + dx * 0.25, 86]], rgbaOf(L.white[3], 0.75), 0.28);
      line(ctx, [[cx + dx + 0.35, 66], [cx + dx * 0.25 + 0.3, 86]], 'rgba(255,255,255,0.95)', 0.2);
    }
    glow(ctx, cx, 66.8, 3.6, L.white[3], 0.55);
    // the satin lapels, folded back wide either side of it, stitched along their edges, a sheen down each
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sd * 4.8, 64);
      ctx.lineTo(cx + sd * 9.8, 66.6);
      ctx.quadraticCurveTo(cx + sd * 8.6, 70.4, cx + sd * 7.2, 74);
      ctx.lineTo(cx + sd * 1.4, 87.4);
      ctx.lineTo(cx + sd * 2.4, 79);
      ctx.closePath();
      const lg = ctx.createLinearGradient(cx + sd * 2, 0, cx + sd * 9.6, 0);
      lg.addColorStop(0, flashed(a, sd > 0 ? L.satin[0] : L.satin[1]));
      lg.addColorStop(1, flashed(a, L.satin[2]));
      ctx.fillStyle = lg;
      ctx.fill();
      line(ctx, [[cx + sd * 5.4, 65], [cx + sd * 6.6, 72.4], [cx + sd * 2.6, 84]], rgbaOf(L.sheen, sd > 0 ? 0.65 : 0.35), 0.45);
      ctx.setLineDash([0.7, 0.55]);
      line(ctx, [[cx + sd * 8.8, 66.8], [cx + sd * 6.5, 73.8], [cx + sd * 1.9, 85.6]], rgbaOf(L.sheen, 0.55), 0.22);
      ctx.setLineDash([]);
      // the jacket's front edge curving away below the lapel to the waist, and the seam down its side
      line(ctx, [[cx + sd * 1.4, 87.4], [cx + sd * 4, 88.6], [cx + sd * 9, 88.4]], rgbaOf(L.satin[3], 0.9), 0.5);
      line(ctx, [[cx + sd * 11, 70], [cx + sd * 8.6, 80], [cx + sd * 9.6, 87]], rgbaOf(L.satin[3], 0.85), 0.5);
      line(ctx, [[cx + sd * 11 + 0.5, 70], [cx + sd * 8.6 + 0.5, 80], [cx + sd * 9.6 + 0.5, 87]], rgbaOf(L.sheen, 0.25), 0.3);
    }
    glow(ctx, 90.6, 78, 6, L.satin[0], 0.45);
    bust(ctx, a, L.satin[3], '#9aa6e6');
    // the folded pocket square at her breast pocket: three crisp peaks, a pocket welt under it
    ctx.beginPath();
    ctx.moveTo(85.2, 75.8);
    ctx.lineTo(86, 73.4);
    ctx.lineTo(86.9, 75.1);
    ctx.lineTo(87.8, 72.8);
    ctx.lineTo(88.7, 75);
    ctx.lineTo(89.3, 73.9);
    ctx.lineTo(89.8, 75.8);
    ctx.closePath();
    ctx.fillStyle = flashed(a, L.white[0]);
    ctx.fill();
    ctx.strokeStyle = rgbaOf(L.white[3], 0.8);
    ctx.lineWidth = 0.18;
    ctx.stroke();
    line(ctx, [[84.8, 76], [90.2, 76]], rgbaOf(L.satin[3], 0.9), 0.5);
    line(ctx, [[84.8, 76.5], [90.2, 76.5]], rgbaOf(L.sheen, 0.4), 0.25);
  }
  function minuetBodice(ctx, a) {
    const cx = 80.7;
    // princess seams curving to the waist, a satin light down each side panel
    for (const sd of [-1, 1]) {
      line(ctx, [[cx + sd * 6.6, 69.6], [cx + sd * 5, 79], [cx + sd * 6, 88]], rgbaOf(L.lilac[3], 0.7), 0.45);
      line(ctx, [[cx + sd * 4, 70.4], [cx + sd * 3.4, 79], [cx + sd * 4.2, 86.6]], 'rgba(255,255,255,0.8)', 0.6);
    }
    glow(ctx, 85, 74, 8, '#ffffff', 0.6);
    bust(ctx, a, L.lilac[3], '#ffffff');
    // the lacing: two black ribbons crossing down her front, each crossing lit where it turns over
    for (const ph of [0, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const y = 70.4 + i * 2.9;
        const x = cx + ((i + ph) % 2 ? 2.1 : -2.1);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = flashed(a, L.black[ph ? 2 : 1]);
      ctx.lineWidth = 0.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) line(ctx, [[cx - 0.5, 71.6 + i * 2.9], [cx + 0.5, 72.2 + i * 2.9]], 'rgba(210,190,255,0.7)', 0.3);
    // the sweetheart neckline edged in black, and white lace standing up along it: one soft scalloped
    // edge, a fine thread pattern inside
    const neck = (u) => [mix(69.6, 91.8, u), 68 - Math.sin(u * Math.PI * 2) ** 2 * 1.4 + Math.exp(-(((u - 0.5) / 0.08) ** 2)) * 1.4];
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const p = neck(k / 20);
      if (k) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    const lace = [];
    for (let k = 0; k <= 12; k++) lace.push(neck(k / 12));
    for (let k = lace.length - 1; k > 0; k--) {
      const p0 = lace[k];
      const p1 = lace[k - 1];
      ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, Math.min(p0[1], p1[1]) - 2.2, p1[0], p1[1] - 0.6);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.strokeStyle = rgbaOf(L.lilac[3], 0.55);
    ctx.lineWidth = 0.2;
    ctx.stroke();
    for (let k = 1; k < 12; k++) {
      const p = lace[k];
      line(ctx, [[p[0], p[1] - 0.2], [p[0], p[1] - 1.4]], rgbaOf(L.lilac[3], 0.4), 0.18);
    }
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const p = neck(k / 20);
      if (k) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.strokeStyle = flashed(a, L.black[1]);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // ---------- Sleeves ----------
  function sleeve(ctx, a, mode, D, side) {
    const sh = a.blShapes?.[`arm${side}`];
    if (!sh) return;
    if (R1) rondoSleeve(ctx, a, mode, D, side, sh);
    else minuetSleeve(ctx, a, mode, D, side, sh);
  }
  function rondoSleeve(ctx, a, mode, D, side, sh) {
    const n = sh.pts.length;
    // the long fitted satin sleeve, the whole arm
    ctx.beginPath();
    D.skin.tubePath(ctx, sh.pts, sh.wl.map((w) => w + 0.7));
    paint(ctx, a, mode, side === 'F' ? L.satin[3] : L.satin[2], INK);
    if (mode !== 'fill') return;
    ctx.save();
    ctx.beginPath();
    D.skin.tubePath(ctx, sh.pts, sh.wl.map((w) => w + 0.7));
    ctx.clip();
    // a satin sheen down its lit side, soft folds where it bends at the elbow
    line(ctx, sh.pts.slice(1, Math.max(3, n - 3)).map(([x, y]) => [x + 0.5, y]), rgbaOf(L.sheen, side === 'N' ? 0.45 : 0.25), 0.9);
    const e = sh.el;
    for (const k of [-1.5, 0, 1.5]) line(ctx, [[e[0] - 1.8, e[1] + k - 0.4], [e[0], e[1] + k + 0.4], [e[0] + 1.8, e[1] + k - 0.2]], rgbaOf(L.satin[3], 0.8), 0.38);
    ctx.restore();
    // the white cuff at her wrist: a neat band round the end of the sleeve, square to the arm, a fold
    // along it and a silver link (never a round blob)
    const W = sh.pts[n - 1];
    const Pb = sh.pts[Math.max(0, n - 4)];
    const ang = Math.atan2(W[1] - Pb[1], W[0] - Pb[0]);
    const hw = sh.wl[n - 1] / 2 + 0.4;
    ctx.save();
    ctx.translate(W[0], W[1]);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.roundRect(-1.9, -hw, 1.9, hw * 2, 0.45);
    ctx.fillStyle = flashed(a, L.white[side === 'F' ? 2 : 1]);
    ctx.fill();
    ctx.strokeStyle = rgbaOf(L.white[3], 0.9);
    ctx.lineWidth = 0.3;
    ctx.stroke();
    line(ctx, [[-1.1, -hw + 0.3], [-1.1, hw - 0.3]], rgbaOf(L.white[3], 0.5), 0.2);
    line(ctx, [[-1.7, -hw + 0.35], [-0.2, -hw + 0.35]], 'rgba(255,255,255,0.9)', 0.25);
    ell(ctx, -0.6, hw * 0.35, 0.42, 0.42);
    ctx.fillStyle = flashed(a, L.silver[1]);
    ctx.fill();
    ell(ctx, -0.72, hw * 0.35 - 0.13, 0.14, 0.12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  function minuetSleeve(ctx, a, mode, D, side, sh) {
    const n = sh.pts.length;
    // the long black opera glove, from just below the elbow
    const k0 = Math.max(1, Math.round(n * 0.52));
    ctx.beginPath();
    D.skin.tubePath(ctx, sh.pts.slice(k0, n), sh.wl.slice(k0, n).map((w) => w + 0.6));
    paint(ctx, a, mode, side === 'F' ? L.black[3] : L.black[2], INK);
    if (mode === 'fill') {
      // its satin sheen, and a little scalloped turn-back at its top
      line(ctx, sh.pts.slice(k0, n - 1).map(([x, y]) => [x + 0.5, y]), rgbaOf('#a890e0', side === 'N' ? 0.55 : 0.3), 0.7);
      const tp = sh.pts[k0];
      ell(ctx, tp[0], tp[1], sh.wl[k0] / 2 + 1, 1.4, Math.atan2(sh.pts[k0 + 1][1] - tp[1], sh.pts[k0 + 1][0] - tp[0]) + Math.PI / 2);
      ctx.fillStyle = flashed(a, L.black[1]);
      ctx.fill();
    }
    // the puff over the shoulder, cut like a bat's wing: built rigid in the upper arm's own frame (down the
    // arm and across it), so it turns with the arm and never folds over itself as the arm bends; a round
    // dome over the shoulder, full sides, its hem in three bat-wing points, two ribs, edged inside
    const c = sh.sh;
    const ud = [sh.el[0] - c[0], sh.el[1] - c[1]];
    const ul = Math.hypot(...ud) || 1;
    const u = [ud[0] / ul, ud[1] / ul];
    const v = [-u[1], u[0]];
    const P = (du, dv) => [c[0] + u[0] * du + v[0] * dv, c[1] + u[1] * du + v[1] * dv];
    const r = sh.ball + 1.5;
    const lp = ul * 0.56;
    const wp = r + 0.9;
    const puff = () => {
      ctx.beginPath();
      ctx.moveTo(...P(0, r));
      ctx.bezierCurveTo(...P(lp * 0.35, wp * 1.12), ...P(lp * 0.8, wp * 1.05), ...P(lp, wp * 0.92));
      // the hem: three points, each scallop curving back up toward the shoulder between them
      const hp = [-wp * 0.92, -wp * 0.3, wp * 0.3, wp * 0.92];
      const hu = [lp, lp + 0.9, lp + 0.9, lp];
      for (let i = 3; i > 0; i--) {
        const m = (hp[i] + hp[i - 1]) / 2;
        ctx.quadraticCurveTo(...P((hu[i] + hu[i - 1]) / 2 - 2.2, m), ...P(hu[i - 1], hp[i - 1]));
      }
      ctx.bezierCurveTo(...P(lp * 0.8, -wp * 1.05), ...P(lp * 0.35, -wp * 1.12), ...P(0, -r));
      const a0 = Math.atan2(-v[1], -v[0]);
      ctx.arc(c[0], c[1], r, a0, a0 + Math.PI, true);
      ctx.closePath();
    };
    // (the arc runs from -v round the back of the shoulder (-u) to +v)
    puff();
    paint(ctx, a, mode, side === 'F' ? L.gown[2] : L.gown[0], INK);
    if (mode !== 'fill') return;
    ctx.save();
    puff();
    ctx.clip();
    glow(ctx, ...P(-r * 0.2, -r * 0.15), r * 1.3, '#ffffff', side === 'N' ? 0.9 : 0.6);
    glow(ctx, ...P(lp, 0), wp * 0.9, L.lilac[2], 0.45);
    for (const k of [-0.3, 0.3]) line(ctx, [P(-r * 0.3, k * r * 0.6), P(lp * 0.55, k * wp * 1.1), P(lp + 0.4, k * wp)], rgbaOf(L.lilac[3], 0.5), 0.45);
    // (the hem edged in black, inside the outline only)
    ctx.beginPath();
    const hp = [-wp * 0.92, -wp * 0.3, wp * 0.3, wp * 0.92];
    const hu = [lp, lp + 0.9, lp + 0.9, lp];
    ctx.moveTo(...P(hu[3], hp[3]));
    for (let i = 3; i > 0; i--) ctx.quadraticCurveTo(...P((hu[i] + hu[i - 1]) / 2 - 2.2, (hp[i] + hp[i - 1]) / 2), ...P(hu[i - 1], hp[i - 1]));
    ctx.strokeStyle = flashed(a, L.black[1]);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }
  // ---------- The shoulder: one smooth cap over the shoulder corner, the arm's round and the upper arm, as
  // Lady Marigold's (the player: "look how Marigold was polished all of it, and do it to them"): built from
  // fixed points that only move smoothly, drawn in even steps, so sleeve and jacket are one shoulder that
  // never notches or pops as the arm swings. Rondo's in her satin; Minuet's shoulders are under her
  // capelet. ----------
  const nearestAt = (pts, p) => {
    let best = 0;
    let bd = Infinity;
    pts.forEach((q, i) => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  function shoulderCap(ctx, a, mode, D, side) {
    if (!R1) return;
    const sh = a.blShapes?.[`arm${side}`];
    if (!sh) return;
    // (her shoulder cap: from a point on her shoulder line toward her neck, the two lines tangent to the
    // round at the top of her arm and the round itself, as one shape, so shoulder and arm always make one
    // smooth curve however the arm swings; never a notch where the arm's round meets the shoulder)
    const neck = ptOf(a, D, 'chest', [80.7, 64.4]);
    const sd = Math.sign(sh.sh[0] - neck[0]) || 1;
    const P = ptOf(a, D, 'chest', [80.7 + sd * 5.8, 66.6]);
    const c = sh.sh;
    const r = sh.ball + 0.4;
    // (one smooth shoulder: the outline round her shoulder corner, the round at the top of her arm and her
    // upper arm down to the sleeve's band, so body and arm are a single shape however the arm swings: no
    // gap under it where the hair behind shows, no dip where the arm's round meets the corner)
    const i0 = nearestAt(sh.pts, [mix(sh.sh[0], sh.el[0], 0.62), mix(sh.sh[1], sh.el[1], 0.62)]);
    const pts0 = [P, ...Array.from({ length: 24 }, (_, i) => [c[0] + Math.cos((i / 24) * TAU) * r, c[1] + Math.sin((i / 24) * TAU) * r])];
    // (every point here moves smoothly with her, so the shape never pops: her body's edge read at fixed
    // heights, her arm sampled at fixed shares of its length; with the arm hanging, down to the armpit so
    // no gap shows under it; lifted, only the shoulder's round, so no web reaches up to it from her side)
    const lift = clamp((c[1] + r * 2 - sh.el[1]) / (r * 3), 0, 1);
    // (her body's edge round this shoulder: fixed points of her outline, from beside her neck down to her
    // armpit, picked in her rest shape so the same points are used every frame. With the arm lifted the
    // lower ones draw in to the shoulder's round, so no web reaches up to it from her side)
    const body = a.blTorsoPts ?? [];
    const rest = a.blTorsoRest ?? [];
    const spec = a.blTorsoSpec;
    let armpitB = null;
    let armpitA = null;
    if (spec && rest.length === body.length) {
      const rcx = spec.cx;
      const [rsy, rsw] = [spec.shoulder.y, spec.shoulder.w];
      const rnw = spec.shoulder.neckW;
      const pitY = rsy + spec.arm.aw0 * 0.95;
      const rsd = side === 'N' ? 1 : -1;
      let lowY = -Infinity;
      for (let i = 0; i < rest.length; i++) {
        const [rx, ry] = rest[i];
        if (rsd * (rx - rcx) < rnw * 1.4 || ry > pitY || ry < rsy - rsw) continue;
        const e = clamp((ry - rsy) / (pitY - rsy), 0, 1);
        const w = lift * e * e * (3 - 2 * e);
        const p = [mix(body[i][0], c[0], w), mix(body[i][1], c[1], w)];
        pts0.push(p);
        if (ry > lowY) {
          lowY = ry;
          armpitB = p;
        }
      }
    }
    const Ls = [0];
    for (let i = 1; i < sh.pts.length; i++) Ls.push(Ls[i - 1] + Math.hypot(sh.pts[i][0] - sh.pts[i - 1][0], sh.pts[i][1] - sh.pts[i - 1][1]));
    const reach = Math.hypot(sh.el[0] - c[0], sh.el[1] - c[1]) * 0.7;
    const along = (d) => {
      let i = 1;
      while (i < Ls.length - 1 && Ls[i] < d) i++;
      const u = clamp((d - Ls[i - 1]) / Math.max(1e-6, Ls[i] - Ls[i - 1]), 0, 1);
      const p0 = sh.pts[i - 1];
      const p1 = sh.pts[i];
      const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
      return { p: [mix(p0[0], p1[0], u), mix(p0[1], p1[1], u)], n: [-(p1[1] - p0[1]) / l, (p1[0] - p0[0]) / l], w: mix(sh.wl[i - 1], sh.wl[i], u) };
    };
    for (let k = 0; k <= 6; k++) {
      const { p, n, w } = along((reach * k) / 6);
      const hw = w / 2 + 0.4;
      const e1 = [p[0] + n[0] * hw, p[1] + n[1] * hw];
      const e2 = [p[0] - n[0] * hw, p[1] - n[1] * hw];
      pts0.push(e1, e2);
      if (k === 6) armpitA = sd * (e1[0] - neck[0]) < sd * (e2[0] - neck[0]) ? e1 : e2;
    }
    // (their convex hull, one smooth shape)
    const hull = (() => {
      const ps = pts0.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]);
      const cross = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
      const lo = [];
      for (const q of ps) {
        while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
        lo.push(q);
      }
      const up = [];
      for (const q of ps.slice().reverse()) {
        while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
        up.push(q);
      }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    })();
    // (wound the same way as the arm's tube discs, so the clip fills as one)
    let area = 0;
    for (let i = 0; i < hull.length; i++) area += hull[i][0] * hull[(i + 1) % hull.length][1] - hull[(i + 1) % hull.length][0] * hull[i][1];
    const capPts = area >= 0 ? hull : hull.slice().reverse();
    // (the armpit: where her arm's inner edge meets her side, the edge between them curves in toward the
    // shoulder joint, a soft hollow, so the arm reads as growing out of her body; it deepens as the arm
    // opens away from her side and fades to nothing as it closes, so it never pops)
    const gap = armpitA && armpitB ? sd * (armpitA[0] - armpitB[0]) : 0;
    // (and it fades out before any other point of the shape comes near the line between armpit and side,
    // so it is gone before those two stop being neighbours on the outline: no pop)
    let clear = 0;
    if (armpitA && armpitB) {
      const ex = armpitB[0] - armpitA[0];
      const ey = armpitB[1] - armpitA[1];
      const el = Math.hypot(ex, ey) || 1;
      const side = (p) => (ex * (p[1] - armpitA[1]) - ey * (p[0] - armpitA[0])) / el;
      const inner = Math.sign(side(c)) || 1;
      let worst = -Infinity;
      for (const p of pts0) if (p !== armpitA && p !== armpitB) worst = Math.max(worst, -inner * side(p));
      clear = clamp(-worst / 1.4, 0, 1);
    }
    const hollow = clamp(gap / (r * 1.6), 0, 1) * 0.55 * clear;
    const mid = armpitA && armpitB ? [(armpitA[0] + armpitB[0]) / 2, (armpitA[1] + armpitB[1]) / 2] : null;
    const ctrl = mid ? [mix(mid[0], c[0], hollow), mix(mid[1], c[1], hollow)] : null;
    // (the outline as a closed line, the armpit's hollow curved in)
    const ring = [capPts[0]];
    for (let i = 1; i <= capPts.length; i++) {
      const p0 = capPts[i - 1];
      const q = capPts[i % capPts.length];
      const pit = ctrl && hollow > 0.01 && ((p0 === armpitA && q === armpitB) || (p0 === armpitB && q === armpitA));
      if (pit) for (let k = 1; k <= 8; k++) {
        const u = k / 8;
        ring.push([(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * ctrl[0] + u * u * q[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * ctrl[1] + u * u * q[1]]);
      }
      else ring.push(q);
    }
    // (then walked at a fixed number of even steps from where a line straight up from the shoulder joint
    // crosses it, so the corners the hull happens to have this frame never change what is drawn)
    const seg = [];
    let per = 0;
    let start = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      if ((x0 - c[0]) * (x1 - c[0]) <= 0 && x0 !== x1) {
        const u = (c[0] - x0) / (x1 - x0);
        if (y0 + (y1 - y0) * u < c[1]) start = per + Math.hypot(x1 - x0, y1 - y0) * u;
      }
      seg.push(per);
      per += Math.hypot(x1 - x0, y1 - y0);
    }
    const N = 72;
    const even = [];
    let j = 0;
    for (let k = 0; k < N; k++) {
      const d = (start + (per * k) / N) % per;
      while (j > 0 && seg[j] > d) j--;
      while (j < seg.length - 1 && seg[j + 1] <= d) j++;
      const l = (seg[j + 1] ?? per) - seg[j] || 1;
      const u = (d - seg[j]) / l;
      even.push([mix(ring[j][0], ring[j + 1][0], u), mix(ring[j][1], ring[j + 1][1], u)]);
    }
    const cap = () => {
      ctx.moveTo(...even[0]);
      for (let k = 1; k < N; k++) ctx.lineTo(...even[k]);
      ctx.closePath();
    };
    if (mode === 'line') {
      ctx.beginPath();
      cap();
      ctx.lineWidth = LW;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.stroke();
      return;
    }
    const pts = sh.pts.slice(0, i0 + 3);
    const wl = sh.wl.slice(0, i0 + 3).map((w) => w + 0.5);
    ctx.save();
    D.skin.tubePath(ctx, pts, wl);
    cap();
    ctx.clip('nonzero');
    // (her satin, as the sleeve and jacket are: deeper on the far side, a sheen down the near one's top)
    ctx.fillStyle = flashed(a, side === 'F' ? L.satin[3] : L.satin[2]);
    ctx.fillRect(c[0] - 30, c[1] - 30, 60, 60);
    glow(ctx, c[0] - 0.4, c[1] - r * 0.5, r * 1.2, L.satin[0], side === 'N' ? 0.55 : 0.25);
    // (the armpit's soft crease, just inside its hollow)
    if (ctrl && hollow > 0.01) {
      const g = ctx.createLinearGradient(armpitB[0], armpitB[1], armpitA[0], armpitA[1]);
      g.addColorStop(0, rgbaOf(L.satin[3], 0));
      g.addColorStop(0.45, rgbaOf(L.satin[3], 0.9 * (hollow / 0.55)));
      g.addColorStop(1, rgbaOf(L.satin[3], 0));
      ctx.beginPath();
      ctx.moveTo(...armpitB);
      ctx.quadraticCurveTo(mix(ctrl[0], c[0], 0.2), mix(ctrl[1], c[1], 0.2), ...armpitA);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Gloves (over the hand: its own round and thumb, snug) ----------
  // ---------- Hands: every finger rigged (the player, 2026-11-28: "rig every finger"; the standard for
  // every character with fingers). Each digit has its own curl (0 straight .. 1 folded into the palm) and
  // the hand its spread; a pose picks a named hand shape and every finger eases to it on its own spring,
  // the little finger first, so a hand closes in a quick ripple with a light bounce and never snaps.
  // Order: thumb, index, middle, ring, little.
  const HAND_SHAPES = {
    relaxed: { c: [0.25, 0.15, 0.2, 0.26, 0.34], s: 0 },
    open: { c: [0, 0, 0, 0, 0], s: 1 },
    fist: { c: [1, 1, 1, 1, 1], s: -0.4 },
    point: { c: [0.85, 0, 1, 1, 1], s: -0.2 },
    clasp: { c: [0.4, 0.42, 0.48, 0.54, 0.6], s: -0.35 },
    limp: { c: [0.15, 0.3, 0.35, 0.4, 0.45], s: 0.25 },
  };
  // (`posed`: the hands the pose asks for: a fight idle's moment, an attack, a mechanic)
  function handTargets(m, a, walk, dead, posed) {
    const test = m.handTest;
    if (test) return typeof test === 'string' ? { F: test, N: test } : test;
    if (m.hands) return m.hands;
    if (dead) return { F: 'limp', N: 'limp' };
    if ((a.hurtAgo ?? 9) < 0.5) return { F: 'open', N: 'open' };
    if (posed) return posed;
    if (walk > 0.5) return { F: 'relaxed', N: 'relaxed' };
    // (idle: Rondo counts the beat with one raised finger; Minuet's hands are clasped by her cheek)
    return R1 ? { F: 'relaxed', N: 'point' } : { F: 'clasp', N: 'clasp' };
  }
  function handRig(m, a, st, dt, walk, dead, beat, posed) {
    const tg = handTargets(m, a, walk, dead, posed);
    const out = {};
    for (const side of ['F', 'N']) {
      const sh = HAND_SHAPES[tg[side]] ?? HAND_SHAPES.relaxed;
      const c = [];
      for (let i = 0; i < 5; i++) {
        let goal = sh.c[i];
        // (Rondo's counting finger taps the beat)
        if (R1 && side === 'N' && i === 1 && tg[side] === 'point') goal += Math.max(0, Math.sin(beat * 2)) * 0.3;
        // (the little finger leads, the thumb last: a ripple as the hand closes or opens)
        const k = i === 0 ? 60 : 64 + i * 12;
        c.push(clamp(spring(st, `twH${side}${i}`, goal, k, 2 * Math.sqrt(k) * 0.72, dt), -0.05, 1.05));
      }
      out[side] = { c, s: spring(st, `twHs${side}`, sh.s, 120, 2 * Math.sqrt(120) * 0.75, dt) };
    }
    a.twHands = out;
  }
  // One finger, from its knuckle: two joints that fold into the palm (seen from the back of the hand, so
  // as it curls it foreshortens to a round knuckle; past a right angle its tip is hidden under the hand),
  // a gentle curve through its middle curl, a round tip. Built as one closed outline.
  function digit(ctx, kx, ky0, ang, len, w0, w1, curl) {
    const x0 = kx - Math.sin(ang) * w0 * 0.45;
    const y0 = ky0 - Math.cos(ang) * w0 * 0.45;
    const th1 = curl * 1.4;
    const th2 = th1 + curl * 1.65;
    const seg1 = len * 0.55 * Math.cos(th1);
    const seg2 = len * 0.45 * Math.cos(th2);
    // (its root starts inside the hand, under the back of the hand, so no round end shows at the knuckle)
    const root = w0 * 0.45;
    const ext = root + Math.max(w0 * 0.8, seg1 + Math.max(0, seg2));
    // (curled, its end is the folded middle joint seen end on: as wide as the finger)
    const wt = mix(w1, w0 * 0.98, clamp(curl * 1.3, 0, 1));
    const dx = Math.sin(ang);
    const dy = Math.cos(ang);
    const nx = dy;
    const ny = -dx;
    const bendK = 0.08 + 0.22 * Math.sin(clamp(curl, 0, 1) * Math.PI);
    const pts = [];
    const N = 10;
    const along = (u, sd) => {
      const w = mix(w0, wt, u) / 2;
      const bend = u * u * ext * bendK;
      return [x0 + dx * ext * u - nx * bend + nx * w * sd, y0 + dy * ext * u - ny * bend + ny * w * sd];
    };
    for (let i = 0; i <= N; i++) pts.push(along(i / N, 1));
    const tip = [x0 + dx * ext - nx * ext * bendK, y0 + dy * ext - ny * ext * bendK];
    const ta = Math.atan2(ny, nx);
    for (let i = 1; i < 12; i++) {
      const t = ta + (Math.PI * i) / 12;
      pts.push([tip[0] + (Math.cos(t) * wt) / 2, tip[1] + (Math.sin(t) * wt) / 2]);
    }
    for (let i = N; i >= 0; i--) pts.push(along(i / N, -1));
    const ba = ta + Math.PI;
    for (let i = 1; i < 12; i++) {
      const t = ba + (Math.PI * i) / 12;
      pts.push([x0 + (Math.cos(t) * w0) / 2, y0 + (Math.sin(t) * w0) / 2]);
    }
    ctx.moveTo(...pts[0]);
    for (const p of pts.slice(1)) ctx.lineTo(...p);
    ctx.closePath();
    const sm = root + Math.max(0, seg1) * 0.98;
    return { tip, ext, dx, dy, mid: [x0 + dx * sm, y0 + dy * sm] };
  }
  // fingers (index toward the thumb at +x): where each sits on the knuckle line, its length, width, fan
  const DIGITS = [
    { x: 0.47, len: 0.78, w: 0.41, ang: 0.07 },
    { x: 0.16, len: 0.86, w: 0.42, ang: 0.02 },
    { x: -0.16, len: 0.8, w: 0.42, ang: -0.03 },
    { x: -0.48, len: 0.64, w: 0.39, ang: -0.1 },
  ];
  function glove(ctx, a, mode, side) {
    const hs = a.blShapes?.[`hand${side}`];
    if (!hs) return;
    const hd = a.twHands?.[side] ?? { c: HAND_SHAPES.relaxed.c, s: 0 };
    ctx.save();
    ctx.transform(...hs.M);
    const [cx, cy] = hs.c;
    const r = hs.r * 1.04;
    const sp = hd.s;
    const ky = cy + r * 0.05;
    const fist = clamp((hd.c[1] + hd.c[2] + hd.c[3] + hd.c[4]) / 4, 0, 1);
    const palm = () => {
      // (the back of the hand: a fist's knuckle line rounds out a little)
      const kb = r * (0.08 + fist * 0.08);
      ctx.moveTo(cx - r * 0.5, cy - r * 0.92);
      ctx.bezierCurveTo(cx - r * 0.72, cy - r * 0.6, cx - r * 0.76, cy - r * 0.15, cx - r * 0.64, ky - r * 0.02);
      ctx.quadraticCurveTo(cx, ky + kb, cx + r * 0.64, ky - r * 0.02);
      ctx.bezierCurveTo(cx + r * 0.76, cy - r * 0.15, cx + r * 0.68, cy - r * 0.62, cx + r * 0.5, cy - r * 0.92);
      ctx.closePath();
    };
    const fingerAt = (i) => {
      const f = DIGITS[i];
      return { x: cx + f.x * r * (1 + sp * 0.12), y: ky - Math.abs(f.x) * r * 0.08, ang: f.ang * (1 + sp * 2.2) + sp * f.x * 0.25, len: f.len * r, w: f.w * r, curl: hd.c[i + 1] };
    };
    const finger = (i) => {
      const f = fingerAt(i);
      return digit(ctx, f.x, f.y, f.ang, f.len, f.w, f.w * 0.9, f.curl);
    };
    // the thumb: out to the side when open, along the hand when relaxed, tucked across the fingers in a fist
    const tc = hd.c[0];
    const thumb = () => digit(ctx, cx + r * 0.5, cy - r * 0.4, mix(0.75 + sp * 0.25, -0.55, clamp(tc, 0, 1)), r * 0.64 * (1 - tc * 0.12), r * 0.46, r * 0.4, tc * 0.35);
    // (drawn little finger first, so each finger lies over the one beyond it; then the thumb)
    // (the back of the hand over the roots of the fingers and thumb)
    const order = [3, 2, 1, 0];
    const pieces = [...order.map((i) => () => finger(i)), thumb, palm];
    const col = R1 ? (side === 'F' ? L.white[2] : L.white[0]) : side === 'F' ? L.black[3] : L.black[2];
    if (mode === 'line') {
      ctx.beginPath();
      for (const p of pieces) p();
      paint(ctx, a, mode, col, INK);
      ctx.restore();
      return;
    }
    const foldHex = R1 ? L.white[3] : '#0c0818';
    const fold = rgbaOf(foldHex, R1 ? 0.5 : 0.55);
    const shine = R1 ? 'rgba(255,255,255,0.7)' : 'rgba(190,170,240,0.16)';
    const knuckle = R1 ? '#ffffff' : '#b9a6f0';
    // each piece filled, then its own shading, so a finger folded over another stays its own
    for (let n = 0; n < pieces.length; n++) {
      ctx.beginPath();
      const info = pieces[n]();
      paint(ctx, a, mode, col, INK);
      ctx.save();
      ctx.beginPath();
      pieces[n]();
      ctx.clip();
      if (n === 5) {
        // (the light kept off the wrist, so the hand melts into the glove's cuff with no edge)
        glow(ctx, cx + r * 0.1, cy - r * 0.15, r * 0.7, '#ffffff', R1 ? 0.5 : 0.16);
        glow(ctx, cx - r * 0.7, cy + r * 0.2, r * 0.9, R1 ? L.white[3] : '#000000', R1 ? 0.45 : 0.35);
        // (the glove's three stitched lines down the back of the hand)
        if (R1) for (const k of [-0.26, 0, 0.26]) line(ctx, [[cx + k * r, cy - r * 0.78], [cx + k * r * 1.12, cy - r * 0.22]], rgbaOf(L.white[3], 0.35), r * 0.04);
        ctx.restore();
        continue;
      }
      const f = n < 4 ? fingerAt(order[n]) : null;
      const b0 = f ? [f.x, f.y] : [cx + r * 0.5, cy - r * 0.4];
      const w = f ? f.w : r * 0.46;
      const cu = f ? f.curl : tc;
      const nx = info.dy;
      const ny = -info.dx;
      // a soft shade along the finger's far edge (where it meets the next), a sheen down its lit side
      line(ctx, [[b0[0] - nx * w * 0.42, b0[1] - ny * w * 0.42], [info.tip[0] - nx * w * 0.4, info.tip[1] - ny * w * 0.4]], fold, r * 0.07);
      line(ctx, [[b0[0] + nx * w * 0.12 + info.dx * r * 0.08, b0[1] + ny * w * 0.12 + info.dy * r * 0.08], [mix(b0[0], info.tip[0], 0.75) + nx * w * 0.12, mix(b0[1], info.tip[1], 0.75) + ny * w * 0.12]], shine, r * 0.045);
      // the knuckle's light; and as it curls the folded middle joint catches the light too, a soft
      // crease across it
      glow(ctx, b0[0] + r * 0.03, b0[1] - r * 0.04, r * 0.16, knuckle, R1 ? 0.8 : 0.35);
      if (f && cu > 0.25) {
        const k = clamp((cu - 0.25) * 2, 0, 1);
        glow(ctx, info.tip[0] - info.dx * w * 0.2, info.tip[1] - info.dy * w * 0.2, w * 0.45, knuckle, (R1 ? 0.7 : 0.3) * k);
        line(ctx, [[info.mid[0] - nx * w * 0.35, info.mid[1] - ny * w * 0.35], [info.mid[0] + nx * w * 0.35, info.mid[1] + ny * w * 0.35]], rgbaOf(foldHex, 0.45 * k), r * 0.045);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // ---------- Shoes ----------
  function shoe(ctx, a, mode, D, side) {
    const fs0 = a.blShapes?.[`foot${side}`];
    if (!fs0) return;
    ctx.save();
    ctx.transform(...fs0.M);
    const c = fs0.pts.reduce((acc, p) => [acc[0] + p[0] / fs0.pts.length, acc[1] + p[1] / fs0.pts.length], [0, 0]);
    const pts = fs0.pts.map(([x, y]) => [c[0] + (x - c[0]) * 1.08, c[1] + (y - c[1]) * 1.1]);
    smooth(ctx, pts);
    paint(ctx, a, mode, side === 'F' ? L.shoe[1] : L.shoe[0], INK);
    if (mode === 'fill') {
      const tip = pts.reduce((b, p) => (p[0] > b[0] ? p : b), pts[0]);
      const bot = Math.max(...pts.map((p) => p[1]));
      ctx.save();
      smooth(ctx, pts);
      ctx.clip();
      const g = ctx.createLinearGradient(0, c[1] - 3, 0, bot);
      g.addColorStop(0, 'rgba(255,255,255,0.4)');
      g.addColorStop(0.6, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(c[0] - 20, c[1] - 10, 40, 20);
      glow(ctx, mix(c[0], tip[0], 0.6), c[1] - 0.8, 1.8, '#ffffff', 0.6);
      ctx.restore();
      if (!R1) {
        // a bat-wing bow on the toe
        const bx = mix(c[0], tip[0], 0.3);
        for (const sd of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(bx, c[1] - 1.2);
          ctx.quadraticCurveTo(bx + sd * 1.2, c[1] - 2.6, bx + sd * 2.4, c[1] - 1.8);
          ctx.quadraticCurveTo(bx + sd * 1.4, c[1] - 1.4, bx + sd * 1.6, c[1] - 0.6);
          ctx.quadraticCurveTo(bx + sd * 0.8, c[1] - 1, bx, c[1] - 1.2);
          ctx.fillStyle = flashed(a, L.black[1]);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  // ---------- The neck, shaded as Lady Marigold's: round, so deeper down both sides and lit down its
  // front, the jaw's soft shadow across its top; only where it rises above the body ----------
  function neckShade(ctx, a, mode, D) {
    const nk = a.blShapes?.neck;
    if (!nk || mode !== 'fill' || !nk.outline) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...nk.outline[0]);
    for (const q of nk.outline.slice(1)) ctx.lineTo(...q);
    ctx.closePath();
    ctx.clip('nonzero');
    const body = a.blTorsoPts;
    if (body) {
      ctx.beginPath();
      ctx.rect(-4000, -4000, 8000, 8000);
      ctx.moveTo(...body[0]);
      for (const p of body.slice(1)) ctx.lineTo(...p);
      ctx.closePath();
      ctx.clip('evenodd');
    }
    const M0 = ctx.getTransform();
    const n = nk.pts.length - 1;
    const top = nk.pts[n];
    const bot = nk.pts[0];
    const d = [top[0] - bot[0], top[1] - bot[1]];
    const Ld = Math.hypot(...d) || 1;
    const nx = -d[1] / Ld;
    const ny = d[0] / Ld;
    const side = (k, u) => {
      const i = Math.round(u * n);
      const p = nk.pts[i];
      return [p[0] + nx * nk.wl[i] * 0.5 * k, p[1] + ny * nk.wl[i] * 0.5 * k];
    };
    for (const k of [-1, 1]) {
      const a0 = side(k * 0.6, 0.3);
      const a1 = side(k * 0.62, 1);
      const g = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]);
      g.addColorStop(0, rgbaOf(L.skin[2], 0));
      g.addColorStop(0.35, rgbaOf(L.skin[3], k < 0 ? 0.6 : 0.4));
      g.addColorStop(1, rgbaOf(L.skin[3], k < 0 ? 0.6 : 0.4));
      ctx.save();
      ctx.filter = `blur(${(nk.wl[n] * 0.12 * Math.hypot(M0.a, M0.b)).toFixed(1)}px)`;
      line(ctx, [a0, side(k * 0.64, 0.62), a1], g, nk.wl[n] * 0.3);
      ctx.restore();
    }
    ctx.save();
    const chin = side(0, 0.82);
    ctx.translate(chin[0], chin[1]);
    ctx.scale(1, 0.55);
    glow(ctx, 0, 0, nk.wl[n] * 1.05, L.skin[3], 0.95);
    ctx.restore();
    ctx.restore();
  }
  // ---------- At the throat: Rondo's wing collar and black bow; Minuet's ribbon with a little bat ----------
  function throat(ctx, a, mode, D) {
    const nk = a.blShapes?.neck;
    if (!nk || mode !== 'fill') return;
    const i = Math.round((nk.pts.length - 1) * 0.18);
    const p = nk.pts[i];
    const q = nk.pts[Math.min(nk.pts.length - 1, i + 1)];
    const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const hw = nk.wl[i] / 2 + 0.25;
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(an + Math.PI / 2);
    // (x across the throat, y down it)
    if (R1) {
      ctx.fillStyle = flashed(a, L.white[0]);
      ctx.beginPath();
      ctx.moveTo(-hw, -1);
      ctx.lineTo(hw, -1);
      ctx.lineTo(hw, 0.8);
      ctx.lineTo(hw * 0.4, 1.4);
      ctx.lineTo(0, 0.6);
      ctx.lineTo(-hw * 0.4, 1.4);
      ctx.lineTo(-hw, 0.8);
      ctx.closePath();
      ctx.fill();
      line(ctx, [[-hw, -0.4], [hw, -0.4]], rgbaOf(L.white[3], 0.7), 0.25);
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 1.4);
        ctx.quadraticCurveTo(sd * 1.6, -0.4, sd * 3, 0);
        ctx.quadraticCurveTo(sd * 3.4, 1.6, sd * 3, 3);
        ctx.quadraticCurveTo(sd * 1.6, 3.2, 0, 1.6);
        const bg = ctx.createLinearGradient(0, 0, sd * 3, 0);
        bg.addColorStop(0, flashed(a, L.satin[3]));
        bg.addColorStop(1, flashed(a, sd > 0 ? L.satin[1] : L.satin[2]));
        ctx.fillStyle = bg;
        ctx.fill();
        line(ctx, [[sd * 0.8, 0.9], [sd * 2.4, 0.5]], rgbaOf(L.sheen, 0.6), 0.25);
      }
      ell(ctx, 0, 1.5, 0.9, 0.9);
      ctx.fillStyle = flashed(a, L.satin[2]);
      ctx.fill();
    } else {
      // (a fine white lace frill below the ribbon: one soft scalloped edge)
      const edgeY = (u) => 0.7 + 0.6 * u * (1 - u);
      ctx.beginPath();
      ctx.moveTo(-hw, edgeY(0));
      for (let k = 0; k <= 8; k++) ctx.lineTo(mix(-hw, hw, k / 8), edgeY(k / 8));
      for (let k = 8; k > 0; k--) {
        const um = (k - 0.5) / 8;
        ctx.quadraticCurveTo(mix(-hw, hw, um), edgeY(um) + 1.3, mix(-hw, hw, (k - 1) / 8), edgeY((k - 1) / 8) + 0.6);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.strokeStyle = rgbaOf(L.lilac[3], 0.5);
      ctx.lineWidth = 0.12;
      ctx.stroke();
      ctx.fillStyle = flashed(a, L.black[1]);
      ctx.fillRect(-hw, -0.6, hw * 2, 1.3);
      // (edged in lilac along its top and bottom)
      line(ctx, [[-hw, -0.55], [hw, -0.55]], rgbaOf(L.lilac[2], 0.9), 0.22);
      line(ctx, [[-hw, 0.65], [hw, 0.65]], rgbaOf(L.lilac[2], 0.9), 0.22);
      // the little bat charm: a round body and two scalloped wings, a pink jewel eye-less heart
      ctx.beginPath();
      ctx.moveTo(-2.6, 1.6);
      ctx.quadraticCurveTo(-1.7, 0.6, 0, 1.3);
      ctx.quadraticCurveTo(1.7, 0.6, 2.6, 1.6);
      ctx.quadraticCurveTo(1.7, 2.4, 1, 2.1);
      ctx.quadraticCurveTo(0, 3.1, -1, 2.1);
      ctx.quadraticCurveTo(-1.7, 2.4, -2.6, 1.6);
      ctx.fillStyle = flashed(a, L.black[2]);
      ctx.fill();
      ell(ctx, 0, 1.9, 0.5, 0.45);
      ctx.fillStyle = '#f2a0d8';
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Pose: a dancer's poise at rest, and her springs (the gown's gores, the tails, the jolt) ----
  function jolt(m, a, st, dt) {
    const walk = clamp(a.walkW ?? 0, 0, 1);
    const U = a[`tktwin_${who}U`] ?? 0;
    const prev = st.twJU ?? U;
    st.twJU = U;
    let kick = 0;
    if (walk > 0.25 && Math.floor(U * 2) !== Math.floor(prev * 2)) kick += 3 * walk;
    const hurt = a.hurtAgo ?? 9;
    if (hurt < (st.twJH ?? 9) - 0.02) kick += 5;
    st.twJH = hurt;
    st.twJV = (st.twJV ?? 0) + kick;
    return clamp(spring(st, 'twJ', 0, 170, 9.5, dt), -1, 1);
  }
  // ---------- Their acts (2026-11-28, the player: "do their animations before setting up the fight").
  // Out of a fight: Rondo counts the beat, Minuet sways with her hands clasped. In a fight each has her own
  // fight idle that never stands still (Rondo conducting, a hat tip, a foot tapping the tempo; Minuet
  // bouncing, peek-a-boo, a twirl); a basic attack each; and a pose for every mechanic of their fight,
  // eased in, held and eased out (m.cast + m.castPose, as Lady Marigold's). The hidden red eye (q.eye)
  // opens in Frozen Moment, Eyes on Me and Pas de Deux. ----------
  const e2 = (u) => {
    const v = clamp(u, 0, 1);
    return v * v * (3 - 2 * v);
  };
  const hold = (x, a0, a1, b0, b1) => (x <= a0 || x >= b1 ? 0 : x < a1 ? e2((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e2((b1 - x) / (b1 - b0)));
  // Each mechanic's pose at u (0..1 through its cast) and time t: { p: channels, face, hands, eye }
  // (the arm on her hidden eye's side, which lifts the hair from it: Rondo's near arm, Minuet's far one;
  // and the other)
  const HA = R1 ? 'N' : 'F';
  const OA = R1 ? 'F' : 'N';
  const arm = (side, sh, el) => ({ [`sh${side}`]: sh, [`el${side}`]: el });
  function castPose(name, u, t) {
    const beat = t * (TAU / 1.8);
    const k1 = e2(u / 0.3);
    switch (name) {
      // 1 Frozen Moment: her near hand sweeps up and lifts the hair from her hidden eye; the red eye opens;
      // her other hand thrusts out, palm forward: stop.
      case 'frozen': {
        const up = e2(u / 0.32);
        const thrust = e2((u - 0.55) / 0.2);
        return {
          // (the hair sweeps aside by itself, never a hand over the face: Rondo snaps her fingers out at her
          // side; Minuet's far hand stays at her cheek as she giggles)
          p: { ...(R1 ? arm('N', -30 - up * 70, -30 - up * 56) : arm('F', -40 - up * 20, -70 - up * 50)), ...arm(OA, 10 - thrust * 104, -60 + thrust * 52), head: -4 - up * 4 + thrust * 2, tilt: -2 * up + thrust * 5, x: thrust * 0.015 },
          face: u > 0.3 ? (R1 ? 'glare' : 'wicked') : R1 ? 'stern' : 'sly',
          hands: { [HA]: R1 ? (up > 0.5 && u < 0.4 ? 'point' : 'relaxed') : 'clasp', [OA]: thrust > 0.3 ? 'open' : 'relaxed' },
          eye: e2((u - 0.26) / 0.26),
        };
      }
      // 2 Change Partners!: a twirl, both arms reaching out to take a partner's hand, gliding round
      case 'swap': {
        const sp = Math.sin(u * TAU);
        return {
          p: { shN: -108 + sp * 10, elN: -20, shF: -74 - sp * 10, elF: -30, turnC: sp * 0.75, tilt: sp * 6, head: -6 + sp * 4, x: Math.sin(u * Math.PI) * 0.03, fxN: 0.12 * Math.sin(u * Math.PI), toeN: 30 * Math.sin(u * Math.PI) },
          face: R1 ? 'satisfied' : 'delight',
          hands: { N: 'open', F: 'relaxed' },
          eye: 0,
        };
      }
      // 3 Eyes on Me: both hands frame her face, she leans in, the red eye wide
      case 'gaze':
        return {
          // (Rondo: hands clasped behind her back, leaning in to stare; Minuet: hands clasped under her chin)
          p: R1 ? { shN: 34 * k1, elN: -64 * k1, shF: 30 * k1, elF: -60 * k1, tilt: k1 * 9, head: k1 * 6, x: k1 * 0.014 } : { shN: -40 - k1 * 8, elN: -60 - k1 * 60, shF: -36 - k1 * 6, elF: -70 - k1 * 46, tilt: k1 * 7, head: k1 * 5, x: k1 * 0.012 },
          face: R1 ? 'glare' : 'wicked',
          hands: { N: 'clasp', F: 'clasp' },
          eye: e2((u - 0.12) / 0.28),
        };
      // 4 Metronome (Rondo): her arm straight up, swinging side to side like a metronome's on the beat
      case 'metronome': {
        const sw = Math.sin(t * (TAU / 0.9));
        return {
          p: { shN: -168 + sw * 20 * k1, elN: -4, shF: 24, elF: -70, head: -6 + sw * 3, tilt: sw * 1.8 },
          face: 'counting',
          hands: { N: 'point', F: 'relaxed' },
          eye: 0,
        };
      }
      // 5 Conductor's Cue (Rondo): an open hand sweeps round, then she points the cue home
      case 'cue': {
        const sweep = e2(u / 0.6);
        const pt = e2((u - 0.6) / 0.14);
        return {
          p: { shN: 30 - sweep * 90 - pt * 32, elN: -40 + pt * 36, shF: 24, elF: -70, tilt: -4 + sweep * 4 + pt * 6, head: 2 - pt * 4, x: pt * 0.022 },
          face: 'stern',
          hands: { N: u < 0.6 ? 'open' : 'point', F: 'relaxed' },
          eye: 0,
        };
      }
      // 6 Boo! (Minuet): a giggle behind her hands, a duck down (she vanishes), then up she pops, arms flung
      // wide
      case 'boo': {
        const hide = hold(u, 0, 0.12, 0.38, 0.5);
        const duck = hold(u, 0.38, 0.5, 0.58, 0.66);
        const pop = e2((u - 0.6) / 0.1);
        return {
          p: { shN: -70 * hide - 150 * pop, elN: -140 * hide - 26 * pop, shF: -66 * hide - 140 * pop, elF: -136 * hide - 30 * pop, head: 8 * hide - 8 * pop, tilt: 3 * hide + 10 * duck - 4 * pop, drop: 0.12 * duck, hop: 0.03 * pop * Math.max(0, Math.sin(Math.min(1, (u - 0.6) / 0.25) * Math.PI)) },
          face: pop > 0.3 ? 'boo' : 'giggle',
          hands: pop > 0.3 ? { N: 'open', F: 'open' } : { N: 'clasp', F: 'clasp' },
          eye: 0,
        };
      }
      // 7 Rewind (Minuet): one finger raised, winding a circle backwards in the air, her other hand on her hip
      case 'rewind': {
        const an = -u * TAU * 1.5;
        return {
          p: { shN: -150 + Math.cos(an) * 18 * k1, elN: -20 + Math.sin(an) * 20 * k1, shF: 22, elF: -72, head: 4 + Math.sin(an) * 3, tilt: -2 + Math.cos(an) * 2 },
          face: 'sly',
          hands: { N: 'point', F: 'relaxed' },
          eye: 0,
        };
      }
      // 8 Mirror Step: a dance step, one arm curved over her head, the other out, her toe pointed
      case 'mirror': {
        const b = Math.sin(beat * 2);
        return {
          p: { shN: -168, elN: -26, shF: -82, elF: -10, fxN: 0.14 * k1, toeN: 30 * k1, tilt: -6 + b * 2, head: -8, drop: 0.02 * (1 + b) },
          face: R1 ? 'poised' : 'giggle',
          hands: { N: 'relaxed', F: 'relaxed' },
          eye: 0,
        };
      }
      // 9 Twin Bond: hands to her heart, then one reaching out to her sister
      case 'bond': {
        const reach = e2((u - 0.5) / 0.2);
        return {
          p: { shN: -50 - reach * 112, elN: -124 + reach * 110, shF: -50, elF: -120, head: 10 - reach * 18, tilt: 2 - reach * 4 },
          face: R1 ? 'satisfied' : 'delight',
          hands: { N: reach > 0.4 ? 'open' : 'clasp', F: 'clasp' },
          eye: 0,
        };
      }
      // their curtsy (the entrance): a deep, slow curtsy, skirts held out, head bowed
      case 'curtsy': {
        const k = e2(u / 0.5);
        return {
          p: { drop: 0.12 * k, tilt: 8 * k, head: 12 * k, shN: -26 * k, elN: -12 * k, shF: -26 * k, elF: -12 * k, fxF: -0.1 * k },
          face: R1 ? 'satisfied' : 'giggle',
          hands: { N: 'relaxed', F: 'relaxed' },
          eye: 0,
        };
      }
      // 10 Pas de Deux: both arms raised round in a grand pose, leaning back, a slow turn; the red eye open
      case 'pasdedeux': {
        const tn = Math.sin(u * TAU);
        return {
          // (arms opened wide and high, well clear of her face)
          p: { shN: -128 * k1, elN: -8 * k1, shF: -118 * k1, elF: -12 * k1, tilt: -8 * k1, head: -10 * k1, turnC: tn * 0.55, fxN: 0.1 * k1, toeN: 30 * k1, x: tn * 0.02 },
          face: R1 ? 'glare' : 'wicked',
          hands: { N: 'relaxed', F: 'relaxed' },
          eye: e2((u - 0.08) / 0.22),
        };
      }
      default:
        return null;
    }
  }
  function pose(m, a, out) {
    const st = (a.mo.rig ??= {});
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const t = a.t ?? 0;
    const now = a.now ?? t;
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const q = { face: R1 ? 'poised' : 'giggle', jig: 0, lock: 0, eye: 0, eyeSpin: 0 };
    a.tw = q;
    const walk = clamp(a.walkW ?? 0, 0, 1);
    const fighting = !dead && (m.fightTest || (m.aggroUntil ?? 0) > now || now - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3 || Boolean(m.cast) || Boolean(m.castTest));
    // (into and out of the fight along a steady ramp, so it never snaps)
    const fwant = fighting ? 1 - walk * 0.7 : 0;
    st.twFW = Number.isFinite(st.twFW) ? st.twFW + clamp(fwant - st.twFW, -dt * 2.2, dt * 1.6) : fwant;
    const fw = e2(st.twFW);
    const calm = (1 - walk) * (dead ? 0 : 1) * (1 - fw);
    const go = (p, k) => {
      if (k > 0.001) for (const [ch, v] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (v - (out[ch] ?? 0)) * k;
    };
    const beat = t * (TAU / 1.8);
    let face = null;
    let hands = null;
    // Out of a fight: Rondo tall and straight, one hand on her hip, the other raised, counting the beat
    // with a finger; Minuet's gloved hands clasped by her cheek, swaying the other way to her sister
    if (R1) go({ shN: -128, elN: -70 + Math.sin(beat) * 7, shF: 20, elF: -66, head: -5 + Math.sin(beat) * 2, tilt: -2 + Math.sin(beat) * 1.4, x: Math.sin(beat) * 0.008 }, calm);
    else go({ shN: -46, elN: -128, shF: -46, elF: -124, head: 9 + Math.sin(beat + 1) * 3, tilt: 3 - Math.sin(beat) * 3, x: -Math.sin(beat) * 0.012 }, calm);
    // Fight idles, each with its own little moments on a 9 s loop
    if (fw > 0.01) {
      const fu = (((t + (m.uid % 3) * 2.3) % 9) + 9) % 9;
      if (R1) {
        // conducting the room with her raised hand on the beat, the other on her hip; a hat tip; her foot
        // tapping the tempo
        const fb = t * (TAU / 1.5);
        go({ shN: -112 + Math.sin(fb) * 12, elN: -56 + Math.cos(fb) * 10, shF: 24, elF: -70, tilt: Math.sin(fb) * 1.6, head: -4 + Math.sin(fb) * 1.5, x: Math.sin(fb) * 0.006, drop: 0.008 * (1 + Math.cos(fb * 2)) }, fw);
        const tip = hold(fu, 2, 2.4, 3.2, 3.7) * fw;
        go({ shF: -164, elF: -112, head: 8, tilt: 3 }, tip);
        const tap = hold(fu, 5.4, 5.6, 7, 7.3) * fw;
        go({ fyN: -0.07 * Math.max(0, Math.sin((fu - 5.6) * 14)), shN: -96, elN: -40 }, tap);
        face = tip > 0.4 ? 'satisfied' : tap > 0.4 ? 'counting' : 'stern';
        hands = { N: tip > 0.4 ? 'relaxed' : 'point', F: tip > 0.4 ? 'clasp' : 'relaxed' };
      } else {
        // bouncing on her toes, swaying, hands clasped by her cheek; peek-a-boo behind her hands; a twirl
        const fb = t * (TAU / 1.2);
        go({ shN: -50 + Math.sin(fb) * 6, elN: -126, shF: -44 - Math.sin(fb) * 6, elF: -122, tilt: -Math.sin(fb) * 4, head: 8 + Math.sin(fb + 1) * 4, x: -Math.sin(fb) * 0.01, hop: 0.012 * Math.abs(Math.sin(fb)) }, fw);
        const peek = hold(fu, 1.6, 1.9, 3, 3.4) * fw;
        go({ shN: -66, elN: -144, shF: -62, elF: -142, head: 10, tilt: 2 }, peek);
        const twirl = hold(fu, 5, 5.4, 6.6, 7.1) * fw;
        go({ shN: -94, elN: -8, shF: -92, elF: -8, turnC: Math.sin((fu - 5) * 5) * 0.7, tilt: Math.sin((fu - 5) * 5) * 5, head: -6 }, twirl);
        face = peek > 0.4 ? (fu > 2.6 ? 'boo' : 'giggle') : twirl > 0.4 ? 'delight' : 'sly';
        hands = peek > 0.4 ? { N: 'clasp', F: 'clasp' } : twirl > 0.4 ? { N: 'open', F: 'open' } : { N: 'clasp', F: 'clasp' };
      }
    }
    // The basic attack, from the rig's attack phase (a.ph): Rondo flicks her hand back, then points the
    // beat at you; Minuet winds both hands back, then shoves them open at you
    const ap = a.ph ?? { antic: 0, strike: 0 };
    if (!dead && ap.antic > 0.01) {
      go(R1 ? { shN: 34, elN: -82, tilt: -6, head: -6, x: -0.012 } : { shN: 30, elN: -100, shF: 22, elF: -100, tilt: -8, head: -6, x: -0.015 }, ap.antic);
      face = R1 ? 'stern' : 'sly';
      hands = R1 ? { N: 'open', F: 'relaxed' } : { N: 'clasp', F: 'clasp' };
    }
    if (!dead && ap.strike > 0.01) {
      go(R1 ? { shN: -96, elN: -6, tilt: 8, head: 2, x: 0.025, fxN: 0.08 } : { shN: -86, elN: -10, shF: -80, elF: -14, tilt: 10, head: 4, x: 0.03, fxN: 0.1 }, ap.strike);
      face = R1 ? 'stern' : 'boo';
      hands = R1 ? { N: 'point', F: 'relaxed' } : { N: 'open', F: 'open' };
    }
    // The mechanics' poses (m.cast with m.castPose from the fight; m.castTest { name, u } for sheets)
    let want = null;
    let cu = 0;
    // (their entrance's moves: data/scenes.js manor_twins)
    const cine = m.mech?.placed ? null : m.cine?.act;
    const CINE = { stepout: 'swap', curtsy: 'curtsy', reveal: 'frozen', stopped: 'frozen' };
    if (!dead && m.castTest) {
      want = m.castTest.name;
      cu = m.castTest.u;
    } else if (!dead && cine && CINE[cine.move]) {
      want = CINE[cine.move];
      cu = cine.move === 'stopped' ? 1 : clamp((now - cine.at) / Math.max(0.2, cine.dur), 0, 1);
    } else if (!dead && m.cast && m.castPose) {
      want = m.castPose;
      cu = clamp((now - m.cast.t0) / Math.max(0.2, m.cast.dur), 0, 1);
    }
    if (want) {
      st.twCast = want;
      st.twCastU = cu;
    }
    st.twCastW = clamp((st.twCastW ?? 0) + (want ? dt * 4.5 : -dt * 3), 0, 1);
    const cw = e2(st.twCastW);
    let eyeGoal = 0;
    if (cw > 0.001 && st.twCast) {
      const P = castPose(st.twCast, want ? cu : 1, t);
      if (P) {
        go(P.p, cw);
        if (cw > 0.4) {
          face = P.face;
          hands = P.hands;
        }
        // (the eye closes again as the pose eases out)
        eyeGoal = want ? P.eye : 0;
      }
    }
    if (m.eyeTest != null) eyeGoal = m.eyeTest;
    q.eye = clamp(spring(st, 'twEye', eyeGoal, 70, 2 * Math.sqrt(70) * 0.85, dt), 0, 1);
    // (the clock hands in the red eye spin while it is open; faster while time is stopped)
    st.twSpin = (st.twSpin ?? 0) + dt * (q.eye > 0.05 ? (m.timeStopped ? 9 : 3) : 0);
    q.eyeSpin = st.twSpin;
    if (dead) face = 'dizzy';
    else if (hurt) face = 'hurt';
    if (face) q.face = face;
    if (m.faceTest) q.face = m.faceTest;
    handRig(m, a, st, dt, walk, dead, beat, hands);
    q.jig = jolt(m, a, st, dt);
    // the gown's gores, each lagging a little more than the last, swinging after her sway and steps
    const lean = Math.sin(beat) * (R1 ? 0.4 : -0.5) + walk * Math.sin(t * 7) * 1.2 + (out.x ?? 0) * 20 + (out.turnC ?? 0) * 3;
    for (let i = 0; i <= GORES; i++) spring(st, `twG${i}`, lean * (0.6 + 0.5 * Math.sin((i / GORES) * Math.PI)), 44 - i * 1.6, 6.4, dt);
    a.twBell = q.jig;
    a.twTails = spring(st, 'twTl', lean * 0.9, 26, 4.4, dt);
    q.lock = spring(st, 'twLk', -lean * 0.05, 34, 6, dt);
  }

  const DRESS = {
    id: `twin_${who}`,
    skin: { lt: L.skin[0], base: L.skin[1], sh: L.skin[2], deep: L.skin[3], ink: INK, guides: false, out: 2 / BIGK },
    liveHead: true,
    noMoves: true,
    under: {
      // (behind her whole body: her glow, Rondo's tails, the hair behind her head)
      armF: (ctx, a, mode, S, D) => {
        if (mode === 'line') aura(ctx, a, D);
        tails(ctx, a, mode, D);
        head(ctx, a, mode, D, 'back');
      },
    },
    over: {
      footFskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'F'),
      footNskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'N'),
      torsoSkin: (ctx, a, mode, S, D) => bodice(ctx, a, mode, S, D),
      armF: (ctx, a, mode, S, D) => {
        sleeve(ctx, a, mode, D, 'F');
        shoulderCap(ctx, a, mode, D, 'F');
      },
      armN: (ctx, a, mode, S, D) => {
        sleeve(ctx, a, mode, D, 'N');
        shoulderCap(ctx, a, mode, D, 'N');
      },
      handFskin: (ctx, a, mode) => glove(ctx, a, mode, 'F'),
      handNskin: (ctx, a, mode) => glove(ctx, a, mode, 'N'),
      neckSkin: (ctx, a, mode, S, D) => {
        neckShade(ctx, a, mode, D);
        throat(ctx, a, mode, D);
      },
      head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
    },
    pose,
  };
  const BIG = BIGK;
  const R = dressRig('maiden', DRESS);
  const rig = R.rig;
  const draw0 = rig.draw;
  rig.draw = (ctx, m, a) => {
    // Their entrance (data/scenes.js manor_twins): not in the room yet ('away'), the clock striking
    // ('chime') and their reflections dancing in the mirrors ('mirror', render/twins/room.js), all with
    // nobody on the floor; then each steps out of her mirror ('stepout'): Rondo onto the floor, Minuet
    // turning over in one smooth half turn up to the ceiling (about her middle, so she ends just where
    // the fight hangs her: world/twins.js TWIN_HANG).
    // (once their fight has begun, world/twins.js, any scene move left on them is over)
    const act = m?.mech?.placed ? null : m?.cine?.act;
    const mv = act?.move;
    if (mv === 'away' || mv === 'chime' || mv === 'mirror' || (m?.offstage && !act)) return;
    const su = mv === 'stepout' ? clamp(((a.now ?? 0) - act.at) / Math.max(0.2, act.dur), 0, 1) : 1;
    const se = su * su * (3 - 2 * su);
    const turning = Boolean(act) && who === 'minuet' && ['stepout', 'curtsy', 'reveal', 'stopped'].includes(mv);
    ctx.save();
    if (turning) {
      const H = m.def?.h ?? 96;
      const rise = (m.y ?? 380) - 146 - H / 2;
      ctx.translate(0, -H / 2 - (rise - H / 2) * se);
      ctx.rotate(Math.PI * se);
      ctx.translate(0, H / 2);
    }
    // (hanging from the ceiling, world/twins.js: her feet up at the ceiling, her head her full height below
    // them, at m.y; see-through as she passes through a mirror, m.twAlpha, or steps out of one)
    if (m?.ceiling && !turning) {
      ctx.translate(0, -(m.def?.h ?? 96));
      ctx.scale(1, -1);
    }
    const a0 = a.alpha;
    let al = m?.twAlpha != null && m.twAlpha < 1 ? m.twAlpha : 1;
    if (mv === 'stepout') al *= Math.min(1, su * 1.6);
    if (al < 1) a.alpha = (a0 ?? 1) * al;
    ctx.scale(BIG, BIG);
    a.gaitScale = BIG;
    draw0(ctx, m, a);
    a.alpha = a0;
    ctx.restore();
  };
  rig.w = Math.round(rig.w * BIG * 1.3);
  rig.h = Math.round(rig.h * BIG * 1.3);
  return {
    art: { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 420, 220, 260], draw: R.still, rig, noHop: true },
    size: { w: Math.round(R.w * BIG), h: Math.round(R.h * BIG), speed: Math.round(R.speed * BIG) },
  };
}
const RONDO = makeTwin('rondo');
const MINUET = makeTwin('minuet');
// (for the room's mirrors: render/twins/arts.js)
TWIN_ARTS.rondo = RONDO.art;
TWIN_ARTS.minuet = MINUET.art;
export const RONDO_ART = RONDO.art;
export const RONDO_SIZE = RONDO.size;
export const MINUET_ART = MINUET.art;
export const MINUET_SIZE = MINUET.size;
