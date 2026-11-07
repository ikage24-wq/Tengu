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
  Sonniss GDC [2024](https://sonniss.com/gameaudiogdc/) and [2026](https://gdc.sonniss.com/) Game
  Audio Bundles ([licence](https://sonniss.com/gdc-bundle-license/)): weapons, impacts and
  explosions (David Dumais Audio, Justsoundeffects, Bluezone, Federico Soler, Jake Fielding, Orbital Emitter,
  Cinematic Sound Design), magic and elements (Epic Stock Media, Alexander Kopeikin, Rescopic
  Sound, InMotionAudio), cartoon, anime and interface sounds (Cinematic Sound Design, Rogue Waves,
  Doex Studio, CB Sounddesign), creatures (344 Audio, Chupapsound) and the world (Justsoundeffects,
  Jake Fielding, Nick McMahan, Pole Position, Systematic Sound, Ivo Vicic, Mechanical Wave). Rebuild
  with `python tools/build-rec.py` (the bundles have to be downloaded by hand first).
- **Ambience loops** (`amb/`, played by `src/audio/ambience.js`): cut from the same Sonniss GDC
  bundles (royalty free under their licence, inside the game only): Nick McMahan's Cascadia Shore
  Waves (the beach), Rogue Waves' Yacht & Marina (the dock) and Systematic Sound's Rural
  Countryside 01 (the meadows), Justsoundeffects' Forest Ambiences (the woods). Rebuild with `python tools/build-amb.py`.
- **Music** (`music/`, listed in `src/audio/tracks.js`): Juhani Junkala's JRPG Music Packs 1, 2, 3, 4
  and 5 and Epic Boss Battle; Tarush Singhal's Happy Ukulele Island Surfing Theme; cynicmusic's Crystal Cave, Dark Forest and Battle Theme A; Kistol's
  Snowfall; Cleyton RX's Underwater; RandomMind's The Old Tower Inn. All from
  [OpenGameArt](https://opengameart.org), all CC0.

The written songs (`src/audio/songs.js`), with their synths, drums and choir made in code, are kept
for any area without a recorded track.
