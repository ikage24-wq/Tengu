// The monsters' voices (2026-11-08): each monster belongs to a family of voices cut from the
// Sonniss recordings (tools/build-voices.py, assets/audio/rec/mv*), heard when it spots you, now
// and then when it's hit, and when it's beaten (src/audio/sfx.js `mobVoice`, src/audio/listen.js).
//   Critter  small animals: chirps, a kitten's meow, yips
//   Beast    bears, wolves, the big ones: barks and grunts down low, a great roar
//   Bird     birds and bats: a hawk's call, a quick crow, squawks
//   Buzz     bees, mites and moths: a buzz
//   Sprite   sprites and wisps: a quick giggle, a twinkle
//   Goblin   goblins and imps: a cheeky cartoon line, a squeak, a dizzy wobble
//   Plant    trees, saplings, mandrakes: wood creaking, a twig's snap, a trunk cracking
//   Stone    golems, armour, clockwork: a machine creature powering up, a mechanical growl
//   Ghost    ghosts, dolls, spirits: a soft moan, a fluttering wail
//   Sea      sea folk and jellies: a gurgle, a squish, bubbles
//   People   witches, ladies, captains: anime fight voices
const FAMILIES = {
  Critter: ['puffle', 'mosstort', 'redpanda', 'strawhog', 'snailbun', 'harvmouse', 'lambkin', 'scorpip', 'cloudsheep', 'nekomata', 'starcarto', 'cometcourier', 'cottoncandy', 'stagehand', 'sleepysheep', 'chorusgirl', 'prompter', 'paperdragon', 'primadonna', 'sporeling', 'mothercapper', 'pumpkinbutler', 'balloonseller', 'boneknight', 'shade', 'jellyninja', 'lollipopwitch', 'gummybear', 'kiterider', 'shepherdess', 'gunner', 'harpist', 'monk'],
  Beast: ['boarlet', 'rockgolem', 'thornback', 'macgoblin', 'lupina', 'teddystrong', 'jackbox', 'tuskar', 'leonie', 'tanukipicker', 'kettletanuki', 'lantertanuki', 'grandkettle', 'whalestorm', 'noodledragon', 'monday', 'chocoknight'],
  Bird: ['sporecap', 'mossowlet', 'windbird', 'mothlibrarian', 'folio', 'waltzrondo', 'waltzminuet'],
  Buzz: ['bumble', 'queenbee'],
  Sprite: ['petalsprite', 'lanternghost', 'stardancer', 'musicballerina', 'marionette'],
  Goblin: ['porcelaindoll', 'gloombat', 'brownie', 'pumpgob', 'tindrummer', 'gearmole', 'teahatter'],
  Plant: ['sproutling', 'leafling', 'sapling', 'gnarlroot', 'topiarydryad', 'sylvana'],
  Stone: ['crystalslime', 'gearheart', 'alarm', 'gretel'],
  Ghost: ['ghostmaid', 'candlebride', 'geminighosts', 'understudy', 'yukionna', 'marionetta', 'persona', 'playwright'],
  Sea: ['rootling', 'keepsake', 'jellymaid', 'anglerlamp', 'octoscholar', 'moraymurri', 'morayena', 'seahorseknight', 'pearldiver', 'barnacleknight', 'matriarch', 'whaledream', 'starspirit'],
  People: ['pebblet', 'wisp', 'meteorgolem', 'crystalking', 'nightking', 'kitsunemiko', 'lamia', 'velvet', 'marigold', 'puddlekid', 'blossomfairy', 'abyssia', 'coralie', 'nebulawitch', 'peppermint', 'eclipsesol', 'eclipseluna', 'astraea', 'toffee', 'bonbon', 'directrice', 'gale', 'tamamo', 'lilith', 'selene', 'mugboss'],
};
const OF = new Map();
for (const [family, ids] of Object.entries(FAMILIES)) for (const id of ids) OF.set(id, family);
export const VOICE_FAMILIES = Object.keys(FAMILIES);
// A monster's voice family (a new monster not listed yet sounds like a little critter).
export const voiceOf = (mobId) => OF.get(mobId) ?? 'Critter';
// Every listed monster, for the tests.
export const VOICED = [...OF.keys()];
