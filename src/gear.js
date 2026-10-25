// Gear: rarity-tiered drops and a risk/reward upgrade system.
// Pure logic. `rng` is injectable so tests can be deterministic.

export const RARITIES = [
  { id: 'common', name: 'Common', weight: 700, statMult: 1.0, color: '#cfcfcf' },
  { id: 'uncommon', name: 'Uncommon', weight: 220, statMult: 1.3, color: '#6fd36f' },
  { id: 'rare', name: 'Rare', weight: 65, statMult: 1.7, color: '#5aa9ff' },
  { id: 'epic', name: 'Epic', weight: 13, statMult: 2.3, color: '#b475ff' },
  { id: 'legendary', name: 'Legendary', weight: 2, statMult: 3.2, color: '#ffb84d' },
];

export const SLOTS = ['weapon', 'hat', 'top', 'gloves', 'shoes'];

export const MAX_UPGRADE = 15;

// Chance to succeed upgrading from `level` to `level + 1`.
// Early upgrades are safe; later ones are risky. Failure costs gold but keeps the item.
export function upgradeChance(level) {
  if (level >= MAX_UPGRADE) return 0;
  return Math.max(0.3, 0.95 - level * 0.05);
}

export function upgradeCost(level, itemLevel) {
  return Math.floor(100 * (level + 1) * (itemLevel + 1));
}

function pickRarity(rng, boost = 0) {
  // `boost` shifts weight toward rarer tiers (e.g. from boss kills).
  const weights = RARITIES.map((r, i) => r.weight * (1 + boost * i));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    roll -= weights[i];
    if (roll < 0) return RARITIES[i];
  }
  return RARITIES[0];
}

// Creates a gear item scaled to `itemLevel`.
export function rollGear(itemLevel, rng = Math.random, boost = 0) {
  const rarity = pickRarity(rng, boost);
  const slot = SLOTS[Math.floor(rng() * SLOTS.length)];
  const base = 2 + itemLevel * 1.5;
  return {
    id: `${slot}-${Math.floor(rng() * 1e9)}`,
    slot,
    itemLevel,
    rarity: rarity.id,
    upgrade: 0,
    atk: Math.round(base * rarity.statMult),
  };
}

// Attempts an upgrade. Returns { ok, cost } and mutates the item on success.
// Failure keeps the item; gold is checked and deducted by the caller.
export function tryUpgrade(item, rng = Math.random) {
  if (item.upgrade >= MAX_UPGRADE) return { ok: false, cost: 0 };
  const cost = upgradeCost(item.upgrade, item.itemLevel);
  const success = rng() < upgradeChance(item.upgrade);
  if (success) {
    item.upgrade += 1;
    item.atk += 1 + Math.floor(item.upgrade / 3);
  }
  return { ok: success, cost };
}
