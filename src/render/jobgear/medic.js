// The Cleric's field kit (docs/design/mage-line.md, the remake): the pyro gremlin became a combat
// medic who still loves explosions, as long as they heal. She keeps the Mage's battle coat, belt of
// vials and satchel, all in field white: a cross patch on the coat, a cross on the satchel (now a
// medical bag), a stethoscope round her neck, and in place of the scorched hat a folded nurse's cap
// with a cross and her goggles pushed up on it. The cross is in the set's accent colour. The cap
// grows grander up the tiers: a second band from Scholar, a gold pin from Archon, little wings on
// the sides from Sunspire. Nothing comes down over her face.

import { R, E, T, F, mix } from '../pixel.js';
import { limb } from '../figure.js';
import battlemage from './battlemage.js';

const WHITE = '#ffffff';
const CAP = '#fbfbfb';
const CAP_DK = '#d9dbe6';
const STEEL = '#b7bfd0';
const STEEL_DK = '#7a8296';
const stage = (t) => (t < 2 ? 0 : t < 5 ? 1 : t < 9 ? 2 : t < 13 ? 3 : t < 17 ? 4 : 5);

// A plus-shaped cross at (x, y), arm half-length r and half-thickness w.
const cross = (x, y, r, w, c) => [R(x - w, y - r, w * 2, r * 2, c), R(x - r, y - w, r * 2, w * 2, c)];

// The nurse's cap: a folded paper cap perched on her head, its peak folded back, the cross on its
// front, her goggles pushed up on it.
function hat(t, p, m) {
  const s = stage(t);
  const bob = (m.hair ?? 0) * 0.3;
  const y = 3.4 + bob;
  const out = [
    // The folded back of the cap rising behind its front band.
    T([[7.6, y + 3.6], [9.4, y - 2.4], [15.5, y - 3.6], [21.6, y - 2.4], [23.4, y + 3.6]], CAP_DK),
    // The front band.
    T([[6.8, y + 3.2], [24.2, y + 3.2], [23.6, y + 5.8], [7.4, y + 5.8]], CAP),
    F(T([[7.4, y + 5.2], [23.6, y + 5.2], [23.6, y + 5.8], [7.4, y + 5.8]], CAP_DK)),
    ...cross(15.5, y + 0.6, 2, 0.75, p.accent),
  ];
  if (s >= 1) out.push(F(T([[7, y + 3.9], [24, y + 3.9], [24, y + 4.4], [7, y + 4.4]], p.accent)));
  // Her goggles, pushed up on the band: two little round lenses on a strap.
  const rim = s >= 3 ? p.trim : '#c9a35a';
  for (const [x, r] of [[11.2, 1.5], [20.2, 1.7]]) {
    out.push(E(x, y + 4.4, r + 0.5, r + 0.5, rim), E(x, y + 4.4, r, r, '#4a3a5a'), F(E(x, y + 4.4, r - 0.4, r - 0.4, mix('#a8e8ff', '#4a3a5a', 0.3))), F(E(x - r * 0.3, y + 4.1, r * 0.32, r * 0.26, WHITE)));
  }
  if (s >= 3) out.push(E(24, y + 2.4, 0.9, 0.9, p.trim), F(E(24, y + 2.4, 0.45, 0.45, p.accent)));
  if (s >= 4) for (const sd of [-1, 1]) out.push(T([[15.5 + sd * 8.6, y + 2], [15.5 + sd * 12.4, y - 1.6 + bob * 0.4], [15.5 + sd * 11.2, y + 1.2], [15.5 + sd * 12.6, y + 2.2], [15.5 + sd * 9, y + 4]], WHITE));
  return out;
}

// The coat in field white with the cross patch on its front, the satchel marked as a medical bag.
function top(t, p, m) {
  const sw = (m.sway ?? 0) * 0.35;
  const out = battlemage.top(t, p, m);
  out.push(E(19.4, 30.4, 1.9, 1.9, WHITE), ...cross(19.4, 30.4, 1.4, 0.5, p.accent));
  const bx = 19.6 + sw * 0.6;
  out.push(...cross(bx + 2, 37.6, 1.1, 0.4, p.accent));
  return out;
}

// The bandaged off hand: a wrap of white bandage round her palm and wrist.
function hand(t, p, hx, hy, ex, ey) {
  const at = (u) => [hx + (ex - hx) * u, hy + (ey - hy) * u];
  return [limb(...at(0.15), ...at(0.5), 3.4, 3, WHITE), F(limb(...at(0.28), ...at(0.34), 3.5, 3.4, CAP_DK)), E(hx, hy, 1.9, 1.9, WHITE), F(E(hx + 0.3, hy + 0.4, 1, 0.7, '#fbe2cf'))];
}

// Behind her: nothing but the stethoscope's tubes falling down her back.
function cape(t, p, m) {
  const sw = m.sway ?? 0;
  return [limb(11, 25.6, 9.4 + sw * 0.6, 31, 0.6, 0.6, STEEL_DK)];
}

// Over the top: the stethoscope round her neck, its chest piece bouncing at her front.
function capeFront(t, p) {
  return [
    limb(10.4, 25.4, 15.5, 26.8, 0.6, 0.6, STEEL_DK), limb(20.6, 25.4, 15.5, 26.8, 0.6, 0.6, STEEL_DK),
    limb(17, 26.4, 18.4, 30.6, 0.5, 0.5, STEEL_DK),
    E(18.4, 31.2, 1.2, 1.2, STEEL), F(E(18.2, 31, 0.5, 0.5, WHITE)),
    F(E(10.6, 25.2, 0.6, 0.6, STEEL)), F(E(20.4, 25.2, 0.6, 0.6, STEEL)),
  ];
}

export default {
  ...battlemage,
  hat, hatBack: () => [], hatTucks: () => false, hatHidesBangs: () => false,
  top, hand, cape, capeFront,
};
