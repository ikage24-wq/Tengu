# Audio: how the game's sound is made

The sound is "real plus modern": recorded instruments and recorded effects, mixed with synths,
drums and effects made in code. (We tried pure 8-bit chip sound first; it was replaced at the
player's request after demos of cozy, real, modern and mixed styles. The research below still
holds for writing melodies, jingles, hits and boss music.)

Read the research before changing any sound or song:

- `research-music.md`: melody writing, loops, mixing, arrangements (the chip instrument parts are
  history now; the composition and mixing rules still apply).
- `research-sfx.md`: the sfxr model for synth layers, levels per category, the recipe table.
- `research-japanese.md`: FFXIV, Pokémon, Dragon Quest, Kirby, MOTHER, Animal Crossing and
  MapleStory; the jingle and UI rules (G1, G2), hits and skills (G3), phase-changing boss music
  (G4), NPC voice blips (G5), and 17 written jingle specs (orchestrated now on real instruments).

How it fits together:

- `tools/build-audio.mjs` packs the recordings into `assets/audio/` (one strip per instrument, a
  note every three semitones, evened out in loudness; one strip of effects) and writes
  `src/audio/manifest.js`. Credits in `assets/audio/CREDITS.md` (FluidR3 GM, CC BY 3.0; Kenney,
  CC0).
- Combat sounds come from free packs (see `assets/audio/CREDITS.md`): pick a take by its name in
  the build script's `EFFECTS` ('pack:file@skip~length'); the build trims, levels and packs it.
  Prefer takes that hit within 0.1 s (sounds land on the animation), and skip a take's wind-up.
- `samples.js` loads and decodes them when the page opens; `bank.js` hands them to a worker that
  renders every effect (`synth.js` + `recipes.js`) and song (`studio.js` + `songs.js`) once.
- `songs.js`: each song is melodies written note by note plus a chord chart; helpers turn the chart
  into strums, arpeggios, basslines and pads. Bars must add up (tests check).

Rules we keep:

1. Each area has its own instruments (see the top of `songs.js`), a lead that sits on top, and
   drums light enough for a cozy game (heavier in fights).
2. Every instrument is evened out in loudness, so track gains mean what they say: lead about
   -18 dB, bass -22 to -24, drums -24 to -28, accompaniment -26 to -32, ornaments lower.
3. Jingles: quick notes into a long landing note reached by an upward leap, major key;
   0.4-1.2 s small, 1.5-2.5 s normal, 3-5 s ceremony. The music dips 8-10 dB under them, and they
   never overlap.
4. Menu sounds are short, dry, and on their own bus that never dips.
5. Blows: a recorded contact plus a synth body; the body climbs through a combo; finishers add a
   sub thump.
6. Every music change happens on a beat or bar line where the music has one.
7. Each effect has a level (`db`), a pitch spread (`vary`) and a voice cap (`max`).
