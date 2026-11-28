// The Mirror Twins' heads, final art (2026-11-28; the concept was redrawn from scratch, the player: "concept
// is just place holder"). Painted with the bosses' fine painting kit (render/bossart/kit.js) in their own
// design units (a face about 40 wide, its middle at the origin), one light from the upper right for both.
// Twins: one face shape, round and small as a doll's, full low cheeks, a little soft chin. Everything else
// is each one's own, and opposite:
//   Rondo   jet black hair with a cool blue sheen, a sleek straight bob cut in one blunt line at the
//           jaw, a long lock falling over her left eye; a tiny satin top hat with a white feather pinned
//           on the other side. Stern: one long almond eye, steel blue, half-lidded under a level lid
//           crease, a straight sharp lash wing; straight brows drawn down; a small, exact mouth.
//   Minuet  snow-white hair with a lilac sheen, a soft, full bob whose ends flick outward at the jaw, the
//           same lock over her right eye; a satin bow whose two loops are cut like bat wings. Always
//           grinning: one big round eye, rose pink with a heart glint, curled lashes; high arched brows;
//           a wide smile with one little fang.
import { TAU, lerp, clamp, cr, poly, smooth, ell, ribbon, sideOf, swell, rgba, mixHex, lin, rad, hlock, piece, drawPiece } from '../bossart/kit.js';

export const G = 0.56;
// (fine lines: the twins are drawn 1.7 times their base's size, so the head's lines are thinned to match)
const LWD = 2 / (1.3 * G) / 1.7;

export const TWINS = {
  rondo: {
    who: 'rondo',
    s: 1,
    out: '#3a3458',
    hairOut: '#181830',
    SK: { hi: '#fbfcff', base: '#e8edfb', sh1: '#cfd7f1', sh2: '#adb9df', deep: '#8e9acb', blush: '#eaa9c9', lip: '#c06c88', lipDk: '#7e3452', mouth: '#4a1e34' },
    HR: { hi: '#a6b4f2', lt: '#454a74', base: '#20203a', sh1: '#151528', sh2: '#0e0e1c', deep: '#08080f', rim: '#bcc8f6' },
    EY: { dk: '#1a2452', mid: '#33508e', base: '#6a88c8', lt: '#b8cbf2', pupil: '#0e1430', ring: '#121838' },
    LASH: '#16162c',
    SHADOW: '#8090c4',
  },
  minuet: {
    who: 'minuet',
    s: -1,
    out: '#5a4a80',
    hairOut: '#7a70a8',
    SK: { hi: '#fff8fe', base: '#f6e6f6', sh1: '#e6cfec', sh2: '#cbb0dc', deep: '#aa90cc', blush: '#f6a0c6', lip: '#e47aa6', lipDk: '#a8406c', mouth: '#5c1c40' },
    HR: { hi: '#ffffff', lt: '#ffffff', base: '#f5f2fb', sh1: '#dcd6ee', sh2: '#b7b0d6', deep: '#9088ba', rim: '#ffffff' },
    EY: { dk: '#5c1c52', mid: '#a4448e', base: '#da7ec6', lt: '#f8c6ea', pupil: '#3a0e34', ring: '#3c1238' },
    LASH: '#3a2050',
    SHADOW: '#f2a0c8',
  },
};

// ---------- One face shape for both ----------
const HEAD_PTS = (() => {
  // (a doll's face, defined: full round cheeks at eye level, the sides curving in below them to a small,
  // slightly pointed chin; never a round ball)
  const upR = [[0, -23.4], [10.8, -21.8], [17, -16.2], [19.8, -7.4], [20.2, 2]];
  const lowR = [[19.6, 8.2], [17.8, 13.2], [14.4, 17.6], [10.2, 21], [5.8, 23.4], [2.2, 24.6]];
  const lowL = lowR.map(([x, y]) => [-x, y]).reverse();
  const upL = upR.slice(1).map(([x, y]) => [-x, y]).reverse();
  return cr([...upR, ...lowR, [0, 25], ...lowL, ...upL], true, 3);
})();
export const HEAD = () => poly(HEAD_PTS);

// ---------- Hair ----------
// ---------- Hair (2026-11-28, the player chose style E from the samples: "do E. it needs to be perfect").
// A round bob with blunt bangs, the cuts bowed gently so they read soft and round: bangs cut at the brows,
// and over one eye a longer blunt panel to the cheek; a straight panel in front of each ear cut at the
// chin; behind, a full round bob cut at the jaw. Built the way Fawnelle's hair is: every part a row of
// real locks side by side, each lit by the one light for the whole head, its shade soft down one side,
// fine strands down it, its end cut blunt with soft corners; one band of shine round the head across
// every lock, moonlight along the crown and the outer edges; outlined only where the hair meets the air.
// Twins: the same cut, mirrored (s): the panel falls over Rondo's left eye and Minuet's right.
const E = { open: -3.4, eye: 13.6, side: 19, back: 22.6, w: 26, round: 2.4, bow: 1.4, step: 1.2 };
const hairFillOf = (HR) => lin(0, -32, 0, 28, [[0, mixHex(HR.base, HR.lt, 0.42)], [0.4, mixHex(HR.base, HR.sh1, 0.08)], [1, mixHex(HR.base, HR.sh1, 0.46)]]);
// (the hairline under the bangs: high and round)
const EDGE = [[-23.4, 2], [-20.6, -6], [-14.6, -13], [-8, -16], [0, -16.6], [8, -16], [14.6, -13], [20.6, -6], [23.4, 2]];
// (as wide at its sides as the bob behind it, so the head's outline flows from crown to bob in one curve)
const CROWN = [[25.2, -2], [25.6, -11], [22.2, -21.4], [13, -28.8], [0, -31.6], [-13, -28.8], [-22.2, -21.4], [-25.6, -11], [-25.2, -2]];
// The bangs: the locks across the forehead, for Rondo (s = 1: the panel over her left eye, the viewer's
// right); mirrored for Minuet. Each [line, width, shade side]; the cut bowed gently along each run.
const BANGS = (() => {
  const n = 10;
  const L = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = lerp(-20.4, 20.6, u);
    const panel = x > E.step;
    const cut = panel ? E.eye : E.open;
    const run = panel ? (x - E.step) / (20.6 - E.step) : (x + 20.4) / (E.step + 20.4);
    const bow = E.bow * Math.sin(Math.PI * clamp(run, 0, 1));
    // (rooted well inside the crown, so a lock's flat-cut top never pokes past the head's outline)
    L.push([[[x * 0.5, -25], [x * 0.9, -14], [x, cut - 1.4 + bow]], (v) => 6.6 - v * 0.4, x < 0 ? -1 : 1, panel]);
  }
  return L;
})();
const bangsOf = (s) => BANGS.map(([line, w, sh, panel]) => [line.map(([x, y]) => [x * s, y]), w, sh * s, panel]);
// the panels in front of the ears: two locks each, cut blunt at the chin
const SIDES = [[[19, -6], [21.4, 4], [21.4, E.side - 1.2]], [[17.4, -6], [18.8, 4], [18.8, E.side - 2]]];
// A lock's light: a faint sheen down its lit side (Fawnelle's), on top of the kit's lock painting
function sheen(P, shape, line, w, sh, HR, al = 0.35) {
  const lit = sideOf(line, w, -sh * 0.3);
  P.band(shape, lit.slice(Math.round(lit.length * 0.12), Math.round(lit.length * 0.7)), swell(0.7, 0.04), rgba(HR.lt === HR.base ? '#ffffff' : HR.lt, al), { blur: 0.3 });
}
// The bob behind the head: full and round, cut at the jaw, its outer locks side by side.
function backPiece(T) {
  const { HR, who } = T;
  return piece(`tw:back:${who}`, [-34, -40, 34, E.back + 6], (P) => {
    const fill = hairFillOf(HR);
    const R = [[13, -31], [22.6, -22.6], [25.8, -11], [E.w + E.round * 0.6, -2], [E.w + E.round * 0.7, 6], [E.w + E.round * 0.4, 14], [E.w, E.back - 2.2], [E.w - 1.8, E.back]];
    const pts = [[0, -33], ...R, [0, E.back - 0.8], ...R.map(([x, y]) => [-x, y]).reverse()];
    const mass = smooth(pts, 4);
    P.add(mass, lin(0, -32, 0, E.back, [[0, mixHex(HR.base, HR.sh1, 0.3)], [1, mixHex(HR.sh1, HR.sh2, 0.45)]]));
    P.detail(smooth([[-18, 6], [0, 4], [18, 6], [18.6, E.back - 1], [0, E.back - 1.4], [-18.6, E.back - 1]], 3), rgba(HR.deep, 0.45), { clip: mass, blur: 1.6 });
    for (const sd of [-1, 1]) {
      // (each rooted inside the head's outline, so no lock's flat-cut top pokes past it)
      for (const [x0, x1, w, y0] of [[12, 17.4, 8.2, -18], [15.6, 21.4, 8.2, -14], [18.6, E.w - 2.4, 7.6, -6]]) {
        const line = [[sd * x0, y0], [sd * (x1 + E.round * 0.6), 4], [sd * x1, E.back - 0.8]];
        const ww = (u) => w - u * 0.6;
        const shp = hlock(P, HR, line, ww, { end: 'blunt', shade: -sd, fill, gloss: 0, strands: 2 });
        sheen(P, shp, line, ww, -sd, HR, 0.3);
      }
      P.band(mass, [[sd * (E.w + E.round - 1), -6], [sd * (E.w + E.round - 0.6), 6], [sd * (E.w - 0.8), 16]], swell(1, 0.05), rgba(HR.rim, 0.5), { blur: 0.4 });
    }
  }, { out: T.hairOut, lw: LWD });
}
// Everything in front of the face, as one piece (so only the hair's outer edge is outlined). `part`:
// 'all' at rest; while the hidden eye opens, 'rest' (all but the long bangs over the eye) and 'panel'
// (those bangs alone, whole, moved aside), drawn so the pair looks just like 'all' until it moves.
// `bend` (0..1, the bangs alone): how far they are pushed aside. Every lock stays whole, its full length,
// rooted where it grows; it bends from the root, its middle arcing out over the brow and its end falling
// beside the eye down the temple, the inner locks bending furthest, so they fold aside the way real
// bangs do (the player, 2026-11-28: "it should fold and look realistic and natural").
const panelIdx = BANGS.map((b, i) => (b[3] ? i : -1)).filter((i) => i >= 0);
function bentLine(i, k) {
  const line = BANGS[i][0];
  const j = panelIdx.indexOf(i);
  const root = line[0];
  const tip = [18.2 + j * 1.6, 11 + j * 0.4];
  const mid = [lerp(root[0], tip[0], 0.55) + 2.6 - j * 0.3, -9 + j * 0.6];
  const e = k * k * (3 - 2 * k);
  return [root, [lerp(line[1][0], mid[0], e), lerp(line[1][1], mid[1], e)], [lerp(line[2][0], tip[0], e), lerp(line[2][1], tip[1], e)]];
}
function frontPiece(T, part = 'all', bend = 0) {
  const { HR, s, who } = T;
  return piece(`tw:front:${who}:${part}:${bend}`, [-30, -40, 34, E.eye + 6], (P) => {
    const fill = hairFillOf(HR);
    const panelOnly = part === 'panel';
    // the side panels first, the bangs over their roots
    if (!panelOnly) for (const sd of [-1, 1]) {
      SIDES.forEach((ln, k) => {
        const line = ln.map(([x, y]) => [sd * x, y]);
        const w = (u) => (k ? 5.4 : 6.4) - u * 0.4;
        const shp = hlock(P, HR, line, w, { end: 'blunt', shade: -sd, fill, gloss: 0, strands: k ? 1 : 2 });
        sheen(P, shp, line, w, -sd, HR, 0.3);
      });
    }
    // the crown down to the hairline, lit from above, deeper at its sides
    const cap = poly(cr([...EDGE, ...CROWN], true, 5));
    if (!panelOnly) {
      P.add(cap, fill);
      const sides = new Path2D();
      sides.rect(-30, -34, 60, 40);
      P.detail(sides, lin(-25, 0, 25, 0, [[0, rgba(HR.sh1, 0.3)], [0.24, rgba(HR.sh1, 0)], [0.76, rgba(HR.sh1, 0)], [1, rgba(HR.sh1, 0.3)]]), { clip: cap });
    }
    // the bangs: the brow-length run first, then the longer panel, the locks at the step on top
    const B = bangsOf(s);
    const order = B.map((_, i) => i).sort((i, j) => (B[i][3] === B[j][3] ? 0 : B[i][3] ? 1 : -1)).filter((i) => (part === 'all' ? true : part === 'panel' ? B[i][3] : !B[i][3]));
    const shapes = [];
    for (const i of order) {
      const [line0, w, sh] = B[i];
      const line = panelOnly && bend > 0 ? bentLine(i, bend).map(([x, y]) => [x * s, y]) : line0;
      const shp = hlock(P, HR, line, w, { end: 'blunt', shade: sh, fill, gloss: 0, strands: 2 });
      sheen(P, shp, line, w, sh, HR);
      shapes.push(shp);
    }
    // the panel's inner edge, where it steps down: a soft shade along it, so the step reads as depth
    const stepX = s * (E.step + 2.4);
    if (part === 'all' || (panelOnly && bend === 0)) P.band(shapes[shapes.length - 1], [[stepX, E.open - 1], [stepX + s * 0.4, 6], [stepX + s * 0.6, E.eye - 2]], swell(1.8, 0.2), rgba(HR.sh1, 0.45), { blur: 0.7 });
    // (the bangs alone: their shine kept on their own locks)
    let onPanel;
    if (panelOnly) {
      onPanel = new Path2D();
      for (const p of shapes) onPanel.addPath(p);
    }
    // one band of shine round the head, across the crown and every lock, fading at its ends
    const band = [];
    for (let k = 0; k <= 40; k++) band.push([-20 + k, -21.4 + 6.4 * ((-20 + k) / 20) ** 2]);
    const fade = (al, col) => lin(-20, 0, 20, 0, [[0, rgba(col, 0)], [0.18, rgba(col, al)], [0.82, rgba(col, al)], [1, rgba(col, 0)]]);
    P.detail(poly(cr(ribbon(band, () => 4.2, { n: 1 }), true, 2)), fade(0.38, HR.hi), { blur: 0.8, clip: onPanel });
    P.detail(poly(cr(ribbon(band, () => 1.5, { n: 1 }), true, 2)), fade(0.5, '#ffffff'), { blur: 0.3, clip: onPanel });
    // moonlight along the crown's top
    const rim = CROWN.slice(1, 5).map(([x, y]) => [x - 1.6, y + 1.2]).reverse();
    if (!panelOnly) P.detail(poly(ribbon(rim, (u) => 1.4 * Math.sin(Math.PI * u), { n: 8 })), rgba('#ffffff', 0.5), { clip: cap, blur: 0.4 });
  }, { out: T.hairOut, lw: LWD });
}

// ---------- Accessories ----------
// Rondo's tiny top hat, pinned at a tilt on the side away from her covered eye: a satin crown lit down
// one side, a white band with a small bow, a curled brim, a white feather with soft barbs, a silver pin.
function hatPiece(T) {
  return piece('tw:hat', [-28, -52, 4, -14], (P) => {
    const tilt = -0.34;
    const c = Math.cos(tilt);
    const sn = Math.sin(tilt);
    const R = (x, y) => [-13 + x * c - y * sn, -27 + x * sn + y * c];
    const crown = poly(cr([R(-5.4, -0.4), R(-5.8, -7), R(-5.4, -13.2), R(-3.6, -14.2), R(3.6, -14.2), R(5.4, -13.2), R(5.8, -7), R(5.4, -0.4)], true, 2));
    P.add(crown, lin(...R(-5.6, 0), ...R(5.6, 0), [[0, '#2a2a46'], [0.3, '#4a4a74'], [0.42, '#5e5e8e'], [0.6, '#262640'], [1, '#121222']]));
    P.detail(poly(cr([R(-4.4, -13.6), R(4.4, -13.6), R(4.8, -12.6), R(-4.8, -12.6)], true, 2)), rgba('#7a7ab0', 0.6));
    // the band and its little bow
    const band = poly([R(-5.6, -1.8), R(-5.8, -4.8), R(5.8, -4.8), R(5.6, -1.8)]);
    P.add(band, lin(...R(0, -4.8), ...R(0, -1.8), [[0, '#ffffff'], [1, '#d8dcf0']]), false);
    P.stroke([R(-5.6, -3.3), R(5.6, -3.3)], rgba('#b0b6d8', 0.7), 0.25);
    for (const sd of [-1, 1]) P.add(poly(cr([R(3, -3.3), R(3 + sd * 2.2, -4.8), R(3 + sd * 2.4, -1.8)], true, 2)), '#f6f6fc');
    // the brim, curled up at its ends, its edge lit
    const brim = poly(cr([R(-9.4, -0.8), R(-7, 1.4), R(0, 2.2), R(7, 1.4), R(9.4, -0.8), R(7.2, -0.2), R(0, 0.4), R(-7.2, -0.2)], true, 3));
    P.add(brim, lin(...R(0, -1), ...R(0, 2.2), [[0, '#3a3a5e'], [1, '#121222']]));
    P.stroke(cr([R(-8.6, -0.4), R(0, 1), R(8.6, -0.4)], false, 4), rgba('#8a90c8', 0.7), 0.35);
    // the feather: a curved quill, soft barbs either side, bending over the crown
    const quill = [R(4, -4), R(6.4, -11), R(6, -17.6), R(3.6, -22)];
    const fp = [];
    const q = cr(quill, false, 6);
    for (let i = 0; i < q.length; i++) {
      const u = i / (q.length - 1);
      const w0 = 2.6 * Math.sin(Math.PI * Math.min(1, u * 1.05)) + 0.2;
      const a0 = q[Math.max(0, i - 1)];
      const b0 = q[Math.min(q.length - 1, i + 1)];
      const l = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
      fp.push([q[i][0] + (-(b0[1] - a0[1]) / l) * w0, q[i][1] + ((b0[0] - a0[0]) / l) * w0]);
    }
    const fp2 = q.map((p, i) => [2 * p[0] - fp[i][0], 2 * p[1] - fp[i][1]]);
    const feather = poly(cr([...fp, ...fp2.reverse()], true, 2));
    P.add(feather, lin(...R(4, -4), ...R(3.6, -22), [[0, '#e4e8f6'], [1, '#ffffff']]));
    P.stroke(q, rgba('#b8bcd8', 0.9), 0.3, { clip: feather });
    for (let i = 2; i < q.length - 1; i += 2) {
      P.stroke([q[i], [lerp(q[i][0], fp[i][0], 1.1), lerp(q[i][1], fp[i][1], 1.1) - 0.8]], rgba('#c8cce4', 0.7), 0.2, { clip: feather });
      P.stroke([q[i], [lerp(q[i][0], fp2[fp2.length - 1 - i][0], 1.1), lerp(q[i][1], fp2[fp2.length - 1 - i][1], 1.1) - 0.8]], rgba('#c8cce4', 0.7), 0.2, { clip: feather });
    }
    // the silver pin holding it
    P.add(ell(...R(4.2, -3.2), 1, 1), rad(...R(4, -3.4), 1.2, [[0, '#ffffff'], [1, '#9aa2c8']]));
  }, { out: '#181830', lw: LWD * 0.7 });
}
// Minuet's bow, on the side away from her covered eye: two loops cut like bat wings (a curved top edge,
// three scallops underneath, two ribs), satin lit along the top, a round knot, two ribbon tails.
function bowPiece(T) {
  return piece('tw:bow', [-6, -46, 40, -4], (P) => {
    const bx = 16;
    const by = -23;
    for (const sd of [-1, 1]) {
      const tip = [bx + sd * 15.4, by - 8.6];
      const top = [[bx + sd * 1.6, by - 2], [bx + sd * 6, by - 10.6], [bx + sd * 12, by - 12.4], tip];
      const p = new Path2D();
      p.moveTo(...top[0]);
      p.bezierCurveTo(...top[1], ...top[2], ...top[3]);
      const S3 = 3;
      for (let i = 0; i < S3; i++) {
        const u0 = i / S3;
        const u1 = (i + 1) / S3;
        const p0 = [lerp(tip[0], bx + sd * 1.8, u0), lerp(tip[1], by + 2.4, u0)];
        const p1 = [lerp(tip[0], bx + sd * 1.8, u1), lerp(tip[1], by + 2.4, u1)];
        p.quadraticCurveTo((p0[0] + p1[0]) / 2 - sd * 0.8, (p0[1] + p1[1]) / 2 - 2.4, p1[0], p1[1]);
      }
      p.closePath();
      P.add(p, lin(bx, by - 12, bx, by + 2, [[0, '#544478'], [0.45, '#33284e'], [1, '#1e1832']]));
      for (const k of [0.36, 0.68]) P.stroke(cr([[bx + sd * 1.6, by], [bx + sd * 15 * k * 0.7, by - 7 * k - 1], [bx + sd * 15 * k + sd * 1.2, by - 8.6 * k - 2.4]], false, 4), rgba('#b8a0e8', 0.55), 0.42, { clip: p });
      P.detail(poly(ribbon(cr([[bx + sd * 3, by - 6.4], [bx + sd * 7, by - 9.8], [bx + sd * 11, by - 10.8]], false, 4), swell(0.9, 0.05), { n: 1 })), rgba('#e8dcff', 0.55), { clip: p, blur: 0.2 });
    }
    for (const sd of [-1, 1]) {
      const tail = poly(cr([[bx + sd * 0.8, by + 1], [bx + sd * 3.6, by + 8.4], [bx + sd * 2.6, by + 11.2], [bx + sd * 1.2, by + 9.6], [bx - sd * 0.4, by + 1.6]], true, 2));
      P.add(tail, lin(bx, by, bx, by + 11, [[0, '#3a2e58'], [1, '#221a38']]));
    }
    P.add(ell(bx, by, 2.8, 2.6), rad(bx - 0.7, by - 0.9, 3.2, [[0, '#7a6aa8'], [1, '#2a2040']]));
    P.detail(ell(bx - 0.6, by - 1, 1, 0.55), rgba('#ffffff', 0.65));
  }, { out: '#3a2e58', lw: LWD * 0.72 });
}

// ---------- Faces ----------
// Each expression: eye (lid lowered, lift of the outer corner, iris size ik, lower lid bot, look, wide),
// or closed; mouth; brow (raised +, drawn down -); blush.
const EXPR = {
  rondo: {
    poised: { eye: { lid: 0.4, lift: 0.1 }, mouth: 'flat', brow: -0.8, blush: 0.3 },
    counting: { eye: { lid: 0.46, lift: 0.08, look: [0.18, -0.06] }, mouth: 'count', brow: -0.6, blush: 0.28 },
    stern: { eye: { lid: 0.5, lift: 0.14 }, mouth: 'frown', brow: -1.3, blush: 0.25 },
    satisfied: { closed: 'calm', mouth: 'flat', brow: -0.2, blush: 0.4 },
    shock: { eye: { lid: 0.02, lift: 0.02, ik: 0.8, wide: 1.12 }, mouth: 'o', brow: 1, blush: 0.4 },
    hurt: { closed: 'hurt', mouth: 'grit', brow: 1, blush: 0.3 },
    dizzy: { closed: 'dizzy', mouth: 'wave', brow: 0.6, blush: 0.3 },
    // (her red eye open: her own eye narrowed, cold and certain)
    glare: { eye: { lid: 0.3, lift: 0.2, ik: 0.86 }, mouth: 'flat', brow: -1.5, blush: 0.2 },
  },
  minuet: {
    giggle: { eye: { lid: 0.04, lift: 0.02, bot: 0.12 }, mouth: 'grin', brow: 0.4, blush: 0.75 },
    sly: { eye: { lid: 0.32, lift: 0.08, look: [-0.16, 0] }, mouth: 'smirk', brow: -0.2, blush: 0.6 },
    boo: { eye: { lid: 0, lift: 0, ik: 1.06, wide: 1.08 }, mouth: 'boo', brow: 0.9, blush: 0.85 },
    delight: { closed: 'happy', mouth: 'grin', brow: 0.3, blush: 0.95 },
    pout: { eye: { lid: 0.2, lift: -0.06, look: [0.1, 0.06] }, mouth: 'pout', brow: 0.8, blush: 0.75 },
    hurt: { closed: 'hurt', mouth: 'grit', brow: 1, blush: 0.5 },
    dizzy: { closed: 'dizzy', mouth: 'wave', brow: 0.6, blush: 0.5 },
    // (her red eye open: a wicked little grin, her own eye narrowed with glee)
    wicked: { eye: { lid: 0.22, lift: 0.16, ik: 0.9, bot: 0.1 }, mouth: 'grin', brow: -0.5, blush: 0.7 },
  },
};
export const TWIN_FACES = { rondo: Object.keys(EXPR.rondo), minuet: Object.keys(EXPR.minuet) };
const EYES = [[-8.6, -1], [8.6, 1]];
const EYE_Y = 7.4;
function eyeShape(who, x, y, o, sp) {
  const round = who === 'minuet';
  const w = round ? 11 : 12;
  const h = (round ? 12.6 : 9.4) * (sp.wide ?? 1);
  const L = (sp.lid ?? 0) * h;
  const b = (sp.bot ?? 0) * h;
  const lift = (sp.lift ?? 0) * h;
  const inner = [x - o * w * 0.5, y + h * 0.12];
  const outer = round ? [x + o * w * 0.52, y + h * 0.02 - lift] : [x + o * w * 0.62, y - h * 0.1 - lift];
  const top = round
    ? [inner, [x - o * w * 0.32, y - h * 0.34 + L * 0.7], [x + o * w * 0.02, y - h * 0.47 + L], [x + o * w * 0.35, y - h * 0.36 + L * 0.9], outer]
    : [inner, [x - o * w * 0.3, y - h * 0.36 + L * 0.8], [x + o * w * 0.1, y - h * 0.44 + L], [x + o * w * 0.44, y - h * 0.3 + L * 0.8], outer];
  const bot = round
    ? [outer, [x + o * w * 0.37, y + h * 0.32 - b], [x + o * w * 0.02, y + h * 0.45 - b], [x - o * w * 0.32, y + h * 0.36 - b], inner]
    : [outer, [x + o * w * 0.42, y + h * 0.24 - b], [x + o * w * 0.04, y + h * 0.36 - b], [x - o * w * 0.3, y + h * 0.3 - b], inner];
  return { w, h, inner, outer, top, bot };
}
const normalAt = (pts, i, o) => {
  const a0 = pts[Math.max(0, i - 1)];
  const b0 = pts[Math.min(pts.length - 1, i + 1)];
  const l = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
  return [o * (b0[1] - a0[1]) / l, -o * (b0[0] - a0[0]) / l];
};
function openEye(P, T, who, clip, x, y, o, sp) {
  const E = eyeShape(who, x, y, o, sp);
  const { EY, SK } = T;
  const top = cr(E.top, false, 6);
  const bot = cr(E.bot, false, 6);
  const white = poly([...top, ...bot.slice(1)]);
  // a soft colour on the lid above it
  P.detail(poly(ribbon(top.map(([px, py]) => [px, py - 2]), (u) => 2.8 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 0.2, { n: 1 })), rgba(T.SHADOW, 0.42), { clip, blur: 1 });
  P.detail(white, lin(x, y - E.h * 0.5, x, y + E.h * 0.5, [[0, '#e2e2f6'], [0.35, '#ffffff'], [1, '#f6f4ff']]), { clip });
  const look = sp.look ?? [0, 0];
  const ir = (who === 'minuet' ? 5.8 : 4.9) * (sp.ik ?? 1);
  const ix = x + look[0] * E.w * 0.5 + o * 0.3;
  const iy = y + look[1] * E.h * 0.5 + E.h * 0.04;
  const ry = ir * (who === 'minuet' ? 1.12 : 1.2);
  const iris = ell(ix, iy, ir, ry);
  P.detail(iris, rad(ix, iy - ry * 0.45, ir * 1.35, [[0, EY.dk], [0.35, EY.mid], [0.7, EY.base], [1, EY.lt]]), { clip: [white] });
  // its lighter lower half, fine streaks, a dark rim
  P.detail(ell(ix, iy + ry * 0.42, ir * 0.78, ry * 0.42), rgba(EY.lt, 0.7), { clip: [white, iris], blur: 0.5 });
  for (let k = 0; k < 12; k++) {
    const an = (k / 12) * TAU + 0.2;
    P.stroke([[ix + Math.cos(an) * ir * 0.48, iy + Math.sin(an) * ry * 0.5], [ix + Math.cos(an) * ir * 0.9, iy + Math.sin(an) * ry * 0.92]], rgba(EY.lt, 0.32), 0.3, { clip: [white] });
  }
  P.detail(iris, 'rgba(0,0,0,0)', { clip: [white], stroke: EY.ring, slw: 0.75 });
  // the pupil: Rondo's a narrow upright oval, sharp; Minuet's round
  P.detail(ell(ix, iy + 0.3, who === 'minuet' ? ir * 0.42 : ir * 0.28, ry * 0.5), EY.pupil, { clip: [white] });
  // the shade the upper lid and lashes cast across the top of the eye
  P.detail(poly(ribbon(top, () => E.h * 0.24, { n: 1 })), rgba(EY.dk, 0.4), { clip: [white], blur: 0.6 });
  // glints
  if (who === 'minuet') {
    P.detail(ell(ix - o * ir * 0.34, iy - ry * 0.4, ir * 0.36, ir * 0.36), '#ffffff', { clip: [white] });
    const hx = ix + o * ir * 0.32;
    const hy = iy + ry * 0.34;
    const hs = ir * 0.24;
    P.detail(poly(cr([[hx, hy + hs], [hx - hs * 1.3, hy - hs * 0.1], [hx - hs * 0.7, hy - hs], [hx, hy - hs * 0.4], [hx + hs * 0.7, hy - hs], [hx + hs * 1.3, hy - hs * 0.1]], true, 2)), rgba('#ffffff', 0.92), { clip: [white] });
    P.detail(ell(ix + o * ir * 0.5, iy - ry * 0.3, ir * 0.12, ir * 0.12), rgba('#ffffff', 0.85), { clip: [white] });
  } else {
    P.detail(poly([[ix - o * ir * 0.54, iy - ry * 0.48], [ix - o * ir * 0.12, iy - ry * 0.6], [ix - o * ir * 0.04, iy - ry * 0.2], [ix - o * ir * 0.46, iy - ry * 0.08]]), '#ffffff', { clip: [white] });
    P.detail(ell(ix + o * ir * 0.36, iy + ry * 0.3, ir * 0.12, ir * 0.12), rgba('#ffffff', 0.8), { clip: [white] });
  }
  // ---- the upper lashes (redrawn 2026-11-28, the player: "top and side eyelashes polish redraw"): one
  // smooth shape, never loose strands: a lash line hugging the lid, fine at the inner corner and swelling
  // toward the outer corner, flowing on past it into a single tapered flick (Rondo's long, sleek, straight
  // wing; Minuet's flick curling up, with one short scallop merged into the line before it); a fine sheen
  // along it ----
  const N = top.length;
  const th = (u) => (who === 'minuet' ? 0.7 + 1.25 * u + 0.5 * Math.sin(Math.PI * u) : 0.45 + 1.85 * u ** 1.3);
  const lashMid = [];
  const lashW = [];
  for (let i = 0; i < N; i++) {
    const n = normalAt(top, i, o);
    const t = th(i / (N - 1));
    lashMid.push([top[i][0] + n[0] * t * 0.5, top[i][1] + n[1] * t * 0.5]);
    lashW.push(t);
  }
  const e0 = lashMid[N - 1];
  const tE = lashW[N - 1];
  const tail = who === 'minuet'
    ? [[[1.3, -0.9], 0.82], [[2.4, -2.1], 0.55], [[3, -3.3], 0.3], [[3.1, -4.1], 0.05]]
    : [[[1.5, -0.8], 0.86], [[3, -1.8], 0.56], [[4.4, -2.8], 0.26], [[5.4, -3.5], 0.04]];
  for (const [[dx, dy], k] of tail) {
    lashMid.push([e0[0] + o * dx, e0[1] + dy]);
    lashW.push(tE * k);
  }
  const outline = (mid, wid) => {
    const Lp = [];
    const Rp = [];
    for (let i = 0; i < mid.length; i++) {
      const a0 = mid[Math.max(0, i - 1)];
      const b0 = mid[Math.min(mid.length - 1, i + 1)];
      const l = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
      const nx = -(b0[1] - a0[1]) / l;
      const ny = (b0[0] - a0[0]) / l;
      Lp.push([mid[i][0] + nx * wid[i] * 0.5, mid[i][1] + ny * wid[i] * 0.5]);
      Rp.push([mid[i][0] - nx * wid[i] * 0.5, mid[i][1] - ny * wid[i] * 0.5]);
    }
    return poly(cr([...Lp, ...Rp.reverse()], true, 3));
  };
  const lashCol = lin(E.inner[0], 0, E.outer[0], 0, [[0, mixHex(T.LASH, SK.deep, 0.45)], [0.3, T.LASH], [1, T.LASH]]);
  P.detail(outline(lashMid, lashW), lashCol);
  if (who === 'minuet') {
    // (the scallop: a short, broad flick rising out of the line's top edge before the corner)
    const i = Math.round(0.8 * (N - 1));
    const n = normalAt(top, i, o);
    const r0 = [top[i][0] + n[0] * lashW[i] * 0.6, top[i][1] + n[1] * lashW[i] * 0.6];
    P.detail(outline([r0, [r0[0] + o * 0.8, r0[1] - 1.1], [r0[0] + o * 1.5, r0[1] - 2], [r0[0] + o * 1.8, r0[1] - 2.6]], [lashW[i] * 0.95, lashW[i] * 0.7, lashW[i] * 0.35, 0.05]), T.LASH);
  }
  // the sheen along the line's outer half
  const sh0 = Math.round(N * 0.35);
  P.detail(poly(ribbon(lashMid.slice(sh0, N - 1).map(([px, py], i) => {
    const n = normalAt(top, sh0 + i, o);
    return [px + n[0] * lashW[sh0 + i] * 0.28, py + n[1] * lashW[sh0 + i] * 0.28];
  }), swell(0.2, 0.01), { n: 1 })), rgba(who === 'minuet' ? '#a080d0' : '#6a78b8', 0.3), { blur: 0.15 });
  // the lid crease: Rondo's low and level (her half-lidded look), Minuet's high and round
  P.stroke(cr(E.top.slice(1, 5).map(([px, py]) => [px, py - (who === 'minuet' ? 3.4 : 2.4)]), false, 4), rgba(SK.deep, 0.75), 0.42);
  // the lower lid: a soft line, the waterline's shine, the inner corner's pink, lower lashes outside
  P.stroke(cr(E.bot.slice(1, 4), false, 4), rgba(SK.deep, 0.7), 0.45);
  P.detail(poly(ribbon(cr(E.bot.slice(1, 4), false, 4).map(([px, py]) => [px, py - 0.6]), swell(0.35, 0.02), { n: 1 })), rgba('#ffffff', 0.6));
  P.detail(ell(E.inner[0] + o * 0.6, E.inner[1] - 0.2, 0.9, 0.6), rgba('#f2a6b8', 0.7));
  // the lower lash line: a soft tapered line along the outer part of the lower lid, never loose spikes
  P.detail(poly(ribbon(bot.slice(0, Math.round(bot.length * 0.32)), (u) => (who === 'minuet' ? 0.6 : 0.45) * (1 - u) ** 0.8 + 0.04, { n: 1 })), rgba(T.LASH, 0.75));
}
function closedEye(P, T, x, y, o, kind) {
  const w = 11;
  if (kind === 'happy') {
    P.stroke(cr([[x - o * w * 0.5, y + 1.2], [x, y - 2.6], [x + o * w * 0.5, y + 1.2]], false, 5), T.LASH, 1.4);
    P.stroke([[x + o * w * 0.46, y + 0.8], [x + o * w * 0.62, y - 0.6]], T.LASH, 0.9);
  } else if (kind === 'calm') {
    P.stroke(cr([[x - o * w * 0.5, y + 0.6], [x, y + 1.6], [x + o * w * 0.6, y - 0.4]], false, 5), T.LASH, 1.3);
    P.stroke([[x + o * w * 0.56, y - 0.2], [x + o * w * 0.76, y - 1.4]], T.LASH, 0.9);
  } else if (kind === 'hurt') {
    P.stroke([[x - o * w * 0.45, y - 2.2], [x + o * w * 0.3, y + 0.4], [x - o * w * 0.45, y + 2.8]], T.LASH, 1.3);
  } else if (kind === 'dizzy') {
    const pts = [];
    for (let k = 0; k <= 30; k++) {
      const an = (k / 30) * TAU * 1.8;
      const r = 0.6 + (k / 30) * 3.8;
      pts.push([x + Math.cos(an) * r, y + Math.sin(an) * r]);
    }
    P.stroke(pts, T.LASH, 0.9);
  } else P.stroke(cr([[x - o * w * 0.5, y - 0.6], [x, y + 1.6], [x + o * w * 0.5, y - 0.6]], false, 5), T.LASH, 1.3);
}
function brows(P, T, who, clip, b) {
  for (const [x, o] of EYES) {
    // (just under the bangs' cut, so they show and act)
    const y = EYE_Y - (who === 'minuet' ? 9.4 : 8.6) - b * 1.2;
    const pts = who === 'minuet'
      ? [[x - o * 4.6, y + 1.4 - b * 0.6], [x - o * 0.6, y - 1.2], [x + o * 4, y + 0.6]]
      : [[x - o * 5, y + 1 + Math.min(0, b) * 0.9], [x, y + 0.1], [x + o * 4.8, y - 0.5]];
    P.detail(poly(ribbon(cr(pts, false, 4), (u) => (who === 'minuet' ? 0.6 + 0.7 * Math.sin(Math.PI * u) : 1 - 0.45 * u), { n: 1 })), who === 'minuet' ? '#8a7ab6' : mixHex(T.HR.sh1, T.HR.base, 0.4), { clip });
  }
}
function mouth(P, T, clip, kind) {
  const { SK } = T;
  const y = 17.2;
  const m = (pts, w = 0.8, col = SK.lipDk) => P.stroke(cr(pts, false, 5), col, w, { clip });
  if (kind === 'flat') {
    m([[-2.6, y + 0.3], [0, y + 0.5], [2.6, y + 0.1]]);
    P.detail(ell(0, y + 1.6, 1.6, 0.6), rgba(SK.lip, 0.4), { clip, blur: 0.4 });
  } else if (kind === 'count') {
    P.detail(ell(0, y + 0.4, 1.6, 1.2), SK.mouth, { clip });
    P.detail(ell(0, y + 0.9, 0.9, 0.4), rgba('#ff8ab4', 0.6), { clip });
  } else if (kind === 'frown') {
    m([[-2.8, y + 0.9], [0, y - 0.3], [2.8, y + 0.9]]);
    P.detail(ell(0, y + 1.6, 1.4, 0.5), rgba(SK.lip, 0.35), { clip, blur: 0.4 });
  } else if (kind === 'o') {
    P.detail(ell(0, y + 0.6, 1.8, 2.4), SK.mouth, { clip });
  } else if (kind === 'grit') {
    P.detail(poly(cr([[-3, y], [3, y], [2.6, y + 2], [-2.6, y + 2]], true, 2)), '#ffffff', { clip, stroke: SK.lipDk, slw: 0.6 });
  } else if (kind === 'wave') m([[-3, y + 0.6], [-1.4, y - 0.4], [0, y + 0.6], [1.4, y - 0.4], [3, y + 0.6]], 0.7);
  else if (kind === 'grin' || kind === 'boo') {
    const open = kind === 'boo' ? 4.6 : 3.2;
    const mo = poly(cr([[-4, y - 0.6], [0, y + 0.3], [4, y - 0.6], [2.8, y + open * 0.72], [0, y + open], [-2.8, y + open * 0.72]], true, 4));
    P.detail(mo, SK.mouth, { clip });
    P.detail(ell(0, y + open * 0.82, 2.2, 1.1), rgba('#ff8ab4', 0.9), { clip: [mo] });
    P.detail(poly([[1, y - 0.2], [2.3, y - 0.4], [1.75, y + 1.7]]), '#ffffff', { clip: [mo] });
    P.stroke(cr([[-4, y - 0.6], [0, y + 0.3], [4, y - 0.6]], false, 4), rgba(SK.lipDk, 0.7), 0.4, { clip });
  } else if (kind === 'smirk') {
    m([[-2.6, y + 0.2], [0.4, y + 0.6], [3.1, y - 0.9]]);
    P.detail(poly([[1, y + 0.4], [2.1, y + 0.2], [1.7, y + 1.8]]), '#ffffff', { clip, stroke: SK.lipDk, slw: 0.3 });
  } else if (kind === 'pout') {
    P.detail(ell(0, y + 0.6, 1.7, 1.2), SK.lip, { clip });
    P.detail(ell(-0.4, y + 0.3, 0.6, 0.3), rgba('#ffffff', 0.6), { clip });
  }
}
export function facePiece(who, name, blink = false) {
  const T = TWINS[who];
  const ex = EXPR[who][name] ?? Object.values(EXPR[who])[0];
  const { SK, s } = T;
  return piece(`tw:face:${who}:${name}:${blink ? 1 : 0}`, [-23, -26, 23, 28], (P) => {
    const head = HEAD();
    P.add(head, lin(0, -23, 0, 25, [[0, SK.hi], [0.55, SK.base], [1, mixHex(SK.base, SK.sh1, 0.45)]]), true, { stroke: rgba(SK.deep, 0.35), slw: 0.5 });
    // lit from the upper right: the light across the forehead and that cheek, the shade down the other side
    P.glow(head, 7, -6, 22, SK.hi, 0.65);
    P.band(head, [[-18.6, -6], [-19.6, 4], [-17.6, 13], [-12.6, 20]], swell(3.2, 0.3), rgba(SK.sh1, 0.55), { blur: 1.2 });
    // the cheek's planes: light high on the cheekbone, soft shade beneath it to the jaw, light on the chin,
    // a shade under the lower lip
    P.glow(head, 11.6, 9.4, 6.4, SK.hi, 0.6);
    for (const sd of [-1, 1]) P.band(head, [[sd * 18, 10], [sd * 15.8, 15.8], [sd * 12, 19.8], [sd * 7.2, 22.4]], swell(2.4, 0.2), rgba(SK.sh1, sd < 0 ? 0.48 : 0.3), { blur: 1.1 });
    P.detail(ell(0.6, 22.2, 3.2, 1.6), rad(0.6, 22.2, 3.2, [[0, rgba(SK.hi, 0.75)], [1, rgba(SK.hi, 0)]]), { clip: head });
    P.detail(ell(0.2, 19.6, 2.4, 0.8), rgba(SK.sh1, 0.32), { clip: head, blur: 0.6 });
    // the hair's shadow on the forehead and under the long lock
    P.detail(poly(cr([...EDGE, ...CROWN], true, 5).map(([x, y]) => [x + 0.5, y + 1.8])), rgba(SK.sh2, 0.5), { clip: head, blur: 0.8 });
    for (const [line, w] of [...bangsOf(s), ...SIDES.map((ln) => [ln, () => 6]), ...SIDES.map((ln) => [ln.map(([x, y]) => [-x, y]), () => 6])]) P.detail(poly(ribbon(line.map(([x, y]) => [x + 0.3, y + 1.4]), w, { n: 8, caps: false })), rgba(SK.sh1, 0.5), { clip: head, blur: 0.7 });
    // a ghost's faint cool rim down the lit cheek
    P.band(head, [[19.6, -2], [19.4, 7], [17.2, 14], [13, 19.4]], swell(1.2, 0.1), rgba('#f2f8ff', 0.85), { blur: 0.5 });
    // blush: wide and soft, Minuet's with three little hatch strokes
    for (const [bx] of EYES) {
      P.detail(ell(bx * 1.24, 13.6, 5.2, 2.5), rgba(SK.blush, ex.blush * 0.8), { clip: head, blur: 1.1 });
      if (who === 'minuet') for (let k = -1; k <= 1; k++) P.stroke([[bx * 1.24 + k * 1.6 - 0.6, 14.4], [bx * 1.24 + k * 1.6 + 0.6, 12.8]], rgba('#e86aa0', 0.5 * ex.blush), 0.35, { clip: head });
    }
    const kind = blink ? 'down' : ex.closed;
    for (const [x, o] of EYES) {
      if (o === s) continue;
      if (kind) closedEye(P, T, x, EYE_Y, o, kind);
      else openEye(P, T, who, head, x, EYE_Y, o, ex.eye);
    }
    brows(P, T, who, head, ex.brow);
    // the nose: a soft shade on its shadow side and a tip of light
    P.detail(ell(-0.8, 12.6, 1, 1.7), rgba(SK.sh2, 0.45), { clip: head, blur: 0.5 });
    P.detail(ell(0.3, 13.6, 0.7, 0.5), rgba('#ffffff', 0.85), { clip: head });
    mouth(P, T, head, ex.mouth);
  }, { out: T.out, lw: LWD });
}

// ---------- The hidden eye (2026-11-28, the player: "1 red hidden eye that stops time"): under the long
// panel each twin keeps one red eye, her own eye's shape but ruby, a clock's twelve marks round its iris
// and two clock hands for a pupil that spin while time is stopped. It opens from a slit as the panel lifts
// aside, a red glow on the cheek round it. ----------
const RED_EY = { dk: '#4a0614', mid: '#9c1226', base: '#e2343e', lt: '#ff9e8e', pupil: '#2a0208', ring: '#3a040e' };
const RED_SPEC = { rondo: { lid: 0.1, lift: 0.12, ik: 1.04 }, minuet: { lid: 0, lift: 0.04, ik: 1.04, wide: 1.04 } };
// (opening: its own upper lid lifts from a slit to wide open, the lashes riding on the lid, so they always
// sit exactly on the eye; drawn in 16 steps, each a cached picture)
function redEyePiece(who, open) {
  const T = { ...TWINS[who], EY: RED_EY, SHADOW: '#e07890' };
  const x = 8.6 * T.s;
  const sp = RED_SPEC[who];
  const spec = { ...sp, lid: lerp(0.74, sp.lid ?? 0, open), lift: lerp(0.02, sp.lift ?? 0, open) };
  return piece(`tw:redeye:${who}:${open}`, [x - 14, EYE_Y - 14, x + 14, EYE_Y + 14], (P) => {
    openEye(P, T, who, HEAD(), x, EYE_Y, T.s, spec);
  }, { out: T.out, lw: LWD });
}
function drawRedEye(ctx, who, a, open, spin) {
  const T = TWINS[who];
  const x = 8.6 * T.s;
  const u = clamp(open, 0, 1);
  // (a red glow on the skin round it, under the hair)
  ctx.save();
  ctx.clip(HEAD());
  const g = ctx.createRadialGradient(x, EYE_Y, 0, x, EYE_Y, 13);
  g.addColorStop(0, `rgba(255,70,80,${0.45 * u})`);
  g.addColorStop(1, 'rgba(255,70,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 14, EYE_Y - 14, 28, 28);
  ctx.restore();
  // (still shut under the hair, it isn't drawn; then its lid lifts)
  const e = u * u * (3 - 2 * u);
  if (e < 0.05) return;
  drawPiece(ctx, redEyePiece(who, Math.round(e * 16) / 16), 'fill', 0);
  // the clock hands: an hour hand and a longer minute hand, light on the dark pupil, shown once the lid
  // is up past them
  const hk = clamp((e - 0.62) / 0.25, 0, 1);
  if (hk <= 0.01) return;
  const ix = x + T.s * 0.3;
  const iy = EYE_Y + (who === 'minuet' ? 12.6 * 1.04 : 9.4) * 0.04 + 0.3;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(255,214,206,${0.95 * hk})`;
  for (const [len, w, sp] of [[1.5, 0.5, spin / 12], [2.4, 0.36, spin]]) {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + Math.sin(sp) * len, iy - Math.cos(sp) * len);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Drawing a head each frame (in its own frame, its middle at the origin) ----------
// q: { face, jig (the soft-body jolt), lock (the long lock's swing) }
export function drawHeadBack(ctx, who, a, mode, q, flash) {
  const j = clamp(q.jig ?? 0, -1, 1);
  ctx.save();
  // (the bob gives softly about its roots, keeping its volume)
  ctx.translate(0, -8);
  ctx.scale(1 + j * 0.03, 1 / (1 + j * 0.03));
  ctx.translate(0, 8);
  drawPiece(ctx, backPiece(TWINS[who]), mode, flash);
  ctx.restore();
}
export function drawHeadFront(ctx, who, a, mode, q, flash) {
  const T = TWINS[who];
  const t = a.t ?? 0;
  const faces = TWIN_FACES[who];
  const f = faces.includes(q.face) ? q.face : faces[0];
  const blink = !EXPR[who][f].closed && ((t + (who === 'minuet' ? 1.7 : 0)) % 4.9) < 0.13;
  drawPiece(ctx, facePiece(who, f, blink), mode, flash);
  // (the hidden red eye, under the hair, as it opens)
  const eye = clamp(q.eye ?? 0, 0, 1);
  if (eye > 0.002 && mode === 'fill') drawRedEye(ctx, who, a, eye, q.eyeSpin ?? 0);
  // (the front hair is one piece, so only its outer edge is outlined; over the face its outline is drawn
  // again in the fill pass, the face's fill having covered it, and its own fill over that)
  const sw = clamp(q.lock ?? 0, -0.08, 0.08);
  const hairAt = () => {
    ctx.translate(-T.s * 8, -29);
    ctx.rotate(sw * 0.4);
    ctx.translate(T.s * 8, 29);
  };
  // As the hidden eye opens, only the long bangs over it move, each lock bending aside from its root
  // (the player, 2026-11-28: "just move the front bangs that around the eye")
  // (bent in 24 steps, each a cached picture, so the fold is smooth)
  const lifted = eye > 0.002;
  const bend = Math.round(clamp(eye * 1.1, 0, 1) * 24) / 24;
  const parts = lifted ? [['rest', hairAt, 0], ['panel', hairAt, bend]] : [['all', hairAt, 0]];
  // (clipped to the face where it stands, the hair moved inside that clip)
  if (mode === 'fill') {
    for (const [p, at, b] of parts) {
      ctx.save();
      ctx.clip(HEAD());
      at();
      drawPiece(ctx, frontPiece(T, p, b), 'line', 0);
      ctx.restore();
    }
  }
  for (const [p, at, b] of parts) {
    ctx.save();
    at();
    drawPiece(ctx, frontPiece(T, p, b), mode, flash);
    ctx.restore();
  }
  if (who === 'rondo') drawPiece(ctx, hatPiece(T), mode, flash);
  else drawPiece(ctx, bowPiece(T), mode, flash);
}
