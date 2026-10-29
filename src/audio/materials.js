// What each monster is made of, for the sound of a blow landing on it (sfx.js): stone cracks,
// crystal rings, bone and armour clank, wood knocks, slime squelches, a spirit whooshes. Anything
// not listed is flesh and fur, which the blow's own punch already covers.
export const MATERIAL = {
  pebblet: 'matStone', mossgolem: 'matStone', rockgolem: 'matStone', tuskar: 'matStone',
  crystalslime: 'matCrystal', crystalking: 'matCrystal', starspirit: 'matCrystal',
  boneknight: 'matArmor', scorpip: 'matArmor', thornback: 'matArmor',
  sproutling: 'matWood', leafling: 'matWood', rootling: 'matWood', sapling: 'matWood', gnarlroot: 'matWood',
  puffle: 'matSlime', mushkin: 'matSlime', sporecap: 'matSlime', sporeling: 'matSlime', mothercapper: 'matSlime', snailbun: 'matSlime',
  wisp: 'matSpirit', shade: 'matSpirit', cloudsheep: 'matSpirit',
};
