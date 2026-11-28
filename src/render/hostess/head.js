// Lady Marigold's head, painted finely (2026-11-28, the player: the concepts were "not detailed, most
// detailed character is Fawnelle": her head brought to that standard). Painted with the bosses' fine
// painting kit (render/bossart/kit.js) in her own design units (her face about 40 wide, its middle at
// the origin), as pieces painted once each and moved by her springs every frame:
//   back     the hair behind her head and her updo's bun, wound and glossed
//   ringlet  two long ringlets hanging behind her ears, each swaying from its root
//   face     her face in one expression: skin lit from the upper right, a soft shade where her hair
//            frames it, her eyes, brows, nose, mouth and blush
//   side     a lock framing each cheek down to her jaw, its tip turned in, swaying
//   cap      her crown down to the hairline, a ring of shine round it
//   fringe   her fringe swept across from a part on her right in long soft locks
//   flowers  three marigolds and their leaves pinned at the front of her bun, a pearl pin
// Her eyes are her own: tall and soft, the outer corners drooping a little (wistful), a honey iris
// with a plum rim, a five-petal marigold glint, a real lower lid with its waterline.
import { TAU, lerp, clamp, cr, poly, smooth, ell, ribbon, along, sideOf, taper, swell, rgba, mixHex, lin, rad, hlock, corkscrew, star4, piece, drawPiece } from '../bossart/kit.js';

export const G = 0.64;
const OUT = '#8a4c6a';
// (her hair's own outline: a deeper plum than the hair, so it reads as a soft line round it; the dress's
// lighter ink round dark hair read as a pale halo, 2026-11-28 "the hair outlines")
const HAIR_OUT = '#64204a';
export const LWD = 2 / (1.3 * G);

const SK = { hi: '#f6fbff', base: '#e2edfc', sh1: '#c6d6f2', sh2: '#a6b9e2', line: '#8a9ed0', blush: '#f7a6c6', lip: '#e57890', lipDk: '#a4405f', mouth: '#7a2640' };
const HR = { hi: '#ffd2e6', lt: '#d77ca6', base: '#ae4a7c', sh1: '#85305e', sh2: '#5e1c42', deep: '#44122f', rim: '#ffc8de' };
const EY = { dk: '#5a1e38', mid: '#a4542a', base: '#e0963c', lt: '#ffd888', glow: '#fff2c6', pupil: '#3a1226', ring: '#ffe4a4' };
const LASH = '#3e1430';
const GOLDEN = ['#fff0c0', '#ffd27a', '#f8a83c', '#e8802a', '#c45e1a'];
const LEAF = ['#c8e6a2', '#8ec070', '#5e9450', '#3e6e3a'];
const FY = [-40, 30];

// ---------- Her head's shape: a soft heart (2026-11-28, the player chose it): full at the cheeks, the
// sides curving in a little sooner beneath them, to a small round chin; no longer than before ----------
const HEAD_PTS = (() => {
  const upR = [[0, -23], [11.2, -20.6], [17.4, -14.6], [19.6, -5.6], [19.8, 2.6]];
  const lowR = [[19.4, 8.2], [17.8, 12.8], [14.4, 17], [9.8, 20.7], [5.4, 23.4], [2.4, 24.7]];
  const chin = [0, 25.1];
  const lowL = lowR.map(([x, y]) => [-x, y]).reverse();
  const upL = upR.slice(1).map(([x, y]) => [-x, y]).reverse();
  return cr([...upR, ...lowR, chin, ...lowL, ...upL], true, 3);
})();
const HEAD = () => poly(HEAD_PTS);

// ---------- Her hair ----------
// (the hairline from her left temple to her right, the fringe parted on her right (viewer's left) and
// swept over to the flowers)
const EDGE = [[-19.6, 1], [-17, -6], [-12.4, -12.8], [-7.6, -16.2], [-3.2, -13.8], [3.6, -10.4], [10.6, -7.2], [16.2, -3.2], [19.6, 2]];
const CROWN = [[21.8, -4], [22.4, -13], [19, -21.8], [11.4, -27.8], [0, -30.2], [-11.4, -27.8], [-19, -21.8], [-22.4, -13], [-21.8, -4]];
const capPts = () => cr([...EDGE, ...CROWN], true, 5);
const FRINGE = [
  [[[-10.2, -21], [-15, -13], [-18.2, -4.4], [-19.2, 3]], taper(5.8, 2.2), -1],
  [[[-4.8, -26.4], [4, -22.6], [12.4, -16.2], [17.8, -8.4], [19.8, 0.4]], taper(6.6, 2.6), 1],
  [[[-6.8, -24], [1, -19.4], [9.4, -12.8], [15.2, -6], [17.8, 0.8]], taper(7, 2.6), 1],
  [[[-8.4, -21], [-2, -15.8], [5.6, -10.2], [11.6, -5.6], [14.6, -2.6]], taper(6.4, 2.4), 1],
  [[[-9.2, -18.4], [-4.4, -13], [1.4, -8.6], [6.4, -5.8], [8.8, -4.8]], taper(4.8, 1.9), 1],
  // (fine locks lying over the big ones, so the fringe reads as layered hair, not one smooth shell)
  [[[-3.4, -22.4], [4.4, -16.6], [11, -10.4], [15.2, -4.2], [16.4, 0.6]], taper(2.4, 0.7), 1],
  [[[-6, -20.2], [0.6, -14.2], [6.8, -9.2], [10.6, -6.6]], taper(2, 0.6), 1],
  [[[-8.4, -20.6], [-12.6, -13.2], [-15.2, -5.6], [-15.6, -0.4]], taper(2.2, 0.6), -1],
];
const FRINGE_ROOT = [-6, -22];
// (each lock framing her cheek tapers to a soft point that curls gently in under her jaw; no turned-back
// hook at its end)
const SIDE = (s) => [[s * 18.2, -12], [s * 20, -1], [s * 19.8, 9], [s * 18.6, 16.4], [s * 16.8, 21.4], [s * 14.6, 24.6]];
const SIDE_W = (u) => (u < 0.55 ? lerp(7.2, 6, u / 0.55) : 6 * Math.cos(((u - 0.55) / 0.45) * Math.PI * 0.5) ** 0.85 + 0.35);
export const RING_ROOT = (s) => [s * 19.6, 9];

function backPiece() {
  return piece('mg:back', [-36, -46, 36, 28], (P) => {
    // the hair behind her head, deep
    const right = [[22.8, -6], [23.8, 5], [22.4, 14], [18.6, 19.4]];
    const pts = [...right, [10, 17], [0, 16], [-10, 17], ...right.map(([x, y]) => [-x, y]).reverse(), [-21.8, -22], [-12.2, -30.6], [0, -32.4], [12.2, -30.6], [21.8, -22]];
    const back = smooth(pts, 5);
    P.add(back, lin(0, -32, 0, 18, [[0, mixHex(HR.base, HR.sh1, 0.4)], [1, mixHex(HR.sh1, HR.sh2, 0.5)]]));
    P.band(back, [[-18, 10], [0, 13], [18, 10]], 7, rgba(HR.deep, 0.45), { blur: 1.2 });
    // her updo's bun, high at the back toward the flowers: hair wound into a soft ball, its wind shown
    // by soft spiral creases, its underside deep, a gloss arc on its upper side, a loose lock wrapped
    // round it
    const bx = 10;
    const by = -31;
    const rr = 11.8;
    const a0 = 0.28;
    const bun = ell(bx, by, rr * 1.08, rr * 0.88, a0);
    P.add(bun, rad(bx + rr * 0.3, by - rr * 0.4, rr * 1.7, [[0, mixHex(HR.base, HR.hi, 0.32)], [0.5, HR.base], [1, mixHex(HR.base, HR.sh1, 0.6)]]));
    P.detail(ell(bx - rr * 0.2, by + rr * 0.42, rr * 0.9, rr * 0.5, a0), rgba(HR.sh1, 0.65), { clip: bun, blur: 0.7 });
    for (const [ph, al] of [[0.4, 0.45], [2.2, 0.3]]) {
      const sp = [];
      for (let k = 0; k <= 36; k++) {
        const t = k / 36;
        const an = ph + t * Math.PI * 2.1;
        const rk = rr * (0.16 + 0.78 * t);
        sp.push([bx + Math.cos(an) * rk * 1.08, by + Math.sin(an) * rk * 0.88]);
      }
      P.detail(poly(ribbon(sp, swell(0.9, 0.06), { n: 1 })), rgba(HR.sh2, al), { clip: bun, blur: 0.25 });
    }
    const g = [];
    for (let k = 0; k <= 8; k++) {
      const an = -2.4 + (k / 8) * 1.6;
      g.push([bx + Math.cos(an) * rr * 0.74, by + Math.sin(an) * rr * 0.62]);
    }
    P.band(bun, g, swell(1.5, 0.05), rgba(HR.hi, 0.7), { blur: 0.25, n: 2 });
    P.band(bun, g.slice(2, 7), swell(0.5, 0.03), rgba('#ffffff', 0.7), { blur: 0.1, n: 2 });
    // (locks wound round it, so it reads as hair coiled up, not a ball: two broad locks sweeping over it,
    // each with its fine edge and a glint where it turns over the top)
    const fillB = rad(bx + rr * 0.3, by - rr * 0.5, rr * 1.8, [[0, mixHex(HR.base, HR.hi, 0.36)], [0.55, HR.base], [1, mixHex(HR.base, HR.sh1, 0.55)]]);
    hlock(P, HR, [[bx - rr * 0.92, by + rr * 0.36], [bx - rr * 0.7, by - rr * 0.42], [bx - rr * 0.06, by - rr * 0.78], [bx + rr * 0.62, by - rr * 0.52], [bx + rr * 0.86, by + rr * 0.04]], taper(rr * 0.5, rr * 0.22, 0.3), { shade: 1, fill: fillB, outline: false, edge: 0.6, gy: [by - rr, by - rr * 0.5], strands: 2, fy: FY });
    hlock(P, HR, [[bx - rr * 0.5, by + rr * 0.62], [bx - rr * 0.1, by + rr * 0.06], [bx + rr * 0.5, by - rr * 0.18], [bx + rr * 0.9, by + rr * 0.3]], taper(rr * 0.38, rr * 0.18, 0.3), { shade: -1, fill: fillB, outline: false, edge: 0.55, gloss: 0.6, gy: [by - rr * 0.3, by + rr * 0.1], strands: 1, fy: FY });
    // the lock wound round its base
    hlock(P, HR, [[bx - 11, by + 4], [bx - 4, by + 8.6], [bx + 5, by + 8.2], [bx + 11.4, by + 3]], taper(4.2, 3.2, 0.25), { shade: -1, fy: FY, gy: [by + 4, by + 9], strands: 2, edge: 0.5 });
  }, { out: HAIR_OUT, lw: LWD });
}
export function ringletPiece(s) {
  const [x0, y0] = RING_ROOT(s);
  return piece(`mg:ring:${s}`, [x0 - 10, y0 - 6, x0 + 10, y0 + 50], (P) => {
    // (the lock it hangs from, out from behind her ear)
    hlock(P, HR, [[x0 - s * 1.4, y0 - 4], [x0 + s * 0.6, y0 + 1], [x0, y0 + 4]], taper(6.4, 6, 0.1), { shade: s, gloss: 0, fy: FY, strands: 1 });
    corkscrew(P, HR, x0, y0 + 3, 39, 5.8, s, { turns: 5, r0: 3.4, r1: 1.7, fy: FY, wEnd: 0.36, open: 0.32 });
  }, { out: HAIR_OUT, lw: LWD * 0.72, fade: [y0 + 26, y0 + 50, 0.42] });
}
export function sidePiece(s) {
  return piece(`mg:side:${s}`, [s > 0 ? 8 : -26, -16, s > 0 ? 26 : -8, 26], (P) => {
    const line = SIDE(s);
    const shape = hlock(P, HR, line, SIDE_W, { shade: -s, fy: FY, gy: [-6, 2], strands: 2, rim: 0.7, edge: 0.45 });
    // (the side toward her face deep where it tucks under the fringe; a little rosy bounce light low on
    // its inner edge)
    P.detail(ell(s * 18.4, -9, 6, 4.4), rgba(HR.sh2, 0.45), { clip: shape, blur: 0.9 });
    const ie = sideOf(line, SIDE_W, s * 0.84);
    P.band(shape, ie.slice(Math.round(ie.length * 0.45), -8), swell(0.9, 0.05), rgba('#ffb0cc', 0.4), { blur: 0.3, n: 1 });
  }, { out: HAIR_OUT, lw: LWD });
}
function capPiece() {
  return piece('mg:cap', [-26, -40, 26, 6], (P) => {
    const cap = poly(capPts());
    const fill = lin(0, -31, 0, 4, [[0, mixHex(HR.base, HR.hi, 0.3)], [0.5, HR.base], [1, mixHex(HR.base, HR.sh1, 0.36)]]);
    P.add(cap, fill);
    // (its edge a touch deeper; its sides deeper where her head turns away)
    P.detail(poly(cr(ribbon(EDGE, () => 3, { n: 4 }), true, 2)), rgba(HR.sh1, 0.4), { clip: cap, blur: 0.6 });
    const sides = new Path2D();
    sides.rect(-30, -34, 60, 40);
    P.detail(sides, lin(-25, 0, 25, 0, [[0, rgba(HR.sh1, 0.4)], [0.25, rgba(HR.sh1, 0)], [0.75, rgba(HR.sh1, 0)], [1, rgba(HR.sh1, 0.32)]]), { clip: cap });
    // (strands combed back from the hairline toward the bun)
    for (const k of [-14, -8, -2, 4, 10]) {
      P.band(cap, [[k * 1.1, -14 - Math.abs(k) * 0.1], [k * 0.9 + 3, -22], [k * 0.6 + 8, -28.6]], swell(0.4, 0.02), rgba(HR.sh2, 0.32), { blur: 0.12, n: 4 });
    }
    // a ring of shine round the crown, fading at its ends, and rosy moonlight along its upper edge
    const arcY = (dx) => -21 + 6.2 * (dx / 20) ** 2;
    const bandPts = [];
    for (let k = 0; k <= 40; k++) bandPts.push([-20 + k, arcY(-20 + k)]);
    const fade = (a, col) => lin(-20, 0, 20, 0, [[0, rgba(col, 0)], [0.2, rgba(col, a)], [0.8, rgba(col, a)], [1, rgba(col, 0)]]);
    P.detail(poly(cr(ribbon(bandPts, () => 4.2, { n: 1 }), true, 2)), fade(0.42, HR.hi), { clip: cap, blur: 0.8 });
    P.detail(poly(cr(ribbon(bandPts, () => 1.3, { n: 1 }), true, 2)), fade(0.5, '#ffffff'), { clip: cap, blur: 0.3 });
    const rimL = CROWN.slice(1, 5).map(([x, y]) => [x - 1.6, y + 1.3]).reverse();
    P.band(cap, rimL, swell(1.3, 0.05), rgba(HR.rim, 0.6), { blur: 0.35 });
  }, { out: HAIR_OUT, lw: LWD });
}
function fringePiece() {
  return piece('mg:fringe', [-26, -32, 26, 8], (P) => {
    const fill = lin(0, -31, 0, 4, [[0, mixHex(HR.base, HR.hi, 0.3)], [0.5, HR.base], [1, mixHex(HR.base, HR.sh1, 0.36)]]);
    const shapes = FRINGE.map(([line, w, sh], i) => hlock(P, HR, line, w, { shade: sh, fill, gloss: 0, gy: [-21, -15], strands: i < 5 ? 2 : 1, outline: i < 5, tone: i >= 5 ? -0.06 : 0 }));
    // (the fine dark line between locks runs down each lock's sides only, from below the parting, so no
    // loops show where they start)
    FRINGE.forEach(([line, w], i) => {
      if (i >= 5) return;
      for (const k of [-0.97, 0.97]) {
        const e = sideOf(line, w, k);
        P.stroke(e.slice(Math.round(e.length * 0.3)), rgba(HR.sh2, 0.55), 0.45);
      }
    });
    // (one ring of shine running on across every lock, matching the crown's, broken where the locks part)
    const arcY = (dx) => -16.4 + 5.6 * (dx / 20) ** 2;
    const ring = [];
    for (let k = 0; k <= 40; k++) ring.push([-20 + k, arcY(-20 + k)]);
    const fade = (a, col) => lin(-20, 0, 20, 0, [[0, rgba(col, 0)], [0.25, rgba(col, a)], [0.75, rgba(col, a)], [1, rgba(col, 0)]]);
    // (crisp, thin and broken into short glints, one along each lock, so it reads as glossy hair, not a
    // smear)
    shapes.forEach((sh, i) => {
      const [line, w, side] = FRINGE[i];
      const mid = sideOf(line, w, -side * 0.12);
      const hit = mid.findIndex(([x, y]) => y > arcY(x) - 0.4);
      if (hit < 0) return;
      const seg = mid.slice(Math.max(0, hit - 3), hit + 4);
      if (seg.length < 3) return;
      const k = i < 5 ? 1 : 0.7;
      P.detail(poly(ribbon(seg, swell(1.15 * k, 0.05), { n: 1 })), rgba(HR.hi, 0.55), { clip: sh, blur: 0.25 });
      P.detail(poly(ribbon(seg.slice(1, -1), swell(0.42 * k, 0.03), { n: 1 })), rgba('#ffffff', 0.8), { clip: sh, blur: 0.08 });
    });
    void fade;
    void ring;
    // (fine wisps: baby hairs at her temples and a few loose strands slipping from the fringe's tips)
    const wisp = (pts, w, al) => P.stroke(cr(pts, false, 6), rgba(HR.sh1, al), w, { blur: 0.08 });
    for (const s of [-1, 1]) {
      wisp([[s * 19.4, -3.6], [s * 20.4, 1.4], [s * 19.6, 5.8]], 0.42, 0.85);
      wisp([[s * 18.6, -1.6], [s * 19, 3], [s * 17.9, 6.6]], 0.3, 0.6);
    }
    wisp([[13.6, -4.2], [16.2, -0.4], [16.8, 3.4]], 0.36, 0.75);
    wisp([[-14.2, -6], [-16.4, -1.6], [-16.4, 2.6]], 0.34, 0.7);
  }, { out: HAIR_OUT, lw: LWD });
}

// ---------- Her marigolds ----------
// A marigold: three rings of ruffled petals, each petal a little fan with a scalloped edge, deep orange at
// its heart lightening to gold at its frill, fine grooves down it; a tight swirled heart.
function petal(P, x, y, r0, r1, an, wid, cols) {
  const pts = [];
  const N = 10;
  const d = [Math.cos(an), Math.sin(an)];
  const n = [-d[1], d[0]];
  pts.push([x + d[0] * r0 - n[0] * wid * 0.2, y + d[1] * r0 - n[1] * wid * 0.2]);
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const side = lerp(-1, 1, u);
    const frill = Math.abs(Math.sin(u * Math.PI * 3)) * 0.12 * (r1 - r0);
    const rr = r1 - (side * side) * 0.18 * (r1 - r0) + frill;
    pts.push([x + d[0] * rr + n[0] * side * wid * 0.5, y + d[1] * rr + n[1] * side * wid * 0.5]);
  }
  pts.push([x + d[0] * r0 + n[0] * wid * 0.2, y + d[1] * r0 + n[1] * wid * 0.2]);
  const p = poly(cr(pts, true, 2));
  P.add(p, rad(x, y, r1 * 1.05, [[0, cols[2]], [0.55, cols[1]], [1, cols[0]]]), false, { stroke: rgba(GOLDEN[4], 0.35), slw: 0.22 });
  for (const s of [-0.22, 0, 0.22]) {
    P.stroke([[x + d[0] * r0 * 1.2 + n[0] * s * wid * 0.3, y + d[1] * r0 * 1.2 + n[1] * s * wid * 0.3], [x + d[0] * r1 * 0.86 + n[0] * s * wid * 0.62, y + d[1] * r1 * 0.86 + n[1] * s * wid * 0.62]], rgba(GOLDEN[4], 0.28), 0.18, { clip: p });
  }
  return p;
}
function marigold(P, x, y, r, turn = 0) {
  // its outline (the flower's silhouette)
  P.add(ell(x, y, r * 1.02, r * 0.96), 'rgba(0,0,0,0)');
  P.detail(ell(x + 0.4, y + 0.8, r, r * 0.94), rgba(HR.deep, 0.35), { blur: 0.8 });
  const rings = [[12, 0.32, 1, [GOLDEN[2], GOLDEN[3], GOLDEN[4]], 0.62], [10, 0.22, 0.76, [GOLDEN[1], GOLDEN[2], GOLDEN[3]], 0.6], [8, 0.1, 0.5, [GOLDEN[0], GOLDEN[1], GOLDEN[3]], 0.56]];
  for (const [n, r0, r1, cols, wk] of rings) {
    for (let i = 0; i < n; i++) {
      const an = turn + (i / n) * TAU + r1 * 1.3;
      petal(P, x, y, r * r0, r * r1, an, r * r1 * wk * (TAU / n) * 1.6, cols);
    }
  }
  // the heart: a tight swirl, a soft light on its top
  const heart = ell(x, y, r * 0.2, r * 0.19);
  P.detail(heart, rad(x - r * 0.05, y - r * 0.06, r * 0.22, [[0, GOLDEN[2]], [1, GOLDEN[4]]]));
  const sp = [];
  for (let k = 0; k <= 20; k++) {
    const an = (k / 20) * TAU * 1.5;
    const rk = r * 0.16 * (k / 20);
    sp.push([x + Math.cos(an) * rk, y + Math.sin(an) * rk]);
  }
  P.stroke(sp, rgba('#8a3a10', 0.6), 0.25, { clip: heart });
  P.detail(ell(x - r * 0.3, y - r * 0.32, r * 0.36, r * 0.2, -0.6), rgba('#ffffff', 0.38), { blur: 0.4 });
}
function leaf(P, x, y, len, wid, an) {
  const d = [Math.cos(an), Math.sin(an)];
  const n = [-d[1], d[0]];
  const at = (u, s) => [x + d[0] * len * u + n[0] * s * wid * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.8, y + d[1] * len * u + n[1] * s * wid * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.8];
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push(at(i / 8, 0.5));
  for (let i = 8; i >= 0; i--) pts.push(at(i / 8, -0.5));
  const p = poly(cr(pts, true, 2));
  P.add(p, lin(x, y, x + d[0] * len, y + d[1] * len, [[0, LEAF[2]], [0.6, LEAF[1]], [1, LEAF[0]]]));
  P.detail(poly(ribbon([at(0, 0), at(0.5, -0.15), at(1, -0.5)], () => wid * 0.5, { n: 4 })), rgba(LEAF[3], 0.35), { clip: p, blur: 0.4 });
  P.stroke(cr([at(0.05, 0), at(0.5, 0.04), at(0.92, 0)], false, 4), rgba(LEAF[3], 0.6), 0.28, { clip: p });
  P.detail(poly(ribbon([at(0.2, 0.22), at(0.55, 0.28), at(0.8, 0.2)], swell(0.6, 0.03), { n: 4 })), rgba('#ffffff', 0.4), { clip: p, blur: 0.2 });
}
function flowersPiece() {
  return piece('mg:flowers', [2, -40, 30, -8], (P) => {
    leaf(P, 15, -22, 9, 4.2, -0.4);
    leaf(P, 17, -17, 8, 3.6, 0.55);
    leaf(P, 11, -28, 7, 3.2, -2.3);
    // a pearl pin under the flowers
    P.add(ell(21.6, -15, 1.5, 1.5), rad(21.6, -15, 1.6, [[0, '#ffffff'], [0.6, '#fdf2f6'], [1, '#e6cfe0']], 21.1, -15.6));
    marigold(P, 19.6, -19.4, 4.2, 0.4);
    marigold(P, 10, -28.4, 3.2, 1.1);
    marigold(P, 14.4, -24.6, 5.8, 0);
  }, { out: OUT, lw: LWD });
}

// ---------- Her face ----------
// The eye in each expression: lid (the upper lid lowered, share of the height), lift (outer corner
// raised; hers rest a little low), ik (iris size), bot (lower lid pushed up), inner (the inner end of
// the upper lid raised, as in sorrow), look (where she looks), wet (brimming).
const EYE_W = 10.4;
const EYE_H = 12.2;
const EYE_Y = 7.4;
const EYES = [[-8.6, -1], [8.6, 1]];
const EXPR = {
  gracious: { eye: { lid: 0.16, lift: -0.03, ik: 1, bot: 0.04 }, mouth: 'smile', brow: 0, blush: 0.55 },
  delighted: { eye: { lid: 0.02, lift: 0.03, ik: 1.04, bot: 0.12 }, mouth: 'open', brow: -0.6, blush: 0.85 },
  pleading: { eye: { lid: 0.06, lift: -0.1, ik: 1.06, inner: 0.12, wet: true }, mouth: 'o', brow: 1, blush: 0.6 },
  wistful: { eye: { lid: 0.3, lift: -0.08, ik: 0.96, look: [-0.1, 0.05] }, mouth: 'flat', brow: 0.7, blush: 0.45 },
  teary: { eye: { lid: 0.12, lift: -0.1, ik: 1.03, inner: 0.1, wet: true }, mouth: 'wobble', brow: 1, blush: 0.65, tear: true },
  dreamy: { closed: 'happy', mouth: 'smile', brow: -0.2, blush: 0.75 },
  focus: { eye: { lid: 0.4, lift: 0.02, ik: 0.96, look: [0.12, 0] }, mouth: 'purse', brow: -1, blush: 0.4 },
  hurt: { closed: 'hurt', mouth: 'grit', brow: 1.2, blush: 0.4 },
  dizzy: { closed: 'dizzy', mouth: 'wave', brow: 0.8, blush: 0.4 },
  sleep: { closed: 'down', mouth: 'tinyo', brow: 0, blush: 0.5 },
};
export const MG_FACES = Object.keys(EXPR);
function eyeGeom(x, y, w, h, o, sp) {
  const L = (sp.lid ?? 0) * h;
  const inn = (sp.inner ?? 0) * h;
  const b = (sp.bot ?? 0) * h;
  const lift = sp.lift ?? 0;
  const inner = [x - o * w * 0.5, y + h * 0.1];
  const outer = [x + o * w * 0.53, y + h * (0.05 - lift)];
  const top = [inner, [x - o * w * 0.3, y - h * 0.32 + L * 0.7 - inn], [x + o * w * 0.02, y - h * 0.44 + L - inn * 0.4], [x + o * w * 0.32, y - h * 0.37 + L * 0.9], outer];
  const bot = [outer, [x + o * w * 0.36, y + h * 0.31 - b * 0.8], [x + o * w * 0.02, y + h * 0.44 - b], [x - o * w * 0.3, y + h * 0.36 - b * 0.9], inner];
  return { inner, outer, top, bot };
}
// the frame along a lid line: its tangent and its outward normal (o: which way is outward)
function lidFrame(lid, i, o) {
  const N = lid.length;
  const a = lid[Math.max(0, i - 1)];
  const b = lid[Math.min(N - 1, i + 1)];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  return { t, n: [o * t[1], -o * t[0]] };
}
// Her upper lash: thin at the inner corner, thickening outward to a soft wing that droops a little
// before it lifts; three round-tipped clumps flicked from its top; a soft plum sheen along it.
function upperLash(P, lid, inner, outer, o) {
  const N = lid.length;
  const thick = (u) => 0.45 + 2.2 * (u < 0.15 ? u / 0.15 * 0.3 : 0.3 + 0.7 * ((u - 0.15) / 0.85) ** 0.8);
  const topAt = (i) => {
    const { n } = lidFrame(lid, i, o);
    const u = i / (N - 1);
    return [lid[i][0] + n[0] * thick(u), lid[i][1] + n[1] * thick(u)];
  };
  const flick = (i, len, tilt) => {
    const { t, n } = lidFrame(lid, i, o);
    const base = topAt(i);
    const d = [n[0] * Math.cos(tilt) + t[0] * Math.sin(tilt), n[1] * Math.cos(tilt) + t[1] * Math.sin(tilt)];
    const pp = [-d[1], d[0]];
    const tip = [base[0] + d[0] * len, base[1] + d[1] * len];
    const r = 0.36;
    return [[tip[0] - d[0] * 0.5 + pp[0] * r * o, tip[1] - d[1] * 0.5 + pp[1] * r * o], tip, [tip[0] - d[0] * 0.5 - pp[0] * r * o, tip[1] - d[1] * 0.5 - pp[1] * r * o]];
  };
  const { t: tw } = lidFrame(lid, N - 1, o);
  const W = (a, b) => [outer[0] + tw[0] * a, outer[1] + tw[1] * a - b];
  const wing = [W(0.8, 0.1), W(1.7, 0.2), W(2.5, 0.7), W(2.6, 1.4), W(1.9, 1.9), W(0.8, 2.4)];
  const fl = [[Math.round((N - 1) * 0.56), 1.0, 0.85], [Math.round((N - 1) * 0.74), 1.3, 1.0], [Math.round((N - 1) * 0.9), 1.5, 1.2]];
  const top = [];
  for (let i = N - 2; i >= 1; i--) {
    const f = fl.find(([j]) => j === i);
    if (f) top.push(...flick(i, f[1], f[2]));
    else if (fl.some(([j]) => Math.abs(i - j) <= 1)) continue;
    else top.push(topAt(i));
  }
  const shape = poly(cr([...lid, ...wing, ...top], true, 3));
  P.add(shape, lin(inner[0], inner[1], outer[0], outer[1], [[0, mixHex(LASH, EY.mid, 0.35)], [0.35, LASH], [1, LASH]]), false);
  const sheen = [];
  for (let i = Math.round(N * 0.24); i <= Math.round(N * 0.8); i += 2) {
    const { n } = lidFrame(lid, i, o);
    const u = i / (N - 1);
    sheen.push([lid[i][0] + n[0] * thick(u) * 0.58, lid[i][1] + n[1] * thick(u) * 0.58]);
  }
  P.band(shape, sheen, swell(0.5, 0.04), rgba('#c07aa0', 0.6), { blur: 0.12, n: 3 });
  return shape;
}
function openEye(P, clip, x, y, w, h, o, sp) {
  const { inner, outer, top, bot } = eyeGeom(x, y, w, h, o, sp);
  const topC = cr(top, false, 8);
  const botC = cr(bot, false, 8);
  const N = topC.length;
  // the lid: a warm peach wash, deepest toward the outer corner; its crease
  const wash = [];
  for (let i = 2; i < N; i++) {
    const { n } = lidFrame(topC, i, o);
    const u = i / (N - 1);
    wash.push([topC[i][0] + n[0] * (1.5 + 1.3 * u), topC[i][1] + n[1] * (1.5 + 1.3 * u)]);
  }
  P.detail(poly(ribbon(wash, (u) => 1.3 + 2.4 * u, { n: 2 })), lin(inner[0], inner[1], outer[0], outer[1], [[0, rgba('#f6a690', 0.08)], [0.6, rgba('#f29a92', 0.38)], [1, rgba('#e0849a', 0.55)]]), { clip, blur: 0.9 });
  const crease = [];
  for (let i = Math.round(N * 0.26); i < N - 1; i++) {
    const { n } = lidFrame(topC, i, o);
    const u = i / (N - 1);
    crease.push([topC[i][0] + n[0] * (2.8 + 0.8 * u), topC[i][1] + n[1] * (2.8 + 0.8 * u)]);
  }
  P.band(clip, crease, swell(0.42, 0.04), rgba('#c27890', 0.5), { blur: 0.1, n: 2 });
  // the white: cool under the lid, a warm inner corner, soft shade along the bottom
  const white = poly([...topC, ...botC.slice(1, -1)]);
  P.detail(white, lin(x, y - h * 0.45, x, y + h * 0.45, [[0, '#ecdde8'], [0.45, '#fffbfb'], [1, '#ffffff']]));
  P.detail(ell(inner[0] + o * 0.9, inner[1] - 0.2, 1.5, 1.2), rgba('#f2a8b8', 0.75), { clip: white, blur: 0.2 });
  P.band(white, botC.slice(1, -1), swell(0.9, 0.1), rgba('#e8d2de', 0.6), { blur: 0.3, n: 2 });
  // the iris: honey, deep under the lid, a warm glow pooling low, fibres of light, a plum rim
  const look = sp.look ?? [0, 0];
  const ix = x + o * w * 0.03 + look[0] * w;
  const iy = y + h * 0.06 + look[1] * h;
  const ik = sp.ik ?? 1;
  const irx = w * 0.4 * ik;
  const iry = h * 0.5 * ik;
  const iris = ell(ix, iy, irx, iry);
  const C = [white, iris];
  P.detail(iris, rad(ix, iy + iry * 0.4, iry * 1.15, [[0, EY.lt], [0.36, EY.base], [0.72, EY.mid], [1, EY.dk]]), { clip: white });
  P.detail(iris, lin(ix, iy - iry, ix, iy + iry, [[0, rgba(EY.dk, 0.95)], [0.36, rgba(EY.dk, 0.5)], [0.6, rgba(EY.dk, 0)]]), { clip: white });
  for (let k = 0; k < 15; k++) {
    const q = Math.PI * 0.05 + (k / 14) * Math.PI * 0.9;
    const r1 = k % 2 ? 0.8 : 0.9;
    P.detail(poly(ribbon([[ix + Math.cos(q) * irx * 0.34, iy + Math.sin(q) * iry * 0.34], [ix + Math.cos(q) * irx * r1, iy + Math.sin(q) * iry * r1]], (u) => 0.34 * (1 - u) + 0.1, { n: 2 })), rgba(EY.glow, 0.34), { clip: C });
  }
  P.items.push({ path: ell(ix, iy + iry * 0.03, irx * 0.72, iry * 0.72), line: false, strokeOnly: rgba(EY.ring, 0.45), slw: 0.45, clip: white });
  const pool = new Path2D();
  pool.ellipse(ix, iy + iry * 0.2, irx * 0.82, iry * 0.74, 0, Math.PI * 0.1, Math.PI * 0.9);
  pool.ellipse(ix, iy + iry * 0.04, irx * 0.78, iry * 0.62, 0, Math.PI * 0.88, Math.PI * 0.12, true);
  pool.closePath();
  P.detail(pool, lin(ix, iy + iry * 0.3, ix, iy + iry * 0.92, [[0, rgba(EY.lt, 0.2)], [1, rgba(EY.glow, 0.9)]]), { clip: C, blur: 0.25 });
  P.items.push({ path: iris, line: false, strokeOnly: rgba(EY.dk, 0.85), slw: 0.6, clip: white });
  P.detail(ell(ix, iy + iry * 0.02, w * 0.19, h * 0.25), rgba(EY.dk, 0.38), { clip: white, blur: 0.2 });
  P.detail(ell(ix, iy + iry * 0.02, w * 0.14, h * 0.2), EY.pupil, { clip: white });
  // the lid's shadow across the top of the eye
  P.detail(poly(ribbon(top, (u) => h * 0.24 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)) + 0.4, { n: 8, caps: false })), rgba('#8a4a6a', 0.42), { clip: white });
  // her lights: the marigold glint (five petals), a little round light low, a tiny twinkle
  const gx = ix + o * w * 0.12;
  const gy = iy - iry * 0.32;
  for (let i = 0; i < 5; i++) {
    const an = (i / 5) * TAU - Math.PI / 2;
    P.detail(ell(gx + Math.cos(an) * w * 0.065, gy + Math.sin(an) * w * 0.065, w * 0.062, w * 0.045, an), '#ffffff', { clip: white });
  }
  P.detail(ell(gx, gy, w * 0.035, w * 0.035), rgba(EY.lt, 0.95), { clip: white });
  P.detail(ell(ix - o * w * 0.16, iy + iry * 0.36, w * 0.06, w * 0.055), 'rgba(255,255,255,0.95)', { clip: white });
  star4(P, ix + o * w * 0.24, iy + iry * 0.22, w * 0.07, 'rgba(255,255,255,0.85)', 0.3, { clip: white });
  if (sp.wet) {
    P.band(white, botC.slice(2, -2), swell(1.1, 0.1), rgba('#d8f0ff', 0.7), { blur: 0.2, n: 2 });
    P.detail(ell(ix + o * w * 0.2, iy + iry * 0.55, w * 0.12, w * 0.04), 'rgba(255,255,255,0.9)', { clip: white });
  }
  // the lower lid: a pink waterline, a soft fine lash line on its outer half, two small lashes, the soft
  // light on the cheek beneath
  P.stroke(cr(bot, false, 8).slice(2, -2), rgba('#f0a8b6', 0.75), 0.4, { clip });
  const lowOut = botC.slice(0, Math.round(botC.length * 0.62)).map(([px, py]) => [px, py + 0.35]);
  P.band(clip, lowOut, (u) => 0.55 * (1 - u) + 0.08, rgba(LASH, 0.65), { n: 1 });
  for (const [u, len] of [[0.16, 1.1], [0.34, 0.9]]) {
    const i = Math.round(u * (botC.length - 1));
    const p = botC[i];
    P.band(clip, [[p[0], p[1] + 0.3], [p[0] + o * len * 0.4, p[1] + len * 0.7], [p[0] + o * len * 0.75, p[1] + len * 0.95]], (v) => 0.32 * (1 - v) + 0.06, rgba(LASH, 0.7), { n: 3 });
  }
  const lowMid = botC[Math.round(botC.length * 0.45)];
  P.detail(ell(lowMid[0], lowMid[1] + 1.7, w * 0.3, 0.9), rgba('#ffffff', 0.32), { clip, blur: 0.6 });
  upperLash(P, topC, inner, outer, o);
}
// Eyes closed: 'happy' a soft ∩ with its lashes curling up and the cheek pushing up beneath; 'down' a
// soft ∪ (asleep, a blink); 'hurt' squeezed shut, '>' and '<'; 'dizzy' little spirals.
function closedEye(P, clip, x, y, w, o, kind) {
  if (kind === 'dizzy') {
    const sp = [];
    for (let i = 0; i <= 40; i++) {
      const an = i * 0.42 * o;
      const r = 0.2 + i * 0.09;
      sp.push([x + Math.cos(an) * r, y + 1 + Math.sin(an) * r * 0.9]);
    }
    P.band(clip, sp, () => 0.7, LASH, { n: 1 });
    return;
  }
  if (kind === 'hurt') {
    const a = [x - o * w * 0.48, y - 2.2];
    const m = [x + o * w * 0.3, y + 0.9];
    const b = [x - o * w * 0.48, y + 3.6];
    P.band(clip, [a, [x - o * w * 0.05, y - 0.2], m], (u) => 0.6 + u * 0.8, LASH, { n: 4 });
    P.band(clip, [m, [x - o * w * 0.05, y + 2.2], b], (u) => 1.4 - u * 0.8, LASH, { n: 4 });
    return;
  }
  const up = kind === 'happy' ? -1 : 1;
  const yy = y + 1.2;
  const line = [[x - o * w * 0.5, yy], [x - o * w * 0.1, yy + up * 2.4], [x + o * w * 0.3, yy + up * 2.1], [x + o * w * 0.56, yy - (up < 0 ? 0 : 0.4)]];
  P.band(clip, line, (u) => 0.5 + 1.5 * Math.sin(Math.PI * Math.min(1, u * 0.8 + 0.1)), LASH, { n: 6 });
  // a soft little wing and two lashes
  const e = line[3];
  P.band(clip, [e, [e[0] + o * 1.2, e[1] - 0.6], [e[0] + o * 1.9, e[1] - 1.6]], (u) => 1 - u * 0.7, LASH, { n: 3 });
  for (const u of [0.55, 0.8]) {
    const q = along(line, u);
    const d = up > 0 ? 1 : -1;
    P.band(clip, [q.p, [q.p[0] + o * 0.5, q.p[1] + d * 1.1], [q.p[0] + o * 1.1, q.p[1] + d * 1.6]], (v) => 0.36 * (1 - v) + 0.06, LASH, { n: 3 });
  }
  if (kind === 'happy') P.detail(ell(x, yy + 3.2, w * 0.36, 1.1), rgba('#ffffff', 0.35), { clip, blur: 0.5 });
}
function brows(P, clip, lift) {
  for (const [s, o] of [[-1, -1], [1, 1]]) {
    const y = -3 - Math.max(0, -lift) * 1.2;
    const innerY = y + (lift > 0 ? -lift * 1.6 : -lift * -1.4);
    const pts = [[o * 3.8, innerY + 0.8], [o * 7.8, y - 1.1 - (lift > 0 ? -lift * 0.3 : 0)], [o * 12.6, y + 0.7 + (lift > 0 ? lift * 0.8 : 0)]];
    P.band(clip, pts, (u) => (u < 0.2 ? lerp(0.7, 1.15, u / 0.2) : lerp(1.15, 0.22, (u - 0.2) / 0.8)), mixHex(HR.sh1, HR.sh2, 0.4), { n: 6 });
    void s;
  }
}
function nose(P, clip) {
  P.band(clip, [[-0.2, 9.8], [-0.9, 12.2], [-0.4, 13.4], [0.9, 13.6]], swell(0.9, 0.1), rgba(SK.sh2, 0.55), { blur: 0.5, n: 4 });
  P.detail(ell(0.9, 12.6, 0.9, 0.55), rgba('#ffffff', 0.75), { clip, blur: 0.25 });
  P.detail(ell(0.2, 13.3, 1, 0.5), rgba(SK.blush, 0.25), { clip, blur: 0.4 });
}
function mouth(P, clip, kind) {
  const my = 17.6;
  const lips = (pts, w) => P.band(clip, pts, w, SK.lipDk, { n: 6 });
  const under = (a = 0.45) => P.detail(ell(0, my + 1.5, 1.6, 0.55), rgba(SK.lip, a), { clip, blur: 0.3 });
  const open = (pts, tongue = true) => {
    const p = smooth(pts, 4);
    P.detail(p, SK.mouth, { clip, stroke: SK.lipDk, slw: 0.45 });
    if (tongue) {
      const ys = pts.map((q) => q[1]);
      const yb = Math.max(...ys);
      P.detail(ell(0, yb - 0.6, 1.8, 1.1), '#f08aa0', { clip: [clip, p] });
    }
    P.detail(ell(-0.6, Math.min(...pts.map((q) => q[1])) + 0.5, 1.2, 0.35), rgba('#ffffff', 0.35), { clip: [clip, p], blur: 0.15 });
  };
  if (kind === 'smile') {
    lips([[-2.8, my - 0.5], [-1.2, my + 0.5], [1.2, my + 0.5], [2.8, my - 0.5]], swell(0.55, 0.12));
    P.band(clip, [[2.8, my - 0.5], [3.3, my - 0.9]], () => 0.3, SK.lipDk, { n: 2 });
    under();
  } else if (kind === 'open') {
    open([[-3, my - 0.6], [0, my - 0.2], [3, my - 0.6], [2.2, my + 1.8], [0, my + 3], [-2.2, my + 1.8]]);
  } else if (kind === 'o') {
    open([[-1.2, my - 0.4], [0, my - 0.8], [1.2, my - 0.4], [1.3, my + 1.2], [0, my + 2], [-1.3, my + 1.2]], false);
  } else if (kind === 'tinyo') {
    open([[-0.7, my], [0, my - 0.3], [0.7, my], [0.7, my + 0.8], [0, my + 1.2], [-0.7, my + 0.8]], false);
  } else if (kind === 'flat') {
    lips([[-2.2, my + 0.2], [0, my - 0.1], [2.2, my + 0.4]], swell(0.42, 0.1));
    under(0.35);
  } else if (kind === 'wobble') {
    lips([[-2.6, my + 0.8], [-1.3, my], [0, my + 0.4], [1.3, my], [2.6, my + 0.8]], swell(0.45, 0.1));
    under(0.3);
  } else if (kind === 'purse') {
    lips([[-1.3, my], [0, my - 0.2], [1.3, my]], swell(0.5, 0.1));
    P.detail(ell(0, my + 1.1, 1.2, 0.5), rgba(SK.lip, 0.5), { clip, blur: 0.25 });
  } else if (kind === 'grit') {
    const p = smooth([[-3, my - 0.4], [0, my - 0.8], [3, my - 0.4], [2.6, my + 1.6], [0, my + 2], [-2.6, my + 1.6]], 4);
    P.detail(p, '#ffffff', { clip, stroke: SK.lipDk, slw: 0.5 });
    P.stroke([[-2.6, my + 0.6], [2.6, my + 0.6]], rgba(SK.lipDk, 0.5), 0.3, { clip: p });
  } else if (kind === 'wave') {
    lips([[-2.8, my + 0.4], [-1.4, my - 0.4], [0, my + 0.4], [1.4, my - 0.4], [2.8, my + 0.4]], () => 0.45);
  } else if (kind === 'talk1') {
    open([[-2, my - 0.4], [0, my - 0.3], [2, my - 0.4], [1.6, my + 1], [0, my + 1.5], [-1.6, my + 1]]);
  } else if (kind === 'talk2') {
    open([[-2.4, my - 0.5], [0, my - 0.4], [2.4, my - 0.5], [1.9, my + 1.8], [0, my + 2.6], [-1.9, my + 1.8]]);
  }
}
export function facePiece(name, blink = false, talk = 0) {
  const ex = EXPR[name] ?? EXPR.gracious;
  return piece(`mg:face:${name}:${blink ? 1 : 0}:${talk}`, [-22, -26, 22, 30], (P) => {
    const head = HEAD();
    P.add(head, lin(0, -23, 0, 25, [[0, SK.hi], [0.55, SK.base], [1, mixHex(SK.base, SK.sh1, 0.4)]]), true, { stroke: rgba(SK.line, 0.4), slw: 0.5 });
    // lit from the upper right; soft shade where her hair frames her face, along her jaw, under her chin
    P.glow(head, 7, -4, 22, SK.hi, 0.6);
    for (const sd of [-1, 1]) {
      const x0 = sd * 15.4;
      P.band(head, [[x0, -4], [x0 + sd * 0.4, 6], [x0 - sd * 0.6, 14], [x0 - sd * 3, 20]], (u) => 3.6 * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.1)) + 0.4, rgba(SK.sh1, sd < 0 ? 0.65 : 0.45), { blur: 1 });
    }
    const far = smooth([[-15.6, -6], [-14.6, 4], [-13.4, 11.6], [-10.4, 17.6], [-5.4, 22.2], [0.4, 24], [-6, 30], [-30, 20], [-30, -8]], 4);
    P.detail(far, rgba(SK.sh1, 0.5), { clip: head, blur: 0.6 });
    P.band(head, [[-9.6, 21.4], [0, 25], [9.6, 21.4]], swell(2.2, 0.3), rgba(SK.sh1, 0.5), { blur: 0.8 });
    // (her face's planes: light on her lit cheekbone, a soft shade beneath it running down to her jaw,
    // a little light on the round of her chin and a soft shade beneath her lower lip, so the head reads
    // as a face, not a ball)
    P.glow(head, 11.4, 8.4, 6.4, SK.hi, 0.6);
    for (const sd of [-1, 1]) {
      P.band(head, [[sd * 17.6, 10], [sd * 15.4, 15.6], [sd * 11.6, 19.8], [sd * 7, 22.6]], swell(2.4, 0.2), rgba(SK.sh1, sd < 0 ? 0.42 : 0.3), { blur: 1.1 });
    }
    P.detail(ell(0.6, 22.6, 3.4, 1.7), rad(0.6, 22.6, 3.4, [[0, rgba(SK.hi, 0.75)], [1, rgba(SK.hi, 0)]]), { clip: head });
    P.detail(ell(0.2, 20.2, 2.6, 0.9), rgba(SK.sh1, 0.32), { clip: head, blur: 0.6 });
    // the hair's shadow on her forehead
    P.detail(poly(capPts().map(([x, y]) => [x + 0.4, y + 1.6])), rgba(SK.sh2, 0.5), { clip: head, blur: 0.7 });
    for (const [line, w] of FRINGE) P.detail(poly(ribbon(line.map(([x, y]) => [x + 0.4, y + 1.4]), w, { n: 8 })), rgba(SK.sh2, 0.45), { clip: head, blur: 0.7 });
    // (a ghost's faint moonlit rim down her lit cheek)
    P.band(head, [[19.2, 0], [18.8, 8], [16.6, 14], [12.6, 19]], swell(1.2, 0.1), rgba('#eef9ff', 0.8), { blur: 0.5 });
    // blush: a wide soft flush, a rosier heart, a tiny gloss high on the cheek
    for (const [bx, o] of [[11.2, 1], [-10.6, -1]]) {
      P.detail(ell(bx, 13.4, 5.6, 2.8), rgba('#f8b4c4', ex.blush * 0.85), { clip: head, blur: 1.1 });
      P.detail(ell(bx + o * 0.2, 13.4, 3.2, 1.5), rgba(SK.blush, ex.blush * 0.9), { clip: head, blur: 0.7 });
      P.detail(ell(bx - o * 0.6, 12.4, 0.7, 0.4), rgba('#ffffff', 0.75), { clip: head, blur: 0.12 });
    }
    // eyes
    const kind = blink ? (ex.closed === 'happy' ? 'happy' : 'down') : ex.closed;
    for (const [x, o] of EYES) {
      if (kind) closedEye(P, head, x, EYE_Y, EYE_W, o, kind);
      else openEye(P, head, x, EYE_Y, EYE_W, EYE_H, o, ex.eye);
    }
    if (ex.tear && !blink) {
      const tx = -13.6;
      const ty = EYE_Y + 6;
      const tp = smooth([[tx, ty - 1.6], [tx + 0.9, ty + 0.4], [tx, ty + 1.4], [tx - 0.9, ty + 0.4]], 3);
      P.detail(tp, lin(tx, ty - 1.6, tx, ty + 1.4, [[0, 'rgba(220,240,255,0.5)'], [1, 'rgba(170,215,255,0.95)']]), { stroke: 'rgba(120,170,220,0.6)', slw: 0.25 });
      P.detail(ell(tx - 0.3, ty + 0.1, 0.3, 0.45), '#ffffff');
    }
    brows(P, head, ex.brow);
    nose(P, head);
    mouth(P, head, talk ? `talk${talk}` : ex.mouth);
  }, { out: OUT, lw: LWD });
}

// ---------- Drawing her head each frame ----------
// (in her head's frame, its middle at the origin, in her design units; `q` her act's state)
// (a ghost's faint cool glow round her head, behind it all, painted once)
function auraPiece() {
  return piece('mg:aura', [-46, -62, 46, 42], (P) => {
    P.detail(ell(2, -8, 44, 48), rad(2, -8, 46, [[0, rgba('#e6f6ff', 0.5)], [0.62, rgba('#d8efff', 0.32)], [1, rgba('#d8efff', 0)]]), { blur: 1 });
  }, { out: OUT, lw: LWD });
}
export function drawHeadBack(ctx, a, mode, q, flash) {
  const j = clamp(a.mgJig ?? 0, -1, 1);
  // (in the outline pass, first, so it lies under every outline and fill, never hazing them)
  if (mode === 'line') drawPiece(ctx, auraPiece(), 'fill', 0);
  // (her updo and back hair squash softly about their foot, keeping their volume)
  ctx.save();
  ctx.translate(0, 16);
  ctx.scale(1 + j * 0.035, 1 / (1 + j * 0.035));
  ctx.translate(0, -16);
  drawPiece(ctx, backPiece(), mode, flash);
  ctx.restore();
  const t = a.t ?? 0;
  for (const s of [-1, 1]) {
    const [x0, y0] = RING_ROOT(s);
    const sw = Math.sin(t * 1.4 + s) * 0.04 - (a.mgLocks ?? 0) * 0.16;
    // (her corkscrew curls bounce like springs from their roots: longer and slimmer, then shorter and
    // fuller, the same amount of hair)
    const k = 1 - j * 0.055;
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(sw);
    // (and their tips trail behind the root, swinging further than it: a shear from the root)
    ctx.transform(1, 0, Math.sin(t * 1.4 + s - 0.7) * 0.03 + j * s * 0.035 - (a.mgLocks ?? 0) * 0.08, 1, 0, 0);
    ctx.scale(1 / k, k);
    ctx.translate(-x0, -y0);
    drawPiece(ctx, ringletPiece(s), mode, flash);
    ctx.restore();
  }
}
export function drawHeadFront(ctx, a, mode, q, flash) {
  const t = a.t ?? 0;
  const f = MG_FACES.includes(q.face) ? q.face : 'gracious';
  const blink = (f === 'gracious' || f === 'delighted' || f === 'focus' || f === 'wistful') && ((t + (a.mo?.uid ?? 0) * 0.41) % 4.7) < 0.13;
  const talk = (q.talk ?? 0) > 0.05 ? 1 + (Math.sin(t * 15) > 0.2 ? 1 : 0) : 0;
  drawPiece(ctx, facePiece(f, blink, talk), mode, flash);
  for (const s of [-1, 1]) {
    const r = [s * 18.2, -12];
    const sw = clamp(-(a.mgLocks ?? 0) * 0.12, -0.12, 0.12);
    ctx.save();
    ctx.translate(r[0], r[1]);
    ctx.rotate(sw);
    ctx.translate(-r[0], -r[1]);
    if (mode === 'fill') {
      ctx.save();
      ctx.clip(HEAD());
      drawPiece(ctx, sidePiece(s), 'line', 0);
      ctx.restore();
    }
    drawPiece(ctx, sidePiece(s), mode, flash);
    ctx.restore();
  }
  drawPiece(ctx, capPiece(), mode, flash);
  const fr = clamp(-(a.mgFringe ?? 0) * 0.06, -0.08, 0.08);
  ctx.save();
  ctx.translate(FRINGE_ROOT[0], FRINGE_ROOT[1]);
  ctx.rotate(fr);
  ctx.translate(-FRINGE_ROOT[0], -FRINGE_ROOT[1]);
  // (the bangs' outline where they lie over her face: the face's own fill would cover the outline pass,
  // so it is drawn again here, only over her face)
  if (mode === 'fill') {
    ctx.save();
    ctx.clip(HEAD());
    drawPiece(ctx, fringePiece(), 'line', 0);
    ctx.restore();
  }
  drawPiece(ctx, fringePiece(), mode, flash);
  ctx.restore();
  drawPiece(ctx, flowersPiece(), mode, flash);
}
