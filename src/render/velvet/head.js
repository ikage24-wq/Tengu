// Madame Velvet's head, painted finely (2026-11-28, the player: the concepts were "not detailed, most
// detailed character is Fawnelle"; "Velvet needs to be a bit more mature"; "make unique faces and
// expressions that fit each boss, eye shapes face shapes no similar stuff"). Painted with the bosses'
// fine painting kit (render/bossart/kit.js) in her own design units (her face about 36 wide, its middle
// at the origin), as pieces painted once each and moved by her springs every frame. Nothing of it is
// Marigold's: her own face shape, eyes, lashes, brows, mouth, hair and expressions.
//   back     the hair behind her head and her big wound bun
//   face     her face in one expression: a mature oval with a firm, softly squared jaw and a defined
//            chin, high cheekbones; her ears showing (her hair swept back off them) with pearl studs
//   hair     her hair swept back from a side part in deep finger waves, each wave's crest catching the
//            light, a soft roll of volume over each temple
//   tendril  a loose curl escaped at each temple, swaying
//   pearl    a pearl drop at each ear, swinging
//   specs    round gold spectacles low on her nose, a fine chain back to her ear
//   cap      a starched white mob cap over the bun, ruffled round its edge, a plum ribbon round it tied
//            in a bow at the side, its tails swaying
// Her eyes: narrow, upswept almonds (a cat's eye) under a heavy upper lid and a plum shadow, a sleek
// winged liner that sweeps up past the outer corner (no flicked lashes), a small slate-violet iris, a
// square catchlight; a fine smudge of liner under the outer corner.
import { TAU, lerp, clamp, cr, poly, smooth, ell, ribbon, along, sideOf, taper, swell, rgba, mixHex, lin, rad, hlock, star4, piece, drawPiece } from '../bossart/kit.js';

export const G = 0.72;
const OUT = '#6e4f7e';
export const HSCALE = 1.2;
export const LWD = 2 / (HSCALE * G);

const SK = { hi: '#fcfbff', base: '#ebe9fb', sh1: '#d4cff0', sh2: '#b6aedc', line: '#9a92c8', blush: '#f2a4c6', lip: '#b05a88', lipDk: '#7a3460', mouth: '#4a1e3a' };
const HR = { hi: '#ffffff', lt: '#ebe6fa', base: '#cbc3e6', sh1: '#a69ecd', sh2: '#7f76aa', deep: '#5e5688', rim: '#f4f0ff' };
const EY = { dk: '#241a48', mid: '#463a7a', base: '#6858b0', lt: '#a898e4', glow: '#ded6ff', pupil: '#150e2c' };
const LASH = '#2a1e40';
const LINEN = ['#ffffff', '#f6f2fa', '#e4dcee', '#cbbfdc'];
const PLUM = ['#b46aa8', '#8e467e', '#6e3262', '#52234a'];
const GOLD = ['#fff0b4', '#f2c868', '#c8963c', '#9a6a28'];
const FY = [-40, 24];

// ---------- Her head's shape: a mature oval, high cheekbones, a firm softly squared jaw, a defined chin ----------
const HEAD_PTS = (() => {
  const upR = [[0, -24], [10.4, -22.2], [16.2, -16.6], [18, -8.4], [18, -0.4]];
  const lowR = [[17.5, 6.2], [16.2, 12], [14, 17.2], [11, 21.4], [7.2, 24.6], [3.4, 26.4]];
  const chin = [0, 26.9];
  const lowL = lowR.map(([x, y]) => [-x, y]).reverse();
  const upL = upR.slice(1).map(([x, y]) => [-x, y]).reverse();
  return cr([...upR, ...lowR, chin, ...lowL, ...upL], true, 3);
})();
const HEAD = () => poly(HEAD_PTS);

// ---------- Her hair ----------
// (a high, gently arched hairline: her forehead shows; parted on her right (viewer's left))
const EDGE = [[-18.6, 4], [-18.2, -4], [-16, -11.4], [-11.6, -16.6], [-6, -18.4], [-1, -17.4], [5, -17.6], [11.4, -16], [16.2, -11], [18.4, -4], [18.8, 4]];
const CROWN = [[21.4, 3], [23.4, -6], [23, -15], [19.4, -23.6], [12, -29.6], [2, -31.8], [-8, -31], [-16.6, -26.8], [-21.6, -19], [-23.2, -9], [-21.8, 3]];
const capPts = () => cr([...EDGE, ...CROWN], true, 5);
// (each wave lock: from the hairline up and back over the crown, its line rippling in an S)
function waveLine(x0, y0, x1, y1, amp, ph = 0) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const x = lerp(x0, x1, u);
    const y = lerp(y0, y1, u) + 0 * u;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l = Math.hypot(dx, dy) || 1;
    const w = amp * Math.sin(u * Math.PI * 2 + ph) * Math.sin(Math.PI * Math.min(1, u * 1.4));
    pts.push([x - (dy / l) * w, y + (dx / l) * w]);
  }
  return pts;
}
const WAVES = [
  // the right of her part (viewer's left): two locks
  [-6, -18.4, -14, -31.4, 1.2, 0, -1, 7.4],
  [-11.6, -16.6, -20.6, -26, 1.1, 0.6, -1, 7],
  [-16, -11.4, -23.4, -17.6, 0.9, 1.2, -1, 6.4],
  // the left of her part (the larger side): sweeping over and back
  [-1, -17.4, 8, -32, 1.4, 0.4, 1, 8.4],
  [5, -17.6, 15.4, -29, 1.3, 1, 1, 8],
  [11.4, -16, 20.4, -23.6, 1.1, 1.6, 1, 7.4],
  [16.2, -11, 23.2, -14.6, 0.9, 2, 1, 6.6],
];
export const TENDRIL_ROOT = (s) => [s * 17.4, -5];

function backPiece() {
  return piece('vv:back', [-34, -50, 34, 22], (P) => {
    const right = [[22.8, -6], [23, 4], [21, 12]];
    const pts = [...right, [10, 14], [0, 13.4], [-10, 14], ...right.map(([x, y]) => [-x, y]).reverse(), [-21.6, -20], [-12.6, -30], [0, -33], [12.6, -30], [21.6, -20]];
    const back = smooth(pts, 5);
    P.add(back, lin(0, -32, 0, 14, [[0, mixHex(HR.base, HR.sh1, 0.4)], [1, mixHex(HR.sh1, HR.sh2, 0.6)]]));
    // her bun, high at the back: hair wound round in thick soft coils, each coil lit on its upper face,
    // deep where it tucks under the next
    const bx = 1;
    const by = -33;
    const rr = 12;
    const bun = ell(bx, by, rr * 1.12, rr * 0.86);
    P.add(bun, rad(bx - rr * 0.2, by - rr * 0.45, rr * 1.7, [[0, mixHex(HR.base, HR.hi, 0.4)], [0.5, HR.base], [1, mixHex(HR.base, HR.sh1, 0.7)]]));
    P.detail(ell(bx, by + rr * 0.45, rr * 0.95, rr * 0.45), rgba(HR.sh2, 0.55), { clip: bun, blur: 0.8 });
    for (const k of [0.35, 0.62, 0.88]) {
      const arc = [];
      for (let i = 0; i <= 14; i++) {
        const an = Math.PI * (1.05 + (i / 14) * 0.9);
        arc.push([bx + Math.cos(an) * rr * 1.12 * k, by + Math.sin(an) * rr * 0.86 * k + rr * 0.08]);
      }
      P.band(bun, arc, swell(1, 0.05), rgba(HR.sh2, 0.5), { blur: 0.3, n: 1 });
      P.band(bun, arc.map(([x, y]) => [x, y - 1.2]).slice(3, 12), swell(0.8, 0.04), rgba('#ffffff', 0.6), { blur: 0.2, n: 1 });
    }
  }, { out: OUT, lw: LWD });
}
function hairPiece() {
  return piece('vv:hair', [-28, -40, 28, 10], (P) => {
    const cap = poly(capPts());
    const fill = lin(0, -32, 0, 4, [[0, mixHex(HR.base, HR.hi, 0.3)], [0.55, HR.base], [1, mixHex(HR.base, HR.sh1, 0.45)]]);
    P.add(cap, fill);
    P.detail(poly(cr(ribbon(EDGE, () => 2.6, { n: 4 }), true, 2)), rgba(HR.sh1, 0.45), { clip: cap, blur: 0.6 });
    // the finger waves: each lock its own band, lit on every crest
    // (smooth, flat to her head: the waves shown by soft shade in each trough and a soft light along
    // each crest, inside the hair's own outline, never bumps on it)
    for (const [x0, y0, x1, y1, amp, ph, sh] of WAVES) {
      const line = waveLine(x0, y0, x0 + (x1 - x0) * 0.86, y0 + (y1 - y0) * 0.86, amp * 0.8, ph);
      P.band(cap, sideOf(line, () => 6, sh * 0.9), swell(1.6, 0.1), rgba(HR.sh2, 0.42), { blur: 0.5, n: 1 });
      P.band(cap, sideOf(line, () => 6, sh * 0.9), swell(0.45, 0.03), rgba(HR.deep, 0.35), { blur: 0.12, n: 1 });
      for (const [u0, u1] of [[0.08, 0.36], [0.52, 0.8]]) {
        const c = cr(line, false, 6);
        const seg = c.slice(Math.round(c.length * u0), Math.round(c.length * u1));
        P.band(cap, seg, swell(1.6, 0.05), rgba('#ffffff', 0.45), { blur: 0.45, n: 1 });
        P.band(cap, seg, swell(0.5, 0.03), rgba('#ffffff', 0.6), { blur: 0.12, n: 1 });
      }
    }
    // a soft roll of volume over each temple, swept back over the tops of her ears
    for (const s of [-1, 1]) {
      P.band(cap, [[s * 18, -9], [s * 21.4, -5], [s * 22.4, 0]], swell(1.4, 0.05), rgba('#ffffff', 0.45), { blur: 0.4, n: 3 });
      P.band(cap, [[s * 16.6, -6], [s * 19.4, -1], [s * 19.6, 3]], swell(1.8, 0.05), rgba(HR.sh2, 0.4), { blur: 0.5, n: 3 });
    }
    // a ring of soft shine round the crown, and moonlight along its rim
    const bandPts = [];
    for (let k = 0; k <= 36; k++) bandPts.push([-18 + k, -24.6 + 5 * ((-18 + k) / 18) ** 2]);
    P.detail(poly(cr(ribbon(bandPts, () => 3.6, { n: 1 }), true, 2)), lin(-18, 0, 18, 0, [[0, rgba(HR.hi, 0)], [0.25, rgba(HR.hi, 0.4)], [0.75, rgba(HR.hi, 0.4)], [1, rgba(HR.hi, 0)]]), { clip: cap, blur: 0.8 });
    P.band(cap, CROWN.slice(1, 6).map(([x, y]) => [x - 1.4, y + 1.2]).reverse(), swell(1.1, 0.05), rgba(HR.rim, 0.6), { blur: 0.3 });
  }, { out: OUT, lw: LWD });
}
export function tendrilPiece(s) {
  const [x0, y0] = TENDRIL_ROOT(s);
  return piece(`vv:tendril:${s}`, [x0 - 8, y0 - 3, x0 + 8, y0 + 20], (P) => {
    // a loose lock curling down in front of her ear, ending in a soft ring of a curl
    const line = [[x0, y0], [x0 + s * 1.6, y0 + 5], [x0 + s * 0.4, y0 + 10], [x0 + s * 1.8, y0 + 14], [x0 + s * 3.2, y0 + 15.6], [x0 + s * 3.4, y0 + 13.6], [x0 + s * 2.2, y0 + 12.8]];
    hlock(P, HR, line, (u) => lerp(2.6, 1, u), { shade: s, fy: FY, gloss: 0, strands: 1 });
    P.band(null, [[x0 + s * 0.6, y0 + 2], [x0 + s * 1.4, y0 + 5], [x0 + s * 0.8, y0 + 8]], swell(0.6, 0.04), rgba('#ffffff', 0.6), { blur: 0.15, n: 3 });
  }, { out: OUT, lw: LWD * 0.8 });
}
export function pearlPiece() {
  return piece('vv:pearl', [-3, -1, 3, 9], (P) => {
    P.add(poly(ribbon([[0, 0], [0, 3.2]], () => 0.5, { n: 1 })), GOLD[2], false);
    P.add(ell(0, 3, 0.8, 0.8), rad(-0.2, 2.8, 1, [[0, GOLD[0]], [1, GOLD[2]]]));
    P.add(ell(0, 5.4, 1.7, 2), rad(-0.5, 4.6, 2.2, [[0, '#ffffff'], [0.55, '#f4f0fa'], [1, '#c8bcdc']]), true, { lw: LWD * 0.6 });
    P.detail(ell(-0.6, 4.6, 0.5, 0.7, -0.4), 'rgba(255,255,255,0.95)');
    P.detail(ell(0.5, 6.6, 0.9, 0.4), rgba('#f2c0dc', 0.5), { blur: 0.2 });
  }, { out: OUT, lw: LWD * 0.6 });
}
function specsPiece(flash = false) {
  return piece(`vv:specs:${flash ? 1 : 0}`, [-26, -2, 26, 22], (P) => {
    const y = 11.4;
    const R0 = 4.4;
    const R1 = 3.9;
    for (const s of [-1, 1]) {
      const x = s * 7.4;
      const lens = ell(x, y, R0, R1);
      P.detail(lens, rgba('#f0ecff', flash ? 0.55 : 0.16));
      P.detail(lens, null, { draw: (ctx) => { ctx.save(); ctx.clip(lens); ctx.strokeStyle = `rgba(255,255,255,${flash ? 0.95 : 0.45})`; ctx.lineWidth = flash ? 2.2 : 0.8; ctx.beginPath(); ctx.moveTo(x - 2.8, y + 1.8); ctx.lineTo(x + 0.4, y - 2.6); ctx.stroke(); ctx.lineWidth = flash ? 1 : 0.4; ctx.beginPath(); ctx.moveTo(x - 1, y + 2.8); ctx.lineTo(x + 1.8, y - 0.8); ctx.stroke(); ctx.restore(); } });
      // the gold rim: lit on its upper side
      P.stroke(cr([...Array(17)].map((_, i) => [x + Math.cos((i / 16) * TAU) * R0, y + Math.sin((i / 16) * TAU) * R1]), false, 2), GOLD[3], 0.9);
      P.stroke(cr([...Array(9)].map((_, i) => [x + Math.cos(Math.PI * (1.1 + (i / 8) * 0.8)) * R0, y + Math.sin(Math.PI * (1.1 + (i / 8) * 0.8)) * R1]), false, 2), GOLD[0], 0.4);
    }
    // the bridge, and the chain from her near temple drooping back to her ear
    P.stroke(cr([[-3, y - 0.6], [0, y - 1.8], [3, y - 0.6]], false, 4), GOLD[3], 0.8);
    P.stroke(cr([[-11.8, y], [-14.6, y + 6.4], [-17.6, y + 5.4], [-18.4, y - 1.6]], false, 5), GOLD[2], 0.5);
    P.stroke(cr([[-11.8, y - 0.2], [-14.6, y + 6.2], [-17.6, y + 5.2]], false, 5), 'rgba(255,248,210,0.7)', 0.2);
  }, { out: OUT, lw: LWD * 0.5 });
}
function capPiece() {
  return piece('vv:cap', [-26, -52, 26, -14], (P) => {
    const y = -34;
    // the cap's puffed crown, gathered: soft folds radiating from its middle
    const crown = ell(1, y - 3, 12.6, 9.4);
    P.add(crown, rad(-3, y - 8, 16, [[0, '#ffffff'], [0.6, LINEN[1]], [1, LINEN[2]]]));
    for (let i = 0; i < 9; i++) {
      const an = Math.PI * (1.08 + (i / 8) * 0.84);
      P.band(crown, [[1, y + 1], [1 + Math.cos(an) * 6, y - 3 + Math.sin(an) * 4.6], [1 + Math.cos(an) * 12, y - 3 + Math.sin(an) * 9]], swell(0.8, 0.04), rgba(LINEN[3], 0.55), { blur: 0.3, n: 3 });
    }
    P.detail(ell(-3, y - 8, 4.6, 2.2, -0.3), rgba('#ffffff', 0.9), { clip: crown, blur: 0.5 });
    // its ruffle: a band round the cap's edge falling in soft scallops, a fold down each
    const ruffle = [];
    const N = 15;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const an = Math.PI * (0.98 + u * 1.04);
      ruffle.push([1 + Math.cos(an) * 16, y + 3 + Math.sin(an) * 6 + 0.6]);
    }
    const outer = [];
    for (let i = 0; i < N; i++) {
      const a = ruffle[i];
      const b = ruffle[i + 1];
      outer.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 2.6], b);
    }
    const inner = ruffle.map(([x, yy]) => [1 + (x - 1) * 0.8, y + 3 + (yy - y - 3) * 0.6 - 2]).reverse();
    const rf = poly(cr([ruffle[0], ...outer, ...inner], true, 2));
    P.add(rf, lin(0, y - 6, 0, y + 8, [[0, '#ffffff'], [1, LINEN[2]]]));
    for (let i = 0; i < N; i++) {
      const a = ruffle[i];
      const b = ruffle[i + 1];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      P.band(rf, [[m[0] * 0.85 + 0.15, m[1] - 1.6], [m[0], m[1] + 1.6]], swell(0.5, 0.04), rgba(LINEN[3], 0.75), { blur: 0.15, n: 2 });
    }
    // the plum ribbon round it, lit along its top, and its bow at her left (the viewer's right)
    const rib = [];
    for (let i = 0; i <= 14; i++) {
      const an = Math.PI * (1.02 + (i / 14) * 0.96);
      rib.push([1 + Math.cos(an) * 12.4, y + 1.2 + Math.sin(an) * 3.4 + 2.4]);
    }
    const rp = poly(ribbon(rib, () => 2.4, { n: 2 }));
    P.add(rp, lin(0, y - 1, 0, y + 4, [[0, PLUM[0]], [1, PLUM[2]]]), false);
    P.band(rp, rib.map(([x, yy]) => [x, yy - 0.6]), swell(0.6, 0.04), rgba('#ffd8ee', 0.6), { blur: 0.15, n: 1 });
    const bx = 12.6;
    const by = y + 2.6;
    for (const sd of [-1, 1]) {
      const loop = smooth([[bx, by], [bx + sd * 2.8, by - 2.8], [bx + sd * 5.2, by - 2.2], [bx + sd * 5.4, by + 0.8], [bx + sd * 3, by + 1.8]], 4);
      P.add(loop, lin(bx, by - 3, bx, by + 2, [[0, PLUM[0]], [1, PLUM[2]]]));
      P.detail(ell(bx + sd * 3, by - 0.3, 1.5, 0.8, sd * 0.2), rgba(PLUM[3], 0.7), { clip: loop, blur: 0.2 });
      P.band(loop, [[bx + sd * 1.4, by - 1.6], [bx + sd * 3.2, by - 2.6], [bx + sd * 4.8, by - 1.8]], swell(0.5, 0.04), rgba('#ffd8ee', 0.7), { blur: 0.12, n: 2 });
    }
    P.add(ell(bx, by, 1.4, 1.5), rad(bx - 0.4, by - 0.5, 1.8, [[0, PLUM[0]], [1, PLUM[2]]]));
  }, { out: OUT, lw: LWD });
}
export function ribbonTailPiece(s) {
  const bx = 12.6;
  const by = -31.4;
  return piece(`vv:tail:${s}`, [bx - 6, by - 1, bx + 8, by + 14], (P) => {
    const tip = [bx + s * 1.6 + 2, by + 11 - (s > 0 ? 1.6 : 0)];
    const line = [[bx, by + 0.6], [bx + s * 0.8 + 1, by + 6], tip];
    const p = poly(ribbon(line, (u) => lerp(1.8, 2.4, u), { n: 4, caps: false }));
    P.add(p, lin(bx, by, tip[0], tip[1], [[0, PLUM[2]], [1, PLUM[1]]]));
    P.band(p, line.map(([x, y]) => [x - 0.4, y]), swell(0.4, 0.03), rgba(PLUM[3], 0.6), { blur: 0.1, n: 4 });
  }, { out: OUT, lw: LWD });
}

// ---------- Her face ----------
// The eye in each expression (each side may differ: [near, far]): lid (the heavy upper lid lowered),
// lift (outer corner raised; hers are upswept), ik (iris size), bot (lower lid up), look, wide.
const EYE_W = 10.8;
const EYE_H = 8.4;
const EYE_Y = 7.2;
const EYES = [[-8.4, -1], [8.4, 1]];
const STERN = { lid: 0.26, lift: 0, ik: 0.92 };
// brows: [near lift, far lift] (+ raises), knit (+ inner ends down, a frown), sad (+ inner ends up)
const EXPR = {
  stern: { eye: STERN, mouth: 'prim', brow: [0, 0], knit: 0.3, blush: 0.32 },
  inspect: { eye: [{ lid: 0.02, lift: 0, ik: 0.84, look: [0, 0.1] }, { lid: 0.5, lift: 0.02, ik: 0.9, look: [0, 0.1] }], mouth: 'prim', brow: [1.8, -0.4], knit: 0, blush: 0.3 },
  tsk: { eye: { lid: 0.44, lift: 0.02, ik: 0.92, look: [-0.16, 0] }, mouth: 'purse', brow: [0.4, 0.4], knit: 0.6, blush: 0.36 },
  scandal: { eye: { lid: -0.12, lift: -0.04, ik: 0.62, wide: 1.25 }, mouth: 'gasp', brow: [2.2, 2.2], knit: -0.4, blush: 0.6, flash: true },
  shout: { eye: { lid: 0.14, lift: 0.06, ik: 0.8, wide: 1.1 }, mouth: 'shout', brow: [-0.6, -0.6], knit: 1.6, blush: 0.5 },
  fond: { closed: 'smile', mouth: 'fond', brow: [0.6, 0.6], knit: -0.6, sad: 0.4, blush: 0.75 },
  happy: { closed: 'smile', mouth: 'fond', brow: [0.6, 0.6], knit: -0.6, sad: 0.4, blush: 0.75 },
  focus: { eye: { lid: 0.42, lift: 0.04, ik: 0.92 }, mouth: 'thin', brow: [-0.4, -0.4], knit: 1.2, blush: 0.3 },
  hurt: { closed: 'hurt', mouth: 'grit', brow: [0.6, 0.6], knit: 0.4, sad: 1.2, blush: 0.3 },
  dizzy: { closed: 'dizzy', mouth: 'wave', brow: [0.8, 0.8], sad: 0.8, blush: 0.3 },
  sleep: { closed: 'down', mouth: 'parted', brow: [0, 0], blush: 0.35 },
};
export const VV_FACES = Object.keys(EXPR);
function eyeGeom(x, y, w, h0, o, sp) {
  const h = h0 * (sp.wide ?? 1);
  const L = (sp.lid ?? 0) * h;
  const b = (sp.bot ?? 0) * h;
  const lift = sp.lift ?? 0;
  const inner = [x - o * w * 0.5, y + h * 0.16];
  const outer = [x + o * w * 0.56, y - h * (0.3 + lift)];
  const top = [inner, [x - o * w * 0.28, y - h * 0.4 + L * 0.7], [x + o * w * 0.06, y - h * 0.56 + L], [x + o * w * 0.36, y - h * 0.52 + L * 0.8], outer];
  const bot = [outer, [x + o * w * 0.34, y + h * 0.16 - b], [x + o * w * 0.02, y + h * 0.42 - b], [x - o * w * 0.3, y + h * 0.4 - b * 0.9], inner];
  return { inner, outer, top, bot, h };
}
function lidFrame(lid, i, o) {
  const N = lid.length;
  const a = lid[Math.max(0, i - 1)];
  const b = lid[Math.min(N - 1, i + 1)];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  return { t, n: [o * t[1], -o * t[0]] };
}
// Her liner: one sleek band along the lid, hairline-thin at the inner corner, thickening outward, then a
// long wing sweeping up past the outer corner to a soft rounded point.
function liner(P, lid, outer, o) {
  const N = lid.length;
  const thick = (u) => 0.3 + 1.9 * u ** 1.3;
  const topPts = [];
  for (let i = N - 1; i >= 0; i--) {
    const { n } = lidFrame(lid, i, o);
    const u = i / (N - 1);
    topPts.push([lid[i][0] + n[0] * thick(u), lid[i][1] + n[1] * thick(u)]);
  }
  const { t } = lidFrame(lid, N - 1, o);
  const up = [t[0] * 0.75, t[1] * 0.75 - 0.66];
  const l = Math.hypot(...up);
  const d = [up[0] / l, up[1] / l];
  const tip = [outer[0] + d[0] * 3.6, outer[1] + d[1] * 3.6];
  const wing = [[outer[0] + d[0] * 1.6 + 0.2 * o, outer[1] + d[1] * 1.6 + 0.3], [tip[0] + o * 0.2, tip[1] + 0.2], tip, [tip[0] - o * 0.3, tip[1] - 0.1], [outer[0] + d[0] * 1.4 - o * 0.6, outer[1] + d[1] * 1.4 - 1.6]];
  const shape = poly(cr([...lid, ...wing, ...topPts], true, 2));
  P.add(shape, LASH, false);
  // a soft violet sheen along it
  const sh = [];
  for (let i = Math.round(N * 0.3); i < N - 1; i++) {
    const { n } = lidFrame(lid, i, o);
    const u = i / (N - 1);
    sh.push([lid[i][0] + n[0] * thick(u) * 0.6, lid[i][1] + n[1] * thick(u) * 0.6]);
  }
  P.band(shape, sh, swell(0.4, 0.03), rgba('#9a86d4', 0.6), { blur: 0.1, n: 2 });
  return shape;
}
function openEye(P, clip, x, y, w, h0, o, sp) {
  const { inner, outer, top, bot, h } = eyeGeom(x, y, w, h0, o, sp);
  const topC = cr(top, false, 8);
  const botC = cr(bot, false, 8);
  const N = topC.length;
  // the lid: a plum shadow deepening toward the outer corner and sweeping up with the wing; a crease
  // set well above the lash (a mature, deep-set lid)
  const wash = [];
  for (let i = 1; i < N; i++) {
    const { n } = lidFrame(topC, i, o);
    const u = i / (N - 1);
    wash.push([topC[i][0] + n[0] * (1.6 + 1.6 * u), topC[i][1] + n[1] * (1.6 + 1.6 * u)]);
  }
  P.detail(poly(ribbon(wash, (u) => 1.4 + 3 * u, { n: 2 })), lin(inner[0], inner[1], outer[0], outer[1], [[0, rgba('#b48ac6', 0.1)], [0.6, rgba('#9e70b8', 0.42)], [1, rgba('#8a5aa8', 0.6)]]), { clip, blur: 1 });
  const crease = [];
  for (let i = Math.round(N * 0.2); i < N; i++) {
    const { n } = lidFrame(topC, i, o);
    const u = i / (N - 1);
    crease.push([topC[i][0] + n[0] * (3.4 + 0.6 * u), topC[i][1] + n[1] * (3.4 + 0.6 * u)]);
  }
  P.band(clip, crease, swell(0.42, 0.04), rgba('#8070b0', 0.55), { blur: 0.1, n: 2 });
  // the white
  const white = poly([...topC, ...botC.slice(1, -1)]);
  P.detail(white, lin(x, y - h * 0.5, x, y + h * 0.4, [[0, '#d8d2ee'], [0.5, '#f8f7ff'], [1, '#ffffff']]));
  P.detail(ell(inner[0] + o * 0.8, inner[1] - 0.2, 1.2, 1), rgba('#e8b0c8', 0.7), { clip: white, blur: 0.2 });
  // the iris: small, slate-violet, a dark rim, deep under the lid, fine fibres of light, a small pupil
  const look = sp.look ?? [0, 0];
  const ix = x + o * w * 0.05 + look[0] * w;
  const iy = y + h * 0.02 + look[1] * h;
  const ik = sp.ik ?? 1;
  const irx = w * 0.3 * ik;
  const iry = h0 * 0.5 * ik;
  const iris = ell(ix, iy, irx, iry);
  const C = [white, iris];
  P.detail(iris, lin(ix, iy - iry, ix, iy + iry, [[0, EY.dk], [0.35, EY.mid], [0.75, EY.base], [1, EY.lt]]), { clip: white });
  for (let k = 0; k < 11; k++) {
    const q = Math.PI * 0.1 + (k / 10) * Math.PI * 0.8;
    P.detail(poly(ribbon([[ix + Math.cos(q) * irx * 0.36, iy + Math.sin(q) * iry * 0.36], [ix + Math.cos(q) * irx * 0.86, iy + Math.sin(q) * iry * 0.86]], (u) => 0.28 * (1 - u) + 0.08, { n: 2 })), rgba(EY.glow, 0.3), { clip: C });
  }
  P.items.push({ path: iris, line: false, strokeOnly: rgba(EY.dk, 0.9), slw: 0.55, clip: white });
  P.detail(ell(ix, iy + iry * 0.05, irx * 0.36, iry * 0.4), EY.pupil, { clip: white });
  // the heavy lid's shadow over the top of the eye
  P.detail(poly(ribbon(top, (u) => h * 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)) + 0.4, { n: 8, caps: false })), rgba('#5a4a8a', 0.5), { clip: white });
  // her lights: a sharp little square and a tiny dot
  P.detail(poly([[ix - irx * 0.3, iy - iry * 0.62], [ix - irx * 0.02, iy - iry * 0.34], [ix - irx * 0.3, iy - iry * 0.06], [ix - irx * 0.58, iy - iry * 0.34]]), '#ffffff', { clip: white });
  P.detail(ell(ix + irx * 0.42, iy + iry * 0.4, 0.38, 0.38), 'rgba(255,255,255,0.9)', { clip: white });
  // a fine smudge of liner under the outer corner
  const lowOut = botC.slice(0, Math.round(botC.length * 0.5)).map(([px, py]) => [px, py + 0.3]);
  P.band(clip, lowOut, (u) => 0.6 * (1 - u) + 0.06, rgba(LASH, 0.45), { n: 1, blur: 0.15 });
  liner(P, topC, outer, o);
}
function closedEye(P, clip, x, y, w, o, kind) {
  if (kind === 'dizzy') {
    const sp = [];
    for (let i = 0; i <= 36; i++) {
      const an = i * 0.44 * o;
      const r = 0.2 + i * 0.09;
      sp.push([x + Math.cos(an) * r, y + Math.sin(an) * r * 0.8]);
    }
    P.band(clip, sp, () => 0.7, LASH, { n: 1 });
    return;
  }
  if (kind === 'hurt') {
    P.band(clip, [[x - o * w * 0.5, y - 2], [x, y - 0.2], [x + o * w * 0.4, y + 0.6]], (u) => 0.6 + u * 0.8, LASH, { n: 4 });
    P.band(clip, [[x + o * w * 0.4, y + 0.6], [x, y + 1.6], [x - o * w * 0.5, y + 3]], (u) => 1.4 - u * 0.8, LASH, { n: 4 });
    return;
  }
  // 'smile' a soft ∩ that keeps her upswept wing; 'down' a heavy ∪ (asleep, a blink)
  const up = kind === 'smile' ? -1 : 1;
  const line = [[x - o * w * 0.5, y + 0.6], [x - o * w * 0.05, y + 0.6 + up * 1.8], [x + o * w * 0.35, y + up * 1.2], [x + o * w * 0.56, y - 1.2]];
  P.band(clip, line, (u) => 0.4 + 1.5 * u ** 1.2, LASH, { n: 6 });
  const e = line[3];
  P.band(clip, [e, [e[0] + o * 1.4, e[1] - 1], [e[0] + o * 2.6, e[1] - 2.2]], (u) => 1.6 - u * 1.2, LASH, { n: 3 });
  P.band(clip, line.map(([px, py]) => [px, py - 2.8]).slice(1), swell(0.4, 0.04), rgba('#8070b0', 0.5), { blur: 0.1, n: 4 });
}
function brows(P, clip, ex) {
  const [ln, lf] = ex.brow ?? [0, 0];
  const knit = ex.knit ?? 0;
  const sad = ex.sad ?? 0;
  EYES.forEach(([ex0, o], i) => {
    const lift = i === 0 ? ln : lf;
    const y = -2 - lift;
    const inY = y + 1 + knit * 0.9 - sad * 1.4;
    const pts = [[ex0 - o * 5, inY], [ex0 + o * 1.4, y - 1.8 + sad * 0.3], [ex0 + o * 5.6, y + 0.2 + sad * 0.8]];
    P.band(clip, pts, (u) => (u < 0.15 ? lerp(0.8, 1.15, u / 0.15) : lerp(1.15, 0.2, ((u - 0.15) / 0.85) ** 0.9)), HR.deep, { n: 6 });
  });
}
function nose(P, clip) {
  // a longer, finer nose than a girl's: a soft shade down its far side, a defined tip with a light on it
  P.band(clip, [[-0.4, 7], [-1, 11], [-1.2, 13.6], [-0.2, 14.8], [1.2, 14.8]], swell(0.9, 0.12), rgba(SK.sh2, 0.5), { blur: 0.5, n: 4 });
  P.detail(ell(0.8, 13.6, 0.9, 0.6), rgba('#ffffff', 0.7), { clip, blur: 0.2 });
  P.band(clip, [[-1.4, 15], [-0.2, 15.5], [1.2, 15.2]], swell(0.3, 0.04), rgba(SK.line, 0.6), { n: 3 });
}
// Her mouth: plum lips, a defined cupid's bow on the upper lip, a fuller lower lip with a shine.
function lips(P, clip, my, w, curve = 0, part = 0) {
  const c = curve;
  const up = smooth([[-w, my + 0.1 - c], [-w * 0.5, my - 1.1], [-0.4, my - 0.9], [0, my - 0.5], [0.4, my - 0.9], [w * 0.5, my - 1.1], [w, my + 0.1 - c], [0, my + 0.4 + part * 0.2]], 3);
  P.detail(up, lin(0, my - 1.2, 0, my + 0.4, [[0, SK.lipDk], [1, mixHex(SK.lipDk, SK.lip, 0.4)]]), { clip });
  const lo = smooth([[-w * 0.82, my + 0.3 - c * 0.6 + part], [0, my + 0.4 + part], [w * 0.82, my + 0.3 - c * 0.6 + part], [w * 0.4, my + 1.9 + part], [0, my + 2.3 + part], [-w * 0.4, my + 1.9 + part]], 3);
  P.detail(lo, lin(0, my + 0.4, 0, my + 2.3 + part, [[0, SK.lip], [1, mixHex(SK.lip, SK.lipDk, 0.5)]]), { clip });
  P.detail(ell(-0.6, my + 1.3 + part, 0.9, 0.35), rgba('#ffe4f0', 0.75), { clip, blur: 0.12 });
  P.band(clip, [[-w, my + 0.1 - c], [0, my + 0.3 + part * 0.5 + (c > 0 ? 0.3 : 0)], [w, my + 0.1 - c]], swell(0.28, 0.06), SK.mouth, { n: 4 });
}
function openMouth(P, clip, pts, tongue = true, teeth = false) {
  const p = smooth(pts, 4);
  P.detail(p, SK.mouth, { clip, stroke: SK.lipDk, slw: 0.8 });
  if (teeth) {
    const ys = pts.map((q) => q[1]);
    const t = new Path2D();
    t.rect(-6, Math.min(...ys) - 1, 12, 1.6);
    P.detail(t, '#ffffff', { clip: [clip, p] });
  }
  if (tongue) {
    const yb = Math.max(...pts.map((q) => q[1]));
    P.detail(ell(0, yb - 0.6, 1.8, 1), '#d27a9a', { clip: [clip, p] });
  }
}
function mouth(P, clip, kind) {
  const my = 19.4;
  if (kind === 'prim') lips(P, clip, my, 2.8, 0.2);
  else if (kind === 'fond') lips(P, clip, my, 3, -0.7);
  else if (kind === 'thin') lips(P, clip, my, 2.4, 0.3);
  else if (kind === 'purse') {
    const p = smooth([[0.4, my - 0.8], [1.8, my - 0.2], [2, my + 1.2], [0.4, my + 2], [-0.8, my + 1.2], [-0.8, my - 0.2]], 3);
    P.detail(p, lin(0, my - 0.8, 0, my + 2, [[0, SK.lipDk], [1, SK.lip]]), { clip });
    P.detail(ell(0.6, my + 0.6, 0.5, 0.4), SK.mouth, { clip });
    P.detail(ell(0, my + 1.2, 0.5, 0.25), rgba('#ffe4f0', 0.7), { clip, blur: 0.1 });
  } else if (kind === 'gasp') openMouth(P, clip, [[-1.6, my - 0.4], [0, my - 1], [1.6, my - 0.4], [1.8, my + 1.8], [0, my + 3.2], [-1.8, my + 1.8]], true);
  else if (kind === 'shout') openMouth(P, clip, [[-3, my + 0.9], [-1.6, my - 0.6], [0, my - 0.9], [1.6, my - 0.6], [3, my + 0.9], [2.2, my + 2.8], [0, my + 3.2], [-2.2, my + 2.8]], true, true);
  else if (kind === 'grit') {
    const p = smooth([[-3, my - 0.4], [0, my - 0.8], [3, my - 0.4], [2.6, my + 1.4], [0, my + 1.8], [-2.6, my + 1.4]], 4);
    P.detail(p, '#ffffff', { clip, stroke: SK.lipDk, slw: 0.5 });
    P.stroke([[-2.6, my + 0.5], [2.6, my + 0.5]], rgba(SK.lipDk, 0.5), 0.3, { clip: p });
  } else if (kind === 'wave') P.band(clip, [[-2.6, my + 0.4], [-1.3, my - 0.4], [0, my + 0.4], [1.3, my - 0.4], [2.6, my + 0.4]], () => 0.5, SK.lipDk, { n: 4 });
  else if (kind === 'parted') lips(P, clip, my, 2.6, 0, 0.5);
  else if (kind === 'talk1') openMouth(P, clip, [[-2, my - 0.4], [0, my - 0.6], [2, my - 0.4], [1.6, my + 1.2], [0, my + 1.8], [-1.6, my + 1.2]]);
  else if (kind === 'talk2') openMouth(P, clip, [[-2.4, my - 0.5], [0, my - 0.7], [2.4, my - 0.5], [1.9, my + 2], [0, my + 2.8], [-1.9, my + 2]]);
}
export function facePiece(name, blink = false, talk = 0) {
  const ex = EXPR[name] ?? EXPR.stern;
  return piece(`vv:face:${name}:${blink ? 1 : 0}:${talk}`, [-24, -26, 24, 30], (P) => {
    // her ears, a little behind the face's edge, shaded inside, a pearl stud on each lobe
    for (const s of [-1, 1]) {
      const ear = smooth([[s * 16.6, 0], [s * 19.6, -1.4], [s * 21, 2.4], [s * 20.4, 7.6], [s * 18.6, 10.6], [s * 16.4, 9.6]], 4);
      P.add(ear, lin(s * 16, 0, s * 21, 0, [[0, SK.sh1], [1, SK.base]]));
      P.band(ear, [[s * 18.4, 1.2], [s * 19.6, 3.6], [s * 19, 7.2]], swell(1.2, 0.1), rgba(SK.sh2, 0.6), { blur: 0.4, n: 3 });
    }
    const head = HEAD();
    P.add(head, lin(0, -24, 0, 27, [[0, SK.hi], [0.55, SK.base], [1, mixHex(SK.base, SK.sh1, 0.45)]]), true, { stroke: rgba(SK.line, 0.4), slw: 0.5 });
    P.glow(head, 6, -6, 22, SK.hi, 0.65);
    // high cheekbones: a light on each, a soft shade sweeping beneath toward the jaw
    for (const sd of [-1, 1]) {
      P.detail(ell(sd * 11.4, 10.4, 4, 2.2, sd * -0.3), rgba('#ffffff', sd > 0 ? 0.4 : 0.25), { clip: head, blur: 0.9 });
      P.band(head, [[sd * 16.6, 8], [sd * 14.6, 14], [sd * 11, 19], [sd * 7.4, 22.4]], swell(2, 0.2), rgba(SK.sh1, sd < 0 ? 0.55 : 0.35), { blur: 1.1 });
      P.band(head, [[sd * 15.8, -6], [sd * 16.6, 2], [sd * 16.6, 8]], swell(2.6, 0.2), rgba(SK.sh1, 0.45), { blur: 1 });
    }
    P.band(head, [[-9, 22.8], [0, 26.6], [9, 22.8]], swell(1.8, 0.3), rgba(SK.sh1, 0.5), { blur: 0.8 });
    P.detail(ell(0.6, 24.4, 2.4, 1), rgba('#ffffff', 0.4), { clip: head, blur: 0.5 });
    // her hairline's soft shadow on her brow
    P.detail(poly(capPts().map(([x, y]) => [x + 0.3, y + 1.4])), rgba(SK.sh2, 0.45), { clip: head, blur: 0.8 });
    // a faint ghostly rim of moonlight down her lit side
    P.band(head, [[17.6, -6], [17.8, 4], [16, 12], [12.6, 18]], swell(1, 0.1), rgba('#f4f2ff', 0.8), { blur: 0.5 });
    // blush: a soft rose high on the cheekbones, sweeping back (never round dots)
    for (const sd of [-1, 1]) P.detail(ell(sd * 11, 12, 4.4, 1.8, sd * -0.25), rgba(SK.blush, ex.blush * 0.75), { clip: head, blur: 1.1 });
    const kind = blink ? (ex.closed === 'smile' ? 'smile' : 'down') : ex.closed;
    EYES.forEach(([x, o], i) => {
      const sp = Array.isArray(ex.eye) ? ex.eye[i] : ex.eye;
      if (kind) closedEye(P, head, x, EYE_Y, EYE_W, o, kind);
      else openEye(P, head, x, EYE_Y, EYE_W, EYE_H, o, sp);
    });
    brows(P, head, ex);
    nose(P, head);
    mouth(P, head, talk ? `talk${talk}` : ex.mouth);
    // her beauty mark, by her lip on her lit side
    P.detail(ell(5.6, 21.8, 0.5, 0.5), '#5a3a6a', { clip: head });
  }, { out: OUT, lw: LWD });
}

// ---------- Drawing her head each frame (in her head's frame, its middle at the origin) ----------
// (her bun's soft-body squash: about its foot, wider as it squashes, keeping its volume)
function squash(ctx, a, footY, k) {
  const j = clamp(a.vvJig ?? 0, -1, 1) * k;
  ctx.translate(0, footY);
  ctx.scale(1 + j, 1 / (1 + j));
  ctx.translate(0, -footY);
}
export function drawHeadBack(ctx, a, mode, q, flash) {
  ctx.save();
  ctx.translate(0, q.bunBob ?? 0);
  squash(ctx, a, -18, 0.05);
  drawPiece(ctx, backPiece(), mode, flash);
  ctx.restore();
}
export function drawHeadFront(ctx, a, mode, q, flash) {
  const t = a.t ?? 0;
  const f = VV_FACES.includes(q.face) ? q.face : 'stern';
  const blink = (f === 'stern' || f === 'focus' || f === 'tsk') && ((t + (a.mo?.uid ?? 0) * 0.37) % 5.1) < 0.13;
  const talk = (q.talk ?? 0) > 0.05 && !['scandal', 'shout'].includes(f) ? 1 + (Math.sin(t * 15) > 0.2 ? 1 : 0) : 0;
  drawPiece(ctx, facePiece(f, blink, talk), mode, flash);
  // the pearls at her ears, swinging
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 18.8, 10);
    ctx.rotate(Math.sin(t * 2 + s) * 0.08 - (a.vvWisp ?? 0) * 0.25);
    drawPiece(ctx, pearlPiece(), mode, flash);
    ctx.restore();
  }
  drawPiece(ctx, hairPiece(), mode, flash);
  for (const s of [-1, 1]) {
    const [x0, y0] = TENDRIL_ROOT(s);
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(clamp(-(a.vvWisp ?? 0) * 0.22 * (s > 0 ? 1 : 0.8), -0.3, 0.3));
    ctx.translate(-x0, -y0);
    drawPiece(ctx, tendrilPiece(s), mode, flash);
    ctx.restore();
  }
  drawPiece(ctx, specsPiece(!!EXPR[f]?.flash), mode, flash);
  ctx.save();
  ctx.translate(0, (q.bunBob ?? 0) * 0.8);
  squash(ctx, a, -24, 0.06);
  for (const s of [-1, 1]) {
    const bx = 12.6;
    const by = -31.4;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(clamp(-(a.vvRibbon ?? 0) * 0.3 * s, -0.4, 0.4));
    ctx.translate(-bx, -by);
    drawPiece(ctx, ribbonTailPiece(s), mode, flash);
    ctx.restore();
  }
  drawPiece(ctx, capPiece(), mode, flash);
  ctx.restore();
}
