// Monster art: the Dream Theatre's company (the levels 40-45 group dungeon, see
// docs/design/dream-theatre.md), each on its own copy of a blank base in its own folder (2026-11-27):
//   The Grand Lobby: understudy (the Masquerade Diva, diva/: a little ghost in the leading lady's
//   borrowed gown, on the spirit base); chorusgirl (the Ticket Lop, ticketlop/: the lobby's usher bunny with
//   a ticket in its cap); stagehand (the Curtain Octopus, curtain/: the stagehand in a curtain hood).
//   The train and the office, the Queen's old life: paperdragon (the Commuter Pigeon, pigeon/: off to
//   work, its ticket in its beak), sleepysheep (the Snooze Snail, snoozesnail/), primadonna (the Paperclip
//   Fiddler, fiddler/: a crab with a stapler), prompter (the Sticky-Note Sprout, sprout/: paper planes).

import { DIVA_ART, DIVA_SIZE } from '../diva/index.js';
import { TICKET_LOP_ART, TICKET_LOP_SIZE } from '../ticketlop/index.js';
import { CURTAIN_OCTOPUS_ART, CURTAIN_OCTOPUS_SIZE } from '../curtain/index.js';
import { PAPERCLIP_FIDDLER_ART, PAPERCLIP_FIDDLER_SIZE } from '../fiddler/index.js';
import { COMMUTER_PIGEON_ART, COMMUTER_PIGEON_SIZE } from '../pigeon/index.js';
import { SNOOZE_SNAIL_ART, SNOOZE_SNAIL_SIZE } from '../snoozesnail/index.js';
import { STICKY_SPROUT_ART, STICKY_SPROUT_SIZE } from '../sprout/index.js';

export const ART = {
  understudy: DIVA_ART,
  chorusgirl: TICKET_LOP_ART,
  stagehand: CURTAIN_OCTOPUS_ART,
  paperdragon: COMMUTER_PIGEON_ART,
  sleepysheep: SNOOZE_SNAIL_ART,
  prompter: STICKY_SPROUT_ART,
  primadonna: PAPERCLIP_FIDDLER_ART,
};

export const INFO = {
  understudy: { name: 'Masquerade Diva', ...DIVA_SIZE },
  chorusgirl: { name: 'Ticket Lop', w: TICKET_LOP_SIZE.w, h: TICKET_LOP_SIZE.h },
  stagehand: { name: 'Curtain Octopus', w: CURTAIN_OCTOPUS_SIZE.w, h: CURTAIN_OCTOPUS_SIZE.h },
  paperdragon: { name: 'Commuter Pigeon', w: COMMUTER_PIGEON_SIZE.w, h: COMMUTER_PIGEON_SIZE.h },
  sleepysheep: { name: 'Snooze Snail', w: SNOOZE_SNAIL_SIZE.w, h: SNOOZE_SNAIL_SIZE.h },
  prompter: { name: 'Sticky-Note Sprout', w: STICKY_SPROUT_SIZE.w, h: STICKY_SPROUT_SIZE.h },
  primadonna: { name: 'Paperclip Fiddler', w: PAPERCLIP_FIDDLER_SIZE.w, h: PAPERCLIP_FIDDLER_SIZE.h },
};
