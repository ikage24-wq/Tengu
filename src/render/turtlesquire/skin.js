// The Turtle Squire's skin (2026-11-27, the Sky Whale's barnacleknight remade as a new creature): a copy of
// the Red-Tape Raccoon's copy (render/raccoon/skin.js), kept here so none of those is touched; nothing that moves is changed.
// The Red-Tape Raccoon's notes follow.
// The Red-Tape Raccoon's skin (2026-11-27, the Dream Theatre's primadonna remade as a new creature): a copy of
// the Star Glider's copy (render/glider/skin.js), kept here so none of those is touched; nothing that moves is changed.
// What this copy adds: `C.parts` (optional palettes per part: arm, leg, hand, foot, neck), so the body can wear
// clothes cut from its own outline (sleeves and trousers in the cloth's colours) with its own fur at the paws and neck.
// The Star Glider's skin (2026-11-26): a copy of the Geode Bear's copy (render/geodebear/skin.js), kept here
// so none of those is touched; nothing that moves is changed. Its notes follow.
// The Geode Bear's skin (2026-11-26): a copy of the Pangolin Sentry's copy of the blank bases' skin
// (render/pangolin/skin.js), kept here so none of those is touched; nothing changed. Its notes follow.
// The Pangolin Sentry's skin (2026-11-26): a copy of Humphrey's copy of Tuskar's copy of the blank bases'
// skin (render/pumpkinbutler/skin.js), kept here so none of those is touched; nothing changed. Its notes
// follow.
// Humphrey the Basset Butler (the Pumpkin Butler remade, 2026-11-26): a copy of Tuskar's copy of the blank bases' skin (render/tuskar/skin.js), kept here so
// neither is touched; nothing changed. Its notes follow.
// Tuskar's skin (2026-11-26, the woolly mammoth calf): a copy of the blank bases' skin (render/mobs/blankskin.js), kept
// here so the base stays clean. What this copy adds: C.ink, its own soft outline colour (never the
// bases' plum), C.out its outline's width, and C.guides false to leave out the mannequin's lines.
// A smooth skinned body for the blank bases (2026-11-23, the player: "disconnect and rerig it as
// an actual torso, waist, hip, etc and fix discontinued body parts, try to smooth it out to fit and
// match", then "the whole body shouldn't move when animating ... have a complex rig system that has
// many parts"): the body is drawn live, every frame, as one smooth shape that follows many bones:
//   - the torso is one outline skinned to the hips (pelvis), the waist (belly), the chest (ribcage)
//     and a collarbone each side: each point of it follows the bones it belongs to, blended where
//     two meet, so the back curves where it bends, the shoulders rise and come forward with the
//     arms, and nothing ever opens a seam;
//   - its shoulder line runs from the neck down to the top of a round shoulder muscle (a disc on
//     the arm, the same height), so an arm turns under it without anything poking up;
//   - its forms: a soft light on the chest, the waist drawn in at the sides, a light on the near
//     hip, and faint construction lines (down the middle, under the chest, across the hips, like the
//     head's) that slide round as the chest and the hips turn (`turnC`, `turnP`), so a twist reads;
//   - each arm and leg is one tube from the shoulder (or up inside the hips) through the elbow (or
//     knee) to the wrist (or ankle), straight along each bone, shaped like one (the upper arm full
//     under the shoulder, the forearm fuller below the elbow, the calf below the knee), round all
//     along, so a joint is one round joint; a soft line just inside its edge, so an arm across the
//     body still reads; the neck is a tube from the chest up into the head;
//   - hands (a mitten and a thumb, turned at the wrist) and feet on their own bones.
// Drawn in two passes like the rig's sprites: an outline pass (each shape's edge in the outline
// ink, 1 px out), then a fill pass, so only the outer edge of the figure is outlined. The far arm
// and leg a shade darker. The head, wings, tails, a spirit's wisp, a serpent's tail and weapons stay
// drawn parts.
//
//   const skin = makeSkin({ J, SC, C, spec });   J: the base's joints (kid-box units), SC: game px a
//   unit, C: its colours, spec: its shape (skinSpec in blankbases.js / blankSkinSpec in blankbase.js)
//   skin.torso(ctx, a, mode, S), skin.neck, skin.arm(ctx, a, mode, S, 'F'|'N'), skin.hand, skin.leg,
//   skin.foot   (`a.blMat`: the rig's matOf, the bones this frame; mode 'line' | 'fill')

import { CHAR_LINE } from '../pixel.js';
import { legDrawer } from '../mobs/blankquad.js';

const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
// A Catmull-Rom curve through `pts`, `n` steps a span (open).
function curveThrough(pts, n) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const hexRgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toward = (c, d, k) => {
  if (k <= 0) return c;
  const [r, g, b] = hexRgb(c);
  const [r2, g2, b2] = hexRgb(d);
  const f = (x, y) => Math.round(x + (y - x) * k);
  return `rgb(${f(r, r2)},${f(g, g2)},${f(b, b2)})`;
};
const apply = (M, [x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
// (The light comes from above and in front; the shade side of a limb faces down and back.)
const SHADE_DIR = [-0.42, 0.91];
const GUIDE = '#cfc6e2';

export function makeSkin({ J, SC, C, spec }) {
  const OUT = C.out ?? 2; // the outline: 1 game px each side of an edge, the outer half showing
  const local = (p, pivot) => [(p[0] - J[pivot][0]) * SC, (p[1] - J[pivot][1]) * SC];
  const at = (a, part, p, pivot) => apply(a.blMat(part), local(p, pivot));
  const colour = (a, c) => toward(c, '#ffffff', Math.min(0.85, (a.flash ?? 0) * 6));
  // (a part's own palette, if it has one: a sleeve, a trouser leg, a paw)
  const P = (k) => (C.parts?.[k] ? { ...C, ...C.parts[k] } : C);
  const poly = (ctx, pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  const line = (ctx, pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  };
  const edge = (ctx) => {
    ctx.strokeStyle = C.ink ?? CHAR_LINE;
    ctx.lineWidth = OUT;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // ---------- The torso, skinned to the hips, waist, chest and collarbones ----------
  const cx = spec.cx;
  const ribs = J.ribs[1];
  const navel = J.navel[1];
  const d = (navel - ribs) * 0.5;
  const { y: shY, w: shW, neckW } = spec.shoulder;
  const aw0 = spec.arm.aw0;
  // How much each point follows each bone: by its height, the chest above the ribs, the waist
  // between, the hips below the navel, blended across each joint; and toward the shoulders, its
  // side's collarbone (most at the shoulder's top, none at the neck or below the armpit).
  const legs = spec.legs !== false;
  const BONES = [['torso', 'hip'], ['waistB', 'navel'], ['chest', 'ribs'], ['claF', 'stern'], ['claN', 'stern'], ...(legs ? [['thighF', 'hipF'], ['thighN', 'hipN']] : [])];
  // (Below the hip sockets the hips follow the thighs, each side its own, the crotch half each, so
  // a leg lifting carries the bottom of the hips with it and grows out of the body: nothing round
  // is left sitting over the thigh.)
  const sockY = legs ? (J.hipN[1] + J.hipF[1]) / 2 : 0;
  const sockX = legs ? Math.abs(J.hipN[0] - cx) || 1 : 1;
  const lowY = spec.right[spec.right.length - 1][1];
  const weights = ([x, y]) => {
    let w;
    if (y <= ribs - d) w = [0, 0, 1];
    else if (y < ribs + d) {
      const u = smoothstep((y - (ribs - d)) / (2 * d));
      w = [0, u, 1 - u];
    } else if (y <= navel - d * 0.6) w = [0, 1, 0];
    else if (y < navel + d * 1.2) {
      const u = smoothstep((y - (navel - d * 0.6)) / (d * 1.8));
      w = [u, 1 - u, 0];
    } else w = [1, 0, 0];
    const up = 1 - smoothstep((y - (shY - aw0 * 0.2)) / (aw0 * 1.4));
    const side = smoothstep((Math.abs(x - cx) - neckW * 1.1) / Math.max(1, shW - neckW * 1.1));
    const cl = w[2] * up * side;
    const out = [w[0], w[1], w[2] - cl, x < cx ? cl : 0, x < cx ? 0 : cl];
    if (legs) {
      const down = smoothstep((y - (sockY - (lowY - sockY) * 0.15)) / Math.max(1, (lowY - sockY) * 1.15)) * 0.9;
      const near = smoothstep(0.5 + ((x - cx) / sockX) * 0.5);
      const th = out[0] * down;
      out[0] -= th;
      out.push(th * (1 - near), th * near);
    }
    return out;
  };
  const skinPt = (a, p) => {
    const w = weights(p);
    let x = 0;
    let y = 0;
    for (let i = 0; i < BONES.length; i++) {
      if (!w[i]) continue;
      const [px, py] = at(a, BONES[i][0], p, BONES[i][1]);
      x += px * w[i];
      y += py * w[i];
    }
    return [x, y];
  };
  // The torso's outline at rest: down the near side, round under the crotch, up the far side.
  const right = curveThrough(spec.right, 6);
  const left = curveThrough(spec.left, 6);
  const [qr] = spec.right.slice(-1);
  const [ql] = spec.left.slice(-1);
  const bottom = curveThrough([qr, [(qr[0] + ql[0]) / 2, Math.max(qr[1], ql[1]) + (qr[0] - ql[0]) * 0.05], ql], 4).slice(1, -1);
  const hull = [...right, ...bottom, ...left.slice().reverse()];
  // (the body's two edges and its middle at a height)
  const edgeAt = (pts, y) => {
    for (let i = 0; i < pts.length - 1; i++) if ((pts[i][1] - y) * (pts[i + 1][1] - y) <= 0) {
      const u = (y - pts[i][1]) / ((pts[i + 1][1] - pts[i][1]) || 1);
      return pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u;
    }
    return pts[pts.length - 1][0];
  };
  const mid = (y) => (edgeAt(right, y) + edgeAt(left, y)) / 2;
  const half = (y) => Math.abs(edgeAt(right, y) - edgeAt(left, y)) / 2;
  // Its far-side shade (a band in from the far edge, below the shoulder) and a light down the near.
  const shadeEdge = left.filter(([, y]) => y > shY);
  const shadeBand = [...shadeEdge, ...shadeEdge.slice().reverse().map(([x, y]) => [x + (mid(y) - x) * 0.3, y])];
  const litEdge = right.filter(([, y]) => y > shY + aw0 * 0.6 && y < spec.lines.bottom);
  const litBand = [...litEdge.map(([x, y]) => [x - (x - mid(y)) * 0.05, y]), ...litEdge.slice().reverse().map(([x, y]) => [x - (x - mid(y)) * 0.14, y])];
  // The waist drawn in: a soft shade on each side between the ribs and the hips.
  const pinch = (pts, k) => {
    const lo = ribs - d * 0.6;
    const hi = navel + d;
    const e = pts.filter(([, y]) => y > lo && y < hi);
    return [...e, ...e.slice().reverse().map(([x, y]) => [x + (mid(y) - x) * k * Math.sin(Math.PI * smoothstep((y - lo) / (hi - lo))), y])];
  };
  const pinchN = pinch(right, 0.16);
  const pinchF = pinch(left, 0.2);
  const oval = (x, y, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * rx, y + Math.sin((i / n) * Math.PI * 2) * ry]);
  const L = spec.lines;
  const chestHalf = half(L.chest);
  const hipHalf = half(L.hip);
  const bellyPts = spec.belly ? oval(spec.belly.x, spec.belly.y, spec.belly.rx, spec.belly.ry, 24) : null;
  // A guide line across the body at height y, wrapped round it as it turns `t` (-1..1): its middle
  // slides toward the side the front turns to, its ends tuck round the edges.
  const across = (y, hw, t, sag) => Array.from({ length: 13 }, (_, i) => {
    const th = -1.25 + (i / 12) * 2.5 + t * 0.7;
    const vis = Math.cos(th - t * 0.7) > -0.1;
    return vis ? [mid(y) + Math.sin(th) * hw * 0.98, y + Math.cos(th) * sag] : null;
  }).filter(Boolean);

  function torso(ctx, a, mode, S) {
    // (kept for the neck, drawn over it this frame: it shows only where it comes up out of it)
    const pts = (a.blTorsoPts = hull.map((p) => skinPt(a, p)));
    poly(ctx, pts);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const tc = S.turnC ?? 0;
    const tp = S.turnP ?? 0;
    const alpha = ctx.globalAlpha;
    // The forms: the chest's light (sliding with its turn), the near hip's light, the far side's
    // shade, the waist's sides drawn in, a light down the near edge.
    // (soft glows with no edge, so nothing reads as a knob or a joint)
    const glow = (p, r, k) => {
      const [gx, gy] = skinPt(a, p);
      const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * SC);
      const [cr, cg, cb] = hexRgb(C.lt);
      gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
      gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(gx - r * SC, gy - r * SC, r * SC * 2, r * SC * 2);
    };
    glow([mid(L.chest) + chestHalf * (0.3 + tc * 0.3), L.chest - (L.chest - shY) * 0.45], chestHalf * 0.75, 0.75);
    glow([mid(L.hip) + hipHalf * (0.4 + tp * 0.25), L.hip + (L.bottom - L.hip) * 0.1], hipHalf * 0.55, 0.45);
    poly(ctx, shadeBand.map((p) => skinPt(a, p)));
    ctx.fillStyle = colour(a, C.sh);
    ctx.fill();
    ctx.globalAlpha = C.guides === false ? 0 : alpha * 0.75;
    for (const band of [pinchN, pinchF]) {
      poly(ctx, band.map((p) => skinPt(a, p)));
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
    poly(ctx, litBand.map((p) => skinPt(a, p)));
    ctx.fillStyle = colour(a, C.lt);
    ctx.fill();
    if (bellyPts) {
      poly(ctx, bellyPts.map((p) => skinPt(a, [p[0] + spec.belly.rx * tc * 0.25, p[1]])));
      ctx.fill();
    }
    // Where the neck and the near arm come out of the body, its light and shade ease away to its
    // plain colour, the colour they are, so they meet it with no edge (the player: "it should never
    // pop out").
    const [br, bgc, bb] = hexRgb(C.base);
    const seat = (c, r, k0) => {
      const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
      gr.addColorStop(0, `rgba(${br},${bgc},${bb},1)`);
      gr.addColorStop(k0, `rgba(${br},${bgc},${bb},1)`);
      gr.addColorStop(1, `rgba(${br},${bgc},${bb},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
    };
    if (!(a.flash > 0)) {
      // (a body with no legs, going down into a wisp, a tail or a four-legged body: its light and
      // shade fade to its plain colour toward its bottom, so it runs on into what's below with no
      // edge)
      if (!spec.legs) {
        const [g0, g1] = [skinPt(a, [cx, L.hip - (L.bottom - L.hip) * 0.4]), skinPt(a, [cx, L.bottom])];
        const gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
        gr.addColorStop(0, `rgba(${br},${bgc},${bb},0)`);
        gr.addColorStop(1, `rgba(${br},${bgc},${bb},1)`);
        ctx.fillStyle = gr;
        poly(ctx, pts);
        ctx.fill();
      }
      seat(skinPt(a, spec.neck.base), spec.neck.w * SC * 0.9, 0.4);
      // (the shoulder's round, all of it, and the arm's root up inside the body)
      if (a.blMat) seat(origin(a, 'armNu'), spec.arm.ball * SC * 2.2, 0.56);
    }
    // Construction lines: down the middle (its top following the chest's turn, its bottom the
    // hips'), under the chest; faint, like the head's.
    ctx.strokeStyle = colour(a, GUIDE);
    ctx.lineWidth = Math.max(0.35, spec.fine * SC * 0.8);
    ctx.lineCap = 'round';
    ctx.globalAlpha = C.guides === false ? 0 : alpha * 0.75;
    const yEnd = spec.legs ? L.bottom : L.hip;
    const ys = Array.from({ length: 12 }, (_, i) => L.top + ((yEnd - L.top) * i) / 11);
    line(ctx, ys.map((y) => {
      const k = smoothstep((y - ribs) / Math.max(1, navel + d - ribs));
      const t = tc * (1 - k) + tp * k;
      return skinPt(a, [mid(y) + Math.sin(t * 0.7) * half(y) * 0.98, y]);
    }));
    ctx.stroke();
    line(ctx, across(L.chest, chestHalf, tc, (L.chest - shY) * 0.12).map((p) => skinPt(a, p)));
    ctx.stroke();
    // (No line across the hips: it read as a seam where the legs join.)
    ctx.globalAlpha = alpha;
    // Collarbones, faint, on the collarbones.
    ctx.strokeStyle = colour(a, C.sh);
    ctx.lineWidth = Math.max(0.35, spec.fine * SC);
    for (const c of spec.collar ?? []) {
      line(ctx, curveThrough(c, 3).map((p) => skinPt(a, p)));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Tubes: arms, legs, the neck ----------
  // A tube through `pts` (rig space), `wl` its width at each, as one shape: round all along (a
  // disc at each step and the strip between), so a bend is smooth and nothing folds over.
  const tubePath = (ctx, pts, wl, grow = 0) => {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const r = Math.max(0.1, wl[i] / 2 + grow);
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (i) {
        const [x0, y0] = pts[i - 1];
        const r0 = Math.max(0.1, wl[i - 1] / 2 + grow);
        const dx = x - x0;
        const dy = y - y0;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        // (wound the same way as the discs, so they all fill as one)
        ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
        ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
        ctx.lineTo(x - nx * r, y - ny * r);
        ctx.lineTo(x + nx * r, y + ny * r);
        ctx.closePath();
      }
    }
  };
  // The middle line of a limb through its joints, straight along each bone, and its width eased
  // from joint to joint.
  const limbLine = (joints, widths, n = 5) => {
    const pts = [];
    const wl = [];
    for (let i = 0; i < joints.length - 1; i++) {
      for (let j = 0; j < n; j++) {
        const u = j / n;
        pts.push(lerp2(joints[i], joints[i + 1], u));
        wl.push(widths[i] + (widths[i + 1] - widths[i]) * smoothstep(u));
      }
    }
    pts.push(joints[joints.length - 1]);
    wl.push(widths[widths.length - 1]);
    return [pts, wl];
  };
  // The limb's shading, worked out bone by bone (each straight run of the limb): a shade band down
  // the side away from the light and a light down the lit side, each its own straight strip with
  // round ends, so a bent knee or elbow never folds a stripe into a zigzag; as a bone turns past
  // the angle where its shade would change sides, it fades out and back in on the other side
  // instead of jumping across.
  const bandRuns = (pts) => {
    const runs = [];
    let cur = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy);
      if (len < 1e-3) continue;
      const ux = dx / len;
      const uy = dy / len;
      if (!cur || ux * cur.u[0] + uy * cur.u[1] < 0.985) {
        cur = { u: [ux, uy], from: i, to: i + 1 };
        runs.push(cur);
      } else cur.to = i + 1;
    }
    return runs.map((r) => {
      let nx = -r.u[1];
      let ny = r.u[0];
      const d = nx * SHADE_DIR[0] + ny * SHADE_DIR[1];
      if (d < 0) {
        nx = -nx;
        ny = -ny;
      }
      return { ...r, n: [nx, ny], fade: smoothstep(Math.abs(d) / 0.3) };
    });
  };
  // (a part drawn over the body, the neck, shows only off it)
  const offBody = (ctx, body) => {
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    body.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip('evenodd');
  };
  // (the body's edge, in a part's own colour, inside that part: where it comes out of the body)
  const seamOver = (ctx, a, shape, body, c) => {
    ctx.save();
    shape();
    ctx.clip('nonzero');
    poly(ctx, body);
    ctx.strokeStyle = c;
    ctx.lineWidth = OUT + 0.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };
  // A limb's tube. `rootN`: how many of its first points are its root (a round shoulder and where
  // it starts inside the body), drawn plain in the body's colour: no edge line, no shading, so the
  // shoulder melts into the body; the edge line and the shading begin past it, the shading easing
  // in over a short way so nothing starts at a hard edge.
  const drawTube = (ctx, a, mode, pts, wl, far, rootN = 0, Q = C) => {
    tubePath(ctx, pts, wl);
    if (mode === 'line') return edge(ctx);
    const body = colour(a, far ? Q.sh : Q.base);
    const n0 = Math.max(0, rootN - 1);
    const op = pts.slice(n0);
    const ow = wl.slice(n0);
    // (A soft line just inside the edge, so a limb over the body still reads: the edge in a deeper
    // tone, the inside laid over it.)
    const inset = 0.55;
    ctx.fillStyle = colour(a, far ? Q.deep : Q.sh);
    tubePath(ctx, op, ow);
    ctx.fill('nonzero');
    tubePath(ctx, op, ow, -inset);
    ctx.fillStyle = body;
    ctx.fill('nonzero');
    if (rootN) {
      tubePath(ctx, pts.slice(0, rootN), wl.slice(0, rootN));
      ctx.fill('nonzero');
    }
    ctx.save();
    tubePath(ctx, op, ow, -inset);
    ctx.clip('nonzero');
    // (eased in from nothing over the first few steps past the root)
    const ease = (i) => (rootN ? smoothstep(i / 4) : 1);
    const alpha = ctx.globalAlpha;
    for (const r of bandRuns(op)) {
      const idx = [];
      for (let i = r.from; i <= r.to; i++) idx.push(i);
      // (each stripe tapers to nothing at both ends, so it fades out at a joint, never a dot)
      const m = idx.length - 1;
      const taper = (j) => smoothstep(Math.min(j, m - j) / Math.max(1, Math.min(2, m / 2)));
      ctx.globalAlpha = alpha * r.fade;
      tubePath(ctx, idx.map((i) => [op[i][0] + r.n[0] * ow[i] * 0.3, op[i][1] + r.n[1] * ow[i] * 0.3]), idx.map((i, j) => ow[i] * 0.42 * ease(i) * (0.35 + 0.65 * taper(j))));
      ctx.fillStyle = colour(a, far ? Q.deep : Q.sh);
      ctx.fill('nonzero');
      if (!far) {
        tubePath(ctx, idx.map((i) => [op[i][0] - r.n[0] * ow[i] * 0.31, op[i][1] - r.n[1] * ow[i] * 0.31]), idx.map((i, j) => ow[i] * 0.13 * ease(i) * taper(j)));
        ctx.fillStyle = colour(a, Q.lt);
        ctx.fill('nonzero');
      }
    }
    ctx.globalAlpha = alpha;
    ctx.restore();
  };
  const origin = (a, part) => {
    const M = a.blMat(part);
    return [M[4], M[5]];
  };

  function arm(ctx, a, mode, S, k) {
    const A = spec.arm;
    const sh = origin(a, `arm${k}u`);
    const el = origin(a, `arm${k}f`);
    const wr = origin(a, `hand${k}`);
    // (From a point inside the shoulder, fixed on the collarbone, so however the arm turns its root
    // stays in the body; the upper arm full under the shoulder, the forearm fuller just below the
    // elbow, narrowing to the wrist.)
    const inward = k === 'N' ? -1 : 1;
    const top = at(a, `cla${k}`, [J[`sh${k}`][0] + inward * A.aw0 * 0.5, J[`sh${k}`][1] + A.aw0 * 0.15], 'stern');
    const [pts, wl] = limbLine([top, sh, lerp2(sh, el, 0.42), el, lerp2(el, wr, 0.3), wr], [A.aw0 * 0.9, A.aw0, A.aw0 * 0.94, A.ew, A.ew * 1.06, A.aw1].map((w) => w * SC), 4);
    // The round shoulder muscle, on the arm: its top level with the shoulder line; it and the
    // arm's root are drawn plain, melting into the body (drawTube's `rootN`).
    pts.unshift(sh);
    wl.unshift(A.ball * 2 * SC);
    // (the root: the shoulder disc, the run from inside the body up to the shoulder joint (the
    // first 6 points), and on down the arm while still inside the shoulder's round)
    const R = A.ball * SC * 0.92;
    let rootN = 6;
    while (rootN < pts.length - 2 && Math.hypot(pts[rootN][0] - sh[0], pts[rootN][1] - sh[1]) < R) rootN++;
    // (the near arm's root lies over the body where the body has eased to its own plain colour, so
    // it melts in: torso's `seat`)
    drawTube(ctx, a, mode, pts, wl, k === 'F', rootN, P('arm'));
  }
  function hand(ctx, a, mode, S, k) {
    const C = P('hand');
    const A = spec.arm;
    const M = a.blMat(`hand${k}`);
    const c = local(J[`hand${k}`], `wr${k}`);
    const far = k === 'F';
    ctx.save();
    ctx.transform(...M);
    ctx.beginPath();
    for (const [x, y, rx, ry] of [[c[0], c[1], A.hr, A.hr * 0.95], [c[0] + A.hr * 0.71 * SC, c[1] - A.hr * 0.33 * SC, A.hr * 0.4, A.hr * 0.38]]) {
      ctx.moveTo(x + rx * SC, y);
      ctx.ellipse(x, y, rx * SC, ry * SC, 0, 0, Math.PI * 2);
    }
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(c[0] - A.hr * 0.14 * SC, c[1] + A.hr * 0.36 * SC, A.hr * 0.54 * SC, A.hr * 0.3 * SC, 0, 0, Math.PI * 2);
    ctx.fillStyle = colour(a, far ? C.deep : C.sh);
    ctx.fill();
    ctx.restore();
  }
  function leg(ctx, a, mode, S, k) {
    const Lg = spec.leg;
    const hip = origin(a, `thigh${k}`);
    const knee = origin(a, `shin${k}`);
    const ank = origin(a, `foot${k}`);
    // (From a point up inside the hips, fixed on the pelvis, so however the leg swings its root stays
    // in the body and the thigh runs into it; the calf full just below the knee.)
    const top = at(a, 'torso', [J[`hip${k}`][0] + (cx - J[`hip${k}`][0]) * 0.3, Lg.top], 'hip');
    const [pts, wl] = limbLine([top, hip, lerp2(hip, knee, 0.5), knee, lerp2(knee, ank, 0.3), ank], [Lg.tw * 0.98, Lg.tw, Lg.tw * 0.9, Lg.kw, Lg.kw * 1.04, Lg.anw].map((w) => w * SC), 4);
    // (Its root, from inside the hips to a little below the crotch, drawn plain in the body's
    // colour, so the thigh grows out of the hips with no edge round its top: the first 4 points to
    // the hip socket, then on down the thigh past the bottom of the hips.)
    const below = Math.max(0, (lowY - J[`hip${k}`][1]) * SC) + Lg.tw * SC * 0.25;
    let rootN = 5;
    while (rootN < pts.length - 2 && Math.hypot(pts[rootN][0] - hip[0], pts[rootN][1] - hip[1]) < below) rootN++;
    drawTube(ctx, a, mode, pts, wl, k === 'F', rootN, P('leg'));
  }
  function foot(ctx, a, mode, S, k) {
    const C = P('foot');
    const Lg = spec.leg;
    const M = a.blMat(`foot${k}`);
    const far = k === 'F';
    const s = SC;
    const pts = curveThrough([[-Lg.heel * 0.9, -Lg.ftop], [Lg.anw * 0.35, -Lg.ftop * 1.05], [Lg.toe * 0.92, Lg.fbot * 0.42], [Lg.toe, Lg.fbot * 0.8], [Lg.toe * 0.9, Lg.fbot], [-Lg.heel, Lg.fbot], [-Lg.heel * 1.05, Lg.fbot * 0.4], [-Lg.heel * 0.9, -Lg.ftop]], 4).map(([x, y]) => [x * s, y * s]);
    ctx.save();
    ctx.transform(...M);
    poly(ctx, pts);
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = colour(a, far ? C.deep : C.sh);
    ctx.fillRect(-Lg.heel * 1.2 * s, Lg.fbot * 0.62 * s, (Lg.heel + Lg.toe) * 1.3 * s, Lg.fbot * s);
    ctx.restore();
  }
  function neck(ctx, a, mode) {
    const C = P('neck');
    const N = spec.neck;
    const base = skinPt(a, N.base);
    const top = at(a, 'head', N.top, 'neck');
    const pts = curveThrough([base, top], 6);
    const wl = pts.map(() => N.w * SC);
    tubePath(ctx, pts, wl);
    if (mode === 'line') return edge(ctx);
    // (only where it comes up out of the body: its foot never shows on the chest)
    const body = a.blTorsoPts;
    if (body) {
      ctx.save();
      offBody(ctx, body);
      tubePath(ctx, pts, wl);
    }
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    if (body) {
      ctx.restore();
      seamOver(ctx, a, () => tubePath(ctx, pts, wl), body, colour(a, C.base));
    }
    // A soft shadow under the chin (soft and short, so a thick neck doesn't read as a collar).
    ctx.save();
    if (body) offBody(ctx, body);
    tubePath(ctx, pts, wl);
    ctx.clip('nonzero');
    const [hx, hy] = at(a, 'head', [N.top[0], N.chin], 'neck');
    // (a soft round, no edge, so wherever the chest cuts it off nothing shows)
    const [sr, sg, sb] = hexRgb(C.sh);
    const rx = N.w * SC * 0.5;
    ctx.translate(hx, hy + N.w * SC * 0.1);
    ctx.scale(1, 0.4);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, `rgba(${sr},${sg},${sb},0.7)`);
    gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
  // ---------- A four-legged lower half (spec.horse: the centaur's pony, the deertaur's deer; its
  // bones placed each frame in a.blHorse: its legs, its outline's points, its tail) ----------
  const HS = spec.horse;
  // (its outline round, each point carrying how much it follows the near legs)
  const barrelRest = HS
    ? (() => {
        const ring = [...HS.barrel, HS.barrel[0], HS.barrel[1]];
        const xy = curveThrough(ring, 4).slice(0, -4);
        const kw = curveThrough(ring.map((p) => [p[2] ?? 0, p[3] ?? 0]), 4).slice(0, -4);
        return xy.map((p, i) => [p[0], p[1], Math.min(1, Math.max(0, kw[i][0])), Math.min(1, Math.max(0, kw[i][1]))]);
      })()
    : null;
  const QD = HS ? legDrawer({ C, edge }) : null;
  // (the top of the body where the rider goes into it, and a light along its back behind her: its
  // middle and how far it spreads)
  const seatTop = HS ? Math.min(...HS.barrel.filter((p) => Math.abs(p[0] - J.hip[0]) < (J.hip[1] - J.waist[1]) * 1.4).map((p) => p[1])) : 0;
  const backLight = HS
    ? (() => {
        const xs = HS.barrel.map((p) => p[0]);
        const ys = HS.barrel.map((p) => p[1]);
        const back = Math.min(...xs);
        const top = Math.min(...ys);
        const len = Math.max(...xs) - back;
        return [back + len * 0.3, top + (Math.max(...ys) - top) * 0.22, len * 0.32];
      })()
    : null;
  // (where the belly's shade fades out: just clear of the near legs' elbow and stifle at rest)
  const bellyEnds = HS
    ? (() => {
        const j1 = (G) => [G.top[0] + G.bones[0][0], G.top[1] + G.bones[0][1]];
        return [j1(HS.hind)[0] + HS.hind.w[1] * 0.9, j1(HS.fore)[0] - HS.fore.w[1] * 0.9];
      })()
    : null;
  const tint = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = hexRgb(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const bodyPtsOf = (a) => (a.blHorse.pts ??= barrelRest.map(a.blHorse.bodyPt));
  function horseBarrel(ctx, a, mode) {
    if (!a.blHorse) return;
    const M = a.blMat('barrel');
    const pts = bodyPtsOf(a);
    poly(ctx, pts);
    if (mode === 'line') return edge(ctx);
    // Its fill: where the rider's body goes down into it, it fades in from its top edge to her
    // hips, so her body runs on down into it, her light and shade fading into its colour, with no
    // edge and no line round her waist (the player: "it should never pop out"); everywhere else,
    // whole.
    const torsoPts = a.blTorsoPts;
    const [cr, cg, cb] = hexRgb(colour(a, C.base).startsWith('#') ? C.base : '#ffffff');
    ctx.save();
    if (torsoPts) offBody(ctx, torsoPts);
    poly(ctx, pts);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.restore();
    if (torsoPts) {
      ctx.save();
      poly(ctx, torsoPts);
      ctx.clip();
      poly(ctx, pts);
      ctx.transform(...M);
      const fade = ctx.createLinearGradient(0, (seatTop - J.hip[1]) * SC, 0, 0);
      fade.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
      fade.addColorStop(1, `rgba(${cr},${cg},${cb},1)`);
      ctx.fillStyle = fade;
      ctx.fill();
      ctx.restore();
      // (and her body's own edge, inside it, laid over in its colour, fading the same way: not even
      // a hairline where she goes into it)
      ctx.save();
      poly(ctx, pts);
      ctx.clip();
      poly(ctx, torsoPts);
      ctx.transform(...M);
      ctx.strokeStyle = fade;
      ctx.lineWidth = (OUT + 0.6) / Math.hypot(M[0], M[1]);
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    // (Soft shade under the belly; a soft light along the back behind the rider, clear of her.)
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    ctx.transform(...M);
    const ys = HS.barrel.map((p) => p[1]);
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)].map((y) => (y - J.hip[1]) * SC);
    const [sr, sg, sb] = hexRgb(C.sh);
    const [lr, lg, lb] = hexRgb(C.lt);
    {
      const c = [(backLight[0] - J.hip[0]) * SC, (backLight[1] - J.hip[1]) * SC];
      const r = backLight[2] * SC;
      const gl = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
      gl.addColorStop(0, `rgba(${lr},${lg},${lb},0.7)`);
      gl.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
      ctx.fillStyle = gl;
      ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
    }
    // (the belly's shade a soft round between the legs, fading out before them, so where a leg
    // comes out of the body, the body there is the leg's own colour: no seam)
    const [bx0, bx1] = bellyEnds.map((x) => (x - J.hip[0]) * SC);
    const rx = (bx1 - bx0) / 2;
    const ry = (y1 - y0) * 0.42;
    ctx.translate((bx0 + bx1) / 2, y1 + ry * 0.3);
    ctx.scale(rx / ry, 1);
    const gb = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
    gb.addColorStop(0, `rgba(${sr},${sg},${sb},0.85)`);
    gb.addColorStop(0.45, `rgba(${sr},${sg},${sb},0.5)`);
    gb.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
    ctx.fillStyle = gb;
    ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
    ctx.restore();
    // (the haunch and the shoulder lit round, soft, moving with the legs under them)
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const glow = (c, r, k) => {
      const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
      gr.addColorStop(0, `rgba(${lr},${lg},${lb},${k})`);
      gr.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
    };
    const { foreN, hindN } = a.blHorse.legs;
    glow(lerp2(hindN.T, hindN.J1, 0.2), hindN.w[0] * 0.75, 0.4);
    glow(lerp2(foreN.T, foreN.J1, 0.25), foreN.w[0] * 0.65, 0.3);
    ctx.restore();
  }
  // A leg (blankquad.js): the far ones under the body, the near ones over its side, grown out of it;
  // under the fetlock a short pastern and the hoof, a darker rounded block (split in two at the
  // front for a deer), standing flat and rolling over its toe as it leaves the ground.
  const rotP = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  function horseLeg(ctx, a, mode, S, k) {
    const L = a.blHorse?.legs?.[k];
    if (!L) return;
    const far = k.endsWith('F');
    const hw = HS.hoof.w * SC;
    const hh = HS.hoof.h * SC;
    const up = HS.hoof.up * SC;
    const pf = hw * 0.12;
    const yT = up - hh;
    const at = (x, y) => {
      const [rx, ry] = rotP([x, y], L.rot);
      return [L.P[0] + rx, L.P[1] + ry];
    };
    const cl = HS.hoof.cloven;
    // (the hoof's corners in its own frame: the top back, the top front, the toe, the heel)
    const hoof = (grow) => {
      const kx = 1 + (2 * grow) / hw;
      const ky = 1 + (2 * grow) / hh;
      const c = [pf, yT + hh / 2];
      const q = (x, y) => at(c[0] + (x - c[0]) * kx, c[1] + (y - c[1]) * ky);
      return { tb: q(pf - hw * 0.4, yT), tf: q(pf + hw * (cl ? 0.32 : 0.38), yT), ctl: q(pf + hw * (cl ? 0.58 : 0.6), yT + hh * 0.5), toe: q(pf + hw * (cl ? 0.78 : 0.62), up), heel: q(pf - hw * 0.46, up), hc: q(pf - hw * 0.52, yT + hh * 0.6) };
    };
    const hoofPath = (c2, grow = 0) => {
      const h = hoof(grow);
      c2.moveTo(...h.tb);
      c2.lineTo(...h.tf);
      c2.quadraticCurveTo(...h.ctl, ...h.toe);
      c2.lineTo(...h.heel);
      c2.quadraticCurveTo(...h.hc, ...h.tb);
      c2.closePath();
    };
    // (the knobs of the joints: the point of the hock behind, the knee a little forward, the fetlock
    // round; on the side the joint bends out to)
    const knobs = (c2, grow) => {
      const [m0, m1] = [(L.J1[0] + L.P[0]) / 2, (L.J1[1] + L.P[1]) / 2];
      let [ox, oy] = [L.J2[0] - m0, L.J2[1] - m1];
      const len = Math.hypot(ox, oy);
      if (len < L.w[2] * 0.15) [ox, oy] = [L.hind ? -1 : 1, 0];
      else [ox, oy] = [ox / len, oy / len];
      const k = L.hind ? [0.3, 0.44] : [0.1, 0.56];
      const c = [L.J2[0] + ox * L.w[2] * k[0], L.J2[1] + oy * L.w[2] * k[0]];
      const r = Math.max(0.1, L.w[2] * k[1] + grow);
      c2.moveTo(c[0] + r, c[1]);
      c2.arc(c[0], c[1], r, 0, Math.PI * 2);
      const rf = Math.max(0.1, L.w[3] * 0.6 + grow);
      c2.moveTo(L.P[0] + rf, L.P[1]);
      c2.arc(L.P[0], L.P[1], rf, 0, Math.PI * 2);
    };
    const foot = {
      path(c2, grow = 0) {
        QD.tubeInto(c2, [L.P, at(pf, yT + hh * 0.3)], [L.w[3], hw * 0.64], grow);
        hoofPath(c2, grow);
        knobs(c2, grow);
      },
      dark: (c2) => hoofPath(c2, -0.55),
      darkColour: [C.deep, '#9a8fb6'],
    };
    QD.drawLeg(ctx, mode, L, {
      far,
      colour: (c) => colour(a, c),
      tint: (c, al) => tint(a, c, al),
      bodyPts: far ? null : bodyPtsOf(a),
      foot,
      unit: (HS.fore.w[0] * SC) / 7.6,
      pinch: [0, 0.06, 0.2],
    });
    if (mode !== 'line' && cl) {
      // (a deer's hoof split in two at the front)
      ctx.beginPath();
      ctx.moveTo(...at(pf + hw * 0.26, yT + hh * 0.42));
      ctx.lineTo(...at(pf + hw * 0.36, up - 0.4));
      ctx.strokeStyle = colour(a, far ? C.sh : C.base);
      ctx.lineWidth = Math.max(0.6, hw * 0.07);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  function horseTail(ctx, a, mode) {
    const T = a.blHorse?.tail;
    if (!T) return;
    const n = T.length;
    if (HS.tail.kind === 'flag') {
      // A deer's: a short soft tuft, round at the tip, pale under.
      const wl = T.map((_, i) => (HS.tail.w[0] + (HS.tail.w[1] - HS.tail.w[0]) * (i / (n - 1))) * SC);
      tubePath(ctx, T, wl);
      if (mode === 'line') return edge(ctx);
      ctx.fillStyle = colour(a, C.base);
      ctx.fill('nonzero');
      ctx.save();
      tubePath(ctx, T, wl);
      ctx.clip('nonzero');
      tubePath(ctx, T.map(([x, y], i) => [x - wl[i] * 0.22, y + wl[i] * 0.1]), wl.map((v) => v * 0.55));
      ctx.fillStyle = colour(a, C.lt);
      ctx.fill('nonzero');
      ctx.restore();
      return;
    }
    // (full near the root, swelling a little, tapering to a soft tip)
    const wl = T.map((_, i) => {
      const u = i / (n - 1);
      return (HS.tail.w[0] * (1 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 1.6))) * (1 - u) + HS.tail.w[1] * u) * SC;
    });
    tubePath(ctx, T, wl);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.sh);
    ctx.fill('nonzero');
    ctx.save();
    tubePath(ctx, T, wl);
    ctx.clip('nonzero');
    tubePath(ctx, T.map(([x, y], i) => [x + wl[i] * 0.18, y - wl[i] * 0.12]), wl.map((v) => v * 0.28));
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    ctx.restore();
  }
  return { torso, neck, arm, hand, leg, foot, horseBarrel, horseLeg, horseTail };
}
