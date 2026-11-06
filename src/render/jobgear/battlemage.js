// The Mage's battle gear (docs/design/mage-line.md, the remake): a pyro gremlin of a magic-school
// dropout dressed to fight, not to sit in a tower. A short open coat over her robe, a belt hung with
// three spell vials (fire, ice, lightning), a satchel of scrolls on a strap across her chest, a
// scarf with a singed end trailing behind her, short buckled boots, and the mage line's pointed hat
// with a pair of goggles strapped round it and its tip scorched black and smoking. Her casting hand
// wears the rune gauntlet (render/gear.js `glove.edge`). The hat ladder is the mage module's; the
// rest grows a little grander up the tiers (trim from Scholar, brass buckles and a fuller satchel
// from Archon, glowing vials from Sunspire). Nothing comes down over her face.

import { R, E, T, F, mix } from '../pixel.js';
import { FIGURE, band, MID, limb } from '../figure.js';
import mage, { hatSpine, coneBand } from './mage.js';

const WHITE = '#ffffff';
const LEATHER = '#7a4a32';
const LEATHER_DK = '#55301f';
const LEATHER_LT = '#a26a46';
const PAPER = '#f6ead2';
const PAPER_DK = '#d8c3a0';
const SOOT = '#2e2632';
const FIRE = '#ff8a3a';
const ICE = '#8fdcff';
const BOLT = '#ffe066';
const stage = (t) => (t < 2 ? 0 : t < 5 ? 1 : t < 9 ? 2 : t < 13 ? 3 : t < 17 ? 4 : 5);
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- Hat: the mage ladder's hat, with goggles round it and a scorched, smoking tip ----------

function goggles(t, p) {
  const s = stage(t);
  const y = 6.2;
  const rim = s >= 3 ? p.trim : '#c9a35a';
  const out = [
    // The strap round the hat just above the brim.
    T([[6.4, y - 1], [24.6, y - 1], [24.8, y + 0.9], [6.2, y + 0.9]], LEATHER_DK),
    F(T([[6.6, y - 0.7], [24.4, y - 0.7], [24.4, y - 0.2], [6.6, y - 0.2]], LEATHER_LT)),
  ];
  // Two round lenses pushed up on the hat, the front one bigger (it's nearer).
  for (const [x, r] of [[12.6, 2.1], [18.4, 2.4]]) {
    out.push(E(x, y, r + 0.6, r + 0.6, rim), E(x, y, r, r, '#4a3a5a'), F(E(x, y, r - 0.5, r - 0.5, mix('#ffb36b', '#4a3a5a', 0.35))));
    out.push(F(E(x - r * 0.35, y - r * 0.35, r * 0.35, r * 0.28, WHITE)));
  }
  out.push(F(R(14.6, y - 0.5, 1.8, 1, rim)));
  return out;
}

function hat(t, p, m) {
  const out = [...mage.hat(t, p, m), ...goggles(t, p)];
  // The tip is singed black where her spells keep catching it, an ember still glowing at the end.
  // (The curl of smoke off it is an effect, drawn with her idle.)
  const sp = hatSpine(t, m);
  const tip = sp[sp.length - 1];
  out.push(coneBand(sp, 0.72, 1, SOOT, 0.2), F(coneBand(sp, 0.7, 0.74, mix(p.main, SOOT, 0.5), 0.3)), F(E(tip.x, tip.y, 0.8, 0.8, FIRE)), F(E(tip.x - 0.2, tip.y - 0.1, 0.35, 0.35, '#ffe2a0')));
  return out;
}

// ---------- Coat over the robe ----------

const COATS = [[40.6, 0.6], [41, 0.8], [41.4, 1], [41.8, 1.2], [42, 1.4], [42.4, 1.6]];

// The coat's two open fronts: the back panel from her back edge to just short of the middle, the
// front one from just past the middle to her front edge, both flaring a little to the hip.
function coatPanels(t, sw) {
  const [len, fl] = COATS[stage(t)];
  const { front, back } = FIGURE;
  const fore = [[MID + 1.5, 26.3], ...front, [22.2 + fl + sw, len - 0.4], [MID + 2.1 + sw, len]];
  const rear = [...back, [MID - 1.6, 26.3], [MID - 2.3 + sw, len], [8.8 - fl + sw, len - 0.4]];
  return { fore, rear, len };
}

function top(t, p, m) {
  const s = stage(t);
  const sw = (m.sway ?? 0) * 0.35;
  const out = [];
  // The robe under the coat, in the second cloth, with a little stand-up collar.
  out.push(T([...FIGURE.front, ...FIGURE.back], p.second));
  out.push(T([[MID - 2.6, 25.8], [MID + 2.6, 25.8], [MID + 1.8, 27.8], [MID - 1.8, 27.8]], p.secondDark));
  const { fore, rear, len } = coatPanels(t, sw);
  out.push(T(rear, p.dark), T(fore, p.main));
  // Lapels folded back at the neck.
  out.push(T([[MID + 1.5, 26.3], [19.4, 26.4], [18.4, 30.4], [MID + 2, 31.2]], p.light));
  out.push(T([[MID - 1.6, 26.3], [12, 26.4], [12.8, 30.2], [MID - 2.2, 31]], p.main));
  // Trimmed hems from the Scholar on.
  if (s >= 1) {
    out.push(band(fore, len - 1.2, len + 0.2, p.trim), band(rear, len - 1.2, len + 0.2, p.trimDark));
    out.push(F(limb(MID + 1.8, 27, MID + 2.1 + sw, len, 0.6, 0.6, p.trim)));
  }
  // Rolled cuffs of soot where she wipes her hands: a dark smudge on the front hem.
  out.push(F(E(20 + sw, len - 2.4, 1.6, 0.8, mix(p.main, SOOT, 0.45))));
  // The belt, a brass buckle, and three spell vials (fire, ice, lightning) hanging off it.
  out.push(band([...FIGURE.front, ...FIGURE.back], 33.8, 35.6, LEATHER), R(MID + 2.6, 33.6, 2.4, 2.2, s >= 3 ? p.trim : '#c9a35a'), F(R(MID + 3.2, 34.2, 1.2, 1, LEATHER_DK)));
  const glow = s >= 4;
  [[11.2, FIRE], [12.8, ICE], [14.4, BOLT]].forEach(([x, c], i) => {
    const y = 37.2 + (i % 2) * 0.5;
    const dx = sw * 0.8;
    if (glow) out.push(F(E(x + dx, y, 1.5, 1.7, mix(c, WHITE, 0.5))));
    out.push(F(limb(x, 35.4, x + dx, y - 1.4, 0.3, 0.3, LEATHER_DK)), E(x + dx, y, 0.95, 1.25, mix(c, '#3a2d4f', 0.15)), F(E(x + dx - 0.25, y - 0.3, 0.35, 0.45, WHITE)), F(R(x + dx - 0.5, y - 1.7, 1, 0.5, '#8a6a4a')));
  });
  // The satchel strap across her chest, from her back shoulder to the bag at her front hip.
  out.push(limb(11.2, 26.8, 20.4, 35.4, 1.1, 1.1, LEATHER_DK), F(limb(11.4, 26.6, 20.4, 35.1, 0.4, 0.4, LEATHER_LT)));
  if (s >= 3) out.push(E(15.6, 30.8, 0.8, 0.8, p.trim));
  // The satchel: a leather bag with a flap, scrolls poking out of the top.
  const bx = 19.6 + sw * 0.6;
  const by = 36;
  const rolls = s >= 3 ? 3 : 2;
  for (let i = 0; i < rolls; i++) {
    const x = bx + 0.6 + i * 1.3;
    const lean = (i - 0.5) * 0.5;
    out.push(T([[x - 0.6, by + 0.6], [x + 0.6, by + 0.6], [x + 0.6 + lean, by - 2.4], [x - 0.6 + lean, by - 2.4]], PAPER), E(x + lean, by - 2.4, 0.65, 0.45, PAPER_DK));
    if (i === 1) out.push(F(R(x - 0.6, by - 1.2, 1.2, 0.5, '#c8324a')));
  }
  out.push(T([[bx - 0.6, by], [bx + 4.6, by], [bx + 4.4, by + 4.6], [bx - 0.4, by + 4.6]], LEATHER));
  out.push(T([[bx - 0.8, by - 0.2], [bx + 4.8, by - 0.2], [bx + 4.6, by + 2], [bx + 2, by + 2.8], [bx - 0.6, by + 2]], LEATHER_LT));
  out.push(F(E(bx + 2, by + 2.2, 0.6, 0.6, s >= 3 ? p.trim : '#c9a35a')));
  return out;
}

const sleeve = (t, p) => p.main;
const longSleeves = () => true;

// Rolled-up sleeves: a cuff band at the shoulder (the coat's seam), brass studs from the Archon.
function shoulder(t, p) {
  const s = stage(t);
  const out = [E(0, 0.8, 2.6, 2.3, p.main), F(R(-2.4, 2, 4.8, 0.8, p.dark))];
  if (s >= 1) out.push(F(R(-2.4, -0.4, 4.8, 0.6, p.trim)));
  if (s >= 3) out.push(F(E(0, 0.6, 0.6, 0.6, p.trim)));
  return out;
}

// ---------- Under-robe skirt and coat tails ----------

const legs = (t, p) => ({ top: '#3a2d44', low: '#3a2d44', pad: null });

function skirt(t, p, m) {
  const s = stage(t);
  const sw = m.sway ?? 0;
  const len = 46 + s * 0.6;
  const out = [];
  // The robe hangs to just above the knee, split at the front so she can run.
  out.push(T([[10, 34.4], [21.2, 34.4], [22 + sw * 0.5, len - 1], [MID + 1.2 + sw * 0.7, len - 2.4], [MID + sw * 0.7, len], [8.8 + sw * 0.9, len + 0.4]], p.second));
  out.push(band([[10, 34.4], [21.2, 34.4], [22 + sw * 0.5, len - 1], [8.8 + sw * 0.9, len + 0.4]], len - 1.4, len + 0.6, p.secondDark));
  // The coat's tail behind her, longer than its front and swinging well behind when she runs.
  const tail = len + 2 + s * 0.4;
  out.push(T([[9.4, 35.6], [13.2, 35.6], [12.2 + sw * 1.2, tail - 1.4], [9 + sw * 1.6, tail], [6.4 + sw * 1.8, tail - 0.8], [8.2, 40]], p.dark));
  if (s >= 1) out.push(F(limb(6.8 + sw * 1.8, tail - 0.9, 11.8 + sw * 1.3, tail - 1.4, 0.7, 0.7, p.trimDark)));
  // Scorch marks on the robe's hem.
  out.push(F(E(17.4 + sw * 0.7, len - 0.6, 1.4, 0.6, mix(p.second, SOOT, 0.5))));
  return out;
}

// ---------- Boots ----------

function shoe(t, p, k) {
  const s = stage(t);
  const c = k.tint(LEATHER_DK);
  const out = [k.sole(c), k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], k.tint(SOOT)), k.shaft(1.6, k.tint(LEATHER), 3.1)];
  out.push(k.dot(0.6, 0.8, 0.6, k.tint(s >= 3 ? p.trim : '#c9a35a')));
  return out;
}

// ---------- Gloves (her off hand; the casting hand wears the gauntlet) ----------

function hand(t, p, hx, hy, ex, ey) {
  const at = (u) => [lerp(hx, ex, u), lerp(hy, ey, u)];
  return [limb(...at(0.2), ...at(0.45), 3.6, 3.2, LEATHER), E(hx, hy, 1.9, 1.9, LEATHER_LT), F(E(hx + 0.4, hy + 0.3, 0.9, 0.7, '#fbe2cf'))];
}

// ---------- Scarf ----------

// Behind: the scarf's long end streaming back from her neck, its tip burnt ragged.
function cape(t, p, m) {
  const sw = m.sway ?? 0;
  const c = p.accent;
  const tx = 2.4 + sw * 1.6;
  const ty = 34 + Math.abs(sw) * 0.3;
  return [
    T([[11.2, 25.4], [13.6, 26.6], [tx + 2.4, ty - 0.6], [tx + 1, ty + 1.4], [tx - 0.6, ty]], c),
    F(limb(12, 26, tx + 0.8, ty - 0.2, 0.5, 0.4, mix(c, WHITE, 0.3))),
    T([[tx + 1, ty + 1.4], [tx + 2.4, ty - 0.6], [tx + 1.6, ty + 2.6], [tx + 0.6, ty + 1.8], [tx - 0.4, ty + 2.8], [tx - 0.6, ty]], SOOT),
  ];
}

// Over the top: the scarf wrapped round her neck and knotted at the side.
function capeFront(t, p) {
  const c = p.accent;
  return [
    T([[10.6, 24.6], [20.6, 24.6], [21, 26.6], [10.2, 26.6]], c),
    F(T([[11, 24.8], [20.2, 24.8], [20.2, 25.3], [11, 25.3]], mix(c, WHITE, 0.35))),
    E(11.4, 26.4, 1.4, 1.2, mix(c, '#3a2d4f', 0.2)),
  ];
}

export default {
  hat, hatBack: mage.hatBack, hatTucks: () => false, hatHidesBangs: () => false,
  top, sleeve, longSleeves, shoulder, legs, skirt, shoe, hand, cape, capeFront,
};
