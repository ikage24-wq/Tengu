// Monster art: Rootwood Hollow (the levels 10-15 group dungeon). All of its monsters were remade from
// scratch for Chapter 3 (2026-11-18) as live rigs; this file only lists them. The great tree was woken
// in the night and everything in it is sleepy and grumpy about it.
//   rootling      Root Imp: Plotter the garden crab, a terracotta crab with a tiny garden on its back
//                 (moss, fern, clover, a daisy); digs in backwards and burrows (render/rootimp/, 2026-11-25)
//   sporecap      Myconid Shaman: Jaxby the blue jay, a cool cobalt jay with a swept crest that hoards
//                 acorns and flicks them at you; Feather Flurry (render/shaman/, 2026-11-26)
//   thornback     Bramble Bear: Varro the moss-stone guardian, a chibi stone lion-dog with a mane of
//                 carved curls, a vermilion bib and its carved temple ball; Temple Ball, rides its
//                 ball along the floor (render/thornback/, 2026-11-26)
//   sporeling     Spore Mite: the Puffball Mouse, a fluffy cream mouse with a mushroom sprouting from
//                 its crown and a puffball tail; sneezes spores (sporemiterig.js, 2026-11-24)
//   mothercapper  The Myconid Queen: Hazel Hoardwell the Pantry Hamster, a big golden hamster in a
//                 mint gingham apron who keeps the garden as her pantry; stuffs her cheek pouches,
//                 spits seeds, bowls into you curled in a ball (render/mothercapper/, 2026-11-26)
//   tuskar        Tuskar the Behemoth: the woolly mammoth calf, a puffed-up young gate guard with
//                 snowy wool, a trunk he toots like a bugle and two ivory tusks; charges, crashes
//                 into pillars, belly-flops (render/tuskar/, 2026-11-26)
//   gnarlroot     Gnarlroot: Old Mossbeard, a huge gentle treeherd on the brute base: a canopy of leaves
//                 for hair, knothole eyes glowing amber, a long moss beard; Elder Yomogi in his roots
//                 (render/gnarlroot/, 2026-11-25)
//   sapling       Root Tendril: the Rootling Dryad, a dreamy dryad on the serpent base whose lower body
//                 is a living root along the floor (render/dryad/, 2026-11-24); she's also the
//   leafling      field monster Rootling Dryad: the same rig, with her vine lash, petal gust and root snare

import { SHAMAN } from '../shaman/index.js';
import { ROOTIMP } from '../rootimp/index.js';
import { THORNBACK } from '../thornback/index.js';
import { SPORE_MITE } from './sporemiterig.js';
import { TUSKAR_ART, TUSKAR_SIZE } from '../tuskar/index.js';
import { HAZEL_ART, HAZEL_SIZE } from '../mothercapper/index.js';
import { DRYAD_ART, DRYAD_SIZE } from '../dryad/index.js';
import { GNARL_ART } from '../gnarlroot/index.js';

export const ART = {
  rootling: ROOTIMP.art,
  sporecap: SHAMAN.art,
  thornback: THORNBACK.art,
  sporeling: SPORE_MITE.art,
  sapling: DRYAD_ART,
  leafling: DRYAD_ART,
  mothercapper: HAZEL_ART,
  tuskar: TUSKAR_ART,
  gnarlroot: GNARL_ART,
};

export const INFO = {
  rootling: { name: 'Root Imp', w: ROOTIMP.w, h: ROOTIMP.h },
  sporecap: { name: 'Myconid Shaman', w: SHAMAN.w, h: SHAMAN.h },
  thornback: { name: 'Bramble Bear', w: THORNBACK.w, h: THORNBACK.h },
  sporeling: { name: 'Spore Mite', w: SPORE_MITE.w, h: SPORE_MITE.h },
  sapling: { name: 'Root Tendril', w: DRYAD_SIZE.w, h: DRYAD_SIZE.h },
  leafling: { name: 'Rootling Dryad', w: DRYAD_SIZE.w, h: DRYAD_SIZE.h },
  mothercapper: { name: 'Myconid Queen', w: HAZEL_SIZE.w, h: HAZEL_SIZE.h },
  tuskar: { name: 'Tuskar the Behemoth', w: TUSKAR_SIZE.w, h: TUSKAR_SIZE.h },
  gnarlroot: { name: 'Gnarlroot, the Oldest Tree', w: 120, h: 150 },
};
