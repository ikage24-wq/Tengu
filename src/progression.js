// Pure progression logic: EXP curve, level-ups, and stat growth.
// No DOM or canvas access, so it can be unit-tested directly.

export const MAX_LEVEL = 200;

// EXP needed to go from `level` to `level + 1`.
// Grows steadily so early levels are quick and late levels are a grind.
export function expToNext(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(15 * level * level + 40 * level + 60);
}

export function createCharacter(classDef) {
  return {
    classId: classDef.id,
    level: 1,
    exp: 0,
    hp: classDef.baseStats.maxHp,
    maxHp: classDef.baseStats.maxHp,
    mp: classDef.baseStats.maxMp,
    maxMp: classDef.baseStats.maxMp,
    atk: classDef.baseStats.atk,
    statPoints: 0,
    skillPoints: 0,
    gold: 0,
  };
}

// Adds EXP and applies any level-ups. Returns how many levels were gained.
export function gainExp(character, amount, classDef) {
  let levelsGained = 0;
  character.exp += amount;
  while (character.level < MAX_LEVEL && character.exp >= expToNext(character.level)) {
    character.exp -= expToNext(character.level);
    character.level += 1;
    levelsGained += 1;
    character.statPoints += 5;
    character.skillPoints += 1;
    character.maxHp += classDef.growth.hp;
    character.maxMp += classDef.growth.mp;
    character.hp = character.maxHp;
    character.mp = character.maxMp;
    character.atk += classDef.growth.atk;
  }
  return levelsGained;
}

export function gainGold(character, amount) {
  character.gold += amount;
}
