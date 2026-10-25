// Skill casting, cooldowns, AoE hit detection, and damage.
// Pure logic: the game loop supplies positions and mob lists.

export function damageFor(character, skill, gearAtk = 0) {
  const base = character.atk + gearAtk;
  // Small variance keeps hits from feeling identical.
  const variance = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.round(base * skill.damageMult * variance));
}

// Returns the skill's AoE hitbox as a world-space rectangle, anchored to the caster facing.
export function skillHitbox(caster, skill) {
  // Full-map skills reach every mob on the map, wherever it stands.
  if (skill.fullMap) return { x: -1e6, y: -1e6, w: 2e6, h: 2e6 };
  const { w, h } = skill.aoe;
  const x = caster.dir >= 0 ? caster.x + caster.w : caster.x - w;
  return { x, y: caster.y + caster.h / 2 - h / 2, w, h };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Tracks per-skill cooldowns for one character.
export function createCooldowns() {
  return {};
}

export function tickCooldowns(cooldowns, dt) {
  for (const id of Object.keys(cooldowns)) {
    cooldowns[id] = Math.max(0, cooldowns[id] - dt);
    if (cooldowns[id] === 0) delete cooldowns[id];
  }
}

// Checks whether a skill can be cast right now. Returns a reason string or null.
export function castBlocker(character, skill, cooldowns) {
  if (character.level < skill.unlockLevel) return 'locked';
  if (cooldowns[skill.id] > 0) return 'cooldown';
  if (character.mp < skill.mpCost) return 'no-mp';
  return null;
}

// Casts a skill: spends MP, starts cooldown, and returns the mobs it hits.
// `mobs` is an array of live mob objects; damage is applied via `applyDamage`.
export function cast(character, skill, cooldowns, caster, mobs, applyDamage, gearAtk = 0) {
  const blocker = castBlocker(character, skill, cooldowns);
  if (blocker) return { ok: false, reason: blocker, hits: [] };

  character.mp -= skill.mpCost;
  cooldowns[skill.id] = skill.cooldown;

  const box = skillHitbox(caster, skill);
  const hits = [];
  for (const mob of mobs) {
    if (!mob.alive || !rectsOverlap(box, mob)) continue;
    const dmg = damageFor(character, skill, gearAtk);
    const killed = applyDamage(mob, dmg);
    hits.push({ mob, dmg, killed });
  }
  return { ok: true, reason: null, hits, box };
}
