// What each monster is made of, for the sound of a blow landing on it (sfx.js): stone cracks,
// crystal rings, bone and armour clank, wood knocks, slime squelches, a spirit whooshes. Anything
// not listed is flesh and fur, which the blow's own punch already covers.
export const MATERIAL = {
  gloombat: 'matStone', mossgolem: 'matStone', rockgolem: 'matStone', thornback: 'matStone',
  crystalslime: 'matCrystal', starspirit: 'matCrystal',
  boneknight: 'matArmor', scorpip: 'matArmor', rootling: 'matArmor',
  sproutling: 'matWood', leafling: 'matWood', sapling: 'matWood', gnarlroot: 'matWood', pumpgob: 'matWood',
  puffle: 'matSlime', snailbun: 'matSlime',
  shade: 'matSpirit', cloudsheep: 'matSpirit',
};
