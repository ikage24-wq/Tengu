// Monster art: the Dream Theatre's company (the levels 40-45 group dungeon, see
// docs/design/dream-theatre.md), each on its own copy of a blank base in its own folder (2026-11-27):
//   The Grand Lobby: understudy (the Masquerade Diva, diva/: a little ghost in the leading lady's
//   borrowed gown, on the spirit base); chorusgirl (the Usher Otter, usher/: the lobby's usherette with
//   a brass torch); stagehand (the Backdrop Beaver, beaver/: the scene painter from backstage).
//   The train and the office, the Queen's old life: paperdragon (the Toast-Dash Stoat, stoat/: late for
//   work, toast in its mouth), sleepysheep (the Travel-Pillow Sloth, sloth/), primadonna (the Red-Tape
//   Raccoon, raccoon/: a clerk who stamps DENIED), prompter (the Intern Quokka, quokka/: paper planes).

import { DIVA_ART, DIVA_SIZE } from '../diva/index.js';
import { USHER_OTTER_ART, USHER_OTTER_SIZE } from '../usher/index.js';
import { BACKDROP_BEAVER_ART, BACKDROP_BEAVER_SIZE } from '../beaver/index.js';
import { RED_TAPE_RACCOON_ART, RED_TAPE_RACCOON_SIZE } from '../raccoon/index.js';
import { TOAST_DASH_STOAT_ART, TOAST_DASH_STOAT_SIZE } from '../stoat/index.js';
import { STRAP_SLOTH_ART, STRAP_SLOTH_SIZE } from '../sloth/index.js';
import { INTERN_QUOKKA_ART, INTERN_QUOKKA_SIZE } from '../quokka/index.js';

export const ART = {
  understudy: DIVA_ART,
  chorusgirl: USHER_OTTER_ART,
  stagehand: BACKDROP_BEAVER_ART,
  paperdragon: TOAST_DASH_STOAT_ART,
  sleepysheep: STRAP_SLOTH_ART,
  prompter: INTERN_QUOKKA_ART,
  primadonna: RED_TAPE_RACCOON_ART,
};

export const INFO = {
  understudy: { name: 'Masquerade Diva', ...DIVA_SIZE },
  chorusgirl: { name: 'Usher Otter', w: USHER_OTTER_SIZE.w, h: USHER_OTTER_SIZE.h },
  stagehand: { name: 'Backdrop Beaver', w: BACKDROP_BEAVER_SIZE.w, h: BACKDROP_BEAVER_SIZE.h },
  paperdragon: { name: 'Toast-Dash Stoat', w: TOAST_DASH_STOAT_SIZE.w, h: TOAST_DASH_STOAT_SIZE.h },
  sleepysheep: { name: 'Travel-Pillow Sloth', w: STRAP_SLOTH_SIZE.w, h: STRAP_SLOTH_SIZE.h },
  prompter: { name: 'Intern Quokka', w: INTERN_QUOKKA_SIZE.w, h: INTERN_QUOKKA_SIZE.h },
  primadonna: { name: 'Red-Tape Raccoon', w: RED_TAPE_RACCOON_SIZE.w, h: RED_TAPE_RACCOON_SIZE.h },
};
