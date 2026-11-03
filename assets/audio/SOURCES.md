# Sound sources

Every recording here is free to use in the game with no credit needed: public domain (CC0), except
the finished effects in `rec/`, which are royalty free under the Sonniss GDC bundle licence (fine
inside the game; not to be handed out as sound effects on their own). Only add recordings under
terms like these. Rebuild with `node tools/build-audio.mjs`.

- **Instruments** (`inst/`): Versilian Studios' [VS Chamber Orchestra 2 Community
  Edition](https://github.com/sgossner/VSCO-2-CE) and [Versilian Community Sample
  Library](https://github.com/sgossner/VCSL): orchestra, pianos, harpsichord, organ, harps, the Dan
  Tranh (played as the koto), mallets, bells and drums.
- **Effects** (`sfx.mp3`): Kenney's RPG Audio, Impact Sounds, Interface Sounds and Sci-Fi Sounds
  packs; CC0 packs from OpenGameArt (artisticdude, Ogrebane, rubberduck, Still North Media,
  qubodup); and percussion from the two Versilian libraries for the spells (gongs, bells, wind
  chimes, wine glasses, cymbals, drums, zaps).

- **Finished effects** (`rec/`, listed in `src/audio/recorded.js`): cut and layered from the
  [Sonniss GDC 2026 Game Audio Bundle](https://gdc.sonniss.com/) ([licence](https://sonniss.com/gdc-bundle-license/)):
  David Dumais Audio's Melee Weapons Pack 2, Epic Stock Media's Anime Game, Elemental Mutation,
  Tower Defense, Fantasy Game 2 and Halloween Game kits, 344 Audio's Cinematic Fight, Medieval
  Weapons and Elemental Palette, Alexander Kopeikin's Designed Ice, CB Sounddesign's Applicable
  Sounds and Cinematic Sound Design's impacts and transitions. Rebuild with `python tools/build-rec.py`
  (the bundle has to be downloaded by hand first).
- **Music** (`music/`, listed in `src/audio/tracks.js`): Juhani Junkala's JRPG Music Packs 1, 3, 4
  and 5 and Epic Boss Battle; cynicmusic's Crystal Cave, Dark Forest and Battle Theme A; Kistol's
  Snowfall; Cleyton RX's Underwater; RandomMind's The Old Tower Inn. All from
  [OpenGameArt](https://opengameart.org), all CC0.

The written songs (`src/audio/songs.js`), with their synths, drums and choir made in code, are kept
for any area without a recorded track.
