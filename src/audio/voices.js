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
  Critter: ['puffle', 'mosstort', 'redpanda', 'strawhog', 'snailbun', 'harvmouse', 'lambkin', 'pebblet', 'scorpip', 'cloudsheep', 'nekomata', 'pearldiver', 'starcarto', 'cottoncandy', 'stagehand'],
  Beast: ['boarlet', 'thornback', 'lupina', 'teddystrong', 'tuskar', 'leonie', 'gummybear', 'paperdragon', 'tanukipicker', 'kettletanuki', 'lantertanuki', 'grandkettle'],
  Bird: ['mossowlet', 'windbird', 'gloombat', 'chorusgirl', 'prompter'],
  Buzz: ['bumble', 'queenbee', 'sporeling', 'mothlibrarian'],
  Sprite: ['petalsprite', 'wisp', 'starspirit', 'sylph', 'lanternghost', 'stardancer', 'cometcourier', 'musicballerina'],
  Goblin: ['brownie', 'macgoblin', 'pumpgob', 'rootling', 'sporecap', 'jellyninja', 'jackbox', 'teahatter'],
  Plant: ['sproutling', 'leafling', 'mossgolem', 'sapling', 'mothercapper', 'gnarlroot', 'topiarydryad', 'sylvana'],
  Stone: ['boneknight', 'crystalslime', 'rockgolem', 'armourknight', 'waltzrondo', 'waltzminuet', 'tindrummer', 'gearheart', 'meteorgolem', 'chocoknight', 'crystalking', 'gretel'],
  Ghost: ['shade', 'porcelaindoll', 'ghostmaid', 'candlebride', 'marionette', 'geminighosts', 'understudy', 'yukionna', 'marionetta', 'persona', 'playwright', 'folio'],
  Sea: ['jellymaid', 'anglerlamp', 'octoscholar', 'moraymurri', 'morayena', 'seahorseknight', 'barnacleknight', 'matriarch', 'primadonna', 'whaledream'],
  People: ['kitsunemiko', 'lamia', 'velvet', 'marigold', 'abyssia', 'coralie', 'nebulawitch', 'lollipopwitch', 'peppermint', 'balloonseller', 'eclipsesol', 'eclipseluna', 'astraea', 'toffee', 'bonbon', 'directrice', 'kiterider', 'shepherdess', 'gunner', 'harpist', 'monk', 'gale', 'tamamo', 'lilith', 'selene'],
};
const OF = new Map();
for (const [family, ids] of Object.entries(FAMILIES)) for (const id of ids) OF.set(id, family);
export const VOICE_FAMILIES = Object.keys(FAMILIES);
// A monster's voice family (a new monster not listed yet sounds like a little critter).
export const voiceOf = (mobId) => OF.get(mobId) ?? 'Critter';
// Every listed monster, for the tests.
export const VOICED = [...OF.keys()];
