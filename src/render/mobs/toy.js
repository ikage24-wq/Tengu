// Monster art: the Clockwork Carnival's toys (docs/design/clockwork-carnival.md), Queen Gearheart's
// wind-up troupe, remade from scratch on 2026-11-26 as six new creatures and characters, each on its
// own copy of a blank base (the older toy rigs retired):
//   musicballerina  Giraffe Ballerina (Clara, the Midway's music-box prima; render/musicballerina/)
//   balloonseller   Koala Balloonist (Mabel, the sleepy balloon seller; render/balloonseller/)
//   tindrummer      Cymbal Monkey (Bingo, the band's cymbal man; render/tindrummer/)
//   jackbox         Boxing Kangaroo (Jacky, and her joey who pops out like a jack-in-the-box;
//                   render/jackbox/)
//   marionette      Harlequin Puppet (Dot, one of Madame Marionette's wooden harlequins, on the kid
//                   base; render/marionette/)
//   teddystrong     Hippo Strongman (Hugo, the strongman with the barbell; render/teddystrong/)

import { GIRAFFE_ART, GIRAFFE_SIZE } from '../musicballerina/index.js';
import { KOALA_ART, KOALA_SIZE } from '../balloonseller/index.js';
import { MONKEY_ART, MONKEY_SIZE } from '../tindrummer/index.js';
import { KANGAROO_ART, KANGAROO_SIZE } from '../jackbox/index.js';
import { PUPPET_ART, PUPPET_SIZE } from '../marionette/index.js';
import { HIPPO_ART, HIPPO_SIZE } from '../teddystrong/index.js';

export const ART = {
  musicballerina: GIRAFFE_ART,
  tindrummer: MONKEY_ART,
  jackbox: KANGAROO_ART,
  marionette: PUPPET_ART,
  teddystrong: HIPPO_ART,
  balloonseller: KOALA_ART,
};
export const INFO = {
  musicballerina: { name: 'Giraffe Ballerina', w: GIRAFFE_SIZE.w, h: GIRAFFE_SIZE.h },
  tindrummer: { name: 'Cymbal Monkey', w: MONKEY_SIZE.w, h: MONKEY_SIZE.h },
  jackbox: { name: 'Boxing Kangaroo', w: KANGAROO_SIZE.w, h: KANGAROO_SIZE.h },
  marionette: { name: 'Harlequin Puppet', w: PUPPET_SIZE.w, h: PUPPET_SIZE.h },
  teddystrong: { name: 'Hippo Strongman', w: HIPPO_SIZE.w, h: HIPPO_SIZE.h },
  balloonseller: { name: 'Koala Balloonist', w: KOALA_SIZE.w, h: KOALA_SIZE.h },
};
