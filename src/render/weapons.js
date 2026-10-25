// Weapon art: how each weapon type is drawn in the hero's hand and as a 16x16 bag icon. The old
// weapon lines were retired; new designs plug in here by type. A design provides
//   shapes(tier, frame) -> { w, h, grip: [x, y], blade: [top, base], shapes }   (in-hand sprite)
//   frames(tier)        -> animation frame count (1 = still)
//   icon(tier)          -> shapes for the 16x16 icon
// Until a type has a design, nothing is drawn for it.

const DESIGNS = {};

export function weaponShapes(type, tier = 0, frame = 0) {
  return DESIGNS[type]?.shapes(tier, frame) ?? null;
}

export function weaponFrames(type, tier = 0) {
  return DESIGNS[type]?.frames?.(tier) ?? 1;
}

export function weaponIcon(type, tier) {
  return DESIGNS[type]?.icon(tier) ?? null;
}
