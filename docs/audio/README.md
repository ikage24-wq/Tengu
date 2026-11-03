# Audio: how the game's sound is made

The sound is "real plus modern": recorded instruments and recorded effects, mixed with synths,
drums and effects made in code. (We tried pure 8-bit chip sound first; it was replaced at the
player's request after demos of cozy, real, modern and mixed styles. The research below still
holds for writing melodies, jingles, hits and boss music.)

Read `craft.md`, then the research, before changing any sound or song:

- `research-music.md`: melody writing, loops, mixing, arrangements (the chip instrument parts are
  history now; the composition and mixing rules still apply).
- `research-sfx.md`: the sfxr model for synth layers, levels per category, the recipe table.
- `research-japanese.md`: FFXIV, Pokémon, Dragon Quest, Kirby, MOTHER, Animal Crossing and
  MapleStory; the jingle and UI rules (G1, G2), hits and skills (G3), phase-changing boss music
  (G4), NPC voice blips (G5), and 17 written jingle specs.

How it fits together:

- `tools/build-audio.mjs` packs each recorded instrument into a strip (`assets/audio/inst/`, a
  note every three semitones, each checked by ear for its pitch) and the recorded effects into
  one, `assets/audio/sfx.mp3`, and writes `src/audio/manifest.js`. Every recording is public
  domain (CC0, see `assets/audio/SOURCES.md`). An instrument with no recording (the choir) plays
  its synth voice (`VOICES` in `studio.js`); `node tools/build-audio.mjs koto cello` rebuilds just
  those instruments, `sfx` just the effects.
- Pick a take by its name in the build script's `EFFECTS` ('pack:file@skip~length', or
  'C:folder/file.wav' from a Versilian library; 'a + b*0.5' layers takes); the build trims,
  levels and packs it. Prefer takes that hit within 0.1 s (sounds land on the animation),
  and skip a take's wind-up.
- `samples.js` loads and decodes them when the page opens; `bank.js` hands them to a worker that
  renders every effect (`synth.js` + `recipes.js`) and song (`studio.js` + `songs.js`) once.
- `songs.js`: each song is melodies written note by note plus a chord chart; helpers turn the chart
  into strums, arpeggios, basslines and pads. Bars must add up (tests check).

How to make it good: read `craft.md` first. It holds the music and sound-design principles
(2026-11-03) that replaced the old list of song rules; the earlier rounds of feedback had frozen
into narrow rules that flattened every song into one formula, and the player asked for them to go.

## Ambience, weight and reactive music (2026-10-29)

- Every area has an ambience bed (looping filtered noise drifting on a slow wave: wind, the sea, a
  cave's hush, a town's murmur) and little sounds over it (birds, gulls, drips, chatter, chimes),
  on their own `amb` bus. The player's clock picks day or night (crickets and an owl at night).
  See `src/audio/ambience.js`.
- Blows add what the monster is made of (`src/audio/materials.js`), heavy weapons sound lower and
  daggers higher, crits add a low thump, and finishers drop the music out for a moment.
- Each field and town song has a fight layer (its bass and a driving drum line, bar for bar) that
  fades in on top while a fight is on. Low HP muffles the music under a heartbeat. Towns play an
  evening version of their song at night (slower and softer, the lead on piano).
- Footsteps alternate feet in pitch and stereo; window opens pop, the quest log and map rustle,
  the bag creaks; skill points and purchases have their own chimes; summons have voices.

## Town and field songs (2026-10-29)

Every town has its own style and every song runs four or five sections (80-125 s a loop): Sprout
Village's swung picnic tune, Pastel Harbor's bossa nova, Ember Crag's brass march with a horn
trio, Moonleaf Grove's violin waltz; the meadows' adventure theme, the forest's Celtic jig, the
ruins' horn hymn, the cave's music box, the sky's Lydian flute. See the top of `songs.js`.
