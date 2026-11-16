// The level 1-50 weapons, redrawn (tiers 0-10: wood, then Copper to Starsteel). Each tier is a
// weapon of its own with its own silhouette, the way MapleStory's ladder goes from a practice
// sword to a gladius, a xiphos, an arming sword, a sabre and on, rather than one shape recoloured
// (research/fx.md section 6; a weapon must read from its silhouette alone). Higher tiers keep the
// older forms (weapon-forms.js).
//
// Same frame as weapon-forms.js: the grip at (0, 0), the weapon pointing toward -y, the cutting
// edge toward +x. Each design returns { shapes, blade: [top, base], reach, a } with the anchors
// the live effects use (tip, head, gem, runes).
//
// Gauntlets are a small glove now: `gloveShapes` dresses the weapon hand (render/gear.js), and the
// gauntlet itself draws nothing in the hand.

import { R, E, T, F, mix } from './pixel.js';
import { SPROUT_DESIGNS } from './weapon-sprout.js';
import { ROOTWOOD_DESIGNS } from './weapon-rootwood.js';
import { TIDEPEARL_DESIGNS } from './weapon-tidepearl.js';
import { STARGLASS_DESIGNS } from './weapon-starglass.js';
import { DREAMSILK_DESIGNS } from './weapon-dreamsilk.js';
import { REGALIA_DESIGNS } from './weapon-regalia.js';

const WHITE = '#ffffff';
const GOLD = '#ffd66b';

// A polygon from its +x half (listed from the top down), mirrored onto -x.
function mir(half, c) {
  const back = half.slice(half[0][0] === 0 ? 1 : 0).reverse().map(([x, y]) => [-x, y]);
  return T([...half, ...back], c);
}
// A gem with a glint.
const gem = (x, y, r, c) => [E(x, y, r, r, c), F(E(x - r * 0.35, y - r * 0.35, r * 0.38, r * 0.38, WHITE))];
// A four-point star.
function star(x, y, r, c, k = 0.3) {
  const q = r * k;
  return T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c);
}
// A grip `len` long below the guard, wrapped in bands of `band` every `step`.
function grip(len, c, band, step = 1.8, w = 2.8) {
  const out = [R(-w / 2, -2.5, w, len + 2.5, c)];
  if (band) for (let y = -1.6; y < len - 0.4; y += step) out.push(R(-w / 2, y, w, 0.7, band));
  return out;
}
// A leaf from (x, y) toward angle `a` (degrees, 0 = +x, 90 = up), `len` long, `w` wide.
function leafAt(x, y, a, len, w, c) {
  const r = (a * Math.PI) / 180;
  const d = [Math.cos(r), -Math.sin(r)];
  const n = [-d[1], d[0]];
  const at = (u, s) => [x + d[0] * len * u + n[0] * w * s, y + d[1] * len * u + n[1] * w * s];
  return T([at(0, 0), at(0.35, 0.95), at(0.75, 0.7), at(1, 0), at(0.75, -0.7), at(0.35, -0.95)], c);
}
// A tapered band along a centre line, `w0` wide at its start and `w1` at its end, as one polygon.
function tube(pts, w0, w1) {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [px, py] = pts[Math.max(0, i - 1)];
    const [nx, ny] = pts[Math.min(pts.length - 1, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x - (dy / len) * w, y + (dx / len) * w]);
    r.push([x + (dy / len) * w, y - (dx / len) * w]);
  });
  return [...l, ...r.reverse()];
}
// A blade's bright edge on its +x side, from `y0` down to `y1`, set in from `x` by `w`.
const edgeStrip = (x, y0, y1, c, w = 0.9) => T([[x, y0], [x, y1], [x - w, y1], [x - w, y0 + 1]], c);

// ---------- Swords ----------
//
// The guard sits at B; blades rise from it, grips hang below. Practice sword, gladius, xiphos,
// arming sword, sabre, silver swept-hilt, elven leaf blade, cobalt wave blade, crystal blade,
// runic longsword, starsteel longsword.
const B = -4;

function sword(m, t) {
  const s = [];
  const a = {};
  let L;
  let top;
  const done = (gemAt) => {
    a.tip = [0, top];
    a.head = [0, B - L * 0.55];
    a.blade = [top, B];
    if (gemAt) a.gem = gemAt;
    return { shapes: s, blade: [top, B], reach: [], a };
  };
  switch (t) {
    case 0: {
      // A practice sword: a rounded wooden blade with its grain, a plain bar guard, a cloth-wrapped
      // grip and a pink ribbon tied at the pommel.
      L = 19;
      top = B - L;
      s.push(...grip(6, '#efe0bf', '#c9a878', 1.4));
      s.push(T([[0, 6.4], [3.2, 8.4], [2.4, 10.8], [0.6, 8.6]], '#ff7a9a'), T([[0, 6.4], [-2.6, 9.6], [-1.2, 11], [-0.2, 8.8]], '#ff9ec0'));
      s.push(E(0, 6.6, 1.9, 1.7, m.trim), E(0, 7, 1.1, 0.9, '#ff7a9a'));
      s.push(mir([[0, top], [1.6, top + 0.5], [2.5, top + 2.2], [2.5, B]], m.blade));
      s.push(F(R(-1.1, top + 4, 0.6, L - 6, m.bladeDark)), F(R(0.7, top + 8, 0.6, L - 11, m.bladeDark)), F(R(-0.2, top + 2.5, 0.5, 5, m.edge)));
      s.push(R(-4.6, B, 9.2, 2.2, m.trim), E(-4.6, B + 1.1, 1.1, 1.1, m.trim), E(4.6, B + 1.1, 1.1, 1.1, m.trim));
      return done();
    }
    case 1: {
      // A copper gladius: a short leaf-waisted blade with a ridge, a round guard and a ball pommel.
      L = 19;
      top = B - L;
      s.push(...grip(5.5, m.grip, m.trimDark));
      s.push(E(0, 6.5, 2.5, 2.3, m.trim), F(E(-0.7, 5.9, 0.7, 0.6, m.edge)));
      s.push(mir([[0, top], [1.6, top + 2.6], [3.1, top + 7.5], [2.9, B - 5], [2.2, B]], m.blade));
      s.push(F(T([[0, top + 1.2], [0.5, top + 3.5], [0.5, B - 1], [-0.5, B - 1], [-0.5, top + 3.5]], m.bladeDark)));
      s.push(edgeStrip(2.9, top + 7.5, B - 5, m.edge));
      s.push(E(0, B + 0.8, 4.6, 1.7, m.trim), F(E(0, B + 0.3, 3.4, 0.5, m.edge)));
      return done();
    }
    case 2: {
      // A bronze xiphos: a broad leaf blade swelling near the point, horned crescent guard, a ring
      // pommel.
      L = 20;
      top = B - L;
      s.push(...grip(5.5, m.grip, m.trimDark));
      s.push(E(0, 7, 2.3, 2.3, m.trim), F(E(0, 7, 1.05, 1.05, m.trimDark)));
      s.push(mir([[0, top], [2.2, top + 4], [3.7, top + 9.5], [3.2, B - 4], [2, B - 1.4], [2.5, B]], m.blade));
      s.push(F(T([[0, top + 1.5], [0.45, top + 4], [0.45, B - 1], [-0.45, B - 1], [-0.45, top + 4]], m.bladeDark)));
      s.push(edgeStrip(3.6, top + 9.5, B - 4, m.edge));
      s.push(T([[-6.2, B - 3.4], [-4.6, B - 0.6], [-2, B + 0.3], [2, B + 0.3], [4.6, B - 0.6], [6.2, B - 3.4], [6.8, B - 0.2], [4.2, B + 2.1], [-4.2, B + 2.1], [-6.8, B - 0.2]], m.trim));
      return done();
    }
    case 3: {
      // An iron arming sword: straight and sturdy with a fuller, a cross guard with ball ends, a
      // wheel pommel.
      L = 21;
      top = B - L;
      s.push(...grip(6, m.grip, m.trimDark));
      s.push(E(0, 7.4, 2.5, 2.5, m.trim), F(E(0, 7.4, 1, 1, m.trimDark)));
      s.push(mir([[0, top], [2.8, top + 3.4], [2.8, B]], m.blade));
      s.push(F(R(-0.6, top + 5, 1.2, L - 8, m.bladeDark)), edgeStrip(2.8, top + 3.4, B, m.edge));
      s.push(R(-6, B, 12, 2.2, m.trim), E(-6.3, B + 1.1, 1.5, 1.5, m.trim), E(6.3, B + 1.1, 1.5, 1.5, m.trim), F(R(-5, B + 1.5, 10, 0.6, m.trimDark)));
      return done();
    }
    case 4: {
      // A steel sabre: the blade curves forward to a clipped point; a knuckle bow loops from the
      // guard round the front of the hand to the pommel.
      L = 22;
      top = B - L;
      const cx = (u) => 3 * u * u;
      const hw = (u) => 2.5 - u * 0.5;
      const edge = [];
      const back = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        const y = B - L * u;
        edge.push([cx(u) + hw(u), y]);
        if (u <= 0.8) back.push([cx(u) - hw(u), y]);
      }
      const tip = [cx(1) + 1.6, top];
      s.push(...grip(6, m.grip, m.trimDark));
      // The knuckle bow: a smooth D from the guard's front end round to the pommel.
      const arc = (rx, ry) => Array.from({ length: 9 }, (_, i) => {
        const r = ((-90 + (i * 180) / 8) * Math.PI) / 180;
        return [0.6 + Math.cos(r) * rx, 2 + Math.sin(r) * ry];
      });
      s.push(T([...arc(5, 6.3), ...arc(3.7, 5).reverse()], m.trim));
      s.push(E(0, 7.8, 1.9, 1.8, m.trim), F(E(-0.5, 7.3, 0.6, 0.5, m.edge)));
      s.push(T([...edge.slice(0, 10), tip, ...back.reverse()], m.blade));
      s.push(F(T(edge.slice(1, 9).map(([x, y]) => [x - 1.6, y]).concat(edge.slice(1, 9).reverse().map(([x, y]) => [x - 2.4, y])), m.bladeDark)));
      s.push(T([...edge.slice(0, 10), tip, ...edge.slice(0, 10).reverse().map(([x, y]) => [x - 0.9, y])], m.edge));
      s.push(R(-3.6, B, 7.2, 2.2, m.trim), F(R(-3, B + 1.5, 6, 0.6, m.trimDark)));
      a.head = [cx(0.55), B - L * 0.55];
      a.tip = tip;
      a.blade = [top, B];
      return { shapes: s, blade: [top, B], reach: [], a };
    }
    case 5: {
      // A silver sword: a slim fullered blade, quillons sweeping up like wings, a pink gem at the
      // heart and a gem drop for a pommel.
      L = 24;
      top = B - L;
      s.push(...grip(6, m.grip, m.trimDark));
      s.push(T([[0, 5.6], [1.7, 7.4], [0, 10], [-1.7, 7.4]], m.trim), ...gem(0, 7.5, 0.95, m.gem));
      s.push(mir([[0, top], [2.3, top + 3], [2.3, B]], m.blade));
      s.push(F(R(-0.5, top + 4.5, 1, L - 7, m.bladeDark)), edgeStrip(2.3, top + 3, B, m.edge));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.5, B + 1.8], [sd * 4, B + 0.6], [sd * 6.6, B - 2.4], [sd * 7.6, B - 5], [sd * 7.8, B - 2], [sd * 5.2, B + 1.8], [sd * 2, B + 2.6]], m.trim));
      s.push(E(0, B + 1, 2.7, 2.3, m.trim), ...gem(0, B + 1, 1.35, m.gem));
      return done([0, B + 1]);
    }
    case 6: {
      // A mithril elven blade: long and leaf-tipped with a vine line down it, leaf quillons
      // reaching up, a sea-blue gem.
      L = 25;
      top = B - L;
      s.push(...grip(6, m.grip, m.trimDark, 2));
      s.push(leafAt(0, 5.6, -90, 5, 1.8, m.trim), ...gem(0, 7, 0.8, m.gem));
      s.push(mir([[0, top], [2.4, top + 4], [3.1, top + 8.5], [2.2, B - 7], [2.6, B - 1.5], [2.2, B]], m.blade));
      s.push(F(R(-0.35, top + 6, 0.7, L - 9, m.edge)));
      for (const [y, sd] of [[top + 10, 1], [top + 14, -1], [top + 18, 1]]) s.push(F(leafAt(0, y, sd > 0 ? 40 : 140, 2.4, 0.8, m.edge)));
      s.push(edgeStrip(3.1, top + 8.5, B - 7, m.edge, 0.8));
      s.push(leafAt(1, B + 1, 35, 7.5, 1.9, m.trim), leafAt(-1, B + 1, 145, 7.5, 1.9, m.trim));
      s.push(E(0, B + 1, 2.4, 2.2, m.trim), ...gem(0, B + 1, 1.3, m.gem));
      return done([0, B + 1]);
    }
    case 7: {
      // A cobalt wave blade: broad, its back cut into breaking waves, fins for a guard and a fin
      // tail for a pommel, a gold gem.
      L = 25;
      top = B - L;
      s.push(...grip(6, m.grip, m.trimDark));
      s.push(T([[0, 5.4], [3, 9.2], [0.4, 8.2], [0, 10.4], [-0.4, 8.2], [-3, 9.2]], m.trim));
      const back = [];
      for (let y = B; y > top + 6; y -= 5) back.push([-3.6, y], [-3.6, y - 2], [-5, y - 3.6]);
      s.push(T([[0, top], [3.6, top + 4.5], [3.6, B], ...back, [-3.6, top + 6], [-2, top + 2.5]], m.blade));
      s.push(F(R(-0.6, top + 5, 1.2, L - 8, m.bladeDark)), edgeStrip(3.6, top + 4.5, B, m.edge));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.8, B], [sd * 5.2, B - 1.4], [sd * 8.4, B + 2.6], [sd * 5.6, B + 2], [sd * 2, B + 2.6]], m.trim));
      s.push(E(0, B + 1, 2.6, 2.3, m.trim), ...gem(0, B + 1, 1.35, m.gem));
      return done([0, B + 1]);
    }
    case 8: {
      // A crystal blade: cut in facets, one face in shadow, shards of crystal growing from the
      // guard, a crystal point for a pommel.
      L = 26;
      top = B - L;
      s.push(...grip(6, m.grip, m.trimDark));
      s.push(T([[-1.6, 5.6], [1.6, 5.6], [0, 10.6]], m.blade), F(T([[0, 5.6], [1.6, 5.6], [0, 10.6]], m.bladeDark)));
      s.push(mir([[0, top], [2.3, top + 3.5], [3.5, top + 10], [2.7, B]], m.blade));
      s.push(F(T([[0, top], [0, B], [-2.7, B], [-3.5, top + 10], [-2.3, top + 3.5]], m.bladeDark)));
      s.push(F(T([[0.4, top + 3], [2.8, top + 10], [2.2, B - 2], [1.4, B - 2], [1.8, top + 10]], m.edge)));
      for (const sd of [-1, 1]) {
        s.push(T([[sd * 1.6, B + 1.6], [sd * 6.4, B - 4.6], [sd * 7, B - 2.4], [sd * 3.2, B + 2.2]], m.blade));
        s.push(T([[sd * 2.4, B + 2], [sd * 5, B - 0.4], [sd * 5.4, B + 1.6]], m.edge));
      }
      s.push(E(0, B + 1, 2.4, 2.2, m.trim), ...gem(0, B + 1, 1.45, m.gem));
      return done([0, B + 1]);
    }
    case 9: {
      // A runic longsword: a heavy dark-stone blade with a stepped shoulder, runes glowing down its
      // heart, wings of the guard swept down, a long grip and a cut-diamond pommel.
      L = 27;
      top = B - L;
      s.push(...grip(7.5, m.grip, m.trimDark, 1.9));
      s.push(T([[0, 6.8], [2.2, 8.8], [0, 11.6], [-2.2, 8.8]], m.trim), ...gem(0, 9, 0.85, m.gem));
      s.push(mir([[0, top], [3.2, top + 4.5], [3.2, B - 3.4], [4.3, B - 2.2], [3.2, B]], m.blade));
      s.push(edgeStrip(3.2, top + 4.5, B - 3.4, m.edge));
      const y0 = top + 5;
      const y1 = B - 4;
      for (let y = y0, i = 0; y < y1 - 1; y += 3.2, i++) {
        s.push(F(R(-0.6, y, 1.2, 2.2, m.rune)));
        s.push(F(i % 2 ? R(-1.4, y + 0.8, 2.8, 0.6, m.rune) : R(-1.4, y + 0.3, 0.6, 1.4, m.rune)));
      }
      a.runes = [0, y0, y1];
      for (const sd of [-1, 1]) s.push(T([[sd * 1.6, B], [sd * 7.4, B + 0.2], [sd * 8.4, B + 4.6], [sd * 5.6, B + 2.4], [sd * 2, B + 2.6]], m.trim), T([[sd * 3, B], [sd * 4.6, B - 2.6], [sd * 5.2, B]], m.trim));
      s.push(E(0, B + 1, 2.6, 2.3, m.trim), ...gem(0, B + 1, 1.4, m.gem));
      return done([0, B + 1]);
    }
    default: {
      // A starsteel longsword: a long night-blue blade set with little stars, a gold star at the
      // guard behind crescent quillons, a star for a pommel.
      L = 29;
      top = B - L;
      s.push(...grip(7.5, m.grip, m.trimDark, 1.9));
      s.push(star(0, 9.2, 3, GOLD), ...gem(0, 9.2, 0.8, m.gem));
      s.push(mir([[0, top], [2.6, top + 6], [3.3, top + 12], [3.3, B]], m.blade));
      s.push(F(R(-0.5, top + 7, 1, L - 10, m.bladeDark)), edgeStrip(3.3, top + 12, B, m.edge), F(T([[0, top + 0.6], [2.4, top + 6], [1.6, top + 6]], m.edge)));
      for (const [x, y, r] of [[-1.3, top + 10, 1.5], [1.2, top + 16, 1.2], [-1, top + 21.5, 1.4]]) s.push(F(star(x, y, r, m.rune)));
      s.push(star(0, B + 1, 6.4, GOLD, 0.26));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.6, B + 0.4], [sd * 6, B - 1.2], [sd * 8.8, B - 4.8], [sd * 7.6, B - 0.6], [sd * 3.6, B + 2.4]], m.trim));
      s.push(E(0, B + 1, 2.4, 2.2, m.trim), ...gem(0, B + 1, 1.45, m.gem));
      return done([0, B + 1]);
    }
  }
}

// An arc of points round (cx, cy), radii rx and ry, from angle a0 to a1 (degrees, 0 = +x, 90 =
// up), n steps.
function arcPts(cx, cy, rx, ry, a0, a1, n = 10) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const r = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(r) * rx, cy - Math.sin(r) * ry];
  });
}
// A shape's points flipped onto the other side of the haft.
const flipX = (pts) => pts.map(([x, y]) => [-x, y]);

// A crescent moon blade on side sd of the haft (1 or -1), centred at height cy, r across: its horns
// curl back free of the haft, and a neck joins its middle to the haft.
function crescent(sd, cy, r, m) {
  const k = r / 11;
  const outer = arcPts(0, cy, r, r * 0.95, 72, -72, 14);
  const inner = arcPts(-2.6 * k, cy, r * 0.9, r * 0.72, -60, 60, 12);
  const side = (pts) => pts.map(([x, y]) => [sd * x, y]);
  return [
    T(side([[1, cy - 2.6 * k], [r * 0.7, cy - 2.6 * k], [r * 0.7, cy + 2.6 * k], [1, cy + 2.6 * k]]), m.trim),
    T(side([...outer, ...inner]), m.blade),
    T(side([...arcPts(0, cy, r, r * 0.95, 62, -62, 12), ...arcPts(0, cy, r - 1.2, r * 0.95 - 1.2, -58, 58, 12)]), m.edge),
  ];
}

// ---------- Axes ----------
//
// A haft from the head down past the hand to a butt cap; the head on the +x side near the top.
// A lashed stone hatchet, a bearded copper hatchet, a bronze crescent with its two holes, an iron
// wedge with a hammer back, a steel tomahawk with a back spike, a silver double-bit, a mithril moon
// blade, a cobalt breaking-wave blade, a faceted crystal double-bit, a runic battleaxe and a
// starsteel battleaxe of two crescent moons round a star.
function axe(m0, t) {
  const m = t === 0 ? { ...m0, blade: '#c4bdb0', bladeDark: '#968e81', edge: '#e2ddd3' } : m0;
  const H = [22, 23, 24, 25, 26, 27, 28, 28, 29, 30, 31][t];
  const top = -H;
  const s = [];
  const a = {};
  s.push(R(-1.3, top, 2.6, H + 7, m.handle));
  if (t === 0) for (let y = top + 3; y < 5; y += 5) s.push(F(R(-1.3, y, 2.6, 0.6, m.handleDark)));
  s.push(...grip(4, m.grip, m.trimDark, 1.7, 2.6).map((r) => ({ ...r, y: r.y + 0.5 })));
  s.push(E(0, 7, 2, 1.6, m.trim));
  if (t >= 4) s.push(T([[-1.3, 7.6], [0, 11], [1.3, 7.6]], m.trim));
  let bx = 9;
  let hh = 12;
  const edge = (pts) => s.push(T(pts, m.edge));
  switch (t) {
    case 0: {
      // A stone wedge lashed on with cord.
      hh = 10;
      s.push(T([[0.6, top + 2], [6.6, top + 0.6], [9, top + 5.4], [6.8, top + 10.6], [0.6, top + 9.2]], m.blade));
      s.push(F(T([[4.4, top + 1.6], [6.4, top + 5.4], [4.6, top + 9.6], [3.2, top + 5.4]], m.bladeDark)), F(T([[7.6, top + 3], [8.6, top + 5.4], [7.6, top + 7.8], [7.2, top + 5.4]], m.edge)));
      for (const y of [top + 3, top + 6.4]) s.push(R(-1.8, y, 3.6, 1.2, '#c9a878'));
      s.push(T([[-1.8, top + 4.2], [1.8, top + 6.4], [1.8, top + 7.4], [-1.8, top + 5.2]], '#b08a5a'));
      bx = 9;
      break;
    }
    case 1: {
      // A bearded hatchet: the blade drops into a hooked beard below.
      hh = 12;
      s.push(T([[0.6, top + 1.6], [5, top + 1.2], [8.6, top], [9.8, top + 4], [9.4, top + 9], [6.8, top + 12.4], [5.6, top + 8.4], [0.6, top + 6.6]], m.blade));
      edge([[8.6, top + 0.4], [9.8, top + 4], [9.4, top + 9], [7, top + 12], [6.6, top + 11], [8.4, top + 8.6], [8.8, top + 4.2], [8, top + 1.2]]);
      s.push(R(-1.9, top + 1, 3.8, 6.2, m.trim));
      bx = 10;
      break;
    }
    case 2: {
      // A bronze fan: narrow at the haft, flaring to a wide curved edge, two rings cast in it.
      hh = 15;
      const cy = top + 7;
      const arc = arcPts(2, cy, 9, 8.4, 70, -70, 12);
      s.push(T([[0.6, cy - 2.6], ...arc, [0.6, cy + 2.6]], m.blade));
      edge(arcPts(2, cy, 9, 8.4, 66, -66, 10).concat(arcPts(2, cy, 7.8, 7.4, -62, 62, 10)));
      s.push(F(E(5.6, cy - 2.2, 1.1, 1.1, m.bladeDark)), F(E(5.6, cy + 2.2, 1.1, 1.1, m.bladeDark)), F(E(5.6, cy - 2.2, 0.5, 0.5, m.edge)), F(E(5.6, cy + 2.2, 0.5, 0.5, m.edge)));
      s.push(R(-1.9, cy - 3.4, 3.8, 6.8, m.trim), F(R(-1.9, cy - 0.4, 3.8, 0.8, m.trimDark)));
      bx = 11;
      break;
    }
    case 3: {
      // An iron wedge flaring to a broad edge, a hammer poll behind.
      hh = 13;
      s.push(T([[0.6, top + 3], [4, top + 2.6], [9, top - 0.6], [10.4, top + 6.2], [9, top + 13], [4, top + 9.8], [0.6, top + 9.4]], m.blade));
      edge([[9, top - 0.4], [10.4, top + 6.2], [9, top + 12.8], [8, top + 11.4], [9.2, top + 6.2], [8, top + 1]]);
      s.push(F(T([[1.2, top + 4.2], [5, top + 3.6], [5, top + 8.4], [1.2, top + 8]], m.bladeDark)));
      s.push(R(-4.4, top + 3.6, 3.4, 5, m.blade), F(R(-4.4, top + 7.4, 3.4, 1.2, m.bladeDark)), R(-1.9, top + 2.6, 3.8, 7.4, m.trim));
      bx = 10.4;
      break;
    }
    case 4: {
      // A steel tomahawk: a long beard, a spike behind, the haft wrapped under the head.
      hh = 15;
      s.push(T([[0.6, top + 2], [6, top + 2], [10, top - 1.2], [11.2, top + 5], [10.2, top + 12], [7.2, top + 15.4], [5, top + 9], [0.6, top + 8]], m.blade));
      edge([[10, top - 1], [11.2, top + 5], [10.2, top + 12], [7.4, top + 15], [7, top + 13.6], [9, top + 11.6], [10, top + 5], [9.2, top + 0.6]]);
      s.push(T([[-0.6, top + 3], [-7.4, top + 5.4], [-0.6, top + 7.4]], m.blade), F(T([[-0.6, top + 5.4], [-7.4, top + 5.4], [-0.6, top + 7.4]], m.bladeDark)));
      s.push(R(-1.9, top + 1.6, 3.8, 7.4, m.trim));
      for (let y = top + 10; y < top + 16; y += 1.6) s.push(R(-1.5, y, 3, 0.8, m.grip));
      bx = 11.2;
      break;
    }
    case 5: {
      // A silver double-bit with a pink gem at the collar and a spike on top.
      hh = 15;
      const bit = [[0.8, top + 4], [7.6, top - 0.6], [10.2, top + 7], [7.6, top + 15], [0.8, top + 10.4]];
      s.push(T(bit, m.blade), T(flipX(bit), m.blade));
      // Shaded like the greatsword's steel: a violet-leaning bevel along the inner flat of each bit
      // and a shine band across it, so the head reads as metal instead of a flat pale slab.
      const bevel = [[0.8, top + 4], [5.6, top + 1.6], [5.6, top + 12.6], [0.8, top + 10.4]];
      const shine = [[2.2, top + 5.6], [7.4, top + 3.6], [8, top + 5], [2.2, top + 6.8]];
      for (const [b, sh] of [[bevel, shine], [flipX(bevel), flipX(shine)]]) s.push(T(b, mix(m.bladeDark, '#5a4a86', 0.3)), F(T(sh, mix(m.blade, '#ffffff', 0.7))));
      edge([[7.6, top - 0.4], [10.2, top + 7], [7.6, top + 14.8], [7, top + 13.4], [9, top + 7], [7, top + 1]]);
      edge(flipX([[7.6, top - 0.4], [10.2, top + 7], [7.6, top + 14.8], [7, top + 13.4], [9, top + 7], [7, top + 1]]));
      s.push(T([[-1.3, top + 0.4], [0, top - 3.6], [1.3, top + 0.4]], m.trim), R(-2.4, top + 2.4, 4.8, 9, m.trim), ...gem(0, top + 7, 1.4, m.gem));
      a.gem = [0, top + 7];
      bx = 10.2;
      break;
    }
    case 6: {
      // A mithril moon blade: a tall crescent, a vine of leaves along it, a leaf hook behind.
      hh = 18;
      const cy = top + 8;
      s.push(...crescent(1, cy, 11, m));
      for (const [x, y, ang] of [[8.4, cy - 4.6, 50], [9.6, cy, 90], [8.4, cy + 4.6, 130]]) s.push(F(leafAt(x, y, ang, 2.4, 0.8, m.edge)));
      s.push(leafAt(-0.6, cy, 160, 7, 2, m.trim));
      s.push(R(-2, cy - 3.6, 4, 7.2, m.trim), ...gem(0, cy, 1.3, m.gem));
      a.gem = [0, cy];
      bx = 11;
      break;
    }
    case 7: {
      // A cobalt blade curling over at the top like a breaking wave, a fin behind, a gold gem.
      hh = 17;
      s.push(T([[0.6, top + 3], [5, top + 0.6], [9, top - 2.4], [12.4, top + 0.6], [10.4, top + 3.2], [8.4, top + 2.4], [10.8, top + 6], [11.4, top + 11], [9.2, top + 16.4], [5, top + 13.4], [0.6, top + 12.2]], m.blade));
      edge([[10.8, top + 6], [11.4, top + 11], [9.2, top + 16.2], [8.4, top + 14.8], [10, top + 11], [9.6, top + 6.4]]);
      s.push(F(E(10.2, top - 0.4, 1.4, 1, m.edge)), F(E(6.4, top + 8.6, 2, 3.4, m.bladeDark)));
      s.push(T([[-0.6, top + 3], [-6.4, top + 0.6], [-4.6, top + 6.4], [-6.4, top + 12.2], [-0.6, top + 10.4]], m.trim));
      s.push(R(-2, top + 2.6, 4, 9, m.trim), ...gem(0, top + 7, 1.35, m.gem));
      a.gem = [0, top + 7];
      bx = 12.4;
      break;
    }
    case 8: {
      // A crystal double-bit, cut in facets, shards rising from the collar.
      hh = 16;
      const big = [[0.8, top + 4], [6, top - 0.4], [10.4, top + 3], [11.4, top + 9.4], [9.2, top + 15.6], [4, top + 14.2], [0.8, top + 11]];
      const small = [[0.8, top + 5], [5, top + 2.4], [7.6, top + 8.4], [5, top + 13.4], [0.8, top + 10.4]];
      s.push(T(flipX(small), m.blade), F(T(flipX([[0.8, top + 8], [7.6, top + 8.4], [5, top + 13.4], [0.8, top + 10.4]]), m.bladeDark)));
      s.push(T(big, m.blade), F(T([[0.8, top + 8], [11.4, top + 9.4], [9.2, top + 15.6], [4, top + 14.2], [0.8, top + 11]], m.bladeDark)));
      s.push(F(T([[6, top + 0.6], [10, top + 3.4], [10.6, top + 8.2], [9.4, top + 8], [8.8, top + 3.8]], m.edge)));
      for (const [x, h] of [[-1.4, 4.4], [0, 6], [1.4, 4.4]]) s.push(T([[x - 0.9, top + 2], [x, top + 2 - h], [x + 0.9, top + 2]], m.blade));
      s.push(R(-2.2, top + 2, 4.4, 9.4, m.trim), ...gem(0, top + 6.8, 1.4, m.gem));
      a.gem = [0, top + 6.8];
      bx = 11.4;
      break;
    }
    case 9: {
      // A runic battleaxe: two heavy angular bits of dark stone cut with runes, a tall spike.
      hh = 20;
      const bit = [[0.8, top + 4], [7, top + 1], [11.4, top - 2.4], [12.8, top + 9], [11.4, top + 19.6], [7, top + 16.6], [0.8, top + 13.6]];
      s.push(T(bit, m.blade), T(flipX(bit), m.blade));
      for (const sd of [1, -1]) edge([[sd * 11.4, top - 2.2], [sd * 12.8, top + 9], [sd * 11.4, top + 19.4], [sd * 10.4, top + 17.6], [sd * 11.6, top + 9], [sd * 10.4, top - 0.2]]);
      for (const sd of [1, -1]) for (let y = top + 3.4, i = 0; y < top + 15; y += 3.4, i++) s.push(F(R(sd * 6 - 0.6, y, 1.2, 2.2, m.rune)), F(i % 2 ? R(sd * 6 - 1.4, y + 0.8, 2.8, 0.6, m.rune) : R(sd * 6 - 1.4, y + 0.3, 0.6, 1.4, m.rune)));
      s.push(T([[-1.6, top + 1], [0, top - 6], [1.6, top + 1]], m.trim), R(-2.4, top + 1.6, 4.8, 12, m.trim), ...gem(0, top + 7.6, 1.45, m.gem));
      a.runes = [6, top + 3.4, top + 15];
      a.gem = [0, top + 7.6];
      bx = 12.8;
      break;
    }
    default: {
      // A starsteel battleaxe: two crescent moons back to back round a gold star, stars set in
      // the blades, a star on top.
      hh = 20;
      const cy = top + 8;
      for (const sd of [1, -1]) {
        s.push(...crescent(sd, cy, 12, m));
        s.push(F(star(sd * 9.6, cy - 4.4, 1.2, m.rune)), F(star(sd * 10.4, cy + 2.4, 1, m.rune)));
      }
      s.push(R(-2.2, top, 4.4, 15, m.trim), star(0, cy, 5.6, GOLD, 0.26), ...gem(0, cy, 1.45, m.gem), star(0, top - 3, 2.6, GOLD));
      a.gem = [0, cy];
      bx = 12;
      break;
    }
  }
  const mid = top + hh / 2;
  a.tip = [bx, mid];
  a.head = [bx * 0.6, mid];
  a.blade = [top - 2, top + hh + 2];
  return { shapes: s, blade: a.blade, reach: [], a };
}

// ---------- Spears ----------
//
// A long shaft from the socket (sock) down past the hand to a butt cap, the head above it. A
// sharpened bamboo cane, a copper leaf with a red tassel, a bronze winged leaf, an iron pike, a
// steel partisan, a silver pike with a pennant, a mithril glaive, a cobalt trident, a crystal
// shard, a runic lance with its hand guard and a starsteel lance with a star at the socket.
function spear(m, t) {
  const S = [32, 33, 34, 35, 36, 37, 38, 38, 39, 40, 41][t];
  const sock = -S;
  const s = [];
  const a = {};
  const bamboo = t === 0;
  s.push(R(-1.3, sock, 2.6, S + 14, bamboo ? '#c8c27a' : m.handle));
  if (bamboo) for (let y = sock + 5; y < 12; y += 7) s.push(R(-1.5, y, 3, 0.9, '#9c9650'));
  else s.push(...grip(5, m.grip, m.trimDark, 1.8, 2.6).map((r) => ({ ...r, y: r.y - 0.5 })));
  s.push(R(-1.7, 12, 3.4, 2.5, m.trim));
  if (t >= 4) s.push(T([[-1.4, 14.5], [0, 18], [1.4, 14.5]], m.trim));
  let hl = 10;
  const socket = (h = 3) => s.push(R(-1.8, sock - 1, 3.6, h, m.trim), F(R(-1.8, sock + h - 1.8, 3.6, 0.6, m.trimDark)));
  switch (t) {
    case 0: {
      // The cane itself, cut on a slant to a point, bound with cord.
      hl = 9;
      s.push(T([[-1.3, sock + 1], [1.3, sock + 1], [1.3, sock - hl], [-1.3, sock - 3]], '#dcd690'), F(T([[0.2, sock - 1], [1.3, sock - hl], [1.3, sock - 3]], '#b9b46a')));
      for (const y of [sock + 2, sock + 3.6]) s.push(R(-1.6, y, 3.2, 1, '#c9a878'));
      break;
    }
    case 1: {
      hl = 10;
      s.push(T([[-1.8, sock + 1.6], [1.8, sock + 1.6], [3.2, sock + 7.6], [0.6, sock + 6], [0, sock + 8], [-0.6, sock + 6], [-3.2, sock + 7.6]], '#e04a5a'));
      s.push(mir([[0, sock - hl], [2.2, sock - hl + 4], [2.6, sock - hl + 7], [1.3, sock - 1.4], [1.2, sock]], m.blade), F(R(-0.35, sock - hl + 2, 0.7, hl - 3, m.bladeDark)));
      socket();
      break;
    }
    case 2: {
      hl = 12;
      s.push(mir([[0, sock - hl], [3, sock - hl + 5], [3.6, sock - hl + 8], [1.4, sock - 3], [1.4, sock]], m.blade), F(T([[0, sock - hl + 1], [0.5, sock - hl + 4], [0.5, sock - 1], [-0.5, sock - 1], [-0.5, sock - hl + 4]], m.bladeDark)));
      s.push(edgeStrip(3.5, sock - hl + 5.5, sock - hl + 8, m.edge, 0.8));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.5, sock], [sd * 4.6, sock + 1.6], [sd * 1.5, sock + 3]], m.trim));
      socket(3.6);
      break;
    }
    case 3: {
      hl = 13;
      s.push(mir([[0, sock - hl], [1.7, sock - hl + 3], [1.9, sock - 3], [1.1, sock - 1], [1.3, sock]], m.blade), edgeStrip(1.9, sock - hl + 3, sock - 3, m.edge, 0.7));
      s.push(R(-2.1, sock - 1.4, 4.2, 1.4, m.trim), R(-1.9, sock + 0.6, 3.8, 1.2, m.trim), R(-1.9, sock + 0.6, 0.6, 7, m.trim), R(1.3, sock + 0.6, 0.6, 7, m.trim));
      break;
    }
    case 4: {
      // A partisan: a central blade and two hooked side spikes at its base.
      hl = 15;
      s.push(mir([[0, sock - hl], [2.3, sock - hl + 4], [2.3, sock - 5], [1.3, sock - 2.6]], m.blade), F(R(-0.5, sock - hl + 3, 1, hl - 7, m.bladeDark)), edgeStrip(2.3, sock - hl + 4, sock - 5, m.edge, 0.7));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.2, sock - 2.4], [sd * 6, sock - 8], [sd * 5, sock - 3.4], [sd * 2.4, sock + 0.4]], m.blade));
      socket(3.4);
      break;
    }
    case 5: {
      hl = 15;
      s.push(T([[1.3, sock + 2], [8.6, sock + 3.2], [6.4, sock + 5.2], [9, sock + 7.6], [1.3, sock + 7.2]], '#ff9ec0'), F(T([[1.3, sock + 5.6], [7.4, sock + 6.6], [9, sock + 7.6], [1.3, sock + 7.2]], '#e7799f')));
      s.push(mir([[0, sock - hl], [2.6, sock - hl + 5], [3, sock - hl + 9], [1.4, sock - 3], [1.6, sock]], m.blade), F(R(-0.45, sock - hl + 3, 0.9, hl - 6, m.bladeDark)), edgeStrip(3, sock - hl + 5, sock - hl + 9, m.edge, 0.8));
      s.push(E(0, sock + 0.4, 2.6, 2, m.trim), ...gem(0, sock + 0.4, 1.2, m.gem));
      a.gem = [0, sock + 0.4];
      break;
    }
    case 6: {
      // A glaive: one curved cutting edge forward, a leaf flaring at the socket.
      hl = 17;
      s.push(T([[0, sock - hl], [3.4, sock - hl + 4], [4.4, sock - hl + 10], [2.8, sock - 1.4], [-1.4, sock], [-1.8, sock - hl + 8], [-0.8, sock - hl + 3]], m.blade));
      s.push(T([[0.4, sock - hl + 0.6], [3.4, sock - hl + 4], [4.4, sock - hl + 10], [2.8, sock - 1.4], [2, sock - 1.4], [3.4, sock - hl + 10], [2.6, sock - hl + 4.6]], m.edge));
      s.push(F(leafAt(0.4, sock - 6, 80, 5, 1, m.bladeDark)));
      s.push(leafAt(1, sock + 1, 20, 5.6, 1.6, m.trim), leafAt(-1, sock + 1, 160, 5.6, 1.6, m.trim), E(0, sock + 0.6, 2.2, 2, m.trim), ...gem(0, sock + 0.6, 1.1, m.gem));
      a.gem = [0, sock + 0.6];
      break;
    }
    case 7: {
      // A trident: three prongs off a crossbar, barbed.
      hl = 15;
      s.push(mir([[0, sock - hl], [1.5, sock - hl + 3], [1.2, sock - 4], [1.2, sock - 3]], m.blade));
      for (const sd of [-1, 1]) {
        s.push(T([[sd * 1.2, sock - 4], [sd * 5, sock - 5.4], [sd * 5.6, sock - hl + 4.6], [sd * 6.8, sock - hl + 7.6], [sd * 6.4, sock - 2.4], [sd * 1.2, sock - 1.4]], m.blade));
        s.push(T([[sd * 5.4, sock - hl + 7], [sd * 3.8, sock - hl + 9.4], [sd * 5.4, sock - hl + 9.6]], m.blade));
      }
      s.push(R(-6.2, sock - 3.6, 12.4, 2, m.trim), ...gem(0, sock - 2.6, 1.3, m.gem));
      socket();
      a.gem = [0, sock - 2.6];
      break;
    }
    case 8: {
      hl = 16;
      s.push(mir([[0, sock - hl], [2.4, sock - hl + 5], [3, sock - hl + 11], [1.6, sock]], m.blade), F(T([[0, sock - hl], [0, sock], [-1.6, sock], [-3, sock - hl + 11], [-2.4, sock - hl + 5]], m.bladeDark)));
      s.push(F(T([[0.4, sock - hl + 3], [2.4, sock - hl + 10.4], [1.6, sock - 2], [1, sock - 2]], m.edge)));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.4, sock + 0.4], [sd * 5.4, sock - 5], [sd * 5.6, sock - 2.6], [sd * 2.4, sock + 1.8]], m.blade));
      s.push(E(0, sock + 0.8, 2.2, 2, m.trim), ...gem(0, sock + 0.8, 1.25, m.gem));
      a.gem = [0, sock + 0.8];
      break;
    }
    case 9: {
      // A lance: a long fluted cone with runes spiralling up it, a round guard over the hand.
      hl = 19;
      s.push(T([[-3.4, sock + 1], [3.4, sock + 1], [0, sock - hl]], m.blade), F(T([[-3.4, sock + 1], [-0.6, sock + 1], [0, sock - hl]], m.bladeDark)), F(T([[1.6, sock + 0.4], [2.6, sock + 0.4], [0.2, sock - hl + 2]], m.edge)));
      for (let k = 0; k < 4; k++) s.push(F(R(-0.6 + (k % 2 ? 0.8 : -0.8), sock - 3 - k * 3.6, 1.2, 2, m.rune)));
      a.runes = [0, sock - hl + 4, sock - 2];
      s.push(R(-3.8, sock + 0.4, 7.6, 1.8, m.trim));
      s.push(E(0, -4.6, 5.6, 1.9, m.trim), F(E(0, -5.2, 4.4, 0.8, m.edge)), ...gem(0, -4.6, 1, m.gem));
      a.gem = [0, -4.6];
      break;
    }
    default: {
      // A long night-blue blade over a gold star, crescent wings at the socket.
      hl = 19;
      s.push(mir([[0, sock - hl], [2.3, sock - hl + 6], [2.9, sock - hl + 12], [1.4, sock - 1]], m.blade), F(R(-0.45, sock - hl + 5, 0.9, hl - 8, m.bladeDark)), edgeStrip(2.9, sock - hl + 12, sock - 3, m.edge, 0.8));
      for (const [x, y, r] of [[-1, sock - hl + 7, 1.1], [0.9, sock - hl + 12, 1]]) s.push(F(star(x, y, r, m.rune)));
      for (const sd of [-1, 1]) s.push(T([[sd * 1.4, sock + 1], [sd * 5.6, sock - 0.6], [sd * 7.6, sock - 4.4], [sd * 6.6, sock + 0.4], [sd * 3, sock + 3]], m.trim));
      s.push(star(0, sock + 1, 5, GOLD, 0.26), ...gem(0, sock + 1, 1.25, m.gem));
      a.gem = [0, sock + 1];
      break;
    }
  }
  const top = sock - hl;
  a.tip = [0, top];
  a.head = [0, sock - hl * 0.5];
  a.blade = [top, sock];
  return { shapes: s, blade: [top, sock], reach: [], a };
}

// ---------- Daggers ----------
//
// One sample dagger, made from scratch (2026-11-16, for the Moon Moth): every dagger item draws
// this one design in its own tier's materials until the dagger line is drawn tier by tier. A
// rogue's knife: a single-edged blade with a clipped point swept a little forward, a deep belly on
// the edge side, a fuller groove down the spine and a notch at the base of the edge; an S guard
// (the quillon on the edge side curling up toward the blade, the other down toward the hand); a
// wrapped grip; and a round pommel cap. From Steel up a gem sits in the guard.
// The guard sits at D; the blade rises from it, the grip hangs below.
const D = -3;

function dagger(m, t) {
  const s = [];
  const a = {};
  const L = 14;
  const top = D - L;
  const wood = t === 0;
  // The grip, wrapped, and a round pommel cap under it. (A ring pommel was tried: with a dagger in
  // each hand, the two rings and the guards' hooks read as scissor handles.)
  s.push(...grip(4.6, wood ? '#efe0bf' : m.grip, wood ? '#c9a878' : m.trimDark, 1.5));
  s.push(E(0, 5.9, 1.7, 1.55, m.trim), F(E(-0.6, 5.3, 0.55, 0.4, mix(m.trim, WHITE, 0.55))));
  // The blade: the spine straight up the -x side, clipped to the point, the edge sweeping out into
  // its belly and in to the notch at the base.
  const blade = [[-1.7, D], [-1.7, top + 6], [-0.9, top + 3], [1, top], [2.4, top + 3.4], [3, top + 7.4], [2.7, D - 2.4], [1.7, D - 1.4], [2, D]];
  s.push(T(blade, m.blade));
  // The bright edge along the belly, the clip lit, the fuller down the spine.
  s.push(T([[1, top], [2.4, top + 3.4], [3, top + 7.4], [2.7, D - 2.4], [1.9, D - 2.2], [2.1, top + 7.2], [1.6, top + 3.6], [0.8, top + 1.2]], m.edge));
  s.push(F(T([[-0.9, top + 3], [1, top], [0.6, top + 1], [-0.6, top + 3.6]], WHITE)));
  s.push(F(T([[-1, D - 1], [-1, top + 6.6], [-0.6, top + 5.4], [-0.3, top + 6.6], [-0.3, D - 1]], m.bladeDark)));
  // The S guard: a bar, its edge-side quillon a thick hook curling up toward the blade and its back
  // quillon the same turned round, curling down toward the hand, each tapering to a round tip.
  const mid = D + 0.9;
  const hook = [[2.6, mid], [3.9, mid - 0.4], [4.7, mid - 1.4], [4.8, mid - 2.7]];
  const back = hook.map(([x, y]) => [-x, 2 * mid - y]);
  s.push(R(-3.4, D, 6.8, 1.8, m.trim), T(tube(hook, 1.8, 1.1), m.trim), T(tube(back, 1.8, 1.1), m.trim));
  s.push(E(4.75, mid - 2.8, 0.7, 0.7, m.trim), E(-4.75, mid + 2.8, 0.7, 0.7, m.trim));
  s.push(F(R(-3.2, D + 0.2, 6.2, 0.5, mix(m.trim, WHITE, 0.45))), F(T(tube(hook.slice(0, 3).map(([x, y]) => [x - 0.35, y - 0.25]), 0.5, 0.3), mix(m.trim, WHITE, 0.45))));
  if (t >= 4) {
    s.push(...gem(0, D + 0.85, 1.05, m.gem));
    a.gem = [0, D + 0.85];
  }
  a.tip = [1, top];
  a.head = [0.6, D - L * 0.55];
  a.blade = [top, D];
  return { shapes: s, blade: [top, D], reach: [], a };
}

// ---------- Moon and ring pieces (the wands and staves) ----------

// A crescent moon lying on its back like a bowl, horns up, round (x, y).
function bowl(x, y, r, c) {
  return [T([...arcPts(x, y, r, r, 180, 360, 14), ...arcPts(x, y - r * 0.35, r * 0.82, r * 0.82, 360, 180, 12)], c)];
}
// A metal ring: a loop with a hole.
const ring = (x, y, r, c) => [E(x, y, r, r, c), E(x, y, r * 0.55, r * 0.55, 'none')];

// ---------- Wands: star wands ----------
//
// A short slim wand held at its end (a little pommel below the hand), a star on top, so it points
// out from her hand and never sits across her face. A wooden wand with a brass star, a copper star
// with a bow, a bronze star before a crescent, an iron star in a ring, a steel double star, a
// silver crescent cradling a pink star, a mithril star with wings, a cobalt comet, a faceted
// crystal star, a runic star in an orbit ring, and a starsteel star with little stars round it.
const LAC = ['#b8875a', '#ead2a2', '#c8913e', '#4a4a5a', '#2a2230', '#f6efe0', '#dbeeff', '#24306a', '#e6faff', '#2c2842', '#1f2860'];

// A five-point star at (x, y), `r` out to its points, `k` how deep the dips are, turned by `rot`.
function star5(x, y, r, c, k = 0.46, rot = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * k : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
}
// A star with a light face and a gem at its heart.
const starHead = (x, y, r, c, light, gemC, k) => [star5(x, y, r, c, k), F(star5(x, y - r * 0.08, r * 0.62, light, k)), ...(gemC ? gem(x, y, r * 0.24, gemC) : [])];



// A lumpy egg-white outline round (x, y).
function ring12(x, y, rx, ry) {
  return Array.from({ length: 12 }, (_, i) => {
    const th = (i / 12) * Math.PI * 2;
    const k = i % 3 === 0 ? 1.1 : i % 3 === 1 ? 0.88 : 1;
    return [x + Math.cos(th) * rx * k, y + Math.sin(th) * ry * k];
  });
}

function wand(m, t, f = 0) {
  const s = [];
  const a = {};
  const H = 7 + t * 0.35;
  const lac = LAC[t];
  // The wand: a slim tapering shaft from the pommel just below the hand up to the head.
  s.push(T([[-1.1, 2.2], [1.1, 2.2], [0.8, -H], [-0.8, -H]], lac), F(T([[0.3, 2.2], [1.1, 2.2], [0.8, -H], [0.3, -H]], mix(lac, '#000000', 0.22))));
  s.push(E(0, 2.6, 1.3, 1.1, m.trim), F(R(-1.2, -0.6, 2.4, 0.7, m.trim)), F(R(-1, -H + 0.4, 2, 0.6, m.trim)));
  const cy = -H - 4.2;
  let top = cy - 5;
  const gold = t <= 1 ? '#f2c45a' : m.trim;
  const goldLt = t <= 1 ? '#fff0b0' : m.edge;
  switch (t) {
    case 0:
      s.push(...starHead(0, cy + 0.6, 3.6, gold, goldLt, null));
      top = cy - 3.2;
      break;
    case 1:
      s.push(T([[0, -H + 0.6], [-2.8, -H - 0.8], [-2.6, -H + 1.4]], '#ff7a8a'), T([[0, -H + 0.6], [2.8, -H - 0.8], [2.6, -H + 1.4]], '#ff7a8a'));
      s.push(...starHead(0, cy, 4, gold, goldLt, null));
      top = cy - 4;
      break;
    case 2:
      s.push(...bowl(1.4, cy - 0.6, 4.6, m.blade).map((sh) => ({ ...sh, pts: sh.pts.map(([x, y]) => [x * 0.9 + 0.6, y]) })));
      s.push(...starHead(-0.6, cy, 3.6, gold, goldLt, null));
      top = cy - 4.6;
      break;
    case 3:
      s.push(T([...arcPts(0, cy, 5, 5, 0, 360, 24), ...arcPts(0, cy, 3.9, 3.9, 360, 0, 24)], m.blade), ...starHead(0, cy, 3.4, m.trim, m.edge, null));
      top = cy - 5;
      break;
    case 4:
      s.push(star5(0, cy, 5.2, m.bladeDark, 0.42, Math.PI / 5), ...starHead(0, cy, 4.6, m.trim, m.edge, m.gem));
      a.gem = [0, cy];
      top = cy - 5.2;
      break;
    case 5:
      s.push(...bowl(0, cy + 0.6, 5.4, m.blade), ...starHead(0, cy - 1.4, 3.2, '#ff9ec0', '#ffe0ec', null), ...gem(0, cy + 2.6, 0.9, m.gem));
      a.gem = [0, cy + 2.6];
      top = cy - 4.8;
      break;
    case 6:
      for (const sd of [-1, 1]) s.push(leafAt(sd * 2.4, cy + 1, sd < 0 ? 160 : 20, 5.4, 1.8, m.blade), F(leafAt(sd * 2.4, cy + 1, sd < 0 ? 168 : 12, 4, 0.8, m.edge)));
      s.push(...starHead(0, cy, 4.2, m.trim, m.edge, m.gem));
      a.gem = [0, cy];
      top = cy - 4.2;
      break;
    case 7:
      // A comet: the star with a tail curling down past the shaft.
      s.push(T([[-1.6, cy + 1], [1.6, cy - 1], [4.6, cy + 6], [2.4, cy + 9], [1, cy + 5]], m.bladeDark), F(T([[-0.6, cy + 0.6], [1, cy - 0.6], [3.4, cy + 5.6], [1.8, cy + 7.6]], m.blade)));
      s.push(...starHead(-0.8, cy - 0.6, 4.2, m.trim, m.edge, m.gem));
      a.gem = [-0.8, cy - 0.6];
      top = cy - 4.8;
      break;
    case 8:
      // A faceted crystal star.
      s.push(star5(0, cy, 5, m.blade, 0.5), F(T([[0, cy - 5], [1.2, cy - 1], [0, cy], [-1.2, cy - 1]], m.edge)), F(T([[0, cy], [4.6, cy - 1.6], [1.4, cy + 0.6]], m.bladeDark)), ...gem(0, cy, 1.2, m.gem));
      a.gem = [0, cy];
      top = cy - 5;
      break;
    case 9:
      // A runic star inside a tilted orbit ring, runes glowing down the shaft.
      s.push(T([...arcPts(0, cy, 6, 2.2, 200, 340, 10), ...arcPts(0, cy, 5, 1.4, 340, 200, 10)], m.trim));
      s.push(...starHead(0, cy - 0.4, 4, m.blade, m.edge, m.gem));
      s.push(T([...arcPts(0, cy, 6, 2.2, 20, 160, 10), ...arcPts(0, cy, 5, 1.4, 160, 20, 10)], m.trim));
      for (let y = -H + 2; y < 1; y += 2.4) s.push(F(R(-0.35, y, 0.7, 1.2, m.rune)));
      a.runes = [0, -H + 2, 1];
      a.gem = [0, cy - 0.4];
      top = cy - 4.4;
      break;
    default: {
      // A big starsteel star, three little stars orbiting it.
      s.push(star5(0, cy - 1, 6, GOLD, 0.44), F(star5(0, cy - 1.4, 3.8, m.blade, 0.44)), ...gem(0, cy - 1, 1.4, m.gem));
      for (const [x, y] of [[-5.6, cy + 3], [5.4, cy + 2], [0, cy - 8.4]]) s.push(F(star(x, y, 1.4, WHITE, 0.3)));
      a.gem = [0, cy - 1];
      top = cy - 9.8;
      break;
    }
  }
  a.blade = [top, -H];
  a.head = [0, cy];
  a.tip = [0, top];
  if (m.rune && !a.runes) a.runes = [0, -H + 1, 1];
  return { shapes: s, blade: a.blade, reach: [], a };
}


function staff(m, t, f = 0) {
  const s = [];
  const a = {};
  const S = 26 + t * 0.8;
  const lac = LAC[t];
  s.push(R(-1.2, -S, 2.4, S + 4, lac), F(R(0.4, -S, 0.8, S + 4, mix(lac, '#000000', 0.22))));
  for (let y = -S + 5; y < 2; y += t >= 2 ? 7 : 12) s.push(F(R(-1.2, y, 2.4, 0.7, m.trim)));
  s.push(R(-1.5, 3, 3, 1.6, m.trim), T([[-1.5, 4.6], [0, 6.2], [1.5, 4.6]], m.trimDark));
  const yb = -S - 1;
  let cy = yb - 5;
  let top = yb - 10;
  const gold = t <= 1 ? '#f2c45a' : m.trim;
  const moon = (x, y, r, c) => T([...arcPts(x, y, r, r, 60, 300, 14), ...arcPts(x + r * 0.45, y - r * 0.05, r * 0.78, r * 0.8, 300, 60, 12)], c);
  switch (t) {
    case 0:
      s.push(moon(0, yb - 4, 4.4, '#f2d690'));
      top = yb - 8.4;
      break;
    case 1:
      s.push(moon(0, yb - 4.6, 5, gold), R(2.6, yb - 4.6, 0.4, 3, m.trimDark), ...starHead(2.8, yb - 0.6, 1.8, '#fff0b0', '#ffffff', null));
      top = yb - 9.6;
      break;
    case 2:
      // A star lantern: a little cage with a star glowing inside.
      cy = yb - 5;
      s.push(R(-0.4, yb - 1.4, 0.8, 1.4, m.trimDark), T([[-3.4, cy - 3.6], [3.4, cy - 3.6], [3.8, cy + 3.6], [-3.8, cy + 3.6]], m.trimDark), T([[-2.6, cy - 2.8], [2.6, cy - 2.8], [2.9, cy + 2.8], [-2.9, cy + 2.8]], '#ffe8a0'), ...starHead(0, cy, 2.2, '#ffd36a', '#ffffff', null), T([[-2.4, cy - 3.6], [2.4, cy - 3.6], [0, cy - 6]], m.trim));
      top = cy - 6;
      break;
    case 3:
      // A crook curling over, a star hanging from its tip.
      s.push(T([...arcPts(3, yb - 4, 3.6, 4, 180, -40, 12), ...arcPts(3, yb - 4, 2.2, 2.6, -40, 180, 12)], lac), R(5.6, yb - 2.4, 0.4, 3, m.trimDark), ...starHead(5.8, yb + 1.8, 2.2, m.trim, m.edge, null));
      cy = yb - 4;
      top = yb - 8;
      break;
    case 4:
      cy = yb - 5;
      s.push(moon(-0.6, cy, 5.6, m.trim), ...gem(1, cy, 2.6, m.blade), F(E(0.2, cy - 0.9, 0.9, 0.9, WHITE)));
      top = cy - 5.6;
      break;
    case 5:
      cy = yb - 5.4;
      s.push(moon(-0.4, cy, 6, m.blade));
      for (const ang of [30, 0, -30]) s.push(F(E(Math.cos((ang * Math.PI) / 180) * 5 + 1.6, cy - Math.sin((ang * Math.PI) / 180) * 5, 0.7, 0.7, m.edge)));
      s.push(...gem(1.2, cy, 1.2, m.gem));
      a.gem = [1.2, cy];
      top = cy - 6;
      break;
    case 6:
      // Twisted wood (two strands) round a star crystal.
      cy = yb - 6;
      for (const sd of [-1, 1]) s.push(T([[sd * 0.6, yb + 1], [sd * 4, cy + 2], [sd * 3.4, cy - 3], [sd * 1, cy - 6], [sd * 2.4, cy - 2.6], [sd * 2.6, cy + 1.6], [sd * 0.2, yb + 1]], lac));
      s.push(...starHead(0, cy, 3.2, m.blade, m.edge, m.gem));
      a.gem = [0, cy];
      top = cy - 6.4;
      break;
    case 7:
      cy = yb - 5.6;
      s.push(moon(-1, cy, 5.8, m.blade), T([[2, cy - 1], [6.4, cy - 7], [5, cy - 4], [8, cy - 9]], m.bladeDark), ...starHead(2.4, cy + 0.4, 2.6, m.trim, m.edge, m.gem));
      a.gem = [2.4, cy + 0.4];
      top = cy - 9;
      break;
    case 8:
      cy = yb - 6;
      s.push(T([[0, cy - 8], [2.8, cy - 2], [2, cy + 5], [-2, cy + 5], [-2.8, cy - 2]], m.blade), F(T([[0, cy - 8], [1, cy - 2], [0, cy + 4], [-1.2, cy - 2]], m.edge)), T([[3, cy + 1], [5, cy - 3], [4.6, cy + 4]], m.bladeDark), T([[-3, cy + 1], [-5, cy - 3], [-4.6, cy + 4]], m.bladeDark), ...gem(0, cy, 1.1, m.gem));
      a.gem = [0, cy];
      top = cy - 8;
      break;
    case 9:
      // A dark orb held in a ring cage, runes down the staff.
      cy = yb - 6;
      s.push(...gem(0, cy, 3.6, m.blade), ...ring(0, cy, 5, m.trim), R(-0.4, cy - 6.4, 0.8, 1.6, m.trim), ...starHead(0, cy - 7.4, 1.6, m.trim, m.edge, null));
      for (let y = -S + 4; y < -S * 0.4; y += 2.6) s.push(F(R(-0.4, y, 0.8, 1.3, m.rune)));
      a.runes = [0, -S + 4, -S * 0.4];
      a.gem = [0, cy];
      top = cy - 9;
      break;
    default:
      cy = yb - 7;
      s.push(moon(-1.4, cy, 7, GOLD), F(moon(-1.9, cy, 5.4, m.blade)), ...starHead(2.4, cy, 4, GOLD, m.edge, m.gem));
      for (const [x, y] of [[-5.4, cy - 7], [6, cy - 6], [6.6, cy + 5]]) s.push(F(star(x, y, 1.3, WHITE, 0.3)));
      a.gem = [2.4, cy];
      top = cy - 8;
      break;
  }
  if (m.rune && !a.runes) a.runes = [0, -S + 5, -S * 0.4];
  a.head = [0, cy];
  a.tip = [0, top];
  a.blade = [top, -S];
  return { shapes: s, blade: a.blade, reach: [], a };
}



// ---------- Bows ----------
//
// One sample bow, made from scratch (2026-11-16, for the Sunfeather): every bow item draws this
// one design in its own tier's materials until the bow line is drawn tier by tier. A hunter's
// recurve: a chunky riser bulging forward at the grip (a wrapped grip, a collar where each limb
// sets in), limbs that sweep back toward the string and flick forward again at the tips (two-tone:
// a dark back, a bright face), and round caps on the tips. From Steel up a gem sits in the riser.
// Sized so that drawn upright behind her (render/hero.js `bowUp`) its top tip stays hidden behind
// her head instead of poking up out of her hair, and its foot clears the ground.
// The frame: the grip at (0, 0), the limbs along y, the belly toward +x, the string at -x.
const BOW_H = 14;
// The limb's centre line, `u` 0 at the grip to 1 at a tip: the riser a little forward, the limb
// sweeping back to its deepest at BOW_DEEP, then the recurve flicking forward to the tip.
const BOW_DEEP = 0.86;
function bowX(u) {
  const a = Math.abs(u);
  if (a <= 0.2) return 1.6 - 0.6 * (a / 0.2) ** 2;
  if (a <= BOW_DEEP) return 1 - 4.6 * ((a - 0.2) / (BOW_DEEP - 0.2)) ** 1.5;
  return -3.6 + 0.9 * ((a - BOW_DEEP) / (1 - BOW_DEEP)) ** 1.6;
}
// Its width: the riser swelling smoothly out of the limbs at the grip, the limbs tapering out to
// the tips.
const bowW = (u) => {
  const a = Math.abs(u);
  return a <= 0.3 ? 3 + 1.8 * (1 - (a / 0.3) ** 2) ** 1.5 : 3 - 1.4 * ((a - 0.3) / 0.7);
};
// A band along the limb from u0 to u1: `side` 0 the whole width, -1 a strip `k` of its width down
// its back (the string side), +1 down its face.
function limbBand(u0, u1, c, side = 0, k = 0.5, n = 24) {
  const l = [];
  const r = [];
  for (let i = 0; i <= n; i++) {
    const u = u0 + ((u1 - u0) * i) / n;
    const x = bowX(u);
    const w = bowW(u) / 2;
    const y = u * BOW_H;
    if (side === 0) {
      l.push([x - w, y]);
      r.push([x + w, y]);
    } else {
      const edge = x + side * w;
      l.push([edge - side * w * 2 * k, y]);
      r.push([edge, y]);
    }
  }
  return T([...l, ...r.reverse()], c);
}

function bow(m, t) {
  const s = [];
  const H = BOW_H;
  const wood = t === 0;
  const deep = bowX(BOW_DEEP);
  const sh = BOW_DEEP * H;
  // The string first (behind), along the backs of the limbs where the recurves touch it; while she
  // draws it's drawn live instead (`a.string`, render/hero.js drawString, which sits 1 px back).
  s.push({ ...R(deep - 1 / 1.3 - 0.4, -sh, 0.8, sh * 2, '#fff6fb'), string: true });
  // The limbs, the riser through them; a dark back and a bright face on each limb.
  s.push(limbBand(-1, 1, m.blade));
  for (const [u0, u1] of [[-0.94, -0.3], [0.3, 0.94]]) {
    s.push(F(limbBand(u0, u1, m.bladeDark, -1, 0.42)));
    s.push(F(limbBand(u0 * 0.95, u1 * 0.95, m.edge, 1, 0.34)));
  }
  // The riser's swell lit down its front.
  s.push(F(limbBand(-0.26, 0.26, m.edge, 1, 0.22)));
  // The wrapped grip where her hand closes, over the back of the riser, two bands across it.
  s.push(T([[-0.9, -2.2], [1.9, -2.2], [2.1, 2.2], [-0.9, 2.2]], wood ? '#efe0bf' : m.grip));
  for (const y of [-1.1, 0.6]) s.push(F(R(-0.9, y, 2.9, 0.55, wood ? '#c9a878' : m.trimDark)));
  // Collars where the limbs set into the riser.
  for (const sd of [-1, 1]) {
    const y = sd * 0.34 * H;
    const x = bowX(0.34);
    s.push(T([[x - 1.9, y - 0.75], [x + 1.9, y - 0.75], [x + 1.7, y + 0.75], [x - 1.7, y + 0.75]], m.trim));
    s.push(F(R(x - 1.6, y - 0.6, 3.1, 0.4, mix(m.trim, WHITE, 0.45))));
  }
  // Round caps on the tips, a glint on each.
  const tip = bowX(1);
  for (const sd of [-1, 1]) {
    s.push(E(tip, sd * H, 1.35, 1.35, m.trim));
    s.push(F(E(tip - 0.4, sd * H - 0.45, 0.45, 0.4, mix(m.trim, WHITE, 0.55))));
  }
  const a = { tip: [tip, -H], head: [1, 0], blade: [-H, H] };
  if (t >= 4) {
    s.push(E(3, 0, 1.55, 1.55, m.trim), ...gem(3, 0, 1.05, m.gem));
    a.gem = [3, 0];
  }
  if (m.rune) a.runes = [bowX(0.55), -H * 0.6, H * 0.6];
  a.string = { x: deep, h: sh, color: '#fff6fb' };
  return { shapes: s, blade: [-H, H], reach: [], a };
}

// ---------- Crossbows ----------
//
// One sample crossbow, made from scratch (2026-11-16, for the Phoenix): every crossbow item draws
// this one design in its own tier's materials until the crossbow line is drawn tier by tier. A
// hunting crossbow held at the hip: a wooden tiller with a shoulder stock swooping down behind (a
// butt plate on its end), a wrapped pistol grip under the hand with a trigger and its guard, a
// flight groove on top with a bolt loaded (a broadhead, pink fletching) and the string caught on
// the nut; at the front a recurve prod lashed to the tiller, and a foot stirrup. From Steel up a
// gem sits in the lashing.
// The frame: the hand at (0, 0), the tiller along +x (level with the hand), the stock behind.
function crossbow(m, t) {
  const s = [];
  const cy = 1;
  const px = 13;
  const S = 7.4;
  const wood = m.handle;
  const xAt = (u) => px + 1.3 - 2.6 * Math.abs(u) ** 1.5 + 1.1 * Math.max(0, (Math.abs(u) - 0.8) / 0.2) ** 1.6;
  const nut = [1.8, cy - 2.1];
  // The string (behind): from each prod tip back to the nut; its lower half runs behind the tiller.
  for (const sd of [-1, 1]) s.push(T(tube([[xAt(sd), cy + sd * S], nut], 0.75, 0.75), '#fff6fb'));
  // The tiller and the shoulder stock swooping down behind, one piece of wood, grain along it.
  s.push(T([[-9.4, cy - 1.3], [px - 1, cy - 1.9], [px - 1, cy + 1.5], [2.4, cy + 1.7], [-2.4, cy + 1.7], [-5, cy + 2.8], [-8.4, cy + 5], [-9.8, cy + 4.6]], wood));
  s.push(F(T(tube([[-8.6, cy + 0.6], [-4, cy + 0.2], [px - 2, cy - 0.2]], 0.5, 0.4), m.handleDark)));
  s.push(F(T([[-9, cy - 1.1], [px - 1.4, cy - 1.7], [px - 1.4, cy - 1.1], [-8.8, cy - 0.5]], mix(wood, WHITE, 0.25))));
  // The butt plate.
  s.push(T([[-9.2, cy - 1.5], [-10.6, cy - 1.2], [-10.9, cy + 4.6], [-9.6, cy + 5.2]], m.trim));
  // The pistol grip under the hand, wrapped, a cap at its foot.
  s.push(T([[-1.3, cy + 1.2], [2.3, cy + 1.2], [1.6, cy + 6.4], [-1.9, cy + 6]], t === 0 ? '#efe0bf' : m.grip));
  for (let y = cy + 2.2; y < cy + 6; y += 1.2) s.push(F(T([[-1.5, y], [2.1 - (y - cy) * 0.12, y], [2.05 - (y - cy) * 0.12, y + 0.45], [-1.55, y + 0.45]], t === 0 ? '#c9a878' : m.trimDark)));
  s.push(E(-0.1, cy + 6.3, 2, 0.95, m.trim));
  // The trigger and its guard.
  s.push(T(tube([[3, cy + 1.6], [3.3, cy + 2.8], [2.9, cy + 3.7]], 0.9, 0.6), m.trimDark));
  s.push(T(tube(arcPts(3.6, cy + 1.6, 1.9, 2.6, 0, -180, 10), 0.75, 0.75), m.trim));
  // The flight groove on top, the bolt in it (a broadhead out past the prod, pink fletching at the
  // back) and the nut holding the string.
  s.push(R(-1.6, cy - 2.6, px + 0.4, 0.8, m.bladeDark));
  s.push(R(-0.6, cy - 3.3, px + 4.8, 0.9, '#e8dcc4'));
  s.push(T([[px + 6.8, cy - 2.85], [px + 4.2, cy - 4.6], [px + 4.8, cy - 2.85], [px + 4.2, cy - 1.1]], m.blade), F(T([[px + 6.8, cy - 2.85], [px + 4.2, cy - 4.6], [px + 4.6, cy - 3.3]], m.edge)));
  s.push(T([[-0.4, cy - 3.3], [2.4, cy - 3.3], [0.2, cy - 5.4], [-1.2, cy - 5.2]], '#ff8fb0'), F(T([[0, cy - 3.6], [1.6, cy - 3.6], [0.2, cy - 4.8]], '#ffc4d6')));
  s.push(E(nut[0], nut[1], 1.15, 1.15, m.trim), F(E(nut[0] - 0.35, nut[1] - 0.4, 0.4, 0.35, mix(m.trim, WHITE, 0.55))));
  // The prod: a recurve bow across the front, a dark back and a bright face, caps on its tips.
  const prod = (c, side = 0, k = 0.5) => {
    const l = [];
    const r = [];
    for (let i = 0; i <= 20; i++) {
      const u = -1 + i / 10;
      const w = (2.4 - Math.abs(u)) / 2;
      const x = xAt(u);
      if (side === 0) {
        l.push([x - w, cy + u * S]);
        r.push([x + w, cy + u * S]);
      } else {
        const e = x + side * w;
        l.push([e - side * w * 2 * k, cy + u * S]);
        r.push([e, cy + u * S]);
      }
    }
    return T([...l, ...r.reverse()], c);
  };
  s.push(prod(m.blade), F(prod(m.bladeDark, -1, 0.4)), F(prod(m.edge, 1, 0.3)));
  for (const sd of [-1, 1]) s.push(E(xAt(sd), cy + sd * S, 1.05, 1.05, m.trim));
  // The lashing that binds the prod to the tiller, cords across it.
  s.push(T([[px - 2.2, cy - 2.4], [px + 1.4, cy - 2.4], [px + 1.6, cy + 2.2], [px - 2.2, cy + 2.2]], m.trim));
  for (const x of [px - 1.5, px - 0.2, px + 1]) s.push(F(R(x, cy - 2.2, 0.5, 4.2, m.trimDark)));
  // The stirrup out in front, for a foot when she spans it.
  s.push(T(tube(arcPts(px + 1.4, cy + 0.6, 3.1, 1.9, 90, -90, 12), 0.9, 0.9), m.trim));
  const a = { tip: [px + 6.8, cy - 2.85], head: [px, cy], blade: [-7, 4] };
  if (t >= 4) {
    s.push(E(px - 0.4, cy - 0.1, 1.45, 1.45, m.trim), ...gem(px - 0.4, cy - 0.1, 1, m.gem));
    a.gem = [px - 0.4, cy - 0.1];
  }
  if (m.rune) a.runes = [-5, cy - 1, cy + 3];
  return { shapes: s, blade: a.blade, reach: [], a };
}

// The player wants them big and chunky (MapleStory's oversized weapons): each design is drawn on
// a plain grid, then blown up, wider than it is longer, so blades, guards and grips are bold.
const CHUNK = { sword: [1.5, 1.2], axe: [1.4, 1.15], spear: [1.45, 1.1], dagger: [1.15, 1.15], wand: [1.2, 1.2], staff: [1.25, 1.1], bow: [1.3, 1.1], crossbow: [1.15, 1.15] };

function scaled(d, [sx, sy]) {
  const sh = (s) => {
    if (s.t === 'r') return { ...s, x: s.x * sx, y: s.y * sy, w: s.w * sx, h: s.h * sy };
    if (s.t === 'e') return { ...s, x: s.x * sx, y: s.y * sy, rx: s.rx * sx, ry: s.ry * sy };
    return { ...s, x: s.x * sx, y: s.y * sy, pts: s.pts.map(([x, y]) => [x * sx, y * sy]) };
  };
  const pt = ([x, y]) => [x * sx, y * sy];
  const a = {};
  // (A word, like the ladder's `fx`, passes through as it is.)
  for (const [k, v] of Object.entries(d.a)) a[k] = typeof v === 'string' ? v : k === 'string' ? { ...v, x: v.x * sx, h: v.h * sy } : k === 'blade' ? v.map((y) => y * sy) : k === 'runes' ? [v[0] * sx, v[1] * sy, v[2] * sy] : k === 'stars' ? v.map((p) => p && pt(p)) : k === 'parts' ? Object.fromEntries(Object.entries(v).map(([n, p]) => [n, { ...p, pivot: pt(p.pivot) }])) : pt(v);
  return { shapes: d.shapes.map(sh), blade: d.blade.map((y) => y * sy), reach: d.reach.map(pt), a };
}

// (The dagger items: one sample dagger for every tier for now, see `dagger`.)
const DRAW = { sword, axe, spear, dagger, wand, staff, bow, crossbow };
// The Island Journey ladder (docs/design/island-journey-gear.md) for the seven job weapons, by
// tier: the Lv 5 starters (tier 0) are the Sprout weapons, the Lv 10 ones (tier 2) the Rootwood
// ones, the Lv 20 ones (tier 4) the Tidepearl ones, the Lv 30 ones (tier 6) the Starglass ones, the Lv 40 ones (tier 8) the Dreamsilk ones, the Lv 50 ones (tier 10) the Regalia (the Mochi Queen's). The wand and the gloves keep their plain starters; other tiers are the retired designs,
// still drawn for the Cash covers and the NPCs who carry them.
const LADDER = { 0: SPROUT_DESIGNS, 2: ROOTWOOD_DESIGNS, 4: TIDEPEARL_DESIGNS, 6: STARGLASS_DESIGNS, 8: DREAMSILK_DESIGNS, 10: REGALIA_DESIGNS };
// (A retired Cash weapon cover keeps the old design of its tier: its look carries `legacy`.)
export const isLadderDesign = (type, tier) => Boolean(LADDER[tier]?.[type]);
export const DESIGNS = Object.fromEntries(Object.entries(DRAW).map(([k, f]) => [k, (m, t, frame) => scaled(LADDER[t]?.[k] && !m?.legacy ? LADDER[t][k](m) : f(m, t, frame), CHUNK[k] ?? [1, 1])]));

// ---------- The glove ----------
//
// A gauntlet is a small glove on the weapon hand, in the weapon's look: the fist in leather (cloth
// for the training one), a cuff at the wrist in the trim, a knuckle plate from Iron, a gem on the
// back of the hand from Silver, a glowing rune from Runic and a star from Starsteel. (hx, hy) is
// the hand, (ex, ey) the elbow.
export function gloveShapes(m, hx, hy, ex, ey) {
  const l = Math.hypot(hx - ex, hy - ey) || 1;
  const [ux, uy] = [(hx - ex) / l, (hy - ey) / l];
  const [nx, ny] = [-uy, ux];
  const t = m.theme ? 20 : m.tier;
  const leather = t === 0 ? '#f2e2c4' : m.handle;
  const cuff = t === 0 ? '#c9a878' : m.trim;
  const wx = hx - ux * 2.3;
  const wy = hy - uy * 2.3;
  const out = [];
  // The cuff, flaring a little toward the elbow.
  const fl = t >= 5 ? 0.5 : 0;
  out.push(T([[wx + nx * 2.2, wy + ny * 2.2], [wx - nx * 2.2, wy - ny * 2.2], [wx - ux * 1.8 - nx * (2.3 + fl), wy - uy * 1.8 - ny * (2.3 + fl)], [wx - ux * 1.8 + nx * (2.3 + fl), wy - uy * 1.8 + ny * (2.3 + fl)]], cuff));
  out.push(F(T([[wx + nx * 2.1, wy + ny * 2.1], [wx - nx * 2.1, wy - ny * 2.1], [wx - ux * 0.5 - nx * 2.1, wy - uy * 0.5 - ny * 2.1], [wx - ux * 0.5 + nx * 2.1, wy - uy * 0.5 + ny * 2.1]], mix(cuff, '#000000', 0.18))));
  // The fist.
  out.push(E(hx, hy, 2.3, 2.2, leather));
  // Stitching, or a knuckle plate from Iron.
  if (t >= 3) out.push(E(hx + ux * 1, hy + uy * 1, 1.7, 1.5, m.blade), F(E(hx + ux * 0.6 - nx * 0.5, hy + uy * 0.6 - ny * 0.5, 0.6, 0.45, m.edge)));
  else out.push(F(T([[hx + ux * 1.2 + nx * 1.6, hy + uy * 1.2 + ny * 1.6], [hx + ux * 1.2 - nx * 1.6, hy + uy * 1.2 - ny * 1.6], [hx + ux * 0.8 - nx * 1.6, hy + uy * 0.8 - ny * 1.6], [hx + ux * 0.8 + nx * 1.6, hy + uy * 0.8 + ny * 1.6]], mix(leather, '#000000', 0.25))));
  // A gem, a rune or a star on the back of the hand.
  if (t >= 10) out.push(F(star(hx - ux * 0.4, hy - uy * 0.4, 1.4, m.rune ?? GOLD)));
  else if (t >= 9) out.push(F(E(hx - ux * 0.4, hy - uy * 0.4, 0.7, 0.7, m.rune ?? m.gem)));
  else if (t >= 5) out.push(...gem(hx - ux * 0.4, hy - uy * 0.4, 0.7, m.gem));
  out.push(F(E(hx - ux * 0.6 + nx * 1.1, hy - uy * 0.6 + ny * 1.1, 0.5, 0.4, WHITE)));
  return out;
}
