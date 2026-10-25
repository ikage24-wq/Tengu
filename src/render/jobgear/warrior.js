// Warrior gear: heavy plate that grows from a squire's padded leather and kettle cap through iron
// and knightly steel with plumed helms and tabards, horned warlord plate with massive pauldrons,
// dragonscale, blood-forged and obsidian armor, molten infernal and doom plate, up to the radiant
// winged armor of the Ascendant. Twenty tiers fall into seven looks (STAGE), and every tier adds
// its own crest, emblem, spikes, and hem within its look.

import { R, E, T, F, shade, mix } from '../pixel.js';
import { torsoPts, band, MID, limb, mirrorX } from '../figure.js';

const LEATHER = '#a8764f';
const LEATHER_D = '#76503a';
const LINEN = '#f4e8d2';
const CHAIN = '#aeb6c6';
const FUR = '#f6ecdc';
const BONE = '#f8efdc';
const WHITE = '#ffffff';

// 0 squire leather · 1 iron · 2 knight · 3 warlord · 4 dragon, blood, obsidian · 5 colossus to
// doomguard · 6 godslayer, ragnarok, ascendant.
const STAGE = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6];
const stage = (t) => STAGE[t];

// ---------- Small helpers ----------

const pts = (list, dx = 0, dy = 0, k = 1) => list.map(([x, y]) => [dx + x * k, dy + y * k]);
const both = (shapes) => [...shapes, ...mirrorX(shapes.filter(Boolean))];
// The top half of a rounded-square ellipse, closed along its base: helm domes, full at the
// shoulders so they cover the hair.
function dome(cx, cy, rx, ry, c) {
  const out = [];
  const pw = (v) => Math.sign(v) * Math.abs(v) ** 0.8;
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i * Math.PI) / 14;
    out.push([cx + pw(Math.cos(a)) * rx, cy + pw(Math.sin(a)) * ry]);
  }
  return T(out, c);
}
const gem = (x, y, r, c) => [E(x, y, r, r, c), F(E(x - r * 0.35, y - r * 0.35, r * 0.38, r * 0.38, WHITE))];
const spike = (x, y, w, h, c, lean = 0) => T([[x - w / 2, y], [x + w / 2, y], [x + lean, y - h]], c);
// A zigzag glowing line (molten cracks, lightning, runes).
const zig = (list, w, c) => F(T([...list, ...list.slice().reverse().map(([x, y]) => [x + w, y + w * 0.4])], c));
const glowOf = (p) => p.glow ?? p.accent;

// ---------- Helms ----------

// The shared helm: a dome over the hair, a brow band above the eyes, and cheek guards that frame
// the face. `top` is the dome's top y, `cheek` the cheek guards' size.
function helm(p, top = 2.4, cheek = 1, browC = p.trim) {
  const g = cheek;
  const guard = T([[3, 11], [8.2, 12], [8.4 + 0.3 * g, 16.4], [7.6 + 0.3 * g, 21.2 + g], [5.2, 22.4 + g], [3, 18 + g]], p.main);
  return [
    dome(15.5, 12.6, 13.4, 12.6 - top, p.main),
    F(T([[9, 4.8], [12.4, 3.4], [11, 6.8], [8.6, 8.4]], p.light)),
    ...both([guard, F(T([[7.4, 13], [8.2, 13], [7.8 + 0.3 * g, 20 + g], [6.8 + 0.3 * g, 20.8 + g]], p.dark))]),
    T([[3, 10.4], [28, 10.4], [27.8, 13], [15.5, 13.8], [3.2, 13]], browC),
  ];
}
const rivets = (c, y = 12, xs = [6, 10.6, 15.5, 20.4, 25]) => xs.map((x) => F(E(x, y, 0.55, 0.55, c)));

// A feather plume rising from (x, y) and streaming back (to the left), bending with the hair spring.
function plume(x, y, k, c, sw) {
  const b = sw * 0.8;
  const body = [[x + 1.4, y + 0.5], [x + 2.4, y - 3 * k], [x + 1, y - 6.4 * k], [x - 3 * k + b, y - 8 * k], [x - 7.4 * k + b * 1.6, y - 7 * k], [x - 10.6 * k + b * 2, y - 3 * k],
    [x - 8.4 * k + b * 1.6, y - 3.8 * k], [x - 9.6 * k + b * 2, y - 0.6 * k], [x - 5.6 * k + b * 1.4, y - 3 * k], [x - 1.2, y - 2.2 * k], [x - 1.4, y + 0.5]];
  return [T(body, c), F(T([[x + 0.6, y - 1], [x - 0.6 + b * 0.4, y - 5.6 * k], [x - 5.6 * k + b * 1.4, y - 6.4 * k], [x - 1.4 + b * 0.4, y - 4.6 * k]], shade(c, 16)))];
}

// Horns from the helm's left side (mirrored to the right). `curl` 0 sweeps up, 1 curls like a ram.
function horns(k, c, curl = 0, bx = 4.6, by = 7.4) {
  const up = [[0, 1.6], [-3.2, 0.6], [-5.8, -2], [-7, -6.6], [-6.4, -11], [-4.6, -6.6], [-2.6, -3.4], [0.6, -2]];
  const ram = [[0, 1.8], [-3.6, 1.6], [-6.6, -0.4], [-7.6, -4], [-6, -7], [-2.6, -7.6], [-0.6, -5.6], [-2.2, -4], [-4.4, -4.6], [-4.8, -2.2], [-2.6, -0.6], [0.6, -1.8]];
  const horn = T(pts(curl ? ram : up, bx, by, k), c);
  const tipBand = curl ? null : F(T(pts([[-5.9, -5.4], [-7.1, -6.8], [-6.6, -8.6], [-5.5, -7]], bx, by, k), shade(c, -14)));
  return both([horn, tipBand]);
}

// A crown of spikes standing on the brow; `hs` are their heights left to right.
function crown(hs, c, y = 10.8, x0 = 6, x1 = 25) {
  return hs.map((h, i) => spike(x0 + ((x1 - x0) * i) / (hs.length - 1), y, 2.6, h, c));
}

// Feathered wings from the helm sides, rising high.
function helmWings(c, tip, hair) {
  const s = hair * 0.4;
  const wing = [T([[5, 9.6], [2.4, 4], [-1.6 + s, -3], [-4.6 + s, -11], [-3.4 + s, -17.6], [-0.6 + s, -11.6], [1.6, -6], [4.6, -1], [7.2, 3.6]], c),
    F(T([[3.6, 6.4], [-0.6 + s, -1], [-2.4 + s, -7.4], [0.4 + s, -3.6], [5.2, 2]], WHITE)),
    F(T([[-3.4 + s, -16], [-1.4 + s, -11.4], [-2.6 + s, -10]], tip))];
  return both(wing);
}

function hat(t, p, m) {
  const sw = m?.hair ?? 0;
  const glow = glowOf(p);
  switch (t) {
    // Squire: a padded leather kettle cap with a wide brim.
    case 0: return [E(15.5, 10.6, 14.4, 2.8, p.dark), dome(15.5, 10.8, 10, 8.8, p.main), F(R(15, 2.6, 1, 6.6, p.dark)), F(R(9, 4, 0.7, 5.2, p.light)), R(5.6, 8.4, 19.8, 2.4, p.dark), F(E(15.5, 2.4, 1.2, 1, p.light))];
    // Militia: an iron kettle hat, flared brim, ridged crown, bronze band.
    case 1: return [E(15.5, 10.8, 15.6, 3.4, p.dark), E(15.5, 10.2, 14.6, 2.4, p.main), dome(15.5, 10.2, 9.8, 9, p.main), F(R(14.8, 1.4, 1.4, 8.4, p.light)), R(5.8, 7.8, 19.4, 2.2, p.trim), ...rivets(p.trimDark, 8.9, [8, 12, 19, 23])];
    // Ironclad: a round iron helm with cheek guards and a riveted brow.
    case 2: return [...helm(p, 2.4, 0.6), ...rivets(p.trimDark), E(15.5, 2.4, 1.6, 1.3, p.trim)];
    // Steelguard: a combed steel helm.
    case 3: return [T([[8.6, 5], [11.6, 0.4], [15.5, -1.4], [19.4, 0.4], [22.4, 5]], p.light), ...helm(p, 2.2, 1), ...rivets(p.trimDark), F(R(15, -0.6, 1, 4.4, p.trim))];
    // Knight: a great helm with its visor raised over the brow and a red plume.
    case 4: return [...plume(15.5, 2.6, 1, p.accent, sw), ...helm(p, 2.2, 1.2), ...visor(p)];
    // Vanguard: a bigger plume and winged cheek fins.
    case 5: return [...plume(15.5, 2.4, 1.25, p.accent, sw), ...both([T([[3.4, 12], [-1.4, 9], [0.4, 13], [-1, 16], [3.6, 16.4]], p.trim)]), ...helm(p, 2, 1.2), ...visor(p), ...gem(15.5, 12.2, 1, p.accent)];
    // Crusader: white plumes, a cross over the brow, and a little crown.
    case 6: return [...plume(13.6, 2.6, 1.15, WHITE, sw), ...plume(16.6, 2.2, 1.35, p.accent, sw), ...helm(p, 2, 1.4), ...visor(p),
      F(R(14.4, 2.6, 2.2, 8, p.accent)), F(R(11.6, 5, 7.8, 2, p.accent)), ...gem(15.5, 12.2, 1.1, p.trim)];
    // Warlord: horns and a row of spikes.
    case 7: return [...horns(0.85, BONE), ...helm(p, 2.4, 1.6), ...crown([3, 5, 3], p.trim, 4.4, 11.5, 19.5), ...rivets(p.trimDark)];
    // Juggernaut: a broad helm, big horns, and a crest of five spikes.
    case 8: return [...horns(1.05, BONE, 0, 4, 8), ...helm(p, 1.8, 2, p.dark), ...crown([3, 4.6, 6.4, 4.6, 3], p.light, 4, 9, 22), ...rivets(p.trim), ...gem(15.5, 12, 1, p.accent)];
    // Titan: a golden crown of tall spikes over a horned helm.
    case 9: return [...horns(1, p.light), ...helm(p, 2, 2), ...crown([4, 6, 9, 6, 4], p.trim, 4.4, 8.6, 22.4), ...gem(15.5, 1.6, 1.2, p.accent), ...gem(15.5, 12.2, 1.2, p.accent)];
    // Dragonscale: a fan of dragon spines, swept horns, and finned cheeks.
    case 10: return [...dragonFrill(p, 1), ...horns(1, p.light, 0, 5, 6), ...both([T([[3.2, 13], [-2.6, 11], [-0.6, 14.4], [-2.4, 17.2], [3.4, 18.6]], p.dark)]), ...helm(p, 2.2, 1.6, p.trim),
      ...scales(p.dark, [[9.6, 6.4], [13.6, 5], [17.6, 5], [21.6, 6.4], [11.6, 8.6], [15.6, 8], [19.6, 8.6]]), ...gem(15.5, 12, 1.2, glow)];
    // Bloodforged: a jagged crown of blades and fanged cheeks, runes glowing on the brow.
    case 11: return [...crown([5, 8, 11, 8, 5], p.dark, 5.4, 7.4, 23.6), ...both([F(T([[7.4, 3.6], [7.8, -1.6], [8.6, 3.6]], glow))]), ...helm(p, 2, 2, p.deep),
      ...both([T([[7.2, 20], [9.2, 20.6], [7.8, 24.6]], BONE)]), zig([[10, 11.8], [12, 11], [13.4, 12.4]], 0.7, glow), zig([[17.6, 12.4], [19, 11], [21, 11.8]], 0.7, glow), ...gem(15.5, 12, 1.3, glow)];
    // Obsidian: towering crystal shards.
    case 12: return [...shards(p, glow), ...helm(p, 2, 1.8, p.trim), ...gem(15.5, 12, 1.3, glow), F(T([[7, 8], [9.6, 4.6], [8.6, 8.6]], p.light))];
    // Colossus: a tall red fan crest between curling ram horns.
    case 13: return [fan(15.5, 4, 11, 13, p.accent), ...[-6, -2, 2, 6].map((dx) => F(T([[15.5 + dx * 0.3 - 0.4, 3], [15.5 + dx * 0.3 + 0.4, 3], [15.5 + dx * 1.5, -7.4 - (6 - Math.abs(dx)) * 0.5]], shade(p.accent, -16)))), ...horns(1.1, BONE, 1, 4.4, 9), ...helm(p, 2, 2), ...crown([3, 4, 3], p.trim, 10.6, 11, 20), ...gem(15.5, 12, 1.2, glow)];
    // Dreadnought: swept steel blade-wings and a center spike.
    case 14: return [...bladeWings(p), spike(15.5, 4, 4, 12, p.light), F(spike(15.5, 3.4, 1.2, 9.4, glow)), ...helm(p, 2, 2, p.trim), ...rivets(p.trimDark), ...gem(15.5, 12, 1.2, glow)];
    // Infernal: demon horns, a crest of flames, and molten cracks.
    case 15: return [...flames(15.5, 4, 1.2, glow), ...horns(1.2, p.deep, 0, 4.6, 7), ...both([F(T(pts([[-5.6, -4.6], [-6.8, -6.6], [-6.4, -11], [-5.4, -7]], 4.6, 7, 1.2), glow))]), ...helm(p, 2, 2, p.deep),
      zig([[8, 4.6], [10, 6.6], [9, 8.4], [11, 10.4]], 0.7, glow), zig([[22, 4], [20.6, 6.4], [22.2, 8.2]], 0.7, glow), ...gem(15.5, 12, 1.3, glow)];
    // Doomguard: great curling horns, a spiked crown, and glowing visor slits.
    case 16: return [...horns(1.5, BONE, 0, 4.4, 9.6), ...helm(p, 1.8, 2.2, p.deep), ...crown([4, 6, 8, 6, 4], p.deep, 5, 8, 23), ...both([F(R(9.2, 11.4, 3.4, 1.1, glow))]), ...gem(15.5, 12, 1.2, glow), F(T([[13, 4], [18, 4], [15.5, 9]], p.light))];
    // Godslayer: a golden sun crown (its rays stand behind the head) and small wings.
    case 17: return [...helmWings(p.light, glow, sw), ...helm(p, 2, 1.6), ...crown([5, 7, 10, 7, 5], p.trim, 9.6, 7.4, 23.6), ...gem(15.5, 4.6, 1.5, glow), ...gem(15.5, 12, 1.1, glow)];
    // Ragnarok: storm horns crackling with lightning.
    case 18: return [...horns(1.4, p.light, 0, 4.4, 7.4), zig([[-1, -10], [1.6, -5], [-0.4, -4.6], [2.2, 1]], 1.1, glow), zig([[32, -10], [29.6, -5], [31.6, -4.6], [29, 1]], 1.1, glow),
      ...helm(p, 2, 2), T([[12.6, 4], [15.5, -9], [18.4, 4]], p.dark), zig([[16.4, -6], [14.4, -1.6], [16.4, -1.4], [14.6, 3.4]], 0.8, glow), zig([[9.6, 11.4], [11.4, 12.4], [13, 11.4]], 0.6, glow), zig([[18, 11.4], [19.6, 12.4], [21.4, 11.4]], 0.6, glow)];
    // Ascendant: radiant feathered wings and a crown (the halo floats behind).
    default: return [...helmWings(WHITE, p.trim, sw), ...helm(p, 2.2, 1.6, p.trim), ...crown([5, 8, 11, 8, 5], p.trim, 4.4, 9, 22), ...gem(15.5, -2.4, 1.4, glow), ...gem(15.5, 12, 1.2, glow)];
  }
}

// The knight's raised visor, a slotted plate resting above the brow.
const visor = (p) => [T([[5.4, 7.6], [25.6, 7.6], [26.6, 11], [4.4, 11]], p.light), F(R(7.6, 8.8, 6.2, 0.9, p.deep)), F(R(17.2, 8.8, 6.2, 0.9, p.deep))];
// A half-disc fan crest standing on the helm (a transverse crest, seen from the front).
function fan(cx, cy, rx, ry, c) {
  const out = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i * Math.PI) / 10;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return T(out, c);
}
const scales = (c, at) => at.map(([x, y]) => F(T([[x - 1.4, y - 0.6], [x + 1.4, y - 0.6], [x, y + 1]], c)));
const dragonFrill = (p) => [T([[7, 6], [5.6, -4], [10, 2.4]], p.dark), T([[10, 4], [10.6, -8], [13.4, 2]], p.main), T([[13, 3], [15.5, -11], [18, 3]], p.dark), T([[17.6, 2], [20.4, -8], [21, 4]], p.main), T([[21, 2.4], [25.4, -4], [24, 6]], p.dark)];
const shards = (p, glow) => [T([[6.6, 6], [5.4, -3], [9.4, -1], [10.6, 4]], p.dark), T([[20.4, 4], [21.6, -1], [25.6, -3], [24.4, 6]], p.dark),
  T([[11, 4], [13, -11], [15.5, -16], [18, -11], [20, 4]], p.main), F(T([[15.5, -16], [18, -11], [16.4, 2]], p.light)), F(T([[14.6, -10], [15.5, -14], [15.6, 0]], glow)), F(T([[6.4, 0], [8.8, 0.2], [9.2, 3]], glow))];
const bladeWings = (p) => both([T([[5, 9], [-5, -2], [-2.6, 1.6], [-7, -6], [-1, -1.6], [-4, -10], [6.6, 4]], p.light), F(T([[3.2, 5.6], [-3.6, -6], [4.2, 2.4]], p.trim))]);
function flames(x, y, k, c) {
  const tongue = (dx, h, lean) => T([[x + dx - 2.2 * k, y], [x + dx + 2.2 * k, y], [x + dx + 1.4 * k + lean, y - h * 0.5], [x + dx + lean, y - h], [x + dx - 1.6 * k, y - h * 0.4]], c);
  return [tongue(-6, 8, -2), tongue(6, 8, 2), tongue(-3, 12, -1), tongue(3, 12, 1), tongue(0, 16, 0), F(T([[x - 1.6, y], [x + 1.6, y], [x, y - 10]], '#fff3b0'))];
}

function hatBack(t, p) {
  if (t < 2) return [];
  const out = [E(15.5, 13.6, 12.6, 11.4, p.dark), T([[4.8, 14], [26.2, 14], [25.6, 24], [15.5, 24.8], [5.4, 24]], stage(t) >= 3 ? p.deep : CHAIN)];
  if (t === 17) for (let i = 0; i < 9; i++) {
    // The sun crown's rays fan out behind the head.
    const a = Math.PI * (1.05 + (i * 0.9) / 8);
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.unshift(T([[15.5 + c * 8 - s * 1.6, 8 + s * 8 + c * 1.6], [15.5 + c * 21, 8 + s * 21], [15.5 + c * 8 + s * 1.6, 8 + s * 8 - c * 1.6]], i % 2 ? p.trim : p.light));
  }
  if (t === 19) out.unshift(E(15.5, -12, 8, 2.6, p.trim), E(15.5, -12, 6, 1.4, 'none'));
  return out;
}

// ---------- Torso ----------

// The chest emblem for a tier, centered at (x, y).
function emblem(t, p, x, y) {
  const glow = glowOf(p);
  switch (t) {
    case 0: case 1: return [];
    case 2: case 3: return [F(E(x, y, 1.4, 1.4, p.trim))];
    case 4: return [T([[x - 2, y - 2], [x + 2, y - 2], [x + 2, y], [x, y + 2.4], [x - 2, y]], p.trim), F(T([[x - 1, y - 1.2], [x + 1, y - 1.2], [x, y + 1]], p.accent))];
    case 5: return [T([[x - 2.6, y - 0.4], [x, y - 2.4], [x + 2.6, y - 0.4], [x + 2.6, y + 1.2], [x, y - 0.6], [x - 2.6, y + 1.2]], p.trim)];
    case 6: return [R(x - 0.9, y - 2.6, 1.8, 5.6, p.accent), R(x - 2.6, y - 1.4, 5.2, 1.6, p.accent)];
    case 7: case 8: return [E(x, y, 2.2, 2.2, p.trim), ...gem(x, y, 1.2, p.accent)];
    case 9: return [T([[x, y - 3], [x + 1, y - 1], [x + 3, y], [x + 1, y + 1], [x, y + 3], [x - 1, y + 1], [x - 3, y], [x - 1, y - 1]], p.trim), ...gem(x, y, 1, p.accent)];
    case 10: return [T([[x - 2.4, y - 1.6], [x + 2.4, y - 1.6], [x, y + 2.4]], p.trim), ...gem(x, y - 0.4, 1.1, glow)];
    case 11: return [T([[x, y - 3], [x + 1.6, y], [x, y + 3], [x - 1.6, y]], glow), F(E(x, y, 0.6, 1.2, WHITE))];
    case 12: return [T([[x, y - 3.2], [x + 2, y], [x, y + 3], [x - 2, y]], p.light), F(T([[x, y - 2.2], [x + 0.9, y], [x, y + 2]], glow))];
    case 13: case 14: return [E(x, y, 2.6, 2.4, p.trim), ...gem(x, y, 1.4, glow)];
    case 15: return [...flames(x, y + 2.4, 0.5, glow)];
    case 16: return [E(x, y - 0.4, 2.4, 2.2, BONE), F(E(x - 0.9, y - 0.4, 0.7, 0.8, glow)), F(E(x + 0.9, y - 0.4, 0.7, 0.8, glow)), R(x - 1.2, y + 1.4, 2.4, 1.2, BONE)];
    case 17: return [T([[x, y - 3.4], [x + 1, y - 1], [x + 3.4, y], [x + 1, y + 1], [x, y + 3.4], [x - 1, y + 1], [x - 3.4, y], [x - 1, y - 1]], p.trim), ...gem(x, y, 1.2, glow)];
    case 18: return [zig([[x + 1.2, y - 3], [x - 1, y], [x + 1, y], [x - 1.2, y + 3]], 1, glow)];
    default: return [...both([T([[x - 0.4, y], [x - 4, y - 2.6], [x - 3.4, y + 0.6], [x - 0.4, y + 1.4]], WHITE)]), ...gem(x, y, 1.2, glow)];
  }
}

function top(t, p) {
  const torso = torsoPts();
  const st = stage(t);
  if (st === 0) {
    // Padded leather (or mail under a leather vest for the militia), quilted, belted.
    const body = t ? CHAIN : p.main;
    return [T(torso, body), t ? T([[9.6, 27], [13.4, 26.4], [14, 34], [9.6, 34]], LEATHER) : null, t ? T([[21.6, 27], [17.8, 26.4], [17.2, 34], [21.6, 34]], LEATHER) : null,
      T([[MID - 2.6, 26.2], [MID + 2.6, 26.2], [MID, 29.6]], LINEN), ...(t ? [] : [F(R(12, 29, 0.7, 4.6, p.dark)), F(R(18.6, 29, 0.7, 4.6, p.dark)), F(R(MID - 0.3, 30, 0.7, 3.8, p.dark))]),
      band(torso, 33.6, 35.6, LEATHER_D), F(R(MID - 1.2, 33.8, 2.4, 1.6, p.trim))];
  }
  const out = [T(torso, st === 2 && t === 6 ? p.dark : p.main)];
  // A gorget at the neck, shoulder edge highlights, and a belt.
  const gorget = T([[11, 25.4], [20.2, 25.4], [21.4, 27.4], [15.6, 29.2], [9.8, 27.4]], st >= 3 ? p.dark : p.light);
  if (st === 1) {
    out.push(F(R(MID - 0.6, 27.6, 1.2, 5.6, p.light)), band(torso, 31.6, 32.8, p.dark));
    if (t === 3) out.push(F(E(11.6, 29.4, 0.6, 0.6, p.trim)), F(E(19.6, 29.4, 0.6, 0.6, p.trim)));
  } else if (st === 2) {
    // Knight plate; the Vanguard and Crusader wear a tabard over it.
    if (t === 4) out.push(T([[MID - 4, 27.6], [MID + 4, 27.6], [MID + 3.4, 32.2], [MID, 33.4], [MID - 3.4, 32.2]], p.light));
    else out.push(T([[MID - 3.6, 27], [MID + 3.6, 27], [MID + 3.6, 36], [MID - 3.6, 36]], t === 6 ? p.main : p.second), R(MID - 3.6, 27, 7.2, 1, p.trim));
  } else if (st === 3) {
    out.push(band(torso, 30.6, 31.8, p.dark), band(torso, 32.4, 33.4, p.dark), T([[MID - 4.4, 27.4], [MID + 4.4, 27.4], [MID + 3.6, 30.6], [MID - 3.6, 30.6]], p.light));
    if (t >= 8) out.push(...[11, 20.2].map((x) => F(E(x, 29.4, 0.7, 0.7, p.trim))));
  } else if (st === 4) {
    if (t === 10) out.push(...[[11.6, 29.4], [14.4, 29.4], [17.2, 29.4], [20, 29.4], [13, 31.6], [15.8, 31.6], [18.6, 31.6], [11.6, 33.4], [19.8, 33.4]].flatMap(([x, y]) => scales(p.dark, [[x, y]])));
    if (t === 11) out.push(T([[9.8, 27], [MID - 1, 28.6], [MID, 33], [10, 31]], p.dark), T([[21.4, 27], [MID + 1, 28.6], [MID, 33], [21.2, 31]], p.dark), zig([[11, 32.4], [12.6, 30.6], [11.8, 29.2]], 0.8, glowOf(p)), zig([[19.6, 32.4], [18.6, 30.6], [19.8, 29.2]], 0.8, glowOf(p)));
    if (t === 12) out.push(T([[9.8, 27.4], [MID, 27.6], [12, 33]], p.dark), T([[21.4, 27.4], [MID, 27.6], [19.2, 33]], p.deep), F(T([[MID, 27.6], [12, 33], [MID, 34]], p.light)), zig([[MID, 28], [MID - 0.4, 33.6]], 0.6, glowOf(p)));
  } else if (st === 5) {
    out.push(T([[MID - 5, 27], [MID + 5, 27], [MID + 4.4, 31], [MID, 32.6], [MID - 4.4, 31]], p.light), band(torso, 32.4, 33.6, p.dark));
    if (t === 15) out.push(zig([[10.6, 28], [12, 30.4], [10.8, 32.6]], 0.8, glowOf(p)), zig([[20.6, 28], [19.4, 30.4], [20.6, 32.6]], 0.8, glowOf(p)), zig([[13.4, 32.8], [15.6, 33.6], [17.8, 32.8]], 0.7, glowOf(p)));
    if (t === 16) out.push(...both([spike(10.6, 27.6, 1.8, 3, BONE, -1)]));
  } else {
    // Divine plate: a bright breastplate with a gilded rim.
    out.push(T([[MID - 5.2, 27], [MID + 5.2, 27], [MID + 4.4, 31.4], [MID, 33], [MID - 4.4, 31.4]], t === 18 ? p.dark : p.light), F(T([[MID - 5.2, 27], [MID + 5.2, 27], [MID + 5, 27.9], [MID - 5, 27.9]], p.trim)), band(torso, 32.4, 33.4, p.trim));
  }
  out.push(gorget, F(T([[11.4, 25.8], [19.8, 25.8], [20.4, 26.8], [10.8, 26.8]], st >= 4 ? p.trim : p.dark)));
  out.push(band(torso, 33.8, 35.8, st >= 4 ? p.deep : st >= 2 ? p.dark : LEATHER_D));
  out.push(...(st >= 2 ? gem(MID, 34.8, 1.2, st >= 4 ? glowOf(p) : p.trim) : [F(R(MID - 1.2, 34, 2.4, 1.6, p.trim))]));
  out.push(...emblem(t, p, MID, 30));
  return out;
}

const sleeve = (t, p) => (t === 1 ? CHAIN : p.dark);
const longSleeves = () => true;

// ---------- Pauldrons ----------

// A flared pauldron over the shoulder joint, drawn with +x pointing out from the body (`s`
// mirrors it to the arm's side): lames stacked under a domed cap whose rim is trimmed, spikes and
// crests rising from it. It reaches far out so it shows past the big chibi head.
function shoulder(t, p, s) {
  const st = stage(t);
  const glow = glowOf(p);
  const k = [0.62, 0.78, 0.92, 1.05, 1.1, 1.2, 1.25][st];
  const P = (list, c) => T(list.map(([x, y]) => [x * k * s, y * k]), c);
  const top = (x) => (x < 5 ? -3 : -3 + (x - 5) * 0.55);
  const sp = (x, h, lean, c = p.trim, w = 2.4) => P([[x - w / 2, top(x) + 0.6], [x + w / 2, top(x + w / 2) + 0.6], [x + lean + h * 0.9, top(x) - h * 0.5]], c);
  const cap = [[-2.4, -1.8], [1, -3.2], [5, -3], [8.4, -1.2], [10, 1.6], [9.6, 3.4], [6, 2.6], [2, 2.4], [-2.4, 2]];
  const lames = [1, 1, 2, 2, 3, 3, 3][st];
  const out = [];
  for (let i = lames; i >= 1; i--) {
    const d = i * 2;
    out.push(P([[-2, 1 + d], [4, 1.4 + d], [9.4 + i * 0.3, 2.4 + d], [9.6 + i * 0.3, 4.2 + d], [5, 3.8 + d], [-2, 3.4 + d]], st === 0 ? LEATHER_D : i % 2 ? p.dark : p.main));
  }
  // Spikes and crests behind the cap.
  if (t === 7) out.push(sp(5.4, 4.4, 2));
  if (t === 8) out.push(sp(3.6, 4, 0.6), sp(6.6, 5, 2.6));
  if (t === 9) out.push(sp(2, 4, -0.4), sp(4.8, 6, 1), sp(7.6, 4.6, 3));
  if (t === 10) out.push(P([[1, -2.6], [5.6, -2.8], [11, -9], [4.6, -6]], p.light), P([[5.6, -2.4], [8.6, -1], [12.4, -5]], p.dark));
  if (t === 11) out.push(sp(2.4, 6, -1, p.dark), sp(5.2, 8, 1.4, p.dark), sp(8, 5, 3.4, p.dark));
  if (t === 12) out.push(P([[1.4, -2.6], [4, -11], [6, -2.6]], p.main), P([[5.6, -2.4], [10, -7.6], [9.4, -0.6]], p.dark), F(P([[3.2, -3], [4, -10], [4.6, -3]], glow)));
  if (t === 13) out.push(sp(2.6, 5, 0.6, p.light), sp(5.4, 6.4, 1.4, p.light), sp(8.2, 4.6, 3, p.light));
  if (t === 14) out.push(P([[1, -2.6], [9, -8], [7.4, -4], [12, -6], [9.4, 0]], p.light));
  if (t === 15) out.push(sp(2, 5, -0.6, glow, 3), sp(5, 7.4, 0.6, glow, 3), sp(8, 5, 2.6, glow, 3));
  if (t === 16) out.push(P([[2, -2.8], [5, -8], [10.4, -9.6], [7, -6.4], [8, -1.6]], BONE), sp(2, 4, -1.4, p.deep));
  if (t === 17) out.push(sp(2.6, 6, -1.4, p.light, 1.8), sp(5.2, 9, 0.4, p.trim, 1.8), sp(8, 6, 2.6, p.light, 1.8));
  if (t === 18) out.push(zig([[3 * k * s, -2.4 * k], [5 * k * s, -6 * k], [3.6 * k * s, -6.4 * k], [6.4 * k * s, -11 * k]], 1.4, glow));
  if (t === 19) out.push(P([[1, -2.6], [3.4, -7], [7.8, -12], [8, -7], [11, -7.4], [9.6, -1.2]], WHITE), F(P([[4, -4], [7.4, -10], [7.2, -5.4]], mix(p.trim, WHITE, 0.4))));
  // The trimmed rim, then the cap with a highlight.
  out.push(P(cap.map(([x, y]) => [x, y + 1]), st === 0 ? LEATHER_D : st >= 2 ? p.trim : p.deep), P(cap, st === 0 ? (t ? LEATHER : p.main) : p.main), F(P([[0, -2.4], [5, -2.4], [8, -0.8], [5, -1.2], [0, -1.2]], st === 0 ? shade(LEATHER, 14) : p.light)));
  if (t === 1) out.push(F(E(5 * k * s, 0.4 * k, 0.7, 0.7, p.trim)));
  if (st >= 2) out.push(...emblemOnShoulder(t, p, 4.6 * k * s, 0.4 * k));
  return out;
}

function emblemOnShoulder(t, p, x, y) {
  if (t === 6) return [F(R(x - 0.7, y - 2, 1.4, 4, p.accent)), F(R(x - 2, y - 0.9, 4, 1.4, p.accent))];
  if (t < 9) return [F(E(x, y, 0.8, 0.8, p.trim))];
  return gem(x, y, 1.1, glowOf(p));
}

// ---------- Legs and tassets ----------

function legs(t, p) {
  const st = stage(t);
  if (st === 0) return t ? { top: CHAIN, low: LEATHER, pad: p.main } : { top: LEATHER_D, low: p.dark, pad: null };
  return { top: st >= 3 ? p.dark : CHAIN, low: p.main, pad: st >= 4 ? p.trim : p.light };
}

// Tassets: plates hung from the belt over each hip, with a cloth flap (tabard, war skirt) swinging
// between them.
function skirt(t, p, m) {
  const st = stage(t);
  const sw = (m?.sway ?? 0) * 0.5;
  if (t === 0) return [9.2, 11.7, 14.2, 16.7, 19.2].map((x, i) => T([[x, 34.4], [x + 2.6, 34.4], [x + 2.5 + sw, 40.6], [x - 0.1 + sw, 40.6]], i % 2 ? LEATHER_D : p.main));
  const out = [T([[9.4, 34.4], [21.6, 34.4], [22.6, 41.6], [8.4, 41.6]], CHAIN)];
  if (t === 1) return [...out, T([[12.4, 34.4], [18.8, 34.4], [19 + sw, 42], [12.2 + sw, 42]], LEATHER), band([[12.4, 34.4], [18.8, 34.4], [19 + sw, 42], [12.2 + sw, 42]], 41, 42, LEATHER_D)];
  // The cloth flap.
  const flapC = st === 2 ? (t === 6 ? p.main : t === 5 ? p.second : null) : st === 3 ? p.second : st >= 4 ? p.deep : null;
  const len = [0, 0, 45, 45.6, 46.4, 47, 48][st];
  if (flapC) {
    const flap = [[12.6, 34.4], [18.6, 34.4], [19.2 + sw, len - 1], [15.6 + sw, len + 0.6], [12 + sw, len - 1]];
    out.push(T(flap, flapC), band(flap, len - 2.4, len - 1.4, st >= 4 ? p.trim : p.dark));
    if (t === 6) out.push(R(14.8 + sw * 0.5, 37.4, 1.6, 5, p.accent), R(13.4 + sw * 0.5, 38.6, 4.4, 1.4, p.accent));
    if (st >= 4) out.push(...emblem(t, p, 15.6 + sw * 0.6, 40.4));
  }
  // Tasset lames on each hip, longer and more layered with the stage.
  const rows = [0, 1, 2, 2, 3, 3, 3][st];
  const plate = [];
  for (let i = rows - 1; i >= 0; i--) {
    const y = 34.4 + i * 2.2;
    plate.push(T([[8.6 - i * 0.4, y], [13.6, y], [13.4, y + 3.4], [8 - i * 0.6, y + 3.8]], i % 2 ? p.dark : p.main));
  }
  plate.push(F(T([[8.4 - (rows - 1) * 0.6, 34.4 + (rows - 1) * 2.2 + 3.2], [13.4, 34.4 + (rows - 1) * 2.2 + 2.8], [13.4, 34.4 + (rows - 1) * 2.2 + 3.4], [8 - (rows - 1) * 0.6, 34.4 + (rows - 1) * 2.2 + 3.8]], p.trim)));
  if (st >= 3) plate.push(T([[8.6, 35.6], [5.4, 36.2], [8.4, 37.8]], st >= 5 ? p.trim : p.light));
  out.push(...both(plate));
  return out;
}

// ---------- Sabatons ----------

function shoe(t, p, k) {
  const st = stage(t);
  const c = (col) => k.tint(col);
  if (t === 0) return [k.shaft(3.8, c(LEATHER_D)), k.sole(c(LEATHER_D)), k.poly([[-1.9, -4.6], [1.9, -4.6], [2.1, -3.2], [-2.1, -3.2]], c(LEATHER))];
  if (t === 1) return [k.shaft(4, c(LEATHER)), k.sole(c(LEATHER)), k.poly([[-0.6, -0.6], [2.4, -0.6], [3, 1.6], [-0.4, 1.6]], c(p.main)), k.poly([[-1.9, -4.8], [1.9, -4.8], [2.1, -3.4], [-2.1, -3.4]], c(LEATHER_D))];
  const h = st >= 3 ? 5.8 : 4.6;
  const out = [k.shaft(h, c(p.main), 3.2), k.sole(c(p.main)),
    k.poly([[-2.7, 0.4], [2.8, 0.4], [3, 1.6], [-3, 1.6]], c(p.dark)),
    k.poly([[-2.8, 2.2], [2.9, 2.2], [2.6, 3], [-2.6, 3]], c(p.deep)),
    k.poly([[-2, -1.6], [2, -1.6], [2, -0.4], [-2, -0.4]], c(st >= 2 ? p.trim : p.light))];
  // A flared cuff at the top of the greave.
  if (st >= 2) out.push(k.poly([[-2, -h], [2, -h], [2.8, -h - 1.4], [-2.8, -h - 1.4]], c(st >= 4 ? p.trim : p.light)));
  if (st >= 3) out.push(k.poly([[-2.4, -h + 1.6], [-4.4, -h - 1], [-2, -h + 0.2]], c(st === 3 ? p.light : p.trim)), k.poly([[2.4, -h + 1.6], [4.4, -h - 1], [2, -h + 0.2]], c(st === 3 ? p.light : p.trim)));
  if (st >= 4) out.push(k.dot(0, -1, 0.7, c(glowOf(p))));
  if (t === 19) out.push(k.poly([[-2, -2], [-5.4, -4.6], [-4.6, -2], [-5.6, -0.6], [-2, 0]], c(WHITE)), k.poly([[2, -2], [5.4, -4.6], [4.6, -2], [5.6, -0.6], [2, 0]], c(WHITE)));
  return out;
}

// ---------- Gauntlets ----------

function hand(t, p, hx, hy, ex, ey) {
  const st = stage(t);
  const len = Math.hypot(ex - hx, ey - hy) || 1;
  const ux = (ex - hx) / len;
  const uy = (ey - hy) / len;
  const at = (d) => [hx + ux * d, hy + uy * d];
  const cuffLen = [1.8, 2.4, 2.8, 3.2, 3.4, 3.6, 3.6][st];
  const [ax, ay] = at(1.2);
  const [bx, by] = at(1.2 + cuffLen);
  if (st === 0) return [limb(ax, ay, bx, by, 3.6, 4, t ? LEATHER_D : p.dark), E(hx, hy, 2.1, 2.1, t ? LEATHER : p.main)];
  const out = [limb(ax, ay, bx, by, 4.2, 5.2 + st * 0.3, p.main), limb(...at(0.6 + cuffLen), bx, by, 5.4 + st * 0.3, 5.6 + st * 0.3, st >= 2 ? p.trim : p.dark)];
  // Spikes off the cuff's outer side.
  if (st >= 3) {
    const [mx, my] = at(1.2 + cuffLen * 0.55);
    const nx = -uy;
    const ny = ux;
    const so = nx < 0 ? 1 : -1;
    out.push(T([[mx + ux, my + uy], [mx - ux, my - uy], [mx + nx * so * (3 + st * 0.3) + ux * 1.4, my + ny * so * (3 + st * 0.3) + uy * 1.4]], st >= 5 ? p.trim : p.light));
  }
  out.push(E(hx, hy, 2.7, 2.5, p.main), F(E(hx - 0.6, hy - 0.7, 1.2, 0.8, p.light)));
  if (st >= 4) out.push(F(E(...at(1.6 + cuffLen * 0.5), 0.9, 0.9, glowOf(p))));
  return out;
}

// ---------- Capes and banners ----------

// The hem's shape, sampled right to left; each style returns a y offset for sample i of n.
const HEMS = {
  flat: (i, n) => 1.2 * Math.sin((Math.PI * i) / n),
  notch: (i, n) => -6 * (1 - Math.abs((2 * i) / n - 1)),
  tatter: (i) => [0, -2.6, -0.4, -3.4, 0.6, -2, -0.2, -3, 0.4, -2.4, 0][i] ?? 0,
  scale: (i) => (i % 2 ? -1.6 : 0.6),
  flame: (i) => [0, -4, 0.6, -5.6, 1, -4.4, 1.2, -5.8, 0.6, -4, 0][i] ?? 0,
  shard: (i) => [0, -5, 1.4, -2, 2, -6, 1.6, -3, 1, -5, 0][i] ?? 0,
};

// A cape hanging from the shoulders, its hem in a given style, swaying with `s`.
function capeOf(bottom, wide, style, s, c, trim, th = 1.4) {
  const n = 10;
  const h = s / 2;
  const right = 27 + wide + s;
  const left = 4 - wide + s;
  const hem = [];
  for (let i = 0; i <= n; i++) hem.push([right - ((right - left) * i) / n, bottom + HEMS[style](i, n)]);
  const body = T([[8.4, 25.6], [22.6, 25.6], [25.6 + wide * 0.5 + h, 36], ...hem, [5.4 - wide * 0.5 + h, 36]], c);
  return trim ? [body, T([...hem, ...hem.slice().reverse().map(([x, y]) => [x, y - th])], trim)] : [body];
}

function capeWings(c, up, tip) {
  const wing = [T([[11, 28 + up], [3, 18 + up], [-7, 11 + up], [-12, 13 + up], [-10, 19 + up], [-14, 24 + up], [-9, 29 + up], [-12, 34 + up], [-5, 38 + up], [-6, 42 + up], [3, 41 + up], [10, 35 + up]], c),
    F(T([[1, 20 + up], [-9, 15 + up], [-6, 21 + up]], tip)), F(T([[0, 27 + up], [-10, 25 + up], [-6, 30 + up]], tip)), F(T([[1, 34 + up], [-8, 35 + up], [-2, 38 + up]], tip))];
  return both(wing);
}

function cape(t, p, m) {
  const s = m?.sway ?? 0;
  const st = stage(t);
  const glow = glowOf(p);
  switch (st) {
    case 0: return capeOf(t ? 46 : 44, 0, 'flat', s, p.dark, p.deep);
    case 1: return capeOf(48, 0.6, 'flat', s, p.dark, p.trim, 1.2);
    // Knightly banner capes, swallow-tailed.
    case 2: return capeOf(50 + (t - 4), 1 + (t - 4) * 0.4, 'notch', s, p.dark, p.trim, 1.2 + (t - 4) * 0.4);
    // Battle-torn war cloaks.
    case 3: return capeOf(50 + (t - 7), 1.6 + (t - 7) * 0.4, 'tatter', s, p.dark, t === 9 ? p.trim : p.deep);
    case 4: return capeOf(52, 2, ['scale', 'tatter', 'shard'][t - 10], s, p.dark, t === 11 ? glow : p.trim);
    case 5: {
      // A long cape under a shorter over-cape.
      const style = ['flat', 'notch', 'flame', 'tatter'][t - 13];
      const under = capeOf(53, 2.6, style, s, p.deep, t === 15 ? glow : p.trim, 1.6);
      const over = capeOf(44, 1.6, t === 15 ? 'flame' : 'flat', s * 0.7, p.dark, t === 15 ? glow : p.trim, 1.2);
      return [...under, ...over];
    }
    default: {
      if (t === 19) return [...capeWings(WHITE, m?.flap ? -2 : 1, mix(p.trim, WHITE, 0.4)), ...capeOf(52, 2.4, 'flat', s, p.dark, p.trim, 2)];
      const under = capeOf(54, 3, t === 18 ? 'tatter' : 'flat', s, p.deep, p.trim, 2);
      const over = capeOf(45, 2, 'notch', s * 0.7, p.dark, p.trim, 1.2);
      const bolts = t === 18 ? [zig([[5 + s, 40], [7 + s, 44], [5 + s, 45], [7.6 + s, 50]], 1, glow), zig([[26 + s, 40], [24 + s, 44], [26 + s, 45], [23.4 + s, 50]], 1, glow)] : [];
      return [...under, ...bolts, ...over];
    }
  }
}

// Over the top: ties or clasps, fur mantles for the warlords, chains and jeweled clasps above.
function capeFront(t, p) {
  const st = stage(t);
  const clasp = (r, c) => [...gem(11, 27, r, c), ...gem(20.2, 27, r, c)];
  if (st <= 1) return [T([[9.8, 25.8], [12.6, 25.8], [13.4, 29], [10.8, 28.6]], p.main), T([[21.4, 25.8], [18.6, 25.8], [17.8, 29], [20.4, 28.6]], p.main), F(E(MID, 28.4, 1, 1, p.trim))];
  if (st === 2) return [F(R(11, 27.6, 9.2, 0.7, p.trim)), ...clasp(1.2, p.trim)];
  if (st === 3) {
    // A fur mantle across the shoulders.
    const fur = [[9, 25.2], [22.2, 25.2], [22.6, 27.4], [21, 28.6], [19.6, 27.8], [18, 29], [15.6, 28.2], [13.2, 29], [11.6, 27.8], [10.2, 28.6], [8.6, 27.4]];
    return [T(fur, t === 9 ? mix(FUR, p.trim, 0.3) : FUR), ...clasp(1.1, p.trim)];
  }
  return [T([[9.2, 25.2], [22, 25.2], [21.4, 27.6], [15.6, 28.4], [9.8, 27.6]], st >= 5 ? p.deep : p.dark), F(R(11, 27.2, 9.2, 0.8, p.trim)), ...clasp(1.3, glowOf(p))];
}

export default { hat, hatBack, hatTucks: (t) => t >= 2, hatHidesBangs: () => false, top, sleeve, longSleeves, shoulder, legs, skirt, shoe, hand, cape, capeFront };
